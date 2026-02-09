import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { loginSchema, insertUserSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';
import { z } from 'zod';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const formSchema = mode === 'login' ? loginSchema : insertUserSchema.extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const authMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await apiRequest('POST', endpoint, data);
      const jsonData = await response.json() as { user: User; token: string };
      return jsonData;
    },
    onSuccess: (data: { user: User; token: string }) => {
      login(data.user, data.token);
      toast({
        title: mode === 'login' ? 'Welcome back!' : 'Account created!',
        description: `Successfully ${mode === 'login' ? 'logged in' : 'registered'} as ${data.user.username}`,
      });
      setLocation('/chat');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: error.message || 'Please check your credentials and try again.',
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    authMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <MessageCircle className="w-9 h-9 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Talko
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {mode === 'login' ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your username"
                        autoComplete="username"
                        disabled={authMutation.isPending}
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        disabled={authMutation.isPending}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={authMutation.isPending}
                data-testid="button-submit"
              >
                {authMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Sign Up'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                form.reset();
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={authMutation.isPending}
              data-testid="button-toggle-mode"
            >
              {mode === 'login' ? (
                <>
                  Don't have an account? <span className="text-primary font-semibold">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="text-primary font-semibold">Sign in</span>
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
