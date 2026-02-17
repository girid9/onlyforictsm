import { useState, useEffect, useCallback, useRef } from "react";

interface UseVoiceAnswerOptions {
  onAnswer: (optionIndex: number) => void;
  enabled: boolean;
  disabled: boolean;
}

export function useVoiceAnswer({ onAnswer, enabled, disabled }: UseVoiceAnswerOptions) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;

  const optionMap: Record<string, number> = {
    a: 0, ay: 0, hey: 0, eh: 0, alpha: 0,
    b: 1, be: 1, bee: 1, bravo: 1,
    c: 2, see: 2, sea: 2, si: 2, charlie: 2,
    d: 3, de: 3, dee: 3, delta: 3,
    "1": 0, "2": 1, "3": 2, "4": 3,
    one: 0, two: 1, three: 2, four: 3,
    first: 0, second: 1, third: 2, fourth: 3,
  };

  const processTranscript = useCallback((text: string) => {
    const normalized = text.trim().toLowerCase();
    setTranscript(normalized);
    for (const word of normalized.split(/\s+/)) {
      if (word in optionMap) {
        onAnswerRef.current(optionMap[word]);
        return true;
      }
    }
    // Also check single-char matches (speech API sometimes gives just the letter)
    if (normalized.length === 1 && normalized in optionMap) {
      onAnswerRef.current(optionMap[normalized]);
      return true;
    }
    return false;
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 5;

    recognition.onstart = () => setListening(true);
    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setListening(false);
      }
    };
    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch { setListening(false); }
      }
    };

    recognition.onresult = (event: any) => {
      for (let r = event.resultIndex; r < event.results.length; r++) {
        for (let a = 0; a < event.results[r].length; a++) {
          const text = event.results[r][a].transcript;
          if (processTranscript(text)) return;
        }
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setListening(false); }
  }, [processTranscript]);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try { rec.stop(); } catch {}
    }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stopListening();
    else if (!disabled) startListening();
  }, [listening, disabled, startListening, stopListening]);

  // Stop when disabled (answered)
  useEffect(() => {
    if (disabled && listening) stopListening();
  }, [disabled, listening, stopListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      if (rec) try { rec.stop(); } catch {}
    };
  }, []);

  const supported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return { listening, transcript, toggle, supported, startListening, stopListening };
}
