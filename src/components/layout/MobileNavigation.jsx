import { Home, Search, Library, Music, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import classNames from 'classnames';

const MobileNavigation = ({ isOpen, onToggle }) => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    onToggle(); // Close the menu after signing out
  };

  return (
    <>
      {/* Fixed bottom navigation */}
      <div className="fixed bottom-[72px] left-0 right-0 bg-background-light border-t border-neutral-800 z-10">
        <div className="flex items-center justify-around h-12">
          <Link 
            to="/" 
            className={classNames("flex flex-col items-center justify-center p-2", {
              "text-primary-400": isActive('/'),
              "text-neutral-400": !isActive('/')
            })}
          >
            <Home size={20} />
            <span className="text-xs mt-0.5">Home</span>
          </Link>
          
          <Link 
            to="/search" 
            className={classNames("flex flex-col items-center justify-center p-2", {
              "text-primary-400": isActive('/search'),
              "text-neutral-400": !isActive('/search')
            })}
          >
            <Search size={20} />
            <span className="text-xs mt-0.5">Search</span>
          </Link>
          
          <Link 
            to="/library" 
            className={classNames("flex flex-col items-center justify-center p-2", {
              "text-primary-400": isActive('/library'),
              "text-neutral-400": !isActive('/library')
            })}
          >
            <Library size={20} />
            <span className="text-xs mt-0.5">Library</span>
          </Link>
          
          <button 
            onClick={onToggle} 
            className="flex flex-col items-center justify-center p-2 text-neutral-400"
          >
            <Menu size={20} />
            <span className="text-xs mt-0.5">More</span>
          </button>
        </div>
      </div>

      {/* Slide-in menu */}
      <div 
        className={classNames(
          "fixed inset-0 bg-background-dark/80 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onToggle}
      >
        <div 
          className={classNames(
            "fixed right-0 top-0 bottom-0 w-64 bg-background-light p-6 transition-transform duration-300 ease-in-out transform shadow-xl",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary-600">
                <Music size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold">Harmony</span>
            </div>
            <button onClick={onToggle} className="text-neutral-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-6">
            {user ? (
              <>
                <div>
                  <h3 className="text-sm uppercase font-semibold text-neutral-400 mb-3">Your Music</h3>
                  <ul className="space-y-3">
                    <li>
                      <Link to="/profile" className="flex items-center gap-3 py-2 text-neutral-300 hover:text-white">
                        Your Profile
                      </Link>
                    </li>
                    <li>
                      <Link to="/playlist/create" className="flex items-center gap-3 py-2 text-neutral-300 hover:text-white">
                        Create Playlist
                      </Link>
                    </li>
                  </ul>
                </div>

                {isAdmin && (
                  <div>
                    <h3 className="text-sm uppercase font-semibold text-neutral-400 mb-3">Admin</h3>
                    <ul className="space-y-3">
                      <li>
                        <Link to="/admin" className="flex items-center gap-3 py-2 text-neutral-300 hover:text-white">
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/users" className="flex items-center gap-3 py-2 text-neutral-300 hover:text-white">
                          Manage Users
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/tracks" className="flex items-center gap-3 py-2 text-neutral-300 hover:text-white">
                          Manage Tracks
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
                
                <div>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left py-2 text-neutral-300 hover:text-white"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div>
                <Link 
                  to="/login" 
                  className="block w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 rounded-full text-white font-medium text-center transition-colors"
                  onClick={onToggle}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block w-full py-2.5 px-4 mt-3 border border-neutral-700 rounded-full text-white font-medium text-center hover:bg-neutral-800 transition-colors"
                  onClick={onToggle}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;