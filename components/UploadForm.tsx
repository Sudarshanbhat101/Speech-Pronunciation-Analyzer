"use client";

import { useRef, useCallback } from "react";

interface UploadFormProps {
  onSubmit: (audioBlob: Blob) => void;
  disabled: boolean;
}

export default function UploadForm({ onSubmit, disabled }: UploadFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const file = fileRef.current?.files?.[0];
      if (!file) return;
      onSubmit(file);
    },
    [onSubmit]
  );

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="audio/*"
        ref={fileRef}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>
        Assess Pronunciation
      </button>
    </form>
  );
}
