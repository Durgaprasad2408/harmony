import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Play, Pause, Plus, ArrowLeft, Music } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { formatTime } from '../utils/formatters';

const AddTracks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playerState, playTrack, togglePlay } = usePlayer();
  
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (id) {
      fetchPlaylistAndTracks();
    }
  }, [id]);

  const fetchPlaylistAndTracks = async () => {
    try {
      // Get playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();

      if (playlistError) throw playlistError;
      setPlaylist(playlistData);

      // Get existing playlist tracks
      const { data: existingTracks, error: existingError } = await supabase
        .from('playlist_tracks')
        .select('track_id')
        .eq('playlist_id', id);

      if (existingError) throw existingError;

      const existingTrackIds = new Set(existingTracks.map(pt => pt.track_id));

      // Get all available tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .order('title');

      if (tracksError) throw tracksError;

      // Filter out tracks that are already in the playlist
      setTracks(tracksData.filter(track => !existingTrackIds.has(track.id)));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelect = (trackId) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleAddTracks = async () => {
    if (selectedTracks.size === 0) {
      setError('Please select at least one track');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Get current highest position
      const { data: currentTracks, error: posError } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', id)
        .order('position', { ascending: false })
        .limit(1);

      if (posError) throw posError;

      const startPosition = (currentTracks?.[0]?.position || 0) + 1;

      // Prepare tracks to insert
      const tracksToAdd = Array.from(selectedTracks).map((trackId, index) => ({
        playlist_id: id,
        track_id: trackId,
        position: startPosition + index,
      }));

      const { error: insertError } = await supabase
        .from('playlist_tracks')
        .insert(tracksToAdd);

      if (insertError) throw insertError;

      // Navigate back to playlist
      navigate(`/playlist/${id}`);
    } catch (err) {
      console.error('Error adding tracks:', err);
      setError('Failed to add tracks to playlist');
    } finally {
      setSaving(false);
    }
  };

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.album.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-neutral-400 mb-6">Playlist not found</p>
        <button 
          onClick={() => navigate('/library')}
          className="btn-primary"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(`/playlist/${id}`)}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Add Tracks</h1>
          <p className="text-neutral-400">to {playlist.title}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-900/50 border border-error-800 text-error-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search tracks by title, artist, or album..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full"
        />
      </div>

      <div className="bg-background-light rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="w-16 px-4 py-3"></th>
                <th className="w-16 text-center px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Album</th>
                <th className="text-right px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-neutral-800 animate-pulse">
                    <td className="px-4 py-3">
                      <div className="w-6 h-6 bg-neutral-800 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-6 h-6 bg-neutral-800 rounded mx-auto"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-neutral-800 rounded mr-3"></div>
                        <div>
                          <div className="w-32 h-4 bg-neutral-800 rounded mb-1"></div>
                          <div className="w-24 h-3 bg-neutral-800 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-24 h-4 bg-neutral-800 rounded"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-4 bg-neutral-800 rounded ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredTracks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    No tracks found
                  </td>
                </tr>
              ) : (
                filteredTracks.map((track, index) => {
                  const isPlaying = playerState.currentTrack?.id === track.id && playerState.isPlaying;
                  const isSelected = selectedTracks.has(track.id);

                  return (
                    <tr 
                      key={track.id} 
                      className={`border-b border-neutral-800 hover:bg-background-dark/30 ${
                        isSelected ? 'bg-primary-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTrackSelect(track.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'bg-primary-600 border-primary-600 text-white' 
                              : 'border-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          {isSelected && <Plus size={14} />}
                        </button>
                      </td>
                      <td className="w-12 text-center px-4 py-3 text-neutral-400">
                        {isPlaying ? (
                          <Pause 
                            size={16} 
                            className="text-primary-400 mx-auto cursor-pointer"
                            onClick={() => togglePlay()}
                          />
                        ) : (
                          <Play
                            size={16}
                            className="text-neutral-400 mx-auto cursor-pointer"
                            onClick={() => playTrack(track)}
                          />
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
                      <td className="px-4 py-3 text-sm text-neutral-400 text-right">
                        {formatTime(track.duration)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-neutral-400">
          {selectedTracks.size} tracks selected
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/playlist/${id}`)}
            className="btn-ghost"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleAddTracks}
            disabled={selectedTracks.size === 0 || saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Plus size={18} />
                <span>Add Selected Tracks</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTracks;