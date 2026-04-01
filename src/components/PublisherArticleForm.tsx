"use client";

import { useState } from "react";
import type { ArticleSummary } from "@/types";

type Props = {
  publisherId: string;
  onSuccess: (article: ArticleSummary) => void;
};

type FormState = "idle" | "submitting" | "error";

export function PublisherArticleForm({ publisherId, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState("");
  const [content, setContent] = useState("");
  const [priceXrp, setPriceXrp] = useState("0.10");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    setError("");

    const price = parseFloat(priceXrp);
    if (isNaN(price) || price <= 0 || price > 10) {
      setError("Price must be between 0.01 and 10 XRP");
      setFormState("error");
      return;
    }

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          preview: preview.trim(),
          content: content.trim(),
          priceXrp: price,
          publisherId,
        }),
      });

      const data = (await res.json()) as ArticleSummary | { error: string };

      if (!res.ok) {
        setError(
          "error" in data ? data.error : "Failed to create article"
        );
        setFormState("error");
        return;
      }

      // Reset form
      setTitle("");
      setPreview("");
      setContent("");
      setPriceXrp("0.10");
      setFormState("idle");
      onSuccess(data as ArticleSummary);
    } catch {
      setError("Request failed — please try again");
      setFormState("error");
    }
  }

  const isSubmitting = formState === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-negative/[0.08] border border-negative/20 text-[13px] text-negative font-medium">
          {error}
        </div>
      )}

      <Field label="Title" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your article headline"
          required
          maxLength={200}
          className="field-input"
        />
      </Field>

      <Field label="Preview" hint="Shown before the paywall — 300 characters max" required>
        <textarea
          value={preview}
          onChange={(e) => setPreview(e.target.value)}
          placeholder="Hook your reader — first 1–2 sentences..."
          required
          maxLength={400}
          rows={3}
          className="field-input resize-none"
        />
        <span className="text-[11px] text-ink-muted mt-1 block text-right">
          {preview.length}/400
        </span>
      </Field>

      <Field label="Full content" required>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your full article here..."
          required
          rows={10}
          className="field-input resize-y"
        />
      </Field>

      <Field label="Price (XRP)" hint="e.g. 0.05 · 0.10 · 0.25" required>
        <input
          type="number"
          value={priceXrp}
          onChange={(e) => setPriceXrp(e.target.value)}
          step="0.01"
          min="0.01"
          max="10"
          required
          className="field-input font-mono w-36"
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-full bg-accent text-surface text-[14px] font-semibold hover:bg-accent-deep transition-colors disabled:opacity-60 disabled:cursor-default"
      >
        {isSubmitting ? "Publishing…" : "Publish article"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-[0.5px] uppercase text-ink-secondary mb-2">
        {label}
        {required && <span className="text-negative ml-1">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-ink-muted mt-1.5">{hint}</p>
      )}
    </div>
  );
}
