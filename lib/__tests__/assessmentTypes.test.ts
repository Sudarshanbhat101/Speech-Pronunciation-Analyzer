import { describe, it, expect } from "vitest";
import { isAssessmentError } from "../../types/assessment";

describe("isAssessmentError", () => {
  it("returns true for an error-shaped response", () => {
    expect(isAssessmentError({ error: "Something went wrong" })).toBe(true);
  });

  it("returns true for an error response with a code", () => {
    expect(isAssessmentError({ error: "No file", code: "NO_FILE" })).toBe(true);
  });

  it("returns false for a successful assessment result", () => {
    expect(
      isAssessmentError({
        transcript: "hello world",
        overallScore: 92,
        overallFeedback: "Great clarity.",
        words: [],
        issueCount: 0,
        wordCount: 2,
      })
    ).toBe(false);
  });
});