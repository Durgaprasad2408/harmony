import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../contexts/PlayerContext';
import { Music, Play, Pause, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TrackContextMenu from '../components/music/TrackContextMenu';

const Artist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playerState, playTracks, togglePlay } = usePlayer();
  const { user } = useAuth();
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (id) {
      fetchArtistAndTracks();
    }
  }, [id]);

  const fetchArtistAndTracks = async () => {
    setLoading(true);
    try {
      // Get artist details
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (artistError) throw artistError;
      setArtist(artistData);

      // Get tracks by artist
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist', artistData.name)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);
    } catch (error) {
      console.error('Error fetching artist:', error);
      setError('Failed to load artist');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track, index) => {
    // Pass the artist source when playing tracks
    const source = `/artist/${id}`;
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
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-neutral-800 rounded-full"></div>
          <div className="flex-1">
            <div className="h-8 bg-neutral-800 w-1/4 rounded mb-2"></div>
            <div className="h-4 bg-neutral-800 w-1/6 rounded"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-neutral-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-neutral-400 mb-6">{error || 'Artist not found'}</p>
        <button 
          onClick={() => navigate('/artists')}
          className="btn-primary"
        >
          Back to Artists
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{artist.name}</h1>
          {artist.bio && (
            <p className="text-neutral-400 mt-2">{artist.bio}</p>
          )}
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
              {tracks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                    No tracks found for this artist
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

export default Artist;