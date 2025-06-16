import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../contexts/PlayerContext';
import { Music, Play, Pause, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TrackContextMenu from '../components/music/TrackContextMenu';

const RecentlyPlayed = () => {
  const { playerState, playTracks, togglePlay } = usePlayer();
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchRecentTracks();
  }, []);

  const fetchRecentTracks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track) => {
    const trackIndex = tracksToDisplay.findIndex(t => t.id === track.id);
    if (trackIndex === -1) return;

    if (playerState.currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTracks(tracksToDisplay, trackIndex);
    }
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

  const demoTracks = Array.from({ length: 20 }, (_, i) => ({
    id: `demo-${i + 1}`,
    title: `Demo Track ${i + 1}`,
    artist: `Artist ${Math.floor(i / 3) + 1}`,
    album: `Album ${Math.floor(i / 5) + 1}`,
    duration: 180 + Math.floor(Math.random() * 180),
    url: 'https://example.com/track.mp3',
    cover_url: `https://images.pexels.com/photos/${1694900 + i * 100}/pexels-photo-${1694900 + i * 100}.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`,
    uploaded_by: 'admin',
    created_at: new Date(Date.now() - i * 86400000).toISOString()
  }));

  const tracksToDisplay = tracks.length > 0 ? tracks : demoTracks;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Recently Played</h1>

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
                Array.from({ length: 10 }).map((_, index) => (
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
              ) : tracksToDisplay.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                    No recently played tracks
                  </td>
                </tr>
              ) : (
                tracksToDisplay.map((track, index) => {
                  const isPlaying = playerState.currentTrack?.id === track.id && playerState.isPlaying;

                  return (
                    <tr
                      key={track.id}
                      className="border-b border-neutral-800 hover:bg-background-dark/30 cursor-pointer"
                      onClick={() => handleTrackClick(track)}
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
          track={tracksToDisplay.find(t => t.id === showMenu)}
          isOpen={!!showMenu}
          onClose={() => setShowMenu(null)}
          position={menuPosition}
        />
      )}
    </div>
  );
};

export default RecentlyPlayed;