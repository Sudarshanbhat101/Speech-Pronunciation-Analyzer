import WordHighlight from "./WordHighlight";
import type { AssessmentResult } from "@/types/assessment";

interface ScoreResultProps {
  result: AssessmentResult;
}

export default function ScoreResult({ result }: ScoreResultProps) {
  return (
    <section>
      <h2>Score: {result.overallScore}/100</h2>
      <ul>
        {result.words.map((w) => (
          <li key={w.word}>
            <WordHighlight word={w.word} score={w.score} />
            {w.issues && w.issues.length > 0 && (
              <ul>
                {w.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {result.suggestions.length > 0 && (
        <div>
          <h3>Suggestions</h3>
          <ul>
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
