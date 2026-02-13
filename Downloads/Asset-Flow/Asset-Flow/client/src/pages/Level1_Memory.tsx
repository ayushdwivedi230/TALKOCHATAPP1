import { useState } from "react";
import { GameCard } from "@/components/GameCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Props {
  onComplete: () => void;
}

export default function Level1_Memory({ onComplete }: Props) {
  const [date, setDate] = useState("");
  const { toast } = useToast();
  const [shake, setShake] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize input to check against the correct date (hidden)
    const normalized = date.trim();
    
    // Check various formats or specific string
    if (normalized === "13/08/2022" || normalized === "2022-08-13") {
      onComplete();
    } else {
      setShake(prev => prev + 1);
      toast({
        title: "Not quite...",
        description: "Acchaw ji chalo ab try again cutie 😉",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        animate={{ x: shake % 2 === 0 ? 0 : [-10, 10, -10, 10, 0] }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <GameCard>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary mb-2">
              <Calendar className="w-8 h-8" />
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-medium">
              When did we first talk?
            </h2>
            
            <p className="text-sm text-muted-foreground">
              (Format: DD/MM/YYYY)
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <Input
                type="text" 
                placeholder="e.g. DD/MM/YYYY"
                className="text-center text-lg py-6 rounded-2xl border-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                autoFocus
              />
              
              <Button 
                type="submit" 
                className="w-full py-6 rounded-2xl text-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Unlock Memory <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </div>
        </GameCard>
      </motion.div>
    </div>
  );
}
