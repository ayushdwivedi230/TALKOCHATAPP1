import { useState, useEffect } from "react";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onComplete: () => void;
}

const WORDS = [
  { id: "word-1", text: "Mai", value: "Mai" },
  { id: "word-2", text: "Bahut", value: "Bahut" },
  { id: "word-3", text: "FastBowling", value: "FastBowling" },
  { id: "word-4", text: "Karta", value: "Karta" },
  { id: "word-5", text: "Rha", value: "Rha" },
];

// Target phrase: "Mai Bahut FastBowling Karta Rha"
const CORRECT_ORDER = ["Mai", "Bahut", "FastBowling", "Karta", "Rha"];

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Level3_Puzzle({ onComplete }: Props) {
  const [selectedWords, setSelectedWords] = useState<typeof WORDS>([]);
  const [availableWords, setAvailableWords] = useState<typeof WORDS>(() => shuffle([...WORDS]));
  const [isSuccess, setIsSuccess] = useState(false);

  const handleWordClick = (word: typeof WORDS[0]) => {
    // Move from available to selected
    setAvailableWords(prev => prev.filter(w => w.id !== word.id));
    setSelectedWords(prev => [...prev, word]);
  };

  const handleSelectedClick = (word: typeof WORDS[0]) => {
    // Move from selected back to available
    setSelectedWords(prev => prev.filter(w => w.id !== word.id));
    setAvailableWords(prev => [...prev, word]);
  };

  useEffect(() => {
    // Check if full sentence is formed
    if (selectedWords.length === WORDS.length) {
      const currentValues = selectedWords.map(w => w.value);
      const isCorrect = currentValues.every((val, index) => val === CORRECT_ORDER[index]);

      if (isCorrect) {
        setIsSuccess(true);
        setTimeout(onComplete, 1500);
      } else {
        // Auto reset if wrong after a short delay
        const timer = setTimeout(() => {
          setAvailableWords(WORDS);
          setSelectedWords([]);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedWords, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GameCard className="max-w-xl">
        <div className="flex flex-col items-center space-y-8 min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Heart className="w-8 h-8 fill-current" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-serif font-medium">
              Complete the sentence
            </h2>
            <p className="text-muted-foreground">
              What do I want to tell you?
            </p>
          </div>

          {/* Answer Area */}
          <div className={cn(
            "w-full p-6 min-h-[80px] rounded-2xl bg-secondary/30 border-2 border-dashed border-primary/20 flex flex-wrap gap-3 justify-center items-center transition-colors duration-300",
            isSuccess && "border-green-500 bg-green-50 border-solid",
            selectedWords.length === WORDS.length && !isSuccess && "border-red-300 bg-red-50 border-solid"
          )}>
            <AnimatePresence mode="popLayout">
              {selectedWords.map((word) => (
                <motion.div
                  key={word.id}
                  layoutId={word.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    onClick={() => !isSuccess && handleSelectedClick(word)}
                    variant="default"
                    className="font-bold text-lg px-6 py-6 rounded-xl shadow-md bg-white text-foreground hover:bg-white/90 border border-primary/10"
                  >
                    {word.text}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {selectedWords.length === 0 && (
              <span className="text-muted-foreground/40 italic">Tap words below to arrange them</span>
            )}
          </div>

          {/* Word Bank */}
          <div className="flex flex-wrap gap-4 justify-center w-full pt-4">
            <AnimatePresence mode="popLayout">
              {availableWords.map((word) => (
                <motion.div
                  key={word.id}
                  layoutId={word.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    onClick={() => handleWordClick(word)}
                    variant="outline"
                    className="font-medium text-lg px-6 py-6 rounded-xl border-2 hover:border-primary/50 hover:bg-secondary/50 bg-transparent"
                  >
                    {word.text}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </GameCard>
    </div>
  );
}
