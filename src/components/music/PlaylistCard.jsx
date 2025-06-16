import { PlayCircle, Music, MoreHorizontal } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const PlaylistCard = ({ playlist, onClick, showOptions = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  const handleOptionsClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleRemoveFromPlaylist = async (e) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlist.id);

      if (error) throw error;

      // Refresh the page or update state as needed
      window.location.reload();
    } catch (err) {
      console.error('Error removing track:', err);
    }
    setShowMenu(false);
  };

  return (
    <div 
      className="group hover-card cursor-pointer overflow-hidden relative"
      onClick={handleClick}
    >
      <div className="flex">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden mr-4 flex-shrink-0">
          {playlist.cover_url ? (
            <img 
              src={playlist.cover_url} 
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
              <Music size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <PlayCircle className="text-white" size={36} />
          </div>
        </div>
        
        <div className="flex flex-col flex-1">
          <h3 className="font-medium text-lg mb-1 line-clamp-1">{playlist.title}</h3>
          <p className="text-sm text-neutral-400 mb-2 line-clamp-2">
            {playlist.description || 'No description'}
          </p>
          <div className="mt-auto text-xs text-neutral-500">
            {formatDate(playlist.created_at)}
          </div>
        </div>

        {showOptions && (
          <div className="relative">
            <button
              onClick={handleOptionsClick}
              className="p-2 text-neutral-400 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background-light border border-neutral-800 z-10">
                <div className="py-1">
                  <button
                    onClick={handleRemoveFromPlaylist}
                    className="block w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 text-left"
                  >
                    Remove from Playlist
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistCard;