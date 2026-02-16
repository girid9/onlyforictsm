import { useState, useRef, useCallback } from "react";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface RollerOptionPickerProps {
  options: string[];
  shuffledAnswerIndex: number;
  revealed: boolean;
  selectedOption: number | null;
  onSelect: (index: number) => void;
}

export function RollerOptionPicker({
  options,
  shuffledAnswerIndex,
  revealed,
  selectedOption,
  onSelect,
}: RollerOptionPickerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const validOptions = options.filter((o) => o.trim());
  const totalOptions = validOptions.length;

  const goNext = useCallback(() => {
    if (revealed) return;
    setActiveIndex((prev) => Math.min(prev + 1, totalOptions - 1));
  }, [totalOptions, revealed]);

  const goPrev = useCallback(() => {
    if (revealed) return;
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, [revealed]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (Math.abs(info.offset.y) > 40) {
        if (info.offset.y < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev]
  );

  const handleConfirm = useCallback(() => {
    if (revealed) return;
    onSelect(activeIndex);
  }, [activeIndex, revealed, onSelect]);

  const getOptionStyle = (index: number) => {
    if (!revealed) return "";
    if (index === shuffledAnswerIndex) return "border-success bg-success/10";
    if (index === selectedOption) return "border-destructive bg-destructive/10";
    return "opacity-40";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Navigation arrows + roller */}
      <div className="relative w-full max-w-md">
        {/* Up arrow */}
        <button
          onClick={goPrev}
          disabled={activeIndex === 0 || revealed}
          className="w-full flex justify-center py-2 text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors"
        >
          <ChevronUp size={24} />
        </button>

        {/* Roller card */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl border border-border bg-card min-h-[140px] touch-pan-x"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              drag={revealed ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={handleDragEnd}
              className={`p-6 flex flex-col items-center justify-center min-h-[140px] cursor-grab active:cursor-grabbing select-none ${getOptionStyle(activeIndex)}`}
            >
              <span className="h-10 w-10 rounded-lg border border-border bg-muted/50 flex items-center justify-center text-sm font-black mb-3">
                {OPTION_LABELS[activeIndex]}
              </span>
              <p className="text-center text-base font-medium leading-relaxed px-4">
                {validOptions[activeIndex]}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots indicator */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {validOptions.map((_, i) => (
              <button
                key={i}
                onClick={() => !revealed && setActiveIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === activeIndex
                    ? "w-6 bg-primary"
                    : revealed && i === shuffledAnswerIndex
                    ? "w-3 bg-success"
                    : revealed && i === selectedOption
                    ? "w-3 bg-destructive"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Down arrow */}
        <button
          onClick={goNext}
          disabled={activeIndex === totalOptions - 1 || revealed}
          className="w-full flex justify-center py-2 text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors"
        >
          <ChevronDown size={24} />
        </button>
      </div>

      {/* Confirm button */}
      {!revealed && (
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all active:scale-[0.97]"
        >
          <Check size={16} />
          Lock In {OPTION_LABELS[activeIndex]}
        </button>
      )}

      {/* Result indicator */}
      {revealed && (
        <div className={`px-4 py-2 rounded-lg text-sm font-bold ${
          selectedOption === shuffledAnswerIndex
            ? "bg-success/10 text-success border border-success/30"
            : "bg-destructive/10 text-destructive border border-destructive/30"
        }`}>
          {selectedOption === shuffledAnswerIndex
            ? "✓ Correct!"
            : `✗ Wrong — Answer: ${OPTION_LABELS[shuffledAnswerIndex]}`}
        </div>
      )}
    </div>
  );
}
