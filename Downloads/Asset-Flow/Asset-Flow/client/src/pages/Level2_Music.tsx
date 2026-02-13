import { useState, useRef, useEffect } from "react";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Music, Play, Pause, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Howl } from 'howler';

interface Props {
  onComplete: () => void;
}

const SONGS = [
  { id: 1, title: "Shape of You", artist: "Ed Sheeran" },
  // Add your local preview file at `client/public/audio/o_mahi.mpeg`
  { id: 2, title: "O Mahi", artist: "Arijit Singh", isCorrect: true, preview: '/audio/o_mahi.mpeg' },
  { id: 3, title: "Abhi Na Jao", artist: "Rafi Sahab" },
  { id: 4, title: "EK Din Aap", artist: "Abheejit" }
];

export default function Level2_Music({ onComplete }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Howl | null>(null);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, []);

  const handleSelect = (song: typeof SONGS[0]) => {
    if (selectedId === song.id) return; // Already selected
    
    setSelectedId(song.id);
    
    // If correct song, play preview and advance
    if (song.isCorrect) {
      if (soundRef.current) soundRef.current.unload();
      
      // Placeholder preview URL - typically this would be a real mp3 url
      // Using a short piano sample URL for demo purposes or a placeholder
      // Use song-specific preview if provided, otherwise fall back to alarm sound
      soundRef.current = new Howl({
        src: [song.preview ?? '/audio/alarm_clock.mp3'],
        volume: 0.5,
        onend: () => setIsPlaying(false)
      });
      
      soundRef.current.play();
      setIsPlaying(true);
      
      // Advance after a short delay to let them realize they got it right
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      // Wrong answer logic could go here (shake effect etc), but for now we just highlight it
      if (soundRef.current) soundRef.current.stop();
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GameCard className="max-w-xl">
        <div className="flex flex-col items-center space-y-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
            <Music className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-serif font-medium">
              Which song reminds me of you?
            </h2>
            <p className="text-muted-foreground">
              Listen to your heart...
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 w-full">
            {SONGS.map((song) => {
              const isSelected = selectedId === song.id;
              const isCorrect = song.isCorrect;
              
              return (
                <Button
                  key={song.id}
                  variant="outline"
                  className={cn(
                    "h-auto py-4 px-6 justify-between text-left rounded-xl border-2 transition-all duration-300",
                    isSelected && isCorrect 
                      ? "border-primary bg-primary/5 text-primary shadow-md" 
                      : isSelected && !isCorrect
                      ? "border-destructive bg-destructive/5 text-destructive"
                      : "hover:border-primary/50 hover:bg-accent"
                  )}
                  onClick={() => handleSelect(song)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-base">{song.title}</span>
                    <span className="text-xs opacity-70 font-medium">{song.artist}</span>
                  </div>
                  
                  {isSelected && isCorrect && (
                    <div className="rounded-full bg-primary p-1 text-white animate-in zoom-in">
                      {isPlaying ? <Music className="w-4 h-4 animate-bounce" /> : <Check className="w-4 h-4" />}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </GameCard>
    </div>
  );
}
