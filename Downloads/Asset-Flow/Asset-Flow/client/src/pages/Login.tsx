import { useState } from "react";
import { useLocation } from "wouter";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check
    if (user === "bubu" && pass === "1234") {
      localStorage.setItem("af_auth", "1");
      setError("");
      setLocation("/");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GameCard className="max-w-md w-full">
        <h2 className="text-2xl font-serif font-medium text-center mb-4">Please sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border"
              placeholder="username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border"
              placeholder="password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end">
            <Button type="submit">Sign in</Button>
          </div>
        </form>
      </GameCard>
    </div>
  );
}
