import { useState, useRef, useCallback } from "react";
import { Check } from "lucide-react";
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
  const [direction, setDirection] = useState<1 | -1>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const validOptions = options.filter((o) => o.trim());
  const totalOptions = validOptions.length;

  const goNext = useCallback(() => {
    if (revealed) return;
    setDirection(1);
    setActiveIndex((prev) => Math.min(prev + 1, totalOptions - 1));
  }, [totalOptions, revealed]);

  const goPrev = useCallback(() => {
    if (revealed) return;
    setDirection(-1);
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
    if (!revealed) return "border-border bg-card";
    if (index === shuffledAnswerIndex)
      return "border-success bg-success/10 ring-2 ring-success/30";
    if (index === selectedOption)
      return "border-destructive bg-destructive/10 ring-2 ring-destructive/30";
    return "border-border bg-card opacity-40";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Roller card */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-card min-h-[120px] touch-pan-x"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeIndex}
            initial={{ y: direction * 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction * -80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            drag={revealed ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            className={`p-5 flex items-center gap-4 min-h-[120px] cursor-grab active:cursor-grabbing select-none ${getOptionStyle(activeIndex)}`}
          >
            {/* Option label on the side */}
            <span className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
              revealed && activeIndex === shuffledAnswerIndex
                ? "bg-success text-success-foreground"
                : revealed && activeIndex === selectedOption
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted border border-border"
            }`}>
              {OPTION_LABELS[activeIndex]}
            </span>
            {/* Option text */}
            <p className="text-base font-medium leading-relaxed flex-1">
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

        {/* Swipe hint */}
        {!revealed && (
          <div className="absolute top-2 right-3 text-[9px] text-muted-foreground/50 font-medium">
            ↕ swipe
          </div>
        )}
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
        <div className={`px-5 py-3 rounded-lg text-sm font-bold ${
          selectedOption === shuffledAnswerIndex
            ? "bg-success/10 text-success border border-success/30"
            : "bg-destructive/10 text-destructive border border-destructive/30"
        }`}>
          {selectedOption === shuffledAnswerIndex
            ? "✓ Correct!"
            : `✗ Wrong — Correct answer: ${OPTION_LABELS[shuffledAnswerIndex]}. ${validOptions[shuffledAnswerIndex]}`}
        </div>
      )}
    </div>
  );
}
