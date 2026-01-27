import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Heart, Sparkles, Home, MessageCircle, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Discovery() {
  const [user, setUser] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, candidatesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/discover`, { credentials: 'include' })
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json();
        setCandidates(candidatesData);
      } else {
        const errorData = await candidatesRes.json();
        if (errorData.detail && errorData.detail.includes('Daily swipe limit')) {
          toast.error(errorData.detail);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    const currentCandidate = candidates[currentIndex];
    if (!currentCandidate) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/swipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          target_id: currentCandidate.user.user_id,
          direction: direction
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail && errorData.detail.includes('Daily swipe limit')) {
          toast.error(errorData.detail);
          return;
        }
        throw new Error('Failed to swipe');
      }

      const data = await response.json();

      if (data.matched) {
        toast.success('🎉 It\'s a match!', {
          description: 'You can now start chatting'
        });
      }

      setCurrentIndex(prev => prev + 1);

      if (currentIndex >= candidates.length - 2) {
        fetchData();
      }
    } catch (error) {
      console.error('Error swiping:', error);
      toast.error('Failed to record swipe');
    }
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      handleSwipe('right');
    } else if (info.offset.x < -100) {
      handleSwipe('left');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-zinc-600">Loading...</div>
      </div>
    );
  }

  const currentCandidate = candidates[currentIndex];
  const isHost = user?.role === 'host';

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-heading text-zinc-950 mb-2">
            {isHost ? 'Find Your Guest' : 'Find Your Podcast'}
          </h1>
          {user?.subscription_tier === 'free' && (
            <p className="text-sm text-zinc-600">
              {user.swipes_today}/20 swipes today
            </p>
          )}
        </div>

        <div className="relative h-[600px] flex items-center justify-center" data-testid="swipe-deck">
          <AnimatePresence>
            {currentCandidate ? (
              <motion.div
                key={currentIndex}
                style={{ x, rotate, opacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                className="absolute w-full aspect-[3/4] bg-white rounded-3xl shadow-xl overflow-hidden border border-zinc-100 cursor-grab active:cursor-grabbing"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                data-testid="swipe-card"
              >
                <div className="h-full flex flex-col">
                  <div className="h-2/3 bg-gradient-to-br from-zinc-100 to-zinc-200 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl font-bold text-zinc-300">
                        {currentCandidate.user.name.charAt(0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                    <h2 className="text-2xl font-bold font-heading mb-2">
                      {isHost ? currentCandidate.user.name : currentCandidate.profile.podcast_name}
                    </h2>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentCandidate.profile.niche?.slice(0, 3).map(n => (
                        <span key={n} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          {n}
                        </span>
                      ))}
                    </div>

                    <p className="text-zinc-600 mb-4 leading-relaxed">
                      {isHost 
                        ? currentCandidate.profile.bio 
                        : currentCandidate.profile.podcast_description}
                    </p>

                    {isHost && currentCandidate.profile.expertise && (
                      <div className="mb-2">
                        <span className="text-sm font-semibold text-zinc-700">Expertise:</span>
                        <span className="text-sm text-zinc-600 ml-2">
                          {currentCandidate.profile.expertise.join(', ')}
                        </span>
                      </div>
                    )}

                    {!isHost && currentCandidate.profile.audience_size && (
                      <div className="mb-2">
                        <span className="text-sm font-semibold text-zinc-700">Audience:</span>
                        <span className="text-sm text-zinc-600 ml-2">
                          {currentCandidate.profile.audience_size}
                        </span>
                      </div>
                    )}

                    <div className="text-sm text-zinc-600">
                      📍 {currentCandidate.profile.country} • 🗣 {currentCandidate.profile.language}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold font-heading mb-2">No more candidates</h2>
                <p className="text-zinc-600 mb-6">Check back later for more matches!</p>
                <Button
                  onClick={fetchData}
                  className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-full px-8 py-6"
                  data-testid="refresh-btn"
                >
                  Refresh
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {currentCandidate && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => handleSwipe('left')}
              className="bg-white border-2 border-zinc-200 hover:border-red-500 rounded-full w-16 h-16 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
              data-testid="swipe-left-btn"
            >
              <X className="h-8 w-8 text-red-500" />
            </button>
            
            <button
              onClick={() => handleSwipe('right')}
              className="bg-orange-600 hover:bg-orange-700 rounded-full w-20 h-20 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
              data-testid="swipe-right-btn"
            >
              <Heart className="h-10 w-10 text-white fill-white" />
            </button>
          </div>
        )}
      </div>

      <nav className="fixed bottom-6 left-4 right-4 h-20 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full flex items-center justify-around z-50 max-w-md mx-auto">
        <button onClick={() => navigate('/discover')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-discover">
          <Home className="h-6 w-6 text-zinc-950" />
          <span className="text-xs font-medium">Discover</span>
        </button>
        <button onClick={() => navigate('/matches')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-matches">
          <MessageCircle className="h-6 w-6 text-zinc-600" />
          <span className="text-xs text-zinc-600">Matches</span>
        </button>
        <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-settings">
          <SettingsIcon className="h-6 w-6 text-zinc-600" />
          <span className="text-xs text-zinc-600">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default Discovery;
