"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getSpeechRecognitionConstructor,
  getVoiceErrorMessage,
  isLikelyMobileDevice,
  type SpeechRecognitionLike,
} from "@/lib/speech-recognition";

type UseVoiceInputOptions = {
  value: string;
  onChange: (value: string) => void;
};

export type UseVoiceInputState = {
  isListening: boolean;
  voiceStatus: string;
  voiceError: string;
  voiceSupported: boolean;
  voiceChecked: boolean;
  toggle: () => void;
};

/**
 * Reusable Web Speech API hook. Designed to drive a single textarea / input
 * field. Append-style transcription: keeps the user's existing typed answer
 * and appends the final transcript to it, while showing the interim text
 * mid-utterance.
 */
export function useVoiceInput({ value, onChange }: UseVoiceInputOptions): UseVoiceInputState {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef("");
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceChecked, setVoiceChecked] = useState(false);

  const abortRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.abort();
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    const supportCheckId = window.setTimeout(() => {
      setVoiceSupported(Boolean(getSpeechRecognitionConstructor()));
      setVoiceChecked(true);
    }, 0);

    return () => {
      window.clearTimeout(supportCheckId);
      abortRecognition();
    };
  }, [abortRecognition]);

  const toggle = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceStatus("Adding your voice answer...");
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not available in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    const mobile = isLikelyMobileDevice();
    const listeningStatus = mobile
      ? "Listening… speak your answer. Mobile browsers may stop automatically after a pause."
      : "Listening… speak your answer, then tap the microphone again to stop.";

    recognition.continuous = !mobile;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    voiceBaseRef.current = valueRef.current;
    recognitionRef.current = recognition;
    setVoiceError("");
    setVoiceStatus(listeningStatus);
    setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const nextDraft = [voiceBaseRef.current, finalTranscript, interimTranscript]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ");

      onChangeRef.current(nextDraft);

      if (finalTranscript.trim()) {
        voiceBaseRef.current = [voiceBaseRef.current, finalTranscript.trim()].filter(Boolean).join(" ");
      }
    };

    recognition.onerror = (event) => {
      setVoiceError(getVoiceErrorMessage(event.error));
      setVoiceStatus("");
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceStatus((current) =>
        current === listeningStatus
          ? "Voice input stopped. Review your answer, then continue."
          : current,
      );
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setVoiceError("Voice input could not start. Check microphone permissions and try again.");
      setVoiceStatus("");
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, []);

  return { isListening, voiceStatus, voiceError, voiceSupported, voiceChecked, toggle };
}
