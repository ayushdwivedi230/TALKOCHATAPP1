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
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [chatMode, setChatMode] = useState<'group' | 'dm'>('group');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const outboundTypingTimeout = useRef<number | null>(null);
  const inboundTypingTimeout = useRef<number | null>(null);

  /* ---------------- Dark mode ---------------- */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  /* ---------------- Auth guard ---------------- */
  useEffect(() => {
    if (!user) setLocation('/');
  }, [user, setLocation]);

  /* ---------------- Fetch users ---------------- */
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user
  });

  /* ---------------- Fetch messages ---------------- */
  const queryKey =
    chatMode === 'group'
      ? ['/api/messages']
      : ['/api/conversations', selectedUserId];

  const { data: messages = [], isLoading } = useQuery<MessageWithSender[]>({
    queryKey,
    enabled: chatMode === 'group' || selectedUserId !== null
  });

  const messagesToRender = messages;

  /* ---------------- WebSocket ---------------- */
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('token');
    const url = `${protocol}//${window.location.host}/ws`;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', token }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        if (!data.message.recipientId) {
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        } else {
          queryClient.invalidateQueries({
            queryKey: ['/api/conversations', data.message.senderId]
          });
          queryClient.invalidateQueries({
            queryKey: ['/api/conversations', data.message.recipientId]
          });
        }
      }

      if (data.type === 'typing') {
        // Show typing indicator for the sender
        setTypingUserId(data.fromUserId);
        // Auto-hide after 2s in case stop_typing is lost
        if (inboundTypingTimeout.current) window.clearTimeout(inboundTypingTimeout.current);
        inboundTypingTimeout.current = window.setTimeout(() => {
          setTypingUserId(null);
          inboundTypingTimeout.current = null;
        }, 2000) as unknown as number;
      }

      if (data.type === 'stop_typing') {
        setTypingUserId(null);
        if (inboundTypingTimeout.current) {
          window.clearTimeout(inboundTypingTimeout.current);
          inboundTypingTimeout.current = null;
        }
      }

      if (data.type === 'online_users') {
        setOnlineUsers(data.users);
      }
    };

    socket.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'WebSocket error',
        description: 'Failed to connect'
      });
    };

    setWs(socket);
    return () => socket.close();
  }, [user, toast]);

  /* ---------------- Auto-scroll ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesToRender]);

  /* ---------------- Send message ---------------- */
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const payload: { text: string; recipientId?: number } = { text };
      if (chatMode === 'dm' && selectedUserId) {
        payload.recipientId = selectedUserId;
      }
      await apiRequest('POST', '/api/messages', payload);
    },
    onSuccess: () => {
      setMessage('');
      // send stop_typing when message is sent
      try {
        if (ws && chatMode === 'dm' && selectedUserId) {
          ws.send(JSON.stringify({ type: 'stop_typing', fromUserId: user!.id, toUserId: selectedUserId }));
        }
      } catch (err) {}
      if (chatMode === 'group') {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      } else if (selectedUserId) {
        queryClient.invalidateQueries({
          queryKey: ['/api/conversations', selectedUserId]
        });
      }
    },
    onError: (err: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: err.message
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  // Send typing events when user types (debounced)
  const handleTyping = (text: string) => {
    setMessage(text);
    if (!ws || chatMode !== 'dm' || !selectedUserId) return;

    // send typing
    try {
      ws.send(JSON.stringify({ type: 'typing', fromUserId: user!.id, toUserId: selectedUserId }));
    } catch (err) {
      // ignore send errors
    }

    if (outboundTypingTimeout.current) window.clearTimeout(outboundTypingTimeout.current);
    outboundTypingTimeout.current = window.setTimeout(() => {
      try {
        ws.send(JSON.stringify({ type: 'stop_typing', fromUserId: user!.id, toUserId: selectedUserId }));
      } catch (err) {}
      outboundTypingTimeout.current = null;
    }, 1500) as unknown as number;
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  if (!user) return null;

  /* ---------------- UI ---------------- */
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        setChatMode('group');
                        setSelectedUserId(null);
                      }}
                    >
                      <Users className="w-4 h-4" /> Group Chat
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allUsers
                    .filter(u => u.id !== user.id)
                    .map(u => (
                      <SidebarMenuItem key={u.id}>
                        <SidebarMenuButton
                          onClick={() => {
                            setChatMode('dm');
                            setSelectedUserId(u.id);
                          }}
                        >
                          <Avatar
                            username={u.username}
                            size="sm"
                            online={onlineUsers.some(o => o.id === u.id)}
                          />
                          {u.username}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-6">
            <h1 className="font-semibold">
              {chatMode === 'group'
                ? 'Group Chat'
                : allUsers.find(u => u.id === selectedUserId)?.username}
            </h1>
            <div className="flex gap-2">
              <Button size="icon" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun /> : <Moon />}
              </Button>
              <Button size="icon" onClick={handleLogout}>
                <LogOut />
              </Button>
            </div>
          </header>

          <ScrollArea className="flex-1 p-6">
            {isLoading ? (
              <p>Loading...</p>
            ) : messagesToRender.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No messages yet
              </p>
            ) : (
              messagesToRender.map((msg, idx) => {
                const isOwn = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-4 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isOwn && <Avatar username={msg.sender.username} />}
                    <div className="max-w-md px-4 py-2 rounded-lg bg-card">
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatDistanceToNow(
                          new Date(msg.created_at || Date.now()),
                          { addSuffix: true }
                        )}
                      </div>
                      <p>{msg.content}</p>
                    </div>
                    {isOwn && <Avatar username={user.username} />}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
            <div className="flex-1">
              <Input
                value={message}
                onChange={e => handleTyping(e.target.value)}
                placeholder="Type a message..."
              />
              {chatMode === 'dm' && typingUserId && typingUserId === selectedUserId && (
                <div className="text-sm text-muted-foreground mt-1">Typing...</div>
              )}
            </div>
            <Button type="submit" disabled={!message.trim()}>
              <Send />
            </Button>
          </form>
        </div>
      </div>
    </SidebarProvider>
  );
}
