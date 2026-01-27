import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const NICHES = ['Technology', 'Business', 'Marketing', 'Health', 'Fitness', 'Finance', 'Personal Development', 'Entertainment', 'Education', 'Science'];
const GUEST_TYPES = ['Expert', 'Founder', 'Influencer', 'Storyteller', 'Researcher'];
const AUDIENCE_SIZES = ['<1K', '1K-10K', '10K-50K', '50K-100K', '100K+'];

function ProfileSetup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    niche: [],
    language: '',
    country: '',
    availability: '',
    podcast_name: '',
    podcast_description: '',
    topics: [],
    audience_size: '',
    preferred_guest_type: [],
    recording_format: 'remote',
    podcast_links: { spotify: '', apple: '', youtube: '' },
    bio: '',
    expertise: [],
    previous_appearances: [],
    social_links: { linkedin: '', twitter: '', website: '' },
    remote_recording: true
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNicheToggle = (niche) => {
    setFormData(prev => ({
      ...prev,
      niche: prev.niche.includes(niche)
        ? prev.niche.filter(n => n !== niche)
        : [...prev.niche, niche]
    }));
  };

  const handleTopicToggle = (topic) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const handleExpertiseToggle = (exp) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(exp)
        ? prev.expertise.filter(e => e !== exp)
        : [...prev.expertise, exp]
    }));
  };

  const handleGuestTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      preferred_guest_type: prev.preferred_guest_type.includes(type)
        ? prev.preferred_guest_type.filter(t => t !== type)
        : [...prev.preferred_guest_type, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.niche.length === 0) {
      toast.error('Please select at least one niche');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      toast.success('Profile saved successfully!');
      navigate('/discover');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-zinc-600">Loading...</div>
      </div>
    );
  }

  const isHost = user?.role === 'host';

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading text-zinc-950 mb-3 tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-lg text-zinc-600">
            {isHost ? 'Tell us about your podcast' : 'Share your expertise'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-card space-y-8">
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Your Niche(s) *</Label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(niche => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => handleNicheToggle(niche)}
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    formData.niche.includes(niche)
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-950'
                  }`}
                  data-testid={`niche-${niche.toLowerCase()}`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {isHost ? (
            <>
              <div>
                <Label htmlFor="podcast_name">Podcast Name *</Label>
                <Input
                  id="podcast_name"
                  value={formData.podcast_name}
                  onChange={(e) => setFormData({ ...formData, podcast_name: e.target.value })}
                  className="h-12 rounded-xl"
                  required
                  data-testid="podcast-name-input"
                />
              </div>

              <div>
                <Label htmlFor="podcast_description">Podcast Description *</Label>
                <Textarea
                  id="podcast_description"
                  value={formData.podcast_description}
                  onChange={(e) => setFormData({ ...formData, podcast_description: e.target.value })}
                  className="rounded-xl min-h-[100px]"
                  required
                  data-testid="podcast-description-input"
                />
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Topics You Cover</Label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicToggle(topic)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        formData.topics.includes(topic)
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-orange-600'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Audience Size</Label>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_SIZES.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFormData({ ...formData, audience_size: size })}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        formData.audience_size === size
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-950'
                      }`}
                      data-testid={`audience-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Preferred Guest Type</Label>
                <div className="flex flex-wrap gap-2">
                  {GUEST_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleGuestTypeToggle(type)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        formData.preferred_guest_type.includes(type)
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-violet-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="rounded-xl min-h-[100px]"
                  placeholder="Tell us about yourself and your expertise"
                  required
                  data-testid="bio-input"
                />
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Your Expertise *</Label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map(exp => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => handleExpertiseToggle(exp)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        formData.expertise.includes(exp)
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-orange-600'
                      }`}
                      data-testid={`expertise-${exp.toLowerCase()}`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language *</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="e.g., English"
                className="h-12 rounded-xl"
                required
                data-testid="language-input"
              />
            </div>

            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., United States"
                className="h-12 rounded-xl"
                required
                data-testid="country-input"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="availability">Availability</Label>
            <Input
              id="availability"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              placeholder="e.g., Weekday mornings, Flexible"
              className="h-12 rounded-xl"
              data-testid="availability-input"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-zinc-950 text-white hover:bg-zinc-800 rounded-full py-6 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            data-testid="profile-submit-btn"
          >
            {submitting ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;
