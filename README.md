# pronounce.check — Speech Pronunciation Analyzer

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-8E75FF?logo=google)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Upload 30–45 seconds of English speech and get an **instant pronunciation score** with **word-by-word feedback** — powered by Google's Gemini AI.

> **Live demo:** [speech-pronunciation-analyzer-omega.vercel.app](https://speech-pronunciation-analyzer-omega.vercel.app/)

---

## Features

- **🎤 Audio Upload** — Drag-and-drop or pick any audio file (mp3, wav, m4a, webm, ogg)
- **🔍 Smart Validation** — Client-side duration check + server-side MIME, size & bitrate sanity checks
- **🤖 Gemini-Powered Analysis** — Structured JSON response with per-word pronunciation judgment
- **📊 Overall Score (0–100)** — Visual waveform dial with tiered feedback (Excellent / Good / Fair / Needs practice)
- **📝 Interactive Transcript** — Color-coded words (green = correct, red = mispronounced, amber = unclear, purple = omitted); tap any flagged word for a detailed phonetic reason
- **🔐 Privacy-First (DPDP 2023 Compliant)** — Audio processed in memory only; **nothing is stored** on any server. Full consent checkbox with transparent data-handling notice.
- **⚡ Edge-Ready** — Runs on Vercel serverless functions with 60s timeout for Gemini processing
- **♿ Accessible** — `role="alert"`, `aria-label`, `aria-pressed`, `prefers-reduced-motion` support

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 (strict mode) |
| **UI** | React 18 with CSS custom properties |
| **Fonts** | Space Grotesk (display), Inter (body), JetBrains Mono (code) |
| **AI** | Google Gemini 2.5 Flash (`generateContent` with structured JSON schema) |
| **Deployment** | Vercel (serverless) |
| **Linting** | ESLint (Next.js config) |

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                          Server (Next.js API Route)   │
│                                                                 │
│  ┌──────────┐    multipart/form-data     ┌──────────────────┐   │
│  │ Upload   │ ────────────────────────── │ validateAudioFile│   │
│  │ Form     │    audio + duration +      │ (MIME / size /   │   │
│  │ (client- │    consent=true            │  duration check) │   │
│  │  side    │                            └──────┬───────────┘   │
│  │  dur.    │                                   │valid           │
│  │  check)  │                                   ▼               │
│  └──────────┘                            ┌──────────────────┐   │
│       │                                  │ Buffer → base64  │   │
│       │                                  └──────┬───────────┘   │
│       │                                         │               │
│       │                                  ┌──────▼───────────┐   │
│       │                                  │assessPronuncia-  │   │
│       │                                  │tion()            │   │
│       │                                  │ (Gemini API call)│   │
│       │                                  └──────┬───────────┘   │
│       │                                         │               │
│       │                                  ┌──────▼───────────┐   │
│       │                                  │ Parse JSON →     │   │
│       │                                  │ AssessmentResult │   │
│       │                                  └──────┬───────────┘   │
│  ┌────┴──────────┐    JSON response             │               │
│  │ ScoreResult   │ ←────────────────────────────┘               │
│  │ (waveform     │                                             │
│  │  dial +       │                                             │
│  │  transcript)  │                                             │
│  └───────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

The app follows a **zero-persistence architecture**:

1. Audio file is validated both client-side (duration via Web Audio API) and server-side (MIME type, size, bitrate sanity check)
2. Validated audio is converted to base64 and sent to Gemini 2.5 Flash with a detailed phonetician prompt
3. Gemini returns **structured JSON** via `responseSchema` — forcing consistent, typed output
4. The response is parsed, validated, and returned to the client
5. **No file is ever written to disk.** Everything is processed in memory and discarded after the response

---

## Project Structure

```
pronounce-check/
├── app/
│   ├── api/
│   │   └── assess/
│   │       └── route.ts          # POST /api/assess — serverless endpoint
│   ├── globals.css               # Full design system (823 lines of CSS)
│   ├── layout.tsx                # Root layout with fonts, header, footer
│   └── page.tsx                  # Main page (upload or results)
├── components/
│   ├── ScoreResult.tsx            # Score dial + summary + transcript
│   ├── UploadForm.tsx             # File picker, validation, consent, submit
│   └── WordHighlight.tsx          # Color-coded interactive transcript
├── lib/
│   ├── audioValidation.ts         # Server-side audio file validation
│   ├── gemini.ts                  # Gemini API client (isolated & swappable)
│   └── responseSchema.ts          # Gemini JSON schema for structured output
├── types/
│   └── assessment.ts              # TypeScript interfaces & type guards
├── docs/
│   └── architecture.md            # Detailed architecture decisions
├── .env.example                   # Environment variable template
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Setup

```bash
# Clone the repo
git clone https://github.com/Sudarshanbhat101/Speech-Pronunciation-Analyzer.git
cd Speech-Pronunciation-Analyzer

# Install dependencies
npm install

# Set up your API key
cp .env.example .env.local
# Edit .env.local and add your Gemini API key:
# GEMINI_API_KEY=your_key_here

# Start the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and upload a 30–45 second English speech recording.

### Production Build

```bash
npm run build
npm start
```

---

## API

### `POST /api/assess`

Accepts multipart/form-data with these fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `audio` | File | ✅ | Audio file (mp3, wav, m4a, webm, ogg). Max 15MB. |
| `consent` | string | ✅ | Must be `"true"` |
| `duration` | string | ❌ | Duration in seconds (client-provided; server validates independently) |

Returns `AssessmentResult` (success, 200) or `AssessmentError` (error, 4xx/5xx).

---

## Key Design Decisions

- **Gemini over Azure/other providers**: Google's `responseSchema` forces structured JSON output, eliminating prompt-injection risks from free-form text. The module `lib/gemini.ts` isolates all provider-specific code — swapping to another AI is a single-file change.
- **No ffmpeg**: Duration is estimated via MIME-type bitrate tables rather than full server-side decode. This avoids heavyweight dependencies and cold-start latency on serverless. See `docs/architecture.md` for the trade-off analysis.
- **Dark theme by default**: The UI uses a waveform/dial-inspired dark theme with `prefers-color-scheme: dark` and `prefers-reduced-motion` support baked in.
- **DPDP 2023 compliance**: Explicit consent checkbox + transparent notice. Zero data retention — no database, no file storage, no logging of audio content.

---

## License

MIT
