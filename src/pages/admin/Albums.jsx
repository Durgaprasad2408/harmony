import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminAlbums() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  async function fetchAlbums() {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAlbumClick = (album) => {
    navigate(`/admin/albums/${album.id}`);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-neutral-800 rounded w-32"></div>
          <div className="h-10 bg-neutral-800 rounded w-28"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-background-light rounded-lg p-4">
              <div className="aspect-square bg-neutral-800 rounded-lg mb-3"></div>
              <div className="h-5 bg-neutral-800 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Albums</h1>
        <button
          onClick={() => navigate('/admin/albums/create')}
          className="btn-primary"
        >
          Create Album
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="card p-12 text-center">
          <Music className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Albums Found</h3>
          <p className="text-neutral-400 mb-6">Start by creating a new album.</p>
          <button
            onClick={() => navigate('/admin/albums/create')}
            className="btn-primary inline-flex"
          >
            Create Album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => handleAlbumClick(album)}
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
      )}
    </div>
  );
}