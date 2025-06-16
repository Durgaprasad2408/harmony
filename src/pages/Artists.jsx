import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Music, ArrowLeft } from 'lucide-react';

const Artists = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('name');

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (artist.bio?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold">Artists</h1>
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search artists..."
          className="input w-full pl-12 py-3"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400"
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
      ) : filteredArtists.length === 0 ? (
        <div className="card p-12 text-center">
          <Music className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Artists Found</h3>
          <p className="text-neutral-400">
            {searchTerm ? 'Try different search terms.' : 'Check back later for artists.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              className="hover-card cursor-pointer group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800 mb-3">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-12 w-12 text-neutral-600" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-lg mb-1 truncate">{artist.name}</h3>
              {artist.bio && (
                <p className="text-sm text-neutral-400 line-clamp-2">{artist.bio}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Artists;