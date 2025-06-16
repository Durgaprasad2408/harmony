import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Play, Pause, Edit, Trash2, Upload, Music } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { formatTime } from '../../utils/formatters';

const AdminTracks = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { playerState, playTrack, togglePlay } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tracks:', error);
      } else {
        setTracks(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    
    try {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId);
      
      if (error) {
        console.error('Error deleting track:', error);
      } else {
        // Update local state
        setTracks(tracks.filter(track => track.id !== trackId));
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleEditTrack = (trackId) => {
    navigate(`/admin/tracks/${trackId}/edit`);
  };

  const filteredTracks = tracks.filter(track => 
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Demo tracks if none from Supabase
  const demoTracks = [
    {
      id: '1',
      title: 'Sunset Memories',
      artist: 'Ambient Dreams',
      album: 'Peaceful Moments',
      duration: 237,
      url: 'https://example.com/track1.mp3',
      cover_url: 'https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      uploaded_by: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Urban Motion',
      artist: 'City Lights',
      album: 'Downtown',
      duration: 184,
      url: 'https://example.com/track2.mp3',
      cover_url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      uploaded_by: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Midnight Jazz',
      artist: 'Smooth Quartet',
      album: 'Late Hours',
      duration: 313,
      url: 'https://example.com/track3.mp3',
      cover_url: 'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      uploaded_by: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: '4',
      title: 'Electric Dreams',
      artist: 'Synthwave',
      album: 'Neon Nights',
      duration: 246,
      url: 'https://example.com/track4.mp3',
      cover_url: 'https://images.pexels.com/photos/1509534/pexels-photo-1509534.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      uploaded_by: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: '5',
      title: 'Mountain Air',
      artist: 'Nature Sounds',
      album: 'Peaceful Landscapes',
      duration: 328,
      url: 'https://example.com/track5.mp3',
      cover_url: 'https://images.pexels.com/photos/1666012/pexels-photo-1666012.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      uploaded_by: 'admin',
      created_at: new Date().toISOString()
    }
  ];

  const tracksToDisplay = filteredTracks.length > 0 ? filteredTracks : demoTracks;

  const isCurrentlyPlaying = (track) => {
    return playerState.currentTrack?.id === track.id && playerState.isPlaying;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Track Management</h1>
        <Link to="/admin/tracks/upload" className="btn-primary flex items-center gap-2">
          <Upload size={18} />
          <span>Upload Track</span>
        </Link>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tracks by title or artist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>
      
      {/* Tracks table */}
      <div className="bg-background-light rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="w-16 px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Track</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Album</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-neutral-800 animate-pulse">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 bg-neutral-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-neutral-800 rounded mr-3"></div>
                        <div>
                          <div className="w-32 h-4 bg-neutral-800 rounded mb-1"></div>
                          <div className="w-24 h-3 bg-neutral-800 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-4 bg-neutral-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-12 h-4 bg-neutral-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="w-20 h-4 bg-neutral-800 rounded ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : (
                tracksToDisplay.map((track) => {
                  const isPlaying = isCurrentlyPlaying(track);
                  
                  return (
                    <tr key={track.id} className="border-b border-neutral-800 hover:bg-background-dark/30">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            if (isPlaying) {
                              togglePlay();
                            } else {
                              playTrack(track);
                            }
                          }}
                          className={`p-2 rounded-full ${
                            isPlaying
                              ? 'bg-primary-600 text-white'
                              : 'bg-neutral-800 text-white hover:bg-neutral-700'
                          }`}
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded bg-neutral-800 mr-3 overflow-hidden">
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
                            <div className="font-medium">{track.title}</div>
                            <div className="text-sm text-neutral-400">{track.artist}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-300">
                        {track.album}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-400">
                        {formatTime(track.duration)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleEditTrack(track.id)}
                            className="p-1.5 rounded-full text-neutral-400 hover:bg-neutral-800"
                            title="Edit track"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTrack(track.id)}
                            className="p-1.5 rounded-full text-error-400 hover:bg-error-900/20"
                            title="Delete track"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTracks;