"use client";

import { useRef, useState } from "react";
import type { AssessResponse, AssessmentResult } from "@/types/assessment";
import { isAssessmentError } from "@/types/assessment";

// These MUST match the server-side constants in lib/audioValidation.ts.
// If your audioValidation.ts uses different numbers, update both places.
const MIN_DURATION_SECONDS = 30;
const MAX_DURATION_SECONDS = 45;
// Small tolerance so a 29.6s or 45.4s recording isn't rejected for rounding.
const DURATION_TOLERANCE_SECONDS = 1;
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB raw audio (~20MB once base64-encoded for Gemini)
const ACCEPTED_MIME_PREFIXES = ["audio/"];

interface UploadFormProps {
  onResult: (result: AssessmentResult) => void;
  onErrorChange?: (error: string | null) => void;
  onLoadingChange?: (loading: boolean) => void;
}

type ClientValidationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "valid"; durationSeconds: number }
  | { status: "invalid"; message: string };

export default function UploadForm({
  onResult,
  onErrorChange,
  onLoadingChange,
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ClientValidationState>({
    status: "idle",
  });
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setLoading = (loading: boolean) => {
    setSubmitting(loading);
    onLoadingChange?.(loading);
  };

  const setError = (message: string | null) => {
    setSubmitError(message);
    onErrorChange?.(message);
  };

  const resetSelection = () => {
    setFile(null);
    setValidation({ status: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const checkDuration = (selectedFile: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(selectedFile);
      const audioEl = new Audio();
      audioEl.preload = "metadata";

      const cleanup = () => URL.revokeObjectURL(objectUrl);

      audioEl.onloadedmetadata = () => {
        const duration = audioEl.duration;
        cleanup();
        if (!isFinite(duration) || duration <= 0) {
          reject(new Error("Could not read audio duration from this file."));
          return;
        }
        resolve(duration);
      };

      audioEl.onerror = () => {
        cleanup();
        reject(
          new Error(
            "Could not read this audio file. Try a different format (mp3, wav, m4a)."
          )
        );
      };

      audioEl.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0] ?? null;
    if (!selectedFile) {
      resetSelection();
      return;
    }

    const isAudio = ACCEPTED_MIME_PREFIXES.some((prefix) =>
      selectedFile.type.startsWith(prefix)
    );
    if (!isAudio) {
      setFile(null);
      setValidation({
        status: "invalid",
        message: `"${selectedFile.name}" doesn't look like an audio file. Please upload mp3, wav, m4a, or similar.`,
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setValidation({
        status: "invalid",
        message: `File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(
          1
        )}MB). Max size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
      });
      return;
    }

    setFile(selectedFile);
    setValidation({ status: "checking" });

    try {
      const duration = await checkDuration(selectedFile);
      const min = MIN_DURATION_SECONDS - DURATION_TOLERANCE_SECONDS;
      const max = MAX_DURATION_SECONDS + DURATION_TOLERANCE_SECONDS;

      if (duration < min || duration > max) {
        setValidation({
          status: "invalid",
          message: `Recording is ${duration.toFixed(
            1
          )}s long. Please upload audio between ${MIN_DURATION_SECONDS}-${MAX_DURATION_SECONDS} seconds.`,
        });
        return;
      }

      setValidation({ status: "valid", durationSeconds: duration });
    } catch (err) {
      setValidation({
        status: "invalid",
        message:
          err instanceof Error
            ? err.message
            : "Could not validate this audio file.",
      });
    }
  };

  const canSubmit =
    file !== null && validation.status === "valid" && consentChecked && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("consent", "true");
      if (validation.status === "valid") {
        formData.append("duration", validation.durationSeconds.toString());
      }

      const res = await fetch("/api/assess", {
        method: "POST",
        body: formData,
      });

      const data: AssessResponse = await res.json();

      if (!res.ok || isAssessmentError(data)) {
        const message = isAssessmentError(data)
          ? data.error
          : "Something went wrong while assessing your audio.";
        setError(message);
        return;
      }

      onResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div className="upload-dropzone">
        <input
          ref={inputRef}
          id="audio-upload-input"
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={submitting}
          className="upload-input"
        />
        <label htmlFor="audio-upload-input" className="upload-label">
          {file ? file.name : "Choose a 30–45 second English speech recording"}
        </label>

        {validation.status === "checking" && (
          <p className="upload-status upload-status-checking">
            Checking audio duration…
          </p>
        )}
        {validation.status === "valid" && (
          <p className="upload-status upload-status-valid">
            ✓ {validation.durationSeconds.toFixed(1)}s — looks good
          </p>
        )}
        {validation.status === "invalid" && (
          <p className="upload-status upload-status-invalid">
            {validation.message}
          </p>
        )}
      </div>

      <div className="consent-row">
        <input
          id="consent-checkbox"
          type="checkbox"
          checked={consentChecked}
          onChange={(e) => setConsentChecked(e.target.checked)}
          disabled={submitting}
        />
        <label htmlFor="consent-checkbox" className="consent-label">
          I consent to my audio being sent to Google Gemini for one-time
          pronunciation analysis. My audio and transcript are processed in
          memory only, are not stored on any server, and are discarded
          immediately after the result is returned to me.
        </label>
      </div>

      <p className="dpdp-notice">
        <strong>Data notice (DPDP 2023):</strong> This app collects only the
        audio file you choose to upload, solely to generate your
        pronunciation score. No audio, transcript, or personal data is
        retained after your request completes — there is nothing stored
        to request deletion of. Your audio is sent to Google's Gemini
        API for processing and is subject to Google's API data-handling
        terms.
      </p>

      {submitError && <p className="submit-error">{submitError}</p>}

      <button type="submit" disabled={!canSubmit} className="submit-button">
        {submitting ? "Analyzing your pronunciation…" : "Get my score"}
      </button>
    </form>
  );
}