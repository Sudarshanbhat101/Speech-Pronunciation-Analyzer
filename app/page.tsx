"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";
import ScoreResult from "@/components/ScoreResult";
import type { AssessmentResult } from "@/types/assessment";

export default function Home() {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResult = (r: AssessmentResult) => {
    setResult(r);
    setError(null);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="page">
      {!result && (
        <section className="hero">
          <p className="hero-eyebrow">Pronunciation feedback, one take</p>
          <h1 className="hero-title">
            Speak. Upload. See exactly which words to fix.
          </h1>
          <p className="hero-subtitle">
            Record 30–45 seconds of English speech and get an instant
            score plus word-by-word feedback on what to improve.
          </p>
        </section>
      )}

      <section className="content-panel">
        {loading && (
          <div className="loading-state" role="status" aria-live="polite">
            <div className="loading-waveform" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="loading-text">Listening closely…</p>
          </div>
        )}

        {!loading && !result && (
          <UploadForm
            onResult={handleResult}
            onErrorChange={setError}
            onLoadingChange={setLoading}
          />
        )}

        {!loading && result && (
          <ScoreResult result={result} onReset={handleReset} />
        )}

        {!loading && !result && error && (
          <p className="page-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}