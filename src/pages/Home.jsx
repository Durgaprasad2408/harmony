import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import TrackCard from '../components/music/TrackCard';
import PlaylistCard from '../components/music/PlaylistCard';
import { Music, ChevronRight, User } from 'lucide-react';

// Demo data for when no data is fetched from Supabase
const demoPlaylists = [
  {
    id: 'demo-1',
    title: 'Chill Vibes',
    description: 'Perfect for relaxation and unwinding',
    user_id: 'demo-user',
    cover_url: 'https://images.pexels.com/photos/1647972/pexels-photo-1647972.jpeg',
    created_at: new Date().toISOString(),
    is_featured: true,
    featured_order: 1
  },
  {
    id: 'demo-2',
    title: 'Workout Mix',
    description: 'High-energy tracks to keep you motivated',
    user_id: 'demo-user',
    cover_url: 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg',
    created_at: new Date().toISOString(),
    is_featured: true,
    featured_order: 2
  },
  {
    id: 'demo-3',
    title: 'Focus Flow',
    description: 'Concentrate with ambient sounds',
    user_id: 'demo-user',
    cover_url: 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg',
    created_at: new Date().toISOString(),
    is_featured: true,
    featured_order: 3
  },
  {
    id: 'demo-4',
    title: 'Evening Jazz',
    description: 'Smooth jazz for your evening',
    user_id: 'demo-user',
    cover_url: 'https://images.pexels.com/photos/4087991/pexels-photo-4087991.jpeg',
    created_at: new Date().toISOString(),
    is_featured: true,
    featured_order: 4
  }
];

const demoAlbums = [
  {
    id: 'demo-album-1',
    title: 'Morning Light',
    artist: 'Sarah Waters',
    cover_url: 'https://images.pexels.com/photos/1666816/pexels-photo-1666816.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-album-2',
    title: 'Urban Dreams',
    artist: 'The City Sound',
    cover_url: 'https://images.pexels.com/photos/1707715/pexels-photo-1707715.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-album-3',
    title: 'Ocean Waves',
    artist: 'Blue Horizon',
    cover_url: 'https://images.pexels.com/photos/1835718/pexels-photo-1835718.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-album-4',
    title: 'Mountain Echo',
    artist: 'Nature\'s Voice',
    cover_url: 'https://images.pexels.com/photos/1671324/pexels-photo-1671324.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-album-5',
    title: 'Electric Night',
    artist: 'Neon Pulse',
    cover_url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-album-6',
    title: 'Desert Wind',
    artist: 'Sand Storm',
    cover_url: 'https://images.pexels.com/photos/1834399/pexels-photo-1834399.jpeg',
    created_at: new Date().toISOString()
  }
];

const demoTracks = [
  {
    id: 'demo-track-1',
    title: 'Sunrise Melody',
    artist: 'Morning Breeze',
    cover_url: 'https://images.pexels.com/photos/1713953/pexels-photo-1713953.jpeg',
    duration: 180
  },
  {
    id: 'demo-track-2',
    title: 'City Lights',
    artist: 'Urban Echo',
    cover_url: 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg',
    duration: 210
  },
  {
    id: 'demo-track-3',
    title: 'Ocean Dreams',
    artist: 'Wave Riders',
    cover_url: 'https://images.pexels.com/photos/1738434/pexels-photo-1738434.jpeg',
    duration: 195
  },
  {
    id: 'demo-track-4',
    title: 'Mountain Air',
    artist: 'Peak Experience',
    cover_url: 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg',
    duration: 225
  },
  {
    id: 'demo-track-5',
    title: 'Night Drive',
    artist: 'Midnight Cruise',
    cover_url: 'https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg',
    duration: 240
  },
  {
    id: 'demo-track-6',
    title: 'Desert Song',
    artist: 'Oasis Sound',
    cover_url: 'https://images.pexels.com/photos/1717969/pexels-photo-1717969.jpeg',
    duration: 200
  },
  {
    id: 'demo-track-7',
    title: 'Forest Walk',
    artist: 'Nature\'s Path',
    cover_url: 'https://images.pexels.com/photos/1761282/pexels-photo-1761282.jpeg',
    duration: 185
  },
  {
    id: 'demo-track-8',
    title: 'Rain Dance',
    artist: 'Storm Chasers',
    cover_url: 'https://images.pexels.com/photos/1702624/pexels-photo-1702624.jpeg',
    duration: 215
  }
];

const demoArtists = [
  {
    id: 'demo-artist-1',
    name: 'Sarah Waters',
    image_url: 'https://images.pexels.com/photos/1699159/pexels-photo-1699159.jpeg'
  },
  {
    id: 'demo-artist-2',
    name: 'The City Sound',
    image_url: 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg'
  },
  {
    id: 'demo-artist-3',
    name: 'Blue Horizon',
    image_url: 'https://images.pexels.com/photos/1699162/pexels-photo-1699162.jpeg'
  },
  {
    id: 'demo-artist-4',
    name: 'Nature\'s Voice',
    image_url: 'https://images.pexels.com/photos/1699163/pexels-photo-1699163.jpeg'
  },
  {
    id: 'demo-artist-5',
    name: 'Neon Pulse',
    image_url: 'https://images.pexels.com/photos/1699164/pexels-photo-1699164.jpeg'
  },
  {
    id: 'demo-artist-6',
    name: 'Sand Storm',
    image_url: 'https://images.pexels.com/photos/1699165/pexels-photo-1699165.jpeg'
  },
  {
    id: 'demo-artist-7',
    name: 'Wave Riders',
    image_url: 'https://images.pexels.com/photos/1699166/pexels-photo-1699166.jpeg'
  },
  {
    id: 'demo-artist-8',
    name: 'Peak Experience',
    image_url: 'https://images.pexels.com/photos/1699167/pexels-photo-1699167.jpeg'
  }
];

