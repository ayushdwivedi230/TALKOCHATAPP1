import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { GameCard } from "@/components/GameCard";
import { Howl } from 'howler';

export default function Level5_Finale() {
  const [textVisible, setTextVisible] = useState(false);
  const audioRef = useRef<Howl | null>(null);

  useEffect(() => {
    // 1. Trigger Confetti
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults, 
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // 2. Play Celebration Music
    audioRef.current = new Howl({
      src: ['https://actions.google.com/sounds/v1/ambiences/morning_stream.ogg'], // Placeholder gentle stream/nature sound
      volume: 0.5,
      loop: true,
      fade: 1000
    });
    audioRef.current.play();

    // 3. Reveal Text
    setTimeout(() => setTextVisible(true), 1000);

    return () => {
      clearInterval(interval);
      audioRef.current?.unload();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Bloom Effect */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 20, opacity: 0.2 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="absolute inset-0 bg-gradient-to-tr from-pink-300 via-rose-300 to-peach-300 rounded-full blur-3xl"
        style={{ transformOrigin: "center" }}
      />
      
      <GameCard className="max-w-2xl text-center z-10 bg-white/90 shadow-2xl border-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <h1 className="text-5xl md:text-7xl font-serif font-bold bloom-text mb-8">
            Happy Birthday ❤️
          </h1>
          
          {textVisible && (
            <div className="space-y-6">
              <p className="text-xl md:text-2xl font-light text-foreground/80 leading-relaxed typewriter">
                This wasn’t just code bebo <br/>
                It was every heartbeat compiled for you my aspiring fastbowler from men team 🥹
              </p>

              <div className="bg-transparent p-2 md:p-4 rounded-lg">
                <p className="text-base md:text-lg text-foreground/85 leading-relaxed">
                  I know words can’t undo the hurt,
                  but I’m truly sorry for everything that went wrong between us,
                  for the things I said, the moments I failed to understand you,
                  and the pain our last argument may have caused.
                </p>

                <p className="text-base md:text-lg text-foreground/85 leading-relaxed pt-3">
                  You are rare.
                  Your kindness, your strength, your smile, the way you make life feel lighter 
                  all of it still lives with me, every single day.
                </p>

                <p className="text-base md:text-lg text-foreground/85 leading-relaxed pt-3">
                  Bebo you are more beautiful than you realize, inside and out, you are not baunu 😞
                  and knowing you has been one of the greatest gifts of my life.
                </p>

                <p className="text-base md:text-lg text-foreground/85 leading-relaxed pt-3">
                  I miss you more than I can ever explain.
                  I miss your voice, your presence, your laughter,
                  and the comfort that only you brought into my world.
                </p>

                <p className="text-base md:text-lg text-foreground/85 leading-relaxed pt-3">
                  No matter where life takes us,
                  a part of my heart will always choose you.
                  Always.
                </p>

                <p className="text-base md:text-lg text-foreground/85 leading-relaxed pt-3">
                  With all my love, and a heart full of regret and admiration 
                  
                </p>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4, duration: 2 }}
                className="pt-8"
              >
                <p className="font-hand text-3xl text-primary transform -rotate-3">
                  With all my love, always.
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>
      </GameCard>
    </div>
  );
}
