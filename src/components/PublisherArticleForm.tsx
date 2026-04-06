"use client";

import { useState, useRef } from "react";
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
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function applyFormat(prefix: string, suffix: string = prefix) {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(newContent);
    // Restore focus and selection inside the inserted formatting
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  function applyHeading() {
    const ta = contentRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    // Find start of current line
    const lineStart = content.lastIndexOf("\n", pos - 1) + 1;
    const lineContent = content.slice(lineStart);
    if (lineContent.startsWith("## ")) {
      // Toggle off
      const newContent = content.slice(0, lineStart) + content.slice(lineStart + 3);
      setContent(newContent);
    } else {
      const newContent = content.slice(0, lineStart) + "## " + content.slice(lineStart);
      setContent(newContent);
    }
    setTimeout(() => ta.focus(), 0);
  }

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

      <Field label="Full content" required>
        <div className="rounded-lg border border-ink-ghost bg-paper focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-wash transition-all overflow-hidden">
          {/* Formatting toolbar */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-ink-ghost bg-paper-deep">
            <ToolbarButton
              label="Bold"
              title="Bold (wrap selection with **)"
              onClick={() => applyFormat("**")}
            >
              <span className="font-bold text-[13px]">B</span>
            </ToolbarButton>
            <ToolbarButton
              label="Italic"
              title="Italic (wrap selection with _)"
              onClick={() => applyFormat("_")}
            >
              <span className="italic text-[13px]">I</span>
            </ToolbarButton>
            <div className="w-px h-4 bg-ink-ghost mx-0.5" />
            <ToolbarButton
              label="Heading"
              title="Section heading (## prefix)"
              onClick={applyHeading}
            >
              <span className="text-[11px] font-bold tracking-wide">H2</span>
            </ToolbarButton>
          </div>
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your full article here..."
            required
            rows={12}
            className="w-full px-4 py-2.5 bg-transparent text-ink text-[14px] font-body placeholder:text-ink-muted focus:outline-none resize-y break-words"
            style={{ fontFamily: "var(--font-body), sans-serif" }}
          />
        </div>
        <p className="text-[11px] text-ink-muted mt-1.5">
          Select text then click a format button. Use H2 for section headings.
        </p>
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

function ToolbarButton({
  onClick,
  title,
  label,
  children,
}: {
  onClick: () => void;
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent textarea losing focus/selection
        onClick();
      }}
      className="px-2 py-1 rounded text-ink-secondary hover:text-ink hover:bg-ink/[0.06] transition-colors min-w-[28px] flex items-center justify-center"
    >
      {children}
    </button>
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
