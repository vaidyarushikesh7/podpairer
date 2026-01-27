import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Settings as SettingsIcon, Crown, LogOut, Code } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Settings() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchData();
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [location]);

  const fetchData = async () => {
    try {
      const [userRes, subRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/subscription/status`, { credentials: 'include' })
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (sessionId) => {
    setCheckingPayment(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/subscription/checkout-status/${sessionId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_status === 'paid') {
          toast.success('Payment successful! You are now a Pro member.');
          fetchData();
          window.history.replaceState({}, '', '/settings');
        } else {
          setTimeout(() => checkPaymentStatus(sessionId), 2000);
        }
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          package_id: 'pro_monthly',
          origin_url: window.location.origin
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to start checkout');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-zinc-600">Loading...</div>
      </div>
    );
  }

  const isPro = user?.subscription_tier === 'pro';

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold font-heading text-zinc-950 mb-8">Settings</h1>

        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-zinc-600">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold font-heading">{user?.name}</h2>
              <p className="text-sm text-zinc-600">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {isPro && <Crown className="h-4 w-4 text-orange-600" />}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isPro ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {isPro ? 'Pro' : 'Free'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <div className="text-sm text-zinc-600">
              <div className="flex justify-between mb-2">
                <span>Role:</span>
                <span className="font-medium text-zinc-900 capitalize">{user?.role}</span>
              </div>
              {!isPro && subscription && (
                <div className="flex justify-between">
                  <span>Daily swipes:</span>
                  <span className="font-medium text-zinc-900">{subscription.swipes_today}/20</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isPro && (
          <div className="bg-gradient-to-br from-orange-50 to-violet-50 rounded-3xl p-8 border-2 border-orange-200 mb-6">
            <div className="text-center">
              <Crown className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold font-heading mb-2">Upgrade to Pro</h2>
              <p className="text-zinc-600 mb-6">Unlock unlimited swipes and matches</p>
              
              <div className="bg-white rounded-2xl p-6 mb-6 text-left">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold font-heading">$9.99</span>
                  <span className="text-zinc-600">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Unlimited swipes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Unlimited matches
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Priority visibility
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Profile boost
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleUpgrade}
                disabled={checkingPayment}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-6 text-lg font-bold shadow-lg"
                data-testid="upgrade-to-pro-btn"
              >
                {checkingPayment ? 'Processing...' : 'Upgrade Now'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={() => navigate('/dev/data-mapping')}
            variant="outline"
            className="w-full justify-start rounded-xl py-6 text-left border-2 hover:border-violet-600 group"
            data-testid="data-mapping-btn"
          >
            <Code className="h-5 w-5 mr-2 text-violet-600" />
            <div>
              <div className="font-semibold">Developer Documentation</div>
              <div className="text-xs text-zinc-500 group-hover:text-zinc-600">View system architecture & data mapping</div>
            </div>
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start rounded-xl py-6 text-left border-2 border-red-200 hover:border-red-500 text-red-600 hover:text-red-700"
            data-testid="logout-btn"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <nav className="fixed bottom-6 left-4 right-4 h-20 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full flex items-center justify-around z-50 max-w-md mx-auto">
        <button onClick={() => navigate('/discover')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-discover">
          <Home className="h-6 w-6 text-zinc-600" />
          <span className="text-xs text-zinc-600">Discover</span>
        </button>
        <button onClick={() => navigate('/matches')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-matches">
          <MessageCircle className="h-6 w-6 text-zinc-600" />
          <span className="text-xs text-zinc-600">Matches</span>
        </button>
        <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1 px-4 py-2" data-testid="nav-settings">
          <SettingsIcon className="h-6 w-6 text-zinc-950" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default Settings;