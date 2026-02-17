import { useState, useEffect, useCallback, useRef } from "react";

interface UseVoiceAnswerOptions {
  onAnswer: (optionIndex: number) => void;
  onTutorCommand?: (command: string) => void;
  enabled: boolean;
  disabled: boolean;
}

export function useVoiceAnswer({ onAnswer, onTutorCommand, enabled, disabled }: UseVoiceAnswerOptions) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const onAnswerRef = useRef(onAnswer);
  const onTutorCommandRef = useRef(onTutorCommand);
  onAnswerRef.current = onAnswer;
  onTutorCommandRef.current = onTutorCommand;

  const optionMap: Record<string, number> = {
    a: 0, ay: 0, hey: 0, eh: 0, alpha: 0, "option a": 0,
    b: 1, be: 1, bee: 1, bravo: 1, "option b": 1,
    c: 2, see: 2, sea: 2, si: 2, charlie: 2, "option c": 2,
    d: 3, de: 3, dee: 3, delta: 3, "option d": 3,
    "1": 0, "2": 1, "3": 2, "4": 3,
    one: 0, two: 1, three: 2, four: 3,
    first: 0, second: 1, third: 2, fourth: 3,
  };

  // Tutor trigger phrases
  const tutorPatterns = [
    { pattern: /explain\s*this/i, command: "Explain this question and the correct answer" },
    { pattern: /why\s*is\s*([abcd])\s*correct/i, command: (m: RegExpMatchArray) => `Why is option ${m[1].toUpperCase()} the correct answer?` },
    { pattern: /why\s*(?:is\s*)?(?:that|it)\s*(?:correct|right)/i, command: "Why is that the correct answer?" },
    { pattern: /help\s*(?:me)?/i, command: "Help me understand this question" },
  ];

  const processTranscript = useCallback((text: string) => {
    const normalized = text.trim().toLowerCase();
    setTranscript(normalized);

    // Check tutor commands first (only when answer is revealed / disabled)
    if (disabled && onTutorCommandRef.current) {
      for (const { pattern, command } of tutorPatterns) {
        const match = normalized.match(pattern);
        if (match) {
          const cmd = typeof command === "function" ? command(match) : command;
          onTutorCommandRef.current(cmd);
          return true;
        }
      }
    }

    // Check "option X" phrases first
    for (const phrase of ["option a", "option b", "option c", "option d"]) {
      if (normalized.includes(phrase) && !disabled) {
        onAnswerRef.current(optionMap[phrase]);
        return true;
      }
    }

    // Then single-word matches
    if (!disabled) {
      for (const word of normalized.split(/\s+/)) {
        if (word in optionMap) {
          onAnswerRef.current(optionMap[word]);
          return true;
        }
      }
      // Single-char match
      if (normalized.length === 1 && normalized in optionMap) {
        onAnswerRef.current(optionMap[normalized]);
        return true;
      }
    }
    return false;
  }, [disabled]);

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
    else startListening();
  }, [listening, startListening, stopListening]);

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
