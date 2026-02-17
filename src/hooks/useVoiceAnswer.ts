import { useState, useEffect, useCallback, useRef } from "react";

interface UseVoiceAnswerOptions {
  onAnswer: (optionIndex: number) => void;
  enabled: boolean;
  disabled: boolean; // e.g. already answered
}

export function useVoiceAnswer({ onAnswer, enabled, disabled }: UseVoiceAnswerOptions) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const optionMap: Record<string, number> = {
    a: 0, ay: 0, hey: 0, eh: 0,
    b: 1, be: 1, bee: 1,
    c: 2, see: 2, sea: 2, si: 2,
    d: 3, de: 3, dee: 3,
    "1": 0, "2": 1, "3": 2, "4": 3,
    one: 0, two: 1, three: 2, four: 3,
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 5;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event: any) => {
      for (let i = 0; i < event.results[0].length; i++) {
        const text = event.results[0][i].transcript.trim().toLowerCase();
        setTranscript(text);
        // Check each word
        for (const word of text.split(/\s+/)) {
          if (word in optionMap) {
            onAnswer(optionMap[word]);
            return;
          }
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onAnswer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
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
    return () => { if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {} };
  }, []);

  const supported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return { listening, transcript, toggle, supported, startListening, stopListening };
}
