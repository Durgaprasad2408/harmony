import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../contexts/PlayerContext';
import { Music, Play, Pause, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TrackContextMenu from '../components/music/TrackContextMenu';

const Mood = () => {
  const { mood } = useParams();
  const navigate = useNavigate();
  const { playerState, playTracks, togglePlay } = usePlayer();
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moodData, setMoodData] = useState(null);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (mood) {
      fetchMoodAndTracks();
    }
  }, [mood]);

  const fetchMoodAndTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: moodData, error: moodError } = await supabase
        .from('moods')
        .select('*')
        .eq('name', mood)
        .maybeSingle();

      if (moodError) throw moodError;
      
      if (!moodData) {
        setError('Mood not found');
        setLoading(false);
        return;
      }

      setMoodData(moodData);

      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('mood_id', moodData.id)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setError('Failed to load mood data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track, index) => {
    // Pass the mood source when playing tracks
    const source = `/mood/${mood}`;
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

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-neutral-800"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-red-500">{error}</h1>
            <p className="text-neutral-400 mt-2">
              The mood you're looking for doesn't exist. Please check the URL and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold capitalize">{mood} Music</h1>
          {moodData?.description && (
            <p className="text-neutral-400 mt-2">{moodData.description}</p>
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
                <th className="text-left px-4 py-3 hidden md:table-cell">Artist</th>
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
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="w-24 h-4 bg-neutral-800 rounded"></div>
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
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    No tracks found in this mood
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
                      <td className="px-4 py-3 text-neutral-300 hidden md:table-cell">
                        {track.artist}
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

export default Mood;