const Home = () => {
  const { user, profile } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  const [moods, setMoods] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: playlists, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_featured', true)
        .order('featured_order', { ascending: true })
        .limit(4);

      if (playlistsError) throw playlistsError;
      setFeaturedPlaylists(playlists || []);

      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (albumsError) throw albumsError;
      setAlbums(albumsData || []);

      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

      if (artistsError) throw artistsError;
      setArtists(artistsData || []);

      if (user) {
        const { data: recentPlays, error: recentError } = await supabase
          .from('play_history')
          .select('track_id, played_at, tracks(*)')
          .eq('user_id', user.id)
          .order('played_at', { ascending: false })
          .limit(8);

        if (recentError) throw recentError;

        const uniqueTracks = new Map();
        recentPlays?.forEach(play => {
          if (!uniqueTracks.has(play.tracks.id)) {
            uniqueTracks.set(play.tracks.id, play.tracks);
          }
        });
        setRecentlyPlayed(Array.from(uniqueTracks.values()));
      } else {
        const { data: tracksData, error: tracksError } = await supabase
          .from('tracks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);

        if (tracksError) throw tracksError;
        setRecentlyPlayed(tracksData || []);
      }

      const { data: genresData, error: genresError } = await supabase
        .from('genres')
        .select('*')
        .order('name');

      if (genresError) throw genresError;
      setGenres(genresData || []);

      const { data: moodsData, error: moodsError } = await supabase
        .from('moods')
        .select('*')
        .order('name');

      if (moodsError) throw moodsError;
      setMoods(moodsData || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodClick = (mood) => {
    navigate(`/mood/${mood.name}`);
  };

  const handlePlaylistClick = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  const handleTrackClick = (track) => {
    // Pass the home source when playing tracks from home
    const source = '/recently-played';
    playTrack(track, source);
  };

  const handleArtistClick = (artist) => {
    navigate(`/artist/${artist.id}`);
  };

  const playlistsToDisplay = featuredPlaylists.length > 0 ? featuredPlaylists : demoPlaylists;
  const albumsToDisplay = albums.length > 0 ? albums : demoAlbums;
  const tracksToDisplay = recentlyPlayed.length > 0 ? recentlyPlayed : demoTracks;
  const artistsToDisplay = artists.length > 0 ? artists : demoArtists;

  return (
    <div className="pb-8 animate-fade-in">
      <section className="mb-10">
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-background-light via-primary-900/20 to-primary-900/10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {user ? `Welcome back, ${profile?.display_name}` : 'Welcome to Harmony'}
          </h1>
          <p className="text-lg text-neutral-300 mb-6">
            {user 
              ? 'Pick up where you left off and discover new tracks.'
              : 'Your personal music sanctuary with beautifully curated playlists.'}
          </p>
          {!user && (
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary">Sign In</Link>
              <Link to="/register" className="btn-ghost">Create Account</Link>
            </div>
          )}
        </div>
      </section>

      {/* Artists */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold">Popular Artists</h2>
          <Link to="/artists" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View all <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-neutral-800 rounded-full mb-2"></div>
                <div className="h-4 bg-neutral-800 rounded mb-1 w-3/4 mx-auto"></div>
              </div>
            ))
          ) : (
            artistsToDisplay.map((artist) => (
              <div
                key={artist.id}
                onClick={() => handleArtistClick(artist)}
                className="text-center hover-card cursor-pointer group"
              >
                <div className="aspect-square rounded-full overflow-hidden bg-neutral-800 mb-3">
                  {artist.image_url ? (
                    <img
                
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-12 w-12 text-neutral-600" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium truncate">{artist.name}</h3>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Moods */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-5">Select Your Mood</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {moods.map((mood, i) => (
            <button key={mood.id} onClick={() => handleMoodClick(mood)} className="aspect-square rounded-xl overflow-hidden relative group hover-card">
              {mood.cover_url ? (
                <img src={mood.cover_url} alt={mood.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br" style={{
                  backgroundImage: `linear-gradient(to bottom right, 
                    hsl(${(i * 72) % 360}, 70%, 20%), 
                    hsl(${(i * 72 + 40) % 360}, 70%, 30%))`
                }} />
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center p-4">
                <span className="font-medium text-lg">{mood.name}</span>
                {mood.description && (
                  <span className="text-sm text-neutral-300 mt-1 text-center line-clamp-2 hidden md:block">
                    {mood.description}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Playlists */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold">Featured Playlists</h2>
          <Link to="/featured-playlists" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            See all <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse card">
                <div className="flex">
                  <div className="w-24 h-24 bg-neutral-800 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-neutral-800 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            playlistsToDisplay.slice(0, 4).map(playlist => (
              <PlaylistCard key={playlist.id} playlist={playlist} onClick={() => handlePlaylistClick(playlist)} />
            ))
          )}
        </div>
      </section>

      {/* Recently Played (only if logged in) */}
      {user && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold">Recently Played</h2>
            <Link to="/recently-played" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-neutral-800 rounded-lg mb-2"></div>
                  <div className="h-4 bg-neutral-800 rounded mb-1 w-3/4"></div>
                  <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                </div>
              ))
            ) : (
              tracksToDisplay.map((track, index) => (
                <TrackCard key={track.id} track={track} onClick={() => handleTrackClick(track, index)} />
              ))
            )}
          </div>
        </section>
      )}

      {/* Latest Albums */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold">Latest Albums</h2>
          <Link to="/albums" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            See all <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {albumsToDisplay.map(album => (
            <Link key={album.id} to={`/album/${album.id}`} className="hover-card cursor-pointer group">
              <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800 mb-3">
                {album.cover_url ? (
                  <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-12 w-12 text-neutral-600" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-lg mb-1 truncate">{album.title}</h3>
              <p className="text-sm text-neutral-400 truncate hidden md:block">{album.artist}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;