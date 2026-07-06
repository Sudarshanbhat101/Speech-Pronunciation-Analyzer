// components/WordHighlight.tsx
"use client";

import { useState } from "react";
import type { WordAssessment, IssueStatus } from "@/types/assessment";

interface WordHighlightProps {
  words: WordAssessment[];
}

const STATUS_LABEL: Record<IssueStatus, string> = {
  correct: "Correct",
  mispronounced: "Mispronounced",
  unclear: "Unclear",
  omitted: "Omitted",
};

const STATUS_CLASS: Record<IssueStatus, string> = {
  correct: "word-token-correct",
  mispronounced: "word-token-mispronounced",
  unclear: "word-token-unclear",
  omitted: "word-token-omitted",
};

export default function WordHighlight({ words }: WordHighlightProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!words || words.length === 0) {
    return <p className="word-highlight-empty">No transcript available.</p>;
  }

  const toggleActive = (index: number, status: IssueStatus) => {
    if (status === "correct") return;
    setActiveIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="word-highlight">
      <div className="word-highlight-legend">
        <span className="legend-item">
          <span className="legend-swatch word-token-correct" /> Correct
        </span>
        <span className="legend-item">
          <span className="legend-swatch word-token-mispronounced" /> Mispronounced
        </span>
        <span className="legend-item">
          <span className="legend-swatch word-token-unclear" /> Unclear
        </span>
        <span className="legend-item">
          <span className="legend-swatch word-token-omitted" /> Omitted
        </span>
      </div>

      <p className="word-highlight-text">
        {words.map((w) => {
          const isFlagged = w.status !== "correct";
          const isActive = activeIndex === w.index;

          return (
            <span key={w.index} className="word-token-wrapper">
              <button
                type="button"
                onClick={() => toggleActive(w.index, w.status)}
                className={`word-token ${STATUS_CLASS[w.status]} ${isFlagged ? "word-token-flagged" : ""
                  } ${isActive ? "word-token-active" : ""}`}
                aria-pressed={isActive}
                aria-label={
                  isFlagged
                    ? `${w.word}: ${STATUS_LABEL[w.status]}. ${w.reason}`
                    : w.word
                }
              >
                {w.word}
              </button>{" "}
              {isActive && isFlagged && (
                <span className="word-tooltip" role="tooltip">
                  <span className="word-tooltip-status">
                    {STATUS_LABEL[w.status]}
                  </span>
                  <span className="word-tooltip-reason">{w.reason}</span>
                </span>
              )}
            </span>
          );
        })}
      </p>
    </div>
  );
}