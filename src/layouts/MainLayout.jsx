import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Player from '../components/player/Player';
import MobileNavigation from '../components/layout/MobileNavigation';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const { isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="animate-pulse text-primary-400">
          <p className="text-xl font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block w-64 min-w-64 h-screen border-r border-neutral-800 overflow-y-auto">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-32">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fixed player at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <Player />
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden">
        <MobileNavigation 
          isOpen={isMobileMenuOpen} 
          onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
      </div>
    </div>
  );
};

export default MainLayout;