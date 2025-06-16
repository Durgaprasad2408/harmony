import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Music, Plus, Search } from 'lucide-react';
import PlaylistCard from '../../components/music/PlaylistCard';

const AdminFeaturedPlaylists = () => {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Featured Playlists</h1>
        <Link
          to="/admin/featured-playlists/create"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Create Featured Playlist</span>
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl mb-6">
        <input
          type="text"
          placeholder="Search featured playlists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full pl-12"
        />
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400"
          size={20}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse card">
              <div className="flex">
                <div className="w-24 h-24 bg-neutral-800 rounded-lg mr-4"></div>
                <div className="flex-1">
                  <div className="h-5 bg-neutral-800 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <div className="card p-12 text-center">
          <Music className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Featured Playlists</h3>
          <p className="text-neutral-400 mb-6">
            {searchTerm ? 'No playlists match your search.' : 'Create featured playlists to showcase on the home page.'}
          </p>
          <Link
            to="/admin/featured-playlists/create"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create Featured Playlist</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

export default AdminFeaturedPlaylists;