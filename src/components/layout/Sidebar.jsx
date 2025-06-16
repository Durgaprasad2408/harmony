import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, Plus, Music, Users, Settings, User, LogOut, Disc, ListMusic } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import classNames from 'classnames';

const Sidebar = () => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const navLinkClasses = (path) => classNames(
    'flex items-center gap-3 py-2.5 px-4 rounded-lg font-medium transition-colors hover:bg-background-light',
    {
      'bg-background-light text-primary-400': isActive(path),
      'text-neutral-400 hover:text-white': !isActive(path),
    }
  );

  return (
    <div className="h-[90vh] t-0 flex flex-col py-6 pb-10 fixed">
      {/* Logo */}
      <div className="px-6 mb-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary-600">
            <Music size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold">Harmony</span>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="space-y-1 px-3">
        <Link to="/" className={navLinkClasses('/')}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/search" className={navLinkClasses('/search')}>
          <Search size={20} />
          <span>Search</span>
        </Link>
        {user && (
          <Link to="/library" className={navLinkClasses('/library')}>
            <Library size={20} />
            <span>Your Library</span>
          </Link>
        )}
      </nav>

      {/* Admin section */}
      {isAdmin && (
        <div className="mt-8 px-3">
          <div className="px-4 mb-4">
            <h3 className="text-sm uppercase font-semibold text-neutral-400">Admin</h3>
          </div>
          
          <div className="space-y-1">
            <Link to="/admin" className={navLinkClasses('/admin')}>
              <Settings size={20} />
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/users" className={navLinkClasses('/admin/users')}>
              <Users size={20} />
              <span>Manage Users</span>
            </Link>
            <Link to="/admin/tracks" className={navLinkClasses('/admin/tracks')}>
              <Music size={20} />
              <span>Manage Tracks</span>
            </Link>
            <Link to="/admin/albums" className={navLinkClasses('/admin/albums')}>
              <Disc size={20} />
              <span>Manage Albums</span>
            </Link>
            <Link to="/admin/featured-playlists" className={navLinkClasses('/admin/featured-playlists')}>
              <ListMusic size={20} />
              <span>Featured Playlists</span>
            </Link>
          </div>
        </div>
      )}

      {/* User section */}
      <div className="mt-auto px-3">
        {user ? (
          <>
            <button 
              onClick={() => signOut()} 
              className="w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-neutral-400 font-medium hover:text-white hover:bg-background-light transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
            <Link to="/profile" className={navLinkClasses('/profile')}>
              <User size={20} />
              <span>Profile</span>
            </Link>
          </>
        ) : (
          <Link to="/login" className="flex items-center gap-3 py-2.5 px-4 rounded-lg font-medium text-primary-400 hover:text-primary-300 transition-colors">
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;