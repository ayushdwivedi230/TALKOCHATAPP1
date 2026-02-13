import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface LevelTransitionProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function LevelTransition({ isVisible, onComplete }: LevelTransitionProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1.2, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative"
          >
            <Heart className="w-32 h-32 text-primary fill-primary/20 animate-pulse" />
            <motion.div 
              className="absolute inset-0 flex items-center justify-center text-primary-foreground font-hand text-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Love
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
