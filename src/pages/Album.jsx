import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Music, Play, Pause, MoreHorizontal } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import TrackContextMenu from '../components/music/TrackContextMenu';

const Album = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playerState, playTracks, togglePlay } = usePlayer();
  const { user } = useAuth();
  
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (id) {
      fetchAlbumAndTracks();
    }
  }, [id]);

  const fetchAlbumAndTracks = async () => {
    try {
      // Get album details
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single();

      if (albumError) throw albumError;
      setAlbum(albumData);

      // Get tracks in album
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', id)
        .order('created_at');

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);
    } catch (err) {
      console.error('Error fetching album:', err);
      setError('Failed to load album');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track, index) => {
    // Pass the album source when playing tracks
    const source = `/album/${id}`;
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

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row gap-6 md:items-end mb-8">
          <div className="w-48 h-48 bg-neutral-800 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-8 bg-neutral-800 w-1/3 rounded mb-4"></div>
            <div className="h-5 bg-neutral-800 w-1/2 rounded mb-2"></div>
            <div className="h-4 bg-neutral-800 w-1/4 rounded"></div>
          </div>
        </div>
        
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-neutral-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-neutral-400 mb-6">{error || 'Album not found'}</p>
        <button 
          onClick={() => navigate('/albums')}
          className="btn-primary"
        >
          Back to Albums
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Album header */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end mb-8">
        <div className="w-48 h-48 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
          {album.cover_url ? (
            <img 
              src={album.cover_url} 
              alt={album.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
              <Music size={64} />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="text-sm text-neutral-400 font-medium mb-1">Album</div>
          <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
          <p className="text-xl text-neutral-300">{album.artist}</p>
        </div>
      </div>

      {/* Tracks list */}
      <div className="bg-background-light rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="w-16 text-center px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Artist</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {tracks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                    No tracks in this album yet
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
                          <div className={`font-medium ${isPlaying ? 'text-primary-400' : ''}`}>
                            {track.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {track.artist}
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

export default Album;