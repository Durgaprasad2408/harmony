import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Music } from 'lucide-react';
import PlaylistCard from '../components/music/PlaylistCard';
import TrackCard from '../components/music/TrackCard';
import { usePlayer } from '../contexts/PlayerContext';

const Library = () => {
  const { user } = useAuth();
  const { playTrack, favorites } = usePlayer();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [favoriteTracks, setFavoriteTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserContent();
    }
  }, [user]);

  const fetchUserContent = async () => {
    setLoading(true);
    try {
      // Get user's playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (playlistsError) {
        console.error('Error fetching playlists:', playlistsError);
      } else {
        setPlaylists(playlistsData);
      }

      // Get favorite tracks
      if (favorites.size > 0) {
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('tracks')
          .select('*')
          .in('id', Array.from(favorites))
          .order('created_at', { ascending: false });

        if (favoritesError) {
          console.error('Error fetching favorite tracks:', favoritesError);
        } else {
          setFavoriteTracks(favoritesData || []);
        }
      }

      // Get recent tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (tracksError) {
        console.error('Error fetching tracks:', tracksError);
      } else {
        setRecentTracks(tracksData);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Demo data if none from Supabase
  const demoPlaylists = [
    {
      id: '1',
      title: 'My Favorites',
      description: 'Collection of all my favorite tracks',
      user_id: user?.id || '',
      cover_url: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Workout Mix',
      description: 'High energy tracks to keep you moving',
      user_id: user?.id || '',
      cover_url: 'https://images.pexels.com/photos/4662950/pexels-photo-4662950.jpeg',
      created_at: new Date().toISOString()
    }
  ];

  // Demo tracks
  const demoTracks = [
    {
      id: '1',
      title: 'Sunset Memories',
      artist: 'Ambient Dreams',
      album: 'Peaceful Moments',
      duration: 237,
      url: 'https://example.com/track1.mp3',
      cover_url: 'https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg',
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
      cover_url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
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
      cover_url: 'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg',
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
      cover_url: 'https://images.pexels.com/photos/1509534/pexels-photo-1509534.jpeg',
      uploaded_by: 'admin',
      created_at: new Date().toISOString()
    }
  ];

  // Create favorites playlist object
  const favoritesPlaylist = {
    id: 'favorites',
    title: 'Liked Songs',
    description: `${favorites.size} liked songs`,
    user_id: user?.id,
    cover_url: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
    created_at: new Date().toISOString()
  };

  // Use demo data if none from Supabase
  const playlistsToDisplay = [
    favoritesPlaylist,
    ...(playlists.length > 0 ? playlists : demoPlaylists)
  ];
  const tracksToDisplay = recentTracks.length > 0 ? recentTracks : demoTracks;

  const handlePlaylistClick = (playlist) => {
    if (playlist.id === 'favorites') {
      // Handle favorites playlist click
      // You'll need to create a route to display favorite tracks
      navigate('/favorites');
    } else {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Your Library</h1>
      
      {/* Playlists section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Your Playlists</h2>
          <Link to="/playlist/create" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            <Plus size={14} />
            <span>Create Playlist</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse card">
                <div className="flex">
                  <div className="w-24 h-24 bg-neutral-800 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-neutral-800 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-neutral-800 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-neutral-800 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : playlistsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlistsToDisplay.map((playlist) => (
              <PlaylistCard 
                key={playlist.id} 
                playlist={playlist}
                onClick={() => handlePlaylistClick(playlist)}
              />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-neutral-400 mb-4">
              You don't have any playlists yet. Create your first playlist to get started.
            </p>
            <Link to="/playlist/create" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              <span>Create Playlist</span>
            </Link>
          </div>
        )}
      </section>
      
      {/* Recently played section */}
      <section>
        <h2 className="text-xl font-bold mb-5">Recently Played</h2>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-neutral-800 rounded-lg mb-2"></div>
                <div className="h-4 bg-neutral-800 rounded mb-1 w-3/4"></div>
                <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : tracksToDisplay.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tracksToDisplay.map((track) => (
              <TrackCard 
                key={track.id} 
                track={track} 
                onClick={() => playTrack(track)} 
              />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-neutral-400">
              You haven't played any tracks yet. Start exploring the music library.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Library;