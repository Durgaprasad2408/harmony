import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Music } from 'lucide-react';

const AuthLayout = () => {
  const { user, isLoading } = useAuth();

  // If already logged in, redirect to home
  if (user && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background-dark">
      {/* Auth image side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-background-dark via-background-light to-primary-900/30 items-center justify-center">
        <div className="max-w-md p-12 text-center animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="p-4 rounded-full bg-primary-900/50">
              <Music size={64} className="text-primary-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-6 text-white">Harmony</h1>
          <p className="text-lg text-neutral-300 mb-8">
            Your personal music sanctuary with beautifully curated playlists and seamless listening experience.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 opacity-70"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="sr-only">Album cover placeholder</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth form side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-primary-900/50">
                <Music size={36} className="text-primary-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Harmony</h1>
            <p className="text-neutral-400">Your personal music sanctuary</p>
          </div>
          
          <div className="bg-background-light rounded-xl shadow-xl p-8 animate-slide-up">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;