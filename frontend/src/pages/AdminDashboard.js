import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle as MessageIcon, Heart, TrendingUp, Brain } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainingModel, setTrainingModel] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/stats`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/admin/users`, { credentials: 'include' })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    setTrainingModel(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/train-model`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to train model');
      }

      const data = await response.json();
      toast.success(`Model trained successfully with ${data.swipes_used} swipes!`);
    } catch (error) {
      console.error('Error training model:', error);
      toast.error('Failed to train model');
    } finally {
      setTrainingModel(false);
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
    <div className="min-h-screen bg-stone-50 pb-12">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold font-heading text-zinc-950">Admin Dashboard</h1>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm" data-testid="stat-total-users">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 text-zinc-600" />
                  <span className="text-2xl font-bold font-heading">{stats.total_users}</span>
                </div>
                <p className="text-sm text-zinc-600">Total Users</p>
                <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                  <span>Hosts: {stats.total_hosts}</span>
                  <span>Guests: {stats.total_guests}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm" data-testid="stat-matches">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="h-8 w-8 text-orange-600" />
                  <span className="text-2xl font-bold font-heading">{stats.total_matches}</span>
                </div>
                <p className="text-sm text-zinc-600">Total Matches</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm" data-testid="stat-messages">
                <div className="flex items-center justify-between mb-2">
                  <MessageIcon className="h-8 w-8 text-violet-600" />
                  <span className="text-2xl font-bold font-heading">{stats.total_messages}</span>
                </div>
                <p className="text-sm text-zinc-600">Total Messages</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm" data-testid="stat-pro-users">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <span className="text-2xl font-bold font-heading">{stats.pro_users}</span>
                </div>
                <p className="text-sm text-zinc-600">Pro Members</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-3xl p-6 border-2 border-violet-200 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-violet-100 rounded-full p-3">
                  <Brain className="h-8 w-8 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold font-heading mb-2">AI Recommendation Model</h3>
                  <p className="text-zinc-600 mb-4">
                    Train the collaborative filtering model using swipe data to improve match recommendations.
                    {stats.total_swipes > 0 && (
                      <span className="block mt-1 text-sm">
                        Current training data: {stats.total_swipes} swipes
                      </span>
                    )}
                  </p>
                  <Button
                    onClick={handleTrainModel}
                    disabled={trainingModel}
                    className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 py-3 disabled:opacity-50"
                    data-testid="train-model-btn"
                  >
                    {trainingModel ? 'Training Model...' : 'Train AI Model'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
          <h2 className="text-xl font-semibold font-heading mb-6">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="users-table">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600">Tier</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600">Profile</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 20).map(user => (
                  <tr key={user.user_id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="py-3 px-4 text-sm">{user.name}</td>
                    <td className="py-3 px-4 text-sm text-zinc-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 bg-zinc-100 rounded-full capitalize">
                        {user.role || 'None'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.subscription_tier === 'pro' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {user.subscription_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.profile_completed 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.profile_completed ? 'Complete' : 'Incomplete'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;