import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import Level0_Entry from "./Level0_Entry";
import Level1_Memory from "./Level1_Memory";
import Level2_Music from "./Level2_Music";
import Level3_Puzzle from "./Level3_Puzzle";
// Level 4 was removed; render a simple placeholder instead of importing the file.
import Level5_Finale from "./Level5_Finale";
import { LevelTransition } from "@/components/LevelTransition";
import { Button } from "@/components/ui/button";
import { useUpdateSession } from "@/hooks/use-game-session";

export default function GameContainer() {
  const [level, setLevel] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const updateSession = useUpdateSession();

  const handleLevelComplete = (newSessionId?: number) => {
    // If we receive a session ID (Level 0), store it
    if (newSessionId) setSessionId(newSessionId);

    // Show transition animation
    setShowTransition(true);

    // Hide the transition after a short delay so the exit animation runs
    // which triggers `onExitComplete` in `LevelTransition` and advances level.
    setTimeout(() => setShowTransition(false), 800);
    
    // Update backend progress if session exists
    if (sessionId || newSessionId) {
      const activeId = sessionId || newSessionId!;
      const nextLevel = level + 1;
      
      updateSession.mutate({
        id: activeId,
        completedLevel: nextLevel,
        reachedFinale: nextLevel === 5
      });
    }
  };

  const advanceLevel = () => {
    setShowTransition(false);
    setLevel((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen w-full bg-background overflow-x-hidden">
      <LevelTransition 
        isVisible={showTransition} 
        onComplete={advanceLevel} 
      />

      <AnimatePresence mode="wait">
        {level === 0 && <Level0_Entry key="l0" onComplete={handleLevelComplete} />}
        {level === 1 && <Level1_Memory key="l1" onComplete={() => handleLevelComplete()} />}
        {level === 2 && <Level2_Music key="l2" onComplete={() => handleLevelComplete()} />}
        {level === 3 && <Level3_Puzzle key="l3" onComplete={() => handleLevelComplete()} />}
        {level === 4 && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-xl w-full p-6 bg-white/90 rounded-2xl shadow-md text-center">
              <h2 className="text-2xl font-serif font-medium">Level 4 (removed)</h2>
              <p className="text-muted-foreground mt-2">This task was removed — click continue to proceed.</p>
              <div className="mt-6">
                <Button onClick={() => handleLevelComplete()} className="px-6 py-3">Continue</Button>
              </div>
            </div>
          </div>
        )}
        {level === 5 && <Level5_Finale key="l5" />}
      </AnimatePresence>
    </div>
  );
}
