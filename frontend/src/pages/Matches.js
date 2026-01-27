import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Home, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/matches`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-zinc-950 mb-2">Your Matches</h1>
          <p className="text-zinc-600">{matches.length} connections</p>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
            <p className="text-zinc-600 mb-6">Start swiping to find your perfect match!</p>
            <Button
              onClick={() => navigate('/discover')}
              className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-full px-8 py-6"
              data-testid="go-to-discover-btn"
            >
              Start Swiping
            </Button>
          </div>
        ) : (
          <div className="space-y-4" data-testid="matches-list">
            {matches.map((match) => (
              <div
                key={match.match.match_id}
                onClick={() => navigate(`/chat/${match.match.match_id}`)}
                className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                data-testid={`match-card-${match.match.match_id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-zinc-600">
                      {match.other_user.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold font-heading truncate group-hover:text-orange-600 transition-colors">
                      {match.other_profile.podcast_name || match.other_user.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {match.other_profile.niche?.slice(0, 2).map(n => (
                        <span key={n} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-xs">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>

                  <MessageCircle className="h-6 w-6 text-zinc-400 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="fixed bottom-6 left-4 right-4 h-20 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full flex items-center justify-around z-50 max-w-md mx-auto">
        <button onClick={() => navigate('/discover')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-discover">
          <Home className="h-6 w-6 text-zinc-600" />
          <span className="text-xs text-zinc-600">Discover</span>
        </button>
        <button onClick={() => navigate('/matches')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-matches">
          <MessageCircle className="h-6 w-6 text-zinc-950" />
          <span className="text-xs font-medium">Matches</span>
        </button>
        <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-settings">
          <SettingsIcon className="h-6 w-6 text-zinc-600" />
          <span className="text-xs text-zinc-600">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default Matches;