import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { useCreateSession } from "@/hooks/use-game-session";
import { Button } from "@/components/ui/button";

interface Props {
  onComplete: (sessionId?: number) => void;
}

export default function Level0_Entry({ onComplete }: Props) {
  const [isStarting, setIsStarting] = useState(false);
  const createSession = useCreateSession();

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const session = await createSession.mutateAsync({});
      onComplete(session.id);
    } catch (error) {
      console.error("Failed to start game", error);
      // Fallback: continue to next level even if session creation failed
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GameCard className="text-center">
        <motion.div
          className="mb-8 flex justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="relative">
            <Heart className="w-20 h-20 text-primary fill-primary/20" />
            <Heart className="w-20 h-20 text-primary absolute inset-0 animate-ping opacity-20" />
          </div>
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-6 leading-tight">
          Only the one who owns my heart can unlock this.
        </h1>

        <p className="text-muted-foreground mb-8 font-light italic">
          Are you ready to find your surprise?
        </p>

        <Button
          onClick={handleStart}
          disabled={isStarting}
          size="lg"
          className="
            w-full md:w-auto text-lg px-8 py-6 rounded-full font-serif
            bg-gradient-to-r from-primary to-primary/80 
            hover:from-primary/90 hover:to-primary 
            shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 
            transition-all duration-300 transform hover:-translate-y-1
          "
        >
          {isStarting ? (
            <span className="flex items-center gap-2">Opening... <Heart className="w-4 h-4 animate-spin" /></span>
          ) : (
            "Start the Game 💖"
          )}
        </Button>
      </GameCard>
    </div>
  );
}
