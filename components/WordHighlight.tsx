interface WordHighlightProps {
  word: string;
  score: number;
}

export default function WordHighlight({ word, score }: WordHighlightProps) {
  const color =
    score >= 80 ? "green" : score >= 50 ? "orange" : "red";

  return (
    <span style={{ color, fontWeight: 600 }}>
      {word} ({score})
    </span>
  );
}
