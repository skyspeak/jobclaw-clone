"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, MessageCircle, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildGapAnalysisShareText,
  buildIMessageShareUrl,
  buildWhatsAppShareUrl,
} from "@/lib/gap-analysis-share";
import { BRAND_NAME } from "@/lib/brand";
import type { ProfileGapParameter } from "@/lib/profile-gaps";
import { cn } from "@/lib/utils";

type IntakeGapShareSheetProps = {
  parameters: ProfileGapParameter[];
  targetLabel?: string;
  className?: string;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function IntakeGapShareSheet({
  parameters,
  targetLabel,
  className,
}: IntakeGapShareSheetProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.location.origin + "/intake";
  }, [open]);

  const shareText = useMemo(
    () =>
      buildGapAnalysisShareText({
        parameters,
        targetLabel,
        shareUrl,
      }),
    [parameters, shareUrl, targetLabel],
  );

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!open) {
      return;
    }

    setStatus("");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus("Could not copy. Try iMessage or WhatsApp instead.");
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({
        title: `${BRAND_NAME} gap analysis`,
        text: shareText,
        url: shareUrl || undefined,
      });
      setOpen(false);
    } catch (caught) {
      if (caught instanceof Error && caught.name === "AbortError") {
        return;
      }
      setStatus("Could not open the share sheet.");
    }
  }

  function openExternal(url: string) {
    window.location.href = url;
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-2 rounded-xl", className)}
        onClick={() => setOpen(true)}
        data-testid="button-share-gap-analysis"
      >
        <Share2 className="size-4" />
        Share
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="gap-share-title"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border/70 bg-card shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {BRAND_NAME}
                </p>
                <h2 id="gap-share-title" className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  Share your gap analysis
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                aria-label="Close share sheet"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 px-5 py-4 sm:px-6">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                onClick={() => openExternal(buildIMessageShareUrl(shareText))}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#34C759]/15 text-[#34C759]">
                  <MessageCircle className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">iMessage</span>
                  <span className="block text-xs text-muted-foreground">Send in Messages</span>
                </span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                onClick={() => openExternal(buildWhatsAppShareUrl(shareText))}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <WhatsAppIcon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">WhatsApp</span>
                  <span className="block text-xs text-muted-foreground">Send to a chat</span>
                </span>
              </button>

              {canNativeShare ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                  onClick={() => void handleNativeShare()}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Share2 className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">More options</span>
                    <span className="block text-xs text-muted-foreground">Open system share sheet</span>
                  </span>
                </button>
              ) : null}

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                onClick={() => void handleCopy()}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Copy className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">Copy text</span>
                  <span className="block text-xs text-muted-foreground">Paste anywhere</span>
                </span>
              </button>
            </div>

            {status ? (
              <p className="px-5 pb-4 text-sm text-muted-foreground sm:px-6" aria-live="polite">
                {status}
              </p>
            ) : (
              <p className="px-5 pb-4 text-xs leading-relaxed text-muted-foreground sm:px-6">
                Shares a summary of your strengths and gaps — not your résumé or LinkedIn.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
