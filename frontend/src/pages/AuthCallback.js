import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash;
        const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');

        if (!sessionId) {
          navigate('/');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const userData = await response.json();

        document.cookie = `session_token=${userData.session_token}; path=/; secure; samesite=none; max-age=${7 * 24 * 60 * 60}`;

        if (!userData.role) {
          navigate('/role', { state: { user: userData }, replace: true });
        } else if (!userData.profile_completed) {
          navigate('/profile-setup', { state: { user: userData }, replace: true });
        } else {
          navigate('/discover', { state: { user: userData }, replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-zinc-900 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-zinc-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}

export default AuthCallback;