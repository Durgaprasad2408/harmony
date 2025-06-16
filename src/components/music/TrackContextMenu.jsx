import { useState, useEffect, useRef } from 'react';
import { Plus, Heart, Share, MoreHorizontal, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { supabase } from '../../lib/supabaseClient';

const TrackContextMenu = ({ track, isOpen, onClose, position }) => {
  const { user } = useAuth();
  const { favorites, toggleLike } = usePlayer();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const menuRef = useRef(null);
  const modalRef = useRef(null);

  const isLiked = favorites.has(track?.id);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPlaylists();
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (!showPlaylistModal || (modalRef.current && !modalRef.current.contains(event.target))) {
          onClose();
          setShowPlaylistModal(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, showPlaylistModal]);

  const fetchUserPlaylists = async () => {
    if (!user) return;
    
    setPlaylistLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('is_featured', false)
        .order('title');

      if (error) throw error;
      setUserPlaylists(data || []);

      // Check which playlists already contain this track
      if (data && data.length > 0 && track) {
        const { data: existingTracks, error: existingError } = await supabase
          .from('playlist_tracks')
          .select('playlist_id')
          .eq('track_id', track.id)
          .in('playlist_id', data.map(p => p.id));

        if (existingError) throw existingError;
        
        const existingPlaylistIds = new Set(existingTracks?.map(pt => pt.playlist_id) || []);
        setSelectedPlaylists(existingPlaylistIds);
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleLike = async () => {
    if (!track || !user) return;
    
    setLoading(true);
    try {
      // Pass the specific track to toggleLike
      await toggleLike(track);
      onClose();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistToggle = (playlistId) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  const handleSavePlaylistChanges = async () => {
    if (!track || !user) return;
    
    setLoading(true);
    try {
      // Get current playlist associations
      const { data: currentAssociations, error: fetchError } = await supabase
        .from('playlist_tracks')
        .select('playlist_id')
        .eq('track_id', track.id)
        .in('playlist_id', userPlaylists.map(p => p.id));

      if (fetchError) throw fetchError;

      const currentPlaylistIds = new Set(currentAssociations?.map(pt => pt.playlist_id) || []);
      
      // Find playlists to add and remove
      const playlistsToAdd = Array.from(selectedPlaylists).filter(id => !currentPlaylistIds.has(id));
      const playlistsToRemove = Array.from(currentPlaylistIds).filter(id => !selectedPlaylists.has(id));

      // Remove from playlists
      if (playlistsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('playlist_tracks')
          .delete()
          .eq('track_id', track.id)
          .in('playlist_id', playlistsToRemove);

        if (removeError) throw removeError;
      }

      // Add to playlists
      for (const playlistId of playlistsToAdd) {
        // Get current highest position in playlist
        const { data: currentTracks, error: posError } = await supabase
          .from('playlist_tracks')
          .select('position')
          .eq('playlist_id', playlistId)
          .order('position', { ascending: false })
          .limit(1);

        if (posError) throw posError;

        const nextPosition = (currentTracks?.[0]?.position || 0) + 1;

        // Add track to playlist
        const { error: insertError } = await supabase
          .from('playlist_tracks')
          .insert({
            playlist_id: playlistId,
            track_id: track.id,
            position: nextPosition,
          });

        if (insertError && insertError.code !== '23505') {
          throw insertError;
        }
      }

      alert('Playlist changes saved successfully!');
      setShowPlaylistModal(false);
      onClose();
    } catch (err) {
      console.error('Error updating playlists:', err);
      alert('Failed to update playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!track) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: track.title,
          text: `Check out "${track.title}" by ${track.artist}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `Check out "${track.title}" by ${track.artist} - ${window.location.href}`
        );
        alert('Link copied to clipboard!');
      }
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!isOpen || !track) return null;

  return (
    <>
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-background-light border border-neutral-800 rounded-lg shadow-xl py-2 min-w-[200px]"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -10px)',
        }}
      >
        {/* Like/Unlike */}
        {user && (
          <button
            onClick={handleLike}
            disabled={loading}
            className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm disabled:opacity-50"
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{isLiked ? 'Remove Like' : 'Like'}</span>
          </button>
        )}

        {/* Add to Playlist */}
        {user && (
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm"
          >
            <Plus size={16} />
            <span>Add to Playlist</span>
          </button>
        )}

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm"
        >
          <Share size={16} />
          <span>Share</span>
        </button>

        {/* Close button */}
        <div className="border-t border-neutral-800 mt-2 pt-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3 text-sm text-neutral-400"
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Playlist Selection Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="bg-background-light border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Add to Playlists</h3>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="p-1 rounded-full hover:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-neutral-400 mb-2">
                  Select playlists to add "{track.title}" to:
                </p>
              </div>

              {playlistLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3">
                      <div className="w-4 h-4 bg-neutral-800 rounded"></div>
                      <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : userPlaylists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-400 mb-4">You don't have any playlists yet.</p>
                  <button
                    onClick={() => {
                      setShowPlaylistModal(false);
                      onClose();
                      // Navigate to create playlist page
                      window.location.href = '/playlist/create';
                    }}
                    className="btn-primary text-sm"
                  >
                    Create Playlist
                  </button>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {userPlaylists.map((playlist) => (
                    <label
                      key={playlist.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-800/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlaylists.has(playlist.id)}
                        onChange={() => handlePlaylistToggle(playlist.id)}
                        className="w-4 h-4 text-primary-600 bg-neutral-800 border-neutral-600 rounded focus:ring-primary-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium truncate">{playlist.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {userPlaylists.length > 0 && (
              <div className="p-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="btn-ghost"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlaylistChanges}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TrackContextMenu;