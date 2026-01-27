import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      const [userRes, messagesRes, matchesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/chat/${matchId}/messages`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/matches`, { credentials: 'include' })
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setMessages(messagesData);
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        const currentMatch = matchesData.find(m => m.match.match_id === matchId);
        if (currentMatch) {
          setOtherUser(currentMatch.other_user);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/${matchId}/messages`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/${matchId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: newMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleGeneratePitch = async () => {
    setGeneratingPitch(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/generate-pitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ match_id: matchId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate pitch');
      }

      const data = await response.json();
      setNewMessage(data.pitch);
      toast.success('AI pitch generated!');
    } catch (error) {
      console.error('Error generating pitch:', error);
      toast.error('Failed to generate pitch');
    } finally {
      setGeneratingPitch(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-zinc-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-zinc-100 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/matches')}
          className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          data-testid="back-to-matches-btn"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold font-heading">{otherUser?.name || 'Chat'}</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-zinc-600 mb-6">Start the conversation!</p>
            <Button
              onClick={handleGeneratePitch}
              disabled={generatingPitch}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 py-3"
              data-testid="generate-pitch-btn"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generatingPitch ? 'Generating...' : 'Generate AI Pitch'}
            </Button>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.message_id}
              className={`flex ${message.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.sender_id === user?.user_id
                    ? 'bg-zinc-950 text-white rounded-tr-sm'
                    : 'bg-white text-zinc-900 rounded-tl-sm border border-zinc-100'
                }`}
                data-testid={`message-${message.message_id}`}
              >
                <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-zinc-100 px-6 py-4">
        {messages.length === 0 && (
          <div className="mb-2">
            <Button
              onClick={handleGeneratePitch}
              disabled={generatingPitch}
              variant="outline"
              size="sm"
              className="text-sm"
              data-testid="inline-generate-pitch-btn"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Pitch
            </Button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 h-12 rounded-xl"
            disabled={sending}
            data-testid="message-input"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-xl px-6 disabled:opacity-50"
            data-testid="send-message-btn"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Chat;