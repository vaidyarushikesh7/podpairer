import { Mic, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function LandingPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/discover';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-2">
            <Mic className="h-8 w-8 text-zinc-950" />
            <span className="text-2xl font-bold font-heading">PodcastMatch</span>
          </div>
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="border-2 border-zinc-200 hover:border-zinc-950 rounded-full px-6 py-5 font-medium"
            data-testid="header-signin-btn"
          >
            Sign In
          </Button>
        </nav>

        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-zinc-950 mb-6 tracking-tight">
            Find Your Perfect
            <br />
            <span className="text-orange-600">Podcast Match</span>
          </h1>
          <p className="text-xl text-zinc-600 font-body mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect podcast hosts with expert guests.
            Swipe, match, and collaborate on amazing conversations.
          </p>
          <Button
            onClick={handleGoogleLogin}
            className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-full px-10 py-7 text-lg font-bold hover:scale-105 active:scale-95 shadow-lg"
            data-testid="get-started-btn"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-card hover:shadow-md transition-shadow">
            <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
              <Mic className="h-7 w-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold font-heading mb-3">For Hosts</h3>
            <p className="text-zinc-600 leading-relaxed">
              Find expert guests who perfectly match your podcast's topics and audience.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-card hover:shadow-md transition-shadow">
            <div className="bg-violet-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-violet-600" />
            </div>
            <h3 className="text-xl font-semibold font-heading mb-3">For Guests</h3>
            <p className="text-zinc-600 leading-relaxed">
              Get discovered by podcasts looking for your specific expertise and insights.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-card hover:shadow-md transition-shadow">
            <div className="bg-zinc-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
              <Sparkles className="h-7 w-7 text-zinc-950" />
            </div>
            <h3 className="text-xl font-semibold font-heading mb-3">AI-Powered</h3>
            <p className="text-zinc-600 leading-relaxed">
              Let AI craft the perfect pitch message to start your collaboration.
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold font-heading mb-6">How It Works</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-start gap-4 text-left bg-white rounded-2xl p-6 border border-zinc-100">
              <div className="bg-zinc-950 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Choose Your Role</h4>
                <p className="text-zinc-600">Sign up as a podcast host or guest</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left bg-white rounded-2xl p-6 border border-zinc-100">
              <div className="bg-zinc-950 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Create Your Profile</h4>
                <p className="text-zinc-600">Share your expertise, niche, and preferences</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left bg-white rounded-2xl p-6 border border-zinc-100">
              <div className="bg-zinc-950 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Swipe & Match</h4>
                <p className="text-zinc-600">Browse profiles and swipe right to connect</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left bg-white rounded-2xl p-6 border border-zinc-100">
              <div className="bg-zinc-950 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1">Start Chatting</h4>
                <p className="text-zinc-600">When both swipe right, chat and collaborate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;