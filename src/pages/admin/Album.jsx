import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Music, ArrowLeft, Edit, Trash2, Play, Pause, Plus } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { formatTime } from '../../utils/formatters';

export default function AdminAlbum() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playerState, playTrack, togglePlay } = usePlayer();
  
  const [album, setAlbum] = useState(null);
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

      // Get available tracks (tracks not in any album)
      const { data: availableTracksData, error: availableTracksError } = await supabase
        .from('tracks')
        .select('*')
        .is('album_id', null)
        .order('title');

      if (availableTracksError) throw availableTracksError;
      setAvailableTracks(availableTracksData || []);
    } catch (err) {
      console.error('Error fetching album:', err);
      setError('Failed to load album');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!album || !confirm('Are you sure you want to delete this album?')) return;

    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', album.id);

      if (error) throw error;
      navigate('/admin/albums');
    } catch (err) {
      console.error('Error deleting album:', err);
      setError('Failed to delete album');
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
      // Update tracks with album_id
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ album_id: id })
        .in('id', Array.from(selectedTracks));

      if (updateError) throw updateError;

      // Refresh data
      await fetchAlbumAndTracks();
      setShowAddTracks(false);
      setSelectedTracks(new Set());
    } catch (err) {
      console.error('Error adding tracks:', err);
      setError('Failed to add tracks to album');
    } finally {
      setSaving(false);
    }
  };

  const filteredTracks = availableTracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-neutral-800 rounded-full"></div>
          <div className="flex-1">
            <div className="h-8 bg-neutral-800 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-neutral-800 rounded w-1/6"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="aspect-square bg-neutral-800 rounded-lg"></div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 bg-neutral-800 rounded w-3/4"></div>
            <div className="h-6 bg-neutral-800 rounded w-1/2"></div>
            <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
          </div>
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
          onClick={() => navigate('/admin/albums')}
          className="btn-primary"
        >
          Back to Albums
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/admin/albums')}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Album Details</h1>
          <p className="text-neutral-400">Manage album and its tracks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Album cover */}
        <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800">
          {album.cover_url ? (
            <img 
              src={album.cover_url} 
              alt={album.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-16 w-16 text-neutral-600" />
            </div>
          )}
        </div>

        {/* Album info */}
        <div className="md:col-span-2">
          <h2 className="text-3xl font-bold mb-2">{album.title}</h2>
          <p className="text-xl text-neutral-300 mb-4">{album.artist}</p>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => navigate(`/admin/albums/${album.id}/edit`)}
              className="btn-ghost flex items-center gap-2"
            >
              <Edit size={18} />
              <span>Edit Album</span>
            </button>
            <button 
              onClick={handleDeleteAlbum}
              className="btn-ghost flex items-center gap-2 text-error-400 hover:text-error-300"
            >
              <Trash2 size={18} />
              <span>Delete Album</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracks section */}
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
                placeholder="Search tracks by title or artist..."
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
                    <th className="text-left px-4 py-3">Artist</th>
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
                          <div className="font-medium">{track.title}</div>
                        </td>
                        <td className="px-4 py-3 text-neutral-300">
                          {track.artist}
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
                  <th className="text-right px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {tracks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-neutral-400">
                      No tracks in this album yet
                    </td>
                  </tr>
                ) : (
                  tracks.map((track, index) => {
                    const isPlaying = playerState.currentTrack?.id === track.id && playerState.isPlaying;
                    
                    return (
                      <tr 
                        key={track.id} 
                        className="border-b border-neutral-800 hover:bg-background-dark/30"
                      >
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
        )}
      </div>
    </div>
  );
}