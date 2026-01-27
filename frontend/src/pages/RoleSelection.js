import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole })
      });

      if (!response.ok) {
        throw new Error('Failed to save role');
      }

      toast.success('Role selected successfully!');
      navigate('/profile-setup');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-zinc-950 mb-4 tracking-tight">
            What brings you here?
          </h1>
          <p className="text-lg text-zinc-600 font-body">
            Choose your role to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <button
            onClick={() => setSelectedRole('host')}
            className={`relative bg-white rounded-3xl p-10 border-2 hover:border-zinc-950 transition-all text-left group ${
              selectedRole === 'host' ? 'border-zinc-950 shadow-lg' : 'border-zinc-100'
            }`}
            data-testid="role-host-btn"
          >
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mic className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold font-heading mb-3">I'm a Podcast Host</h3>
            <p className="text-zinc-600 leading-relaxed">
              Looking for amazing guests to join my podcast and share their expertise.
            </p>
            {selectedRole === 'host' && (
              <div className="absolute top-4 right-4 bg-zinc-950 text-white rounded-full w-6 h-6 flex items-center justify-center">
                ✓
              </div>
            )}
          </button>

          <button
            onClick={() => setSelectedRole('guest')}
            className={`relative bg-white rounded-3xl p-10 border-2 hover:border-zinc-950 transition-all text-left group ${
              selectedRole === 'guest' ? 'border-zinc-950 shadow-lg' : 'border-zinc-100'
            }`}
            data-testid="role-guest-btn"
          >
            <div className="bg-violet-100 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="text-2xl font-bold font-heading mb-3">I'm a Podcast Guest</h3>
            <p className="text-zinc-600 leading-relaxed">
              Ready to share my knowledge and insights on podcasts in my field.
            </p>
            {selectedRole === 'guest' && (
              <div className="absolute top-4 right-4 bg-zinc-950 text-white rounded-full w-6 h-6 flex items-center justify-center">
                ✓
              </div>
            )}
          </button>
        </div>

        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-full px-12 py-6 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
            data-testid="role-continue-btn"
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;