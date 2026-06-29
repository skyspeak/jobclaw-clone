"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Share2,
  Sparkles,
  X,
  Youtube,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BRAND_YOUTUBE_URL } from "@/lib/brand";
import {
  buildDearccSignupShareText,
  buildIMessageShareUrl,
  buildWhatsAppShareUrl,
} from "@/lib/gap-analysis-share";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ShareOptionButton({
  label,
  sublabel,
  icon,
  onClick,
}: {
  label: string;
  sublabel: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 flex-1 touch-manipulation items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3.5 text-left transition-colors active:bg-muted/40 hover:border-[#2D6A4F]/30 hover:bg-muted/30"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/60">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{sublabel}</span>
      </span>
    </button>
  );
}

export function IntakeGetHiredConfirmationSplash() {
  const [visible, setVisible] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/intake`;
  }, []);

  const shareText = useMemo(
    () => (shareUrl ? buildDearccSignupShareText(shareUrl) : ""),
    [shareUrl],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!shareOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShareOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [shareOpen]);

  function openShare(url: string) {
    window.location.href = url;
    setShareOpen(false);
  }

  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-700 ease-out sm:space-y-8",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      <section
        className="relative overflow-hidden rounded-3xl border border-[#2D6A4F]/20 bg-gradient-to-b from-[#2D6A4F]/10 via-card to-[#FDFBF7] px-5 py-8 text-center shadow-sm sm:px-10 sm:py-12"
        role="status"
        aria-live="polite"
      >
        <div
          className="pointer-events-none absolute -left-16 top-0 size-48 rounded-full bg-[#2D6A4F]/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-12 bottom-0 size-40 rounded-full bg-[#D4A574]/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-md flex-col items-center">
          <div
            className="mb-6 flex items-center justify-center gap-3 text-[#2D6A4F]/50"
            aria-hidden
          >
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#2D6A4F]/40 sm:w-14" />
            <Sparkles className="size-4 text-[#D4A574]" />
            <span className="font-serif text-lg italic text-[#2D6A4F]/70">✦</span>
            <Sparkles className="size-4 text-[#D4A574]" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#2D6A4F]/40 sm:w-14" />
          </div>

          <div
            className={cn(
              "mb-6 flex size-16 items-center justify-center rounded-full bg-[#2D6A4F] text-white shadow-lg shadow-[#2D6A4F]/25",
              "transition-transform duration-700 ease-out",
              visible ? "scale-100" : "scale-90",
            )}
          >
            <Check className="size-8 stroke-[2.5]" aria-hidden />
          </div>

          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Congratulations!
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
            You have signed up to land your dream job.
          </p>

          <p className="mt-3 text-sm text-muted-foreground/80">
            We&apos;ll be in touch with curated guidance tailored to you.
          </p>
        </div>
      </section>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="h-12 min-h-12 w-full touch-manipulation rounded-2xl border-border/70 bg-card text-base font-semibold"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="mr-2 size-4" />
          Send this to a friend
        </Button>

        <Button asChild size="lg" className="cta-glow h-12 min-h-12 w-full touch-manipulation rounded-2xl text-base font-semibold">
          <a href={BRAND_YOUTUBE_URL} rel="noreferrer" target="_blank">
            <Youtube className="mr-2 size-5" />
            Check out DearCC on YouTube
            <ArrowRight className="ml-1 size-4 opacity-90" />
          </a>
        </Button>
      </div>

      <Button asChild variant="ghost" className="min-h-11 w-full touch-manipulation rounded-xl text-muted-foreground">
        <Link href="/">Back to home</Link>
      </Button>

      {shareOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setShareOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="get-hired-share-title"
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border/70 bg-card pb-[max(0px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-0"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
              <div>
                <h2 id="get-hired-share-title" className="text-lg font-semibold tracking-tight text-foreground">
                  Send this to a friend
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share DearCC so they can get the same tailored help.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 touch-manipulation rounded-full"
                aria-label="Close share sheet"
                onClick={() => setShareOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-2 p-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-6">
              <ShareOptionButton
                label="iMessage"
                sublabel="Send in Messages"
                icon={<MessageCircle className="size-5 text-[#34C759]" />}
                onClick={() => openShare(buildIMessageShareUrl(shareText))}
              />
              <ShareOptionButton
                label="WhatsApp"
                sublabel="Send to a chat"
                icon={<WhatsAppIcon className="size-5 text-[#25D366]" />}
                onClick={() => openShare(buildWhatsAppShareUrl(shareText))}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
