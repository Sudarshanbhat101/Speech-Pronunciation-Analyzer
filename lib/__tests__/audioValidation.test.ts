import { describe, it, expect } from "vitest";
import {
  validateAudioFile,
  MAX_FILE_SIZE_BYTES,
  MIN_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
  ACCEPTED_MIME_TYPES,
} from "../audioValidation";

describe("validateAudioFile", () => {
  describe("MIME type checks", () => {
    it("rejects when no file type is detected", () => {
      const result = validateAudioFile("", 1_000);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/no file type/i);
    });

    it("accepts every supported MIME type", () => {
      // 6MB with an in-range explicit duration bypasses the fallback estimator,
      // so every accepted type passes regardless of its assumed bitrate.
      for (const mime of ACCEPTED_MIME_TYPES) {
        const result = validateAudioFile(mime, 6 * 1024 * 1024, 35);
        expect(result.valid).toBe(true);
      }
    });

    it("rejects unsupported formats", () => {
      for (const mime of ["audio/flac", "video/mp4", "application/pdf", "text/plain"]) {
        const result = validateAudioFile(mime, 1_000);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/unsupported audio format/i);
      }
    });

    it("handles MIME strings with extra parameters", () => {
      const result = validateAudioFile("audio/mpeg; codecs=mp3", 6 * 1024 * 1024, 35);
      expect(result.valid).toBe(true);
    });

    it("is case-insensitive for MIME types", () => {
      const result = validateAudioFile("AUDIO/MP3", 6 * 1024 * 1024, 35);
      expect(result.valid).toBe(true);
    });
  });

  describe("size checks", () => {
    it("rejects empty files", () => {
      const result = validateAudioFile("audio/mp3", 0);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/empty/i);
    });

    it("rejects files larger than the max size", () => {
      const result = validateAudioFile("audio/mp3", MAX_FILE_SIZE_BYTES + 1);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too large/i);
    });

    it("accepts files at exactly the max size limit", () => {
      // 15MB over 45s = ~2.8 Mbps, within the 3 Mbps sanity ceiling.
      const result = validateAudioFile("audio/mp3", MAX_FILE_SIZE_BYTES, 45);
      expect(result.valid).toBe(true);
    });
  });

  describe("explicit duration checks", () => {
    it("rejects NaN and non-positive durations", () => {
      expect(validateAudioFile("audio/wav", 1_000_000, NaN).error).toMatch(/invalid/i);
      expect(validateAudioFile("audio/wav", 1_000_000, 0).error).toMatch(/invalid/i);
      expect(validateAudioFile("audio/wav", 1_000_000, -5).error).toMatch(/invalid/i);
    });

    it("rejects durations below the minimum", () => {
      const short = MIN_DURATION_SECONDS - 1;
      const result = validateAudioFile("audio/mp3", 500_000, short);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too short/i);
      expect(result.estimatedDurationSeconds).toBe(short);
    });

    it("rejects durations above the maximum", () => {
      const long = MAX_DURATION_SECONDS + 1;
      const result = validateAudioFile("audio/mp3", 5_000_000, long);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too long/i);
      expect(result.estimatedDurationSeconds).toBe(long);
    });

    it("accepts a valid in-range duration with a consistent bitrate", () => {
      // 40s at ~64 kbps = 40 * 64_000 / 8 = 320,000 bytes (inside 8kbps..3Mbps)
      const result = validateAudioFile("audio/mp3", 320_000, 40);
      expect(result.valid).toBe(true);
      expect(result.estimatedDurationSeconds).toBe(40);
    });

    it("rejects when size does not match the claimed duration (bitrate too high)", () => {
      // 10MB in 25s = 3.2 Mbps, above the 3 Mbps sanity ceiling,
      // while the 25s duration itself passes the bounds checks.
      const result = validateAudioFile("audio/mp3", 10_000_000, 25);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/does not match/i);
    });

    it("rejects when size does not match the claimed duration (bitrate too low)", () => {
      // 20KB in 30s ~= 5.3 kbps, below the 8 kbps sanity floor.
      const result = validateAudioFile("audio/mp3", 20_000, 30);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/does not match/i);
    });
  });

  describe("fallback duration estimation (no explicit duration)", () => {
    it("estimates duration from size for a known MIME type", () => {
      // WAV at 1_411_200 bps = 176,400 bytes/sec; ~5s = ~882KB -> flagged too short
      const result = validateAudioFile("audio/wav", 882_000);
      expect(result.valid).toBe(false);
      expect(result.estimatedDurationSeconds).toBeCloseTo(5, 5);
    });

    it("falls back to a default bitrate for unknown-to-table MIME types that are accepted", () => {
      // Any accepted-but-untabulated type is not currently possible; sanity
      // check that the default (128kbps) path is exercised via an accepted type.
      const result = validateAudioFile("audio/mpeg", 1_411_200 * 5);
      expect(result.estimatedDurationSeconds).toBeCloseTo((1_411_200 * 5 * 8) / 128_000, 5);
    });

    it("flags audio that estimates below the fallback minimum (~10s)", () => {
      const result = validateAudioFile("audio/wav", 100_000); // ~0.7s
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too short/i);
    });

    it("flags audio that estimates above the fallback maximum (~120s)", () => {
      // 3MB mp3 at 128kbps = ~187s estimated, but still under the 15MB cap.
      const result = validateAudioFile("audio/mp3", 3_000_000);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too long/i);
    });
  });
});