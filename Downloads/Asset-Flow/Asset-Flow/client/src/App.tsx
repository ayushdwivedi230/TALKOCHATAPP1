import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import GameContainer from "@/pages/GameContainer";
import Login from "@/pages/Login";
import { useState } from "react";

function Router() {
  const [auth, setAuth] = useState<boolean>(() => !!localStorage.getItem("af_auth"));

  // Simple client-side guarded root route — if not authenticated, show /login
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {auth ? <GameContainer /> : <Login />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
