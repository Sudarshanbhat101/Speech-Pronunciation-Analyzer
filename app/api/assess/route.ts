// app/api/assess/route.ts
//
// Single API route: accepts a multipart/form-data upload with an "audio"
// field, validates it server-side (never trust the client-side duration
// check alone), converts it to base64, sends it to Gemini via
// assessPronunciation(), and returns the structured result as JSON.
//
// No file is ever written to disk and nothing is persisted after the
// response is sent — this is the core of the DPDP "no retention" story
// (see docs/architecture.md).

import { NextRequest, NextResponse } from "next/server";
import { assessPronunciation } from "@/lib/gemini";
import { validateAudioFile, MAX_FILE_SIZE_BYTES } from "@/lib/audioValidation";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds — Gemini call can take a while on Vercel

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided. Expected a multipart 'audio' field." },
        { status: 400 }
      );
    }

    const consent = formData.get("consent");
    if (consent !== "true") {
      return NextResponse.json(
        {
          error:
            "Consent is required to process your audio. Please check the consent box before submitting.",
        },
        { status: 400 }
      );
    }

    const mimeType = audioFile.type;
    const sizeBytes = audioFile.size;

    const validation = validateAudioFile(mimeType, sizeBytes);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum allowed size." },
        { status: 400 }
      );
    }

    const base64Audio = buffer.toString("base64");

    const result = await assessPronunciation({
      base64Audio,
      mimeType,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Error in /api/assess:", err);

    const message =
      err instanceof Error ? err.message : "Unknown server error occurred.";

    return NextResponse.json(
      { error: `Failed to process audio: ${message}` },
      { status: 500 }
    );
  }
}