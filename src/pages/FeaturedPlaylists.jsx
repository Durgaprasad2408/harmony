import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Music, ArrowLeft, Search } from 'lucide-react';
import PlaylistCard from '../components/music/PlaylistCard';

const FeaturedPlaylists = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_featured', true)
        .order('featured_order', { ascending: true });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistClick = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (playlist.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold">Featured Playlists</h1>
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search featured playlists..."
          className="input w-full pl-12 py-3"
        />
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400"
          size={20}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      ) : filteredPlaylists.length === 0 ? (
        <div className="card p-12 text-center">
          <Music className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Playlists Found</h3>
          <p className="text-neutral-400">
            {searchTerm ? 'Try different search terms.' : 'Check back later for featured playlists.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={() => handlePlaylistClick(playlist)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedPlaylists;