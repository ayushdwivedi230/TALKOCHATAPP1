import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GameCard({ children, className }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "bg-white/80 backdrop-blur-md border border-white/50",
        "shadow-xl shadow-primary/10 rounded-3xl p-8 md:p-12",
        "w-full max-w-lg mx-auto relative overflow-hidden",
        className
      )}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      {children}
    </motion.div>
  );
}
