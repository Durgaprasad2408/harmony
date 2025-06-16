import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../contexts/PlayerContext';
import { Music, Play, Pause, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TrackContextMenu from '../components/music/TrackContextMenu';

const Favorites = () => {
  const navigate = useNavigate();
  const { playerState, playTracks, togglePlay, favorites } = usePlayer();
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (user && favorites?.size > 0) {
      fetchFavoriteTracks();
    } else {
      setLoading(false);
    }
  }, [user, favorites]);

  const fetchFavoriteTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .in('id', Array.from(favorites))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching favorite tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track, index) => {
    // Pass the favorites source when playing tracks
    const source = '/favorites';
    playTracks(tracks, index, source);
  };

  const handleMenuClick = (e, track) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    });
    setShowMenu(track.id);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/library')}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Liked Songs</h1>
          <p className="text-neutral-400 mt-1">{tracks.length} tracks</p>
        </div>
      </div>

      <div className="bg-background-light rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="w-16 text-center px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Album</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-neutral-800 animate-pulse">
                    <td className="px-4 py-4">
                      <div className="w-8 h-8 bg-neutral-800 rounded mx-auto"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-neutral-800 rounded mr-3"></div>
                        <div>
                          <div className="w-32 h-4 bg-neutral-800 rounded mb-1"></div>
                          <div className="w-24 h-3 bg-neutral-800 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-24 h-4 bg-neutral-800 rounded"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-8 h-8 bg-neutral-800 rounded mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : tracks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                    No liked songs yet
                  </td>
                </tr>
              ) : (
                tracks.map((track, index) => {
                  const isPlaying = playerState.currentTrack?.id === track.id && playerState.isPlaying;
                  
                  return (
                    <tr 
                      key={track.id} 
                      className="border-b border-neutral-800 hover:bg-background-dark/30 cursor-pointer"
                      onClick={() => handleTrackClick(track, index)}
                    >
                      <td className="w-16 text-center px-4 py-3 text-neutral-400">
                        {isPlaying ? (
                          <Pause size={16} className="text-primary-400 mx-auto" />
                        ) : (
                          <Play size={16} className="text-neutral-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded bg-neutral-800 mr-3 overflow-hidden flex-shrink-0">
                            {track.cover_url ? (
                              <img 
                                src={track.cover_url} 
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
                                <Music size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className={`font-medium ${isPlaying ? 'text-primary-400' : ''}`}>
                              {track.title}
                            </div>
                            <div className="text-sm text-neutral-400">{track.artist}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {track.album}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => handleMenuClick(e, track)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
                          title="More options"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMenu && (
        <TrackContextMenu
          track={tracks.find(t => t.id === showMenu)}
          isOpen={!!showMenu}
          onClose={() => setShowMenu(null)}
          position={menuPosition}
        />
      )}
    </div>
  );
};

export default Favorites;