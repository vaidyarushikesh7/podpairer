import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Code, Boxes, Brain } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function DataMapping() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('architecture');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error:', error);
      navigate('/');
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
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-heading text-zinc-950">Developer Documentation</h1>
            <p className="text-zinc-600">Complete system architecture and data mapping</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 border border-zinc-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Boxes className="inline h-4 w-4 mr-2" />
            Architecture
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Database className="inline h-4 w-4 mr-2" />
            Database Schema
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Code className="inline h-4 w-4 mr-2" />
            API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('ml')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'ml'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Brain className="inline h-4 w-4 mr-2" />
            ML Pipeline
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
          {activeTab === 'architecture' && (
            <div>
              <h2 className="text-2xl font-bold font-heading mb-6">System Architecture</h2>
              <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-xl overflow-x-auto text-xs leading-relaxed font-mono">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                          📱 FRONTEND LAYER (React)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Landing  │  Auth  │  Role  │  Profile  │  Discovery  │  Matches  │  Chat  │
│   Page    │ Callback│ Select │   Setup   │   /Swipe    │   List    │  UI    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▼ HTTP/REST APIs
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ⚙️ BACKEND LAYER (FastAPI)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Auth APIs  │  Profile APIs  │  Discovery APIs  │  Match APIs  │  Chat APIs │
│  AI APIs    │  Payment APIs  │  Admin APIs      │  ML Recommender          │
└─────────────────────────────────────────────────────────────────────────────┘
            ▼                    ▼                    ▼                 ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐
│  🌐 EXTERNAL    │  │  🗄️ DATABASE    │  │  🧠 ML MODEL    │  │ 💾 STORAGE │
│    SERVICES     │  │   (MongoDB)     │  │   (PyTorch)     │  │            │
│ • Emergent Auth │  │ • users         │  │ • NCF Model     │  │ • Weights  │
│ • OpenAI        │  │ • profiles      │  │ • Embeddings    │  │   (.pt)    │
│ • Stripe        │  │ • swipes        │  │ • MLP Layers    │  │            │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────┘`}
              </pre>
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h2 className="text-2xl font-bold font-heading mb-6">Database Collections</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-orange-600 pl-4">
                  <h3 className="text-xl font-semibold mb-2">users</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono text-orange-600">user_id</span>
                      <span className="text-zinc-500"> (PK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono">email</span>
                      <span className="text-zinc-500"> (UK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">name</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">picture</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">role</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">profile_completed</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">subscription_tier</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">swipes_today</div>
                  </div>
                </div>

                <div className="border-l-4 border-violet-600 pl-4">
                  <h3 className="text-xl font-semibold mb-2">profiles</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono text-violet-600">user_id</span>
                      <span className="text-zinc-500"> (PK, FK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">niche[]</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">language</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">country</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">podcast_name (host)</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">bio (guest)</div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-xl font-semibold mb-2">swipes</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono text-blue-600">swipe_id</span>
                      <span className="text-zinc-500"> (PK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono">swiper_id</span>
                      <span className="text-zinc-500"> (FK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono">swiped_id</span>
                      <span className="text-zinc-500"> (FK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">direction</div>
                  </div>
                </div>

                <div className="border-l-4 border-green-600 pl-4">
                  <h3 className="text-xl font-semibold mb-2">matches</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono text-green-600">match_id</span>
                      <span className="text-zinc-500"> (PK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono">user1_id</span>
                      <span className="text-zinc-500"> (FK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded">
                      <span className="font-mono">user2_id</span>
                      <span className="text-zinc-500"> (FK)</span>
                    </div>
                    <div className="bg-zinc-50 p-3 rounded font-mono">last_message_at</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <h2 className="text-2xl font-bold font-heading mb-6">API Endpoints</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-600 rounded-full"></span>
                    Authentication APIs
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/auth/session</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">GET /api/auth/me</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/auth/logout</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-violet-600 rounded-full"></span>
                    Profile APIs
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/role</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/profile</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">GET /api/profile</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                    Discovery & Matching
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">GET /api/discover</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/swipe</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">GET /api/matches</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                    Chat & AI
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">GET /api/chat/{'{match_id}'}/messages</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/chat/{'{match_id}'}/messages</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/ai/generate-pitch</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-600 rounded-full"></span>
                    Payment & Admin
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">GET /api/subscription/status</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/subscription/checkout</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">GET /api/admin/stats</div>
                    <div className="bg-zinc-50 p-3 rounded font-mono text-sm">POST /api/admin/train-model</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ml' && (
            <div>
              <h2 className="text-2xl font-bold font-heading mb-6">Machine Learning Pipeline</h2>
              
              <div className="space-y-6">
                <div className="bg-violet-50 border-2 border-violet-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Neural Collaborative Filtering (NCF)</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-violet-600 rounded-full mt-2"></div>
                      <div>
                        <strong>Input:</strong> Swipe data (swiper_id, swiped_id, direction)
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-violet-600 rounded-full mt-2"></div>
                      <div>
                        <strong>Embeddings:</strong> User & Item embeddings (32 dimensions each)
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-violet-600 rounded-full mt-2"></div>
                      <div>
                        <strong>Architecture:</strong> MLP layers [64 → 32 → 16 → 1]
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-violet-600 rounded-full mt-2"></div>
                      <div>
                        <strong>Output:</strong> Prediction score (0.0 - 1.0)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Training Process</h3>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      1. Collect swipe data from MongoDB
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      2. Map user/item IDs to numerical indices
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      3. Create labels: right=1.0, left=0.0
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      4. Train for 20 epochs with Adam optimizer
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      5. Save model weights to disk (cf_model.pt)
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Model Performance</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-4 rounded">
                      <div className="text-zinc-600 text-xs mb-1">Model Size</div>
                      <div className="text-2xl font-bold">40 KB</div>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <div className="text-zinc-600 text-xs mb-1">Parameters</div>
                      <div className="text-2xl font-bold">~50K</div>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <div className="text-zinc-600 text-xs mb-1">Final Loss</div>
                      <div className="text-2xl font-bold">0.41</div>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <div className="text-zinc-600 text-xs mb-1">Inference</div>
                      <div className="text-2xl font-bold">&lt;10ms</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataMapping;
