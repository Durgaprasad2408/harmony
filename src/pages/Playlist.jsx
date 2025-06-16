import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { Play, Pause, Music, Edit, Trash2, Plus, MoreHorizontal } from 'lucide-react';
import TrackContextMenu from '../components/music/TrackContextMenu';

const Playlist = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { playerState, playTracks, togglePlay } = usePlayer();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (id) {
      fetchPlaylist();
    }
  }, [id]);

  const fetchPlaylist = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();

      if (playlistError) {
        throw new Error('Playlist not found');
      }

      setPlaylist(playlistData);
      setIsOwner(user?.id === playlistData.user_id);

      const { data: playlistTracksData, error: tracksError } = await supabase
        .from('playlist_tracks')
        .select('track_id, position')
        .eq('playlist_id', id)
        .order('position');

      if (tracksError) {
        throw new Error('Error fetching playlist tracks');
      }

      if (playlistTracksData.length > 0) {
        const trackIds = playlistTracksData.map(pt => pt.track_id);
        const { data: tracksData, error: trackDetailsError } = await supabase
          .from('tracks')
          .select('*')
          .in('id', trackIds);

        if (trackDetailsError) {
          throw new Error('Error fetching track details');
        }

        const orderedTracks = playlistTracksData.map(pt =>
          tracksData.find(t => t.id === pt.track_id)
        ).filter(Boolean);

        setTracks(orderedTracks);
      } else {
        setTracks([]);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track, index) => {
    // Pass the playlist source when playing tracks
    const source = `/playlist/${id}`;
    playTracks(tracks, index, source);
  };

  const handleRemoveTrack = async (e, trackId) => {
    e.stopPropagation();
    if (!playlist) return;

    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlist.id)
        .eq('track_id', trackId);

      if (error) throw error;

      setTracks(tracks.filter(track => track.id !== trackId));
    } catch (err) {
      console.error('Error removing track:', err);
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

  const handleEditPlaylist = () => {
    navigate(`/playlist/${id}/edit`);
  };

  const handleDeletePlaylist = async () => {
    if (!playlist || !confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlist.id);

      if (error) throw error;

      navigate('/library');
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert('Failed to delete playlist');
    }
  };

  const handleAddTracks = () => {
    navigate(`/playlist/${id}/add-tracks`);
  };

  const handlePlayPlaylist = () => {
    if (tracks.length === 0) return;

    const isCurrentPlaylist =
      playerState.queue.length > 0 &&
      playerState.queue[0].id === tracks[0].id;

    if (isCurrentPlaylist) {
      togglePlay();
    } else {
      const source = `/playlist/${id}`;
      playTracks(tracks, 0, source);
    }
  };

  const isPlaylistPlaying = () => {
    return (
      playerState.isPlaying &&
      playerState.queue.length > 0 &&
      tracks.length > 0 &&
      playerState.queue[0].id === tracks[0].id
    );
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
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-neutral-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-neutral-400 mb-6">{error}</p>
        <Link to="/library" className="btn-primary">
          Back to Library
        </Link>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6 md:items-end mb-8">
        <div className="w-48 h-48 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
          {playlist.cover_url ? (
            <img
              src={playlist.cover_url}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
              <Music size={64} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="text-sm text-neutral-400 font-medium mb-1">Playlist</div>
          <h1 className="text-4xl font-bold mb-2">{playlist.title}</h1>

          {playlist.description && (
            <p className="text-neutral-400 mb-2">{playlist.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-500">
            <span>{tracks.length} tracks</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          onClick={handlePlayPlaylist}
          disabled={tracks.length === 0}
          className={`btn flex items-center gap-2 ${
            isPlaylistPlaying()
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'btn-primary'
          }`}
        >
          {isPlaylistPlaying() ? <Pause size={18} /> : <Play size={18} />}
          <span>{isPlaylistPlaying() ? 'Pause' : 'Play'}</span>
        </button>

        {isOwner && (
          <>
            <button
              onClick={handleEditPlaylist}
              className="btn-ghost flex items-center gap-2"
            >
              <Edit size={18} />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDeletePlaylist}
              className="btn-ghost flex items-center gap-2 text-error-400 hover:text-error-300"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>

      <div className="bg-background-light rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h3 className="text-lg font-medium">Tracks</h3>
          {isOwner && (
            <button onClick={handleAddTracks} className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              <span>Add Tracks</span>
            </button>
          )}
        </div>

        {tracks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-400 mb-6">
              This playlist doesn't have any tracks yet.
            </p>
            {isOwner && (
              <button
                onClick={handleAddTracks}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                <span>Add Tracks</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="w-12 text-center px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Album</th>
                  <th className="w-12"></th>
                  {isOwner && <th className="w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {tracks.map((track, index) => {
                  const isPlaying =
                    playerState.currentTrack?.id === track.id && playerState.isPlaying;

                  return (
                    <tr
                      key={track.id}
                      className="border-b border-neutral-800 hover:bg-background-dark/30 cursor-pointer"
                      onClick={() => handleTrackClick(track, index)}
                    >
                      <td className="w-12 text-center px-4 py-3 text-neutral-400">
                        {isPlaying ? (
                          <Pause size={16} className="text-primary-400 mx-auto" />
                        ) : (
                          <span>{index + 1}</span>
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
                      <td className="px-4 py-3 text-neutral-300">{track.album}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => handleMenuClick(e, track)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
                          title="More options"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3">
                          <button
                            onClick={e => handleRemoveTrack(e, track.id)}
                            className="p-1.5 text-error-400 hover:text-error-300 rounded-full hover:bg-error-900/20"
                            title="Remove from playlist"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

export default Playlist;