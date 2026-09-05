import { useEffect, useState } from 'react';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';

const client = createClient();

interface Conversation {
  id: string;
  other_name: string;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

export default function Messages() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (!res?.data) {
          client.auth.toLogin();
        } else {
          setUser(res.data);
          loadConversations();
        }
      })
      .catch(() => client.auth.toLogin());
  }, []);

  const loadConversations = async () => {
    try {
      const res = await client.entities.messages.queryMine({ sort: '-created_at', limit: 50 });
      const msgs = res?.data?.items || [];

      // Group by conversation partner
      const convMap = new Map<string, Conversation>();
      msgs.forEach((msg: any) => {
        const partnerId = msg.receiver_id === user?.id ? msg.sender_id : msg.receiver_id;
        const partnerName = msg.receiver_id === user?.id ? (msg.sender_name || 'Usuario') : (msg.receiver_name || 'Usuario');
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            id: partnerId,
            other_name: partnerName,
            last_message: msg.content,
            last_time: msg.created_at,
            unread: 0,
          });
        }
      });

      setConversations(Array.from(convMap.values()));
    } catch {
      // No messages yet
    }
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    setSelectedConv(convId);
    try {
      const res = await client.entities.messages.queryMine({
        sort: 'created_at',
        limit: 100,
      });
      const allMsgs = res?.data?.items || [];
      const filtered = allMsgs
        .filter((m: any) => m.sender_id === convId || m.receiver_id === convId)
        .map((m: any) => ({
          ...m,
          is_mine: m.sender_id !== convId,
        }));
      setMessages(filtered);
    } catch {
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    try {
      await client.entities.messages.create({
        data: {
          receiver_id: selectedConv,
          content: newMessage.trim(),
          sender_name: user?.nickname || user?.email?.split('@')[0] || 'Usuario',
          receiver_name: conversations.find(c => c.id === selectedConv)?.other_name || 'Usuario',
        },
      });
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender_id: user?.id,
        receiver_id: selectedConv,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_mine: true,
      }]);
      setNewMessage('');
    } catch {
      toast.error('Error al enviar mensaje');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-slate-50">
        <div className="container py-6">
          <h1 className="text-2xl md:text-3xl mb-6">Mensajes</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
            {/* Conversation List */}
            <Card className="bg-white overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Conversaciones</h3>
                </div>
                <div className="overflow-y-auto h-[540px]">
                  {loading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex gap-3">
                          <div className="h-10 w-10 bg-slate-200 rounded-full" />
                          <div className="flex-1">
                            <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                            <div className="h-2 bg-slate-200 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : conversations.length > 0 ? (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => loadMessages(conv.id)}
                        className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${selectedConv === conv.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-emerald-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{conv.other_name}</span>
                              {conv.unread > 0 && (
                                <Badge className="bg-emerald-500 text-white text-xs">{conv.unread}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No tienes conversaciones aún</p>
                      <p className="text-xs text-muted-foreground mt-1">Contacta a un profesional para iniciar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="md:col-span-2 bg-white overflow-hidden flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                {selectedConv ? (
                  <>
                    {/* Chat header */}
                    <div className="p-4 border-b flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-emerald-700" />
                      </div>
                      <span className="font-medium text-sm">
                        {conversations.find(c => c.id === selectedConv)?.other_name || 'Chat'}
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                            msg.is_mine
                              ? 'bg-emerald-600 text-white rounded-br-md'
                              : 'bg-slate-100 text-foreground rounded-bl-md'
                          }`}>
                            {msg.content}
                            <p className={`text-xs mt-1 ${msg.is_mine ? 'text-emerald-200' : 'text-muted-foreground'}`}>
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          Inicia la conversación enviando un mensaje
                        </p>
                      )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                        className="flex-1"
                      />
                      <Button onClick={handleSend} disabled={!newMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-muted-foreground">Selecciona una conversación</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}