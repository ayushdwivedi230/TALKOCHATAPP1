import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, LogOut, Users, Moon, Sun, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider 
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/Avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { MessageWithSender, User } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<MessageWithSender[]>({
    queryKey: ['/api/messages'],
    refetchInterval: false,
  });

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    const authToken = localStorage.getItem('token');

    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({ 
        type: 'auth', 
        token: authToken
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      } else if (data.type === 'online_users') {
        setOnlineUsers(data.users);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection error',
        description: 'Failed to connect to chat server',
      });
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest('POST', '/api/messages', { text });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: error.message,
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {/* Shadcn Sidebar */}
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 px-4">
                <Users className="w-4 h-4 text-primary" />
                Online Users
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {onlineUsers.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-muted-foreground">No users online</p>
                    </div>
                  ) : (
                    onlineUsers.map((onlineUser) => (
                      <SidebarMenuItem key={onlineUser.id}>
                        <SidebarMenuButton className="h-auto py-3">
                          <div className="flex items-center gap-3 w-full" data-testid={`user-${onlineUser.username}`}>
                            <Avatar username={onlineUser.username} size="sm" online={true} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {onlineUser.username}
                                {onlineUser.id === user.id && (
                                  <span className="text-xs text-muted-foreground ml-1">(you)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Talko</h1>
                <p className="text-xs text-muted-foreground">Welcome, {user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                data-testid="button-theme-toggle"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="max-w-4xl mx-auto space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-24" />
                        <div className="h-16 bg-muted rounded-2xl max-w-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Start the conversation by sending your first message below
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwnMessage = msg.senderId === user.id;
                  const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${msg.id}`}
                    >
                      {!isOwnMessage && showAvatar && (
                        <Avatar username={msg.sender.username} size="md" />
                      )}
                      {!isOwnMessage && !showAvatar && (
                        <div className="w-10" />
                      )}
                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-md lg:max-w-lg`}>
                        {showAvatar && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-xs font-semibold">
                              {isOwnMessage ? 'You' : msg.sender.username}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-card text-card-foreground rounded-tl-sm border border-border'
                          }`}
                        >
                          <p className="text-base break-words">{msg.text}</p>
                        </div>
                      </div>
                      {isOwnMessage && showAvatar && (
                        <Avatar username={user.username} size="md" />
                      )}
                      {isOwnMessage && !showAvatar && (
                        <div className="w-10" />
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message input */}
          <div className="border-t border-border p-4 bg-card">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sendMessageMutation.isPending}
                  className="flex-1 rounded-full bg-background px-6"
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="rounded-full w-12 h-12"
                  data-testid="button-send"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
