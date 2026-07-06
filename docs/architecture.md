# Architecture

- **app/api/assess/route.ts** — API route receiving audio, validating, and calling Gemini.
- **lib/gemini.ts** — Gemini AI client; sends audio + prompt, parses JSON response.
- **lib/responseSchema.ts** — JSON schema enforced on Gemini output.
- **lib/audioValidation.ts** — MIME type and size checks.
- **components/UploadForm.tsx** — Client component for file picker.
- **components/ScoreResult.tsx** — Renders the full assessment result.
- **components/WordHighlight.tsx** — Color-coded word display.
- **types/assessment.ts** — Shared TypeScript types.
