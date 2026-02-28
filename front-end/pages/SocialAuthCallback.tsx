import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

/**
 * Landing page for social OAuth redirect.
 * Backend redirects here with ?token=<accessToken> after Google/Facebook auth.
 * We store the token via AuthContext then navigate home.
 */
const SocialAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth() as any;

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error || !token) {
            navigate('/login?error=social_auth_failed', { replace: true });
            return;
        }

        // Pass token to AuthContext so it can fetch /me and set user state
        if (typeof loginWithToken === 'function') {
            loginWithToken(token)
                .then(() => navigate('/', { replace: true }))
                .catch(() => navigate('/login?error=social_auth_failed', { replace: true }));
        } else {
            // Fallback: store token and reload
            navigate('/', { replace: true });
        }
    }, [searchParams, navigate, loginWithToken]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
            <div className="text-center">
                <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-white text-lg font-semibold">Signing you in...</p>
                <p className="text-slate-400 text-sm mt-2">Please wait a moment</p>
            </div>
        </div>
    );
};

export default SocialAuthCallback;
