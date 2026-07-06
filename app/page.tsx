"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";
import ScoreResult from "@/components/ScoreResult";
import type { AssessmentResult } from "@/types/assessment";

export default function Home() {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAssessment = async (audioBlob: Blob) => {
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const res = await fetch("/api/assess", {
      method: "POST",
      body: formData,
    });

    const data: AssessmentResult = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main>
      <h1>Pronounce Check</h1>
      <UploadForm onSubmit={handleAssessment} disabled={loading} />
      {loading && <p>Analysing pronunciation…</p>}
      {result && <ScoreResult result={result} />}
    </main>
  );
}
