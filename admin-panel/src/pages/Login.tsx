import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';

export const Login = () => {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const loginWithGoogle = useAppStore((state) => state.loginWithGoogle);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login({ loginId, password });
    if (!result.success) {
      setError(result.message ?? 'Unable to sign in.');
      return;
    }

    setError('');
    navigate(result.role === 'SUPER_ADMIN' ? '/super-admin' : '/owner');
  };

  const handleGoogleCredentialResponse = (credential: string) => {
    const result = loginWithGoogle(credential);
    if (!result.success) {
      setError(result.message ?? 'Google Sign-In failed.');
      return;
    }

    setError('');
    navigate(result.role === 'SUPER_ADMIN' ? '/super-admin' : '/owner');
  };

  useEffect(() => {
    if (!clientId) return;

    // Dynamically load Google Identity Services SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const google = (window as any).google;
      if (google) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              handleGoogleCredentialResponse(response.credential);
            }
          },
        });
        
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: btnContainer.clientWidth || 300,
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [clientId]);

  const handleGoogleLoginClick = () => {
    if (!clientId) {
      setShowSetupModal(true);
      return;
    }

    try {
      const google = (window as any).google;
      if (google) {
        google.accounts.id.prompt();
      } else {
        setError('Google Sign-In SDK is loading. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to initialize Google Sign-In.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex justify-center items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-extrabold text-gray-900">SpaPOS</span>
          </Link>
          <span className="block text-[9px] text-gray-400 font-semibold tracking-wide uppercase mt-1">powered by catcachcode</span>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            start your 14-day free trial
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          {/* Unified Login Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email or Login ID</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm outline-none transition-all"
                  placeholder="Email address or Login ID"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
              >
                Sign in
              </button>
            </div>
          </form>



          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              {clientId ? (
                <div className="flex justify-center">
                  <div id="google-signin-btn" className="w-full"></div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLoginClick}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Google Client ID Setup Guide Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden animate-fade-in relative text-gray-800">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-600 to-indigo-650"></div>
            
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-primary-50 text-primary-750 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Developer Configuration
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">Google OAuth Credentials Guide</h2>
                </div>
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer outline-none transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 max-h-[300px] overflow-y-auto pr-1 text-xs text-gray-600 space-y-3 leading-relaxed border-t border-b border-gray-100 py-4 font-medium">
                <p>Follow these steps to obtain a Google Client ID and link it to SpaPOS:</p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary-600 font-bold hover:underline">Google Cloud Console</a>.
                  </li>
                  <li>
                    Create a new project named <strong>SpaPOS</strong>.
                  </li>
                  <li>
                    Go to <strong>APIs & Services &gt; OAuth consent screen</strong>:
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Choose <strong>External</strong> user type.</li>
                      <li>Fill out App Info and Developer Email.</li>
                      <li>Add the <code>/auth/userinfo.email</code> and <code>/auth/userinfo.profile</code> scopes.</li>
                    </ul>
                  </li>
                  <li>
                    Navigate to <strong>Credentials</strong>, click <strong>+ Create Credentials</strong>, and select <strong>OAuth client ID</strong>.
                  </li>
                  <li>
                    Set the Application Type to <strong>Web application</strong>.
                  </li>
                  <li>
                    Under <strong>Authorized JavaScript origins</strong>, add:
                    <div className="bg-gray-50 border border-gray-150 p-2 rounded-lg font-mono text-[10px] text-gray-700 mt-1 select-all">
                      http://localhost:5173<br />
                      http://localhost:5174
                    </div>
                  </li>
                  <li>
                    Click <strong>Create</strong>, copy the generated <strong>Client ID</strong>.
                  </li>
                  <li>
                    Open or create a <code>.env</code> file in the <code>admin-panel</code> directory and add:
                    <div className="bg-gray-50 border border-gray-150 p-2 rounded-lg font-mono text-[10px] text-gray-750 mt-1 select-all">
                      VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
                    </div>
                  </li>
                </ol>
              </div>



              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-xs border-none cursor-pointer shadow-md hover:shadow-lg transition-all"
                >
                  Close & Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
