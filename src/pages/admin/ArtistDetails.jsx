import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Music, Play, Pause, ArrowLeft, Download, Plus, X, Trash2 } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { formatTime } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

const ArtistDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playerState, playTracks, togglePlay } = usePlayer();
  const { user } = useAuth();
  
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (id) {
      fetchArtistAndTracks();
    }
  }, [id]);

  const fetchArtistAndTracks = async () => {
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

      // Get available tracks (tracks not assigned to this artist)
      const { data: availableTracksData, error: availableTracksError } = await supabase
        .from('tracks')
        .select('*')
        .neq('artist', artistData.name)
        .order('title');

      if (availableTracksError) throw availableTracksError;
      setAvailableTracks(availableTracksData || []);
    } catch (error) {
      console.error('Error fetching artist:', error);
      setError('Failed to load artist');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track, index) => {
    playTracks(tracks, index);
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
      // Update tracks with new artist
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ artist: artist.name })
        .in('id', Array.from(selectedTracks));

      if (updateError) throw updateError;

      // Refresh data
      await fetchArtistAndTracks();
      setShowAddTracks(false);
      setSelectedTracks(new Set());
    } catch (err) {
      console.error('Error adding tracks:', err);
      setError('Failed to add tracks to artist');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTrack = async (trackId) => {
    if (!confirm('Are you sure you want to remove this track from the artist?')) return;

    try {
      const { error } = await supabase
        .from('tracks')
        .update({ artist: '' }) // Changed from null to empty string
        .eq('id', trackId);

      if (error) throw error;

      // Refresh tracks list
      setTracks(tracks.filter(t => t.id !== trackId));
    } catch (err) {
      console.error('Error removing track:', err);
      setError('Failed to remove track from artist');
    }
  };

  const handleDownload = async (e, track) => {
    e.stopPropagation();
    try {
      const response = await fetch(track.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title} - ${track.artist}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading track:', error);
      alert('Failed to download track');
    }
  };

  const filteredTracks = availableTracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.album.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onClick={() => navigate('/admin/artists')}
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
          onClick={() => navigate('/admin/artists')}
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
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h3 className="text-lg font-medium">Tracks</h3>
          <button
            onClick={() => setShowAddTracks(!showAddTracks)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Add Tracks</span>
          </button>
        </div>

        {showAddTracks ? (
          <div className="p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tracks by title or album..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full"
              />
            </div>

            <div className="overflow-x-auto mb-4">
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
                  {filteredTracks.map((track, index) => {
                    const isSelected = selectedTracks.has(track.id);
                    const isPlaying = playerState.currentTrack?.id === track.id && playerState.isPlaying;

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
                        <td className="w-16 text-center px-4 py-3 text-neutral-400">
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
                            <div className="font-medium">{track.title}</div>
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
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-400">
                {selectedTracks.size} tracks selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddTracks(false);
                    setSelectedTracks(new Set());
                  }}
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="w-16 text-center px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Album</th>
                  <th className="text-right px-4 py-3">Duration</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {tracks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
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
                        <td className="px-4 py-3 text-sm text-neutral-400 text-right">
                          {formatTime(track.duration)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrack(track.id);
                            }}
                            className="p-1.5 text-error-400 hover:text-error-300 rounded-full hover:bg-error-900/20"
                            title="Remove from artist"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistDetails;