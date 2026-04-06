"use client";

import { useState } from "react";
import { useWallet } from "./WalletProvider";
import type { ArticleSummary } from "@/types";

type Props = {
  publisherId: string;
  onSuccess: (article: ArticleSummary) => void;
};

type FormState = "idle" | "submitting" | "error";
type Currency = "XRP" | "RLUSD";

export function PublisherArticleForm({ publisherId, onSuccess }: Props) {
  const { address } = useWallet();
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState("0.10");
  const [currency, setCurrency] = useState<Currency>("XRP");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    setError("");

    if (!address) {
      setError("Connect your wallet before publishing");
      setFormState("error");
      return;
    }

    const parsedPrice = parseFloat(price);
    const maxPrice = currency === "RLUSD" ? 100 : 10;
    if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > maxPrice) {
      setError(`Price must be between 0.01 and ${maxPrice} ${currency}`);
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
          price: parsedPrice,
          currency,
          publisherId,
          walletAddress: address,
        }),
      });

      const data = (await res.json()) as ArticleSummary | { error: string };

      if (!res.ok) {
        setError("error" in data ? data.error : "Failed to create article");
        setFormState("error");
        return;
      }

      setTitle("");
      setPreview("");
      setContent("");
      setPrice("0.10");
      setCurrency("XRP");
      setFormState("idle");
      onSuccess(data as ArticleSummary);
    } catch {
      setError("Request failed. Please try again.");
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

      <Field label="Preview" hint="Shown before the paywall. 400 characters max." required>
        <textarea
          value={preview}
          onChange={(e) => setPreview(e.target.value)}
          placeholder="Hook your reader. First 1–2 sentences..."
          required
          maxLength={400}
          rows={3}
          className="field-input resize-none"
        />
        <span className="text-[11px] text-ink-muted mt-1 block text-right">
          {preview.length}/400
        </span>
      </Field>

      <Field label="Full content" hint="Use ## for section headings. Press Enter for a new paragraph." required>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your full article here..."
          required
          rows={12}
          className="field-input resize-y break-words"
        />
      </Field>

      <div className="flex gap-4 items-end">
        <Field label="Currency" required>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value as Currency);
              setPrice(e.target.value === "RLUSD" ? "0.10" : "0.10");
            }}
            className="field-input w-32"
          >
            <option value="XRP">XRP</option>
            <option value="RLUSD">RLUSD</option>
          </select>
        </Field>

        <Field label={`Price (${currency})`} required>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0.01"
            max={currency === "RLUSD" ? "100" : "10"}
            required
            className="field-input font-mono w-36"
          />
        </Field>
      </div>

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
