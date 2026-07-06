// components/ScoreResult.tsx
"use client";

import type { AssessmentResult } from "@/types/assessment";
import WordHighlight from "./WordHighlight";

interface ScoreResultProps {
  result: AssessmentResult;
  onReset: () => void;
}

function scoreTier(score: number): {
  label: string;
  className: string;
} {
  if (score >= 90) return { label: "Excellent", className: "score-tier-excellent" };
  if (score >= 75) return { label: "Good", className: "score-tier-good" };
  if (score >= 60) return { label: "Fair", className: "score-tier-fair" };
  return { label: "Needs practice", className: "score-tier-poor" };
}

export default function ScoreResult({ result, onReset }: ScoreResultProps) {
  const { overallScore, overallFeedback, words, issueCount, wordCount } = result;
  const tier = scoreTier(overallScore);
  const clampedScore = Math.max(0, Math.min(100, overallScore));

  return (
    <div className="score-result">
      <div className="score-header">
        <div
          className={`score-circle ${tier.className}`}
          style={
            {
              "--score-percent": `${clampedScore}%`,
            } as React.CSSProperties
          }
        >
          <span className="score-number">{Math.round(clampedScore)}</span>
          <span className="score-out-of">/ 100</span>
        </div>

        <div className="score-summary">
          <span className={`score-tier-label ${tier.className}`}>
            {tier.label}
          </span>
          <p className="score-feedback">{overallFeedback}</p>
          <p className="score-issue-count">
            {issueCount === 0
              ? `All ${wordCount} words sounded clear.`
              : `${issueCount} of ${wordCount} words need attention.`}
          </p>
        </div>
      </div>

      <div className="score-transcript-section">
        <h3 className="score-transcript-heading">Your transcript</h3>
        <p className="score-transcript-hint">
          Tap a highlighted word to see why it was flagged.
        </p>
        <WordHighlight words={words} />
      </div>

      <button type="button" onClick={onReset} className="score-reset-button">
        Try another recording
      </button>
    </div>
  );
}