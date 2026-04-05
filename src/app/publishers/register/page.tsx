"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublisherProfile } from "@/types";

type FormState = "idle" | "submitting" | "error";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [description, setDescription] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    setError("");

    try {
      const res = await fetch("/api/publishers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, walletAddress, description: description || undefined }),
      });

      const data = (await res.json()) as PublisherProfile | { error: string };

      if (!res.ok) {
        setError("error" in data ? data.error : "Registration failed");
        setFormState("error");
        return;
      }

      const profile = data as PublisherProfile;
      setFormState("idle"); // clear spinner before navigation
      router.push(`/publishers/${profile.id}/dashboard`);
    } catch {
      setError("Request failed. Please try again.");
      setFormState("error");
    }
  }

  const isSubmitting = formState === "submitting";

  return (
    <div className="max-w-[480px] mx-auto px-6 pt-16 pb-24">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-[32px] font-normal tracking-[-0.5px] text-ink mb-2">
          Start earning
        </h1>
        <p className="text-[14px] text-ink-muted">
          Monetize your writing with per-article micropayments.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-surface border border-ink/[0.08] rounded-xl px-8 py-9 shadow-[0_4px_24px_rgba(20,18,17,0.04)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-negative/[0.08] border border-negative/20 text-[13px] text-negative font-medium">
              {error}
            </div>
          )}

          <FormField label="Publication name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Ledger Report"
              required
              maxLength={100}
              className="field-input"
            />
          </FormField>

          <FormField
            label="XRPL wallet address"
            hint="Your address starting with 'r'. Payments go directly here."
            required
          >
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              required
              className="field-input font-mono text-[13px]"
              spellCheck={false}
            />
          </FormField>

          <FormField
            label={
              <>
                About{" "}
                <span className="text-ink-muted normal-case font-normal tracking-normal">
                  (optional)
                </span>
              </>
            }
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell readers what you write about..."
              maxLength={500}
              rows={3}
              className="field-input resize-none"
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 mt-2 rounded-full bg-accent text-surface text-[14px] font-semibold hover:bg-accent-deep transition-colors disabled:opacity-60 disabled:cursor-default"
          >
            {isSubmitting ? "Creating account…" : "Create publisher account"}
          </button>
        </form>
      </div>

    </div>
  );
}

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: React.ReactNode;
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
      {hint && <p className="text-[11px] text-ink-muted mt-1.5">{hint}</p>}
    </div>
  );
}
