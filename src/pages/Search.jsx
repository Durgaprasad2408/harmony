import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePlayer } from '../contexts/PlayerContext';
import { Search as SearchIcon, Play, Pause, Music } from 'lucide-react';
import TrackCard from '../components/music/TrackCard';
import PlaylistCard from '../components/music/PlaylistCard';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../utils/formatters';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({
    tracks: [],
    playlists: [],
    albums: [],
  });
  const [genres, setGenres] = useState([]);
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playTrack, playerState, togglePlay } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGenresAndMoods();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchGenresAndMoods = async () => {
    try {
      // Fetch genres
      const { data: genresData, error: genresError } = await supabase
        .from('genres')
        .select('*')
        .order('name');

      if (genresError) throw genresError;
      setGenres(genresData || []);

      // Fetch moods
      const { data: moodsData, error: moodsError } = await supabase
        .from('moods')
        .select('*')
        .order('name');

      if (moodsError) throw moodsError;
      setMoods(moodsData || []);
    } catch (error) {
      console.error('Error fetching genres and moods:', error);
    }
  };

  const performSearch = async () => {
    if (searchTerm.trim().length < 2) {
      setSearchResults({ tracks: [], playlists: [], albums: [] });
      return;
    }

    setLoading(true);
    try {
      // Search tracks
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('*')
        .or(
          `title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%,album.ilike.%${searchTerm}%`
        )
        .limit(12);

      if (trackError) throw trackError;

      // Search albums
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .or(
          `title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`
        )
        .limit(6);

      if (albumError) throw albumError;

      // Search playlists - only show featured playlists and user's own playlists
      const playlistQuery = supabase
        .from('playlists')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .or(`is_featured.eq.true,user_id.eq.${user?.id}`)
        .limit(6);

      const { data: playlistData, error: playlistError } = await playlistQuery;

      if (playlistError) throw playlistError;

      setSearchResults({
        tracks: trackData || [],
        playlists: playlistData || [],
        albums: albumData || [],
      });
    } catch (error) {
      console.error('Unexpected error during search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = (genre) => {
    navigate(`/genre/${genre.name}`);
  };

  const handleMoodClick = (mood) => {
    navigate(`/mood/${mood.name}`);
  };

  const handleTrackClick = (track) => {
    if (playerState.currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Search</h1>

      {/* Search input */}
      <div className="relative max-w-2xl mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for songs, artists, or playlists..."
          className="input w-full pl-12 py-3 text-lg"
        />
        <SearchIcon
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400"
          size={20}
        />
      </div>

      {loading ? (
        // Loading skeleton
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Tracks</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-neutral-800 rounded-lg mb-2"></div>
                  <div className="h-4 bg-neutral-800 rounded mb-1 w-3/4"></div>
                  <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : searchTerm.length < 2 ? (
        // Browse categories
        <div className="space-y-12">
          {/* Genres section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Browse by Genre</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {genres.map((genre, i) => (
                <div
                  key={genre.id}
                  onClick={() => handleGenreClick(genre)}
                  className="aspect-square rounded-lg overflow-hidden hover-card cursor-pointer relative group"
                >
                  {genre.cover_url ? (
                    <img
                      src={genre.cover_url}
                      alt={genre.name}
                      className="w-full h-full object-cover"
                    />
                
                  ) : (
                    <div
                      className="w-full h-full bg-gradient-to-br"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, 
                          hsl(${(i * 36) % 360}, 70%, 20%), 
                          hsl(${(i * 36 + 40) % 360}, 70%, 30%))`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                    <h3 className="text-xl font-bold text-center">{genre.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Moods section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Browse by Mood</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {moods.map((mood, i) => (
                <div
                  key={mood.id}
                  onClick={() => handleMoodClick(mood)}
                  className="aspect-square rounded-lg overflow-hidden hover-card cursor-pointer relative group"
                >
                  {mood.cover_url ? (
                    <img
                      src={mood.cover_url}
                      alt={mood.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-gradient-to-br"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, 
                          hsl(${(i * 72) % 360}, 70%, 20%), 
                          hsl(${(i * 72 + 40) % 360}, 70%, 30%))`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                    <h3 className="text-xl font-bold text-center">{mood.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        // Search results
        <div className="space-y-8">
          {/* Albums results */}
          <div>
            <h2 className="text-xl font-bold mb-4">Albums</h2>
            {searchResults.albums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => navigate(`/album/${album.id}`)}
                    className="hover-card cursor-pointer group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800 mb-3">
                      {album.cover_url ? (
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-12 w-12 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-lg mb-1 truncate">{album.title}</h3>
                    <p className="text-sm text-neutral-400 truncate">{album.artist}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center">
                <p className="text-neutral-400">
                  No albums found matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>

          {/* Tracks results */}
          <div>
            <h2 className="text-xl font-bold mb-4">Tracks</h2>
            {searchResults.tracks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.tracks.map((track) => (
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
                  No tracks found matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>

          {/* Playlists results */}
          <div>
            <h2 className="text-xl font-bold mb-4">Playlists</h2>
            {searchResults.playlists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center">
                <p className="text-neutral-400">
                  No playlists found matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;