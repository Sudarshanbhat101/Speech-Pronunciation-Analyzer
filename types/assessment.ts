export interface WordAssessment {
  word: string;
  score: number;
  issues?: string[];
}

export interface AssessmentResult {
  overallScore: number;
  words: WordAssessment[];
  suggestions: string[];
}
