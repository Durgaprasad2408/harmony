import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Music, Image, X, Save, ArrowLeft, ArrowRight } from 'lucide-react';

const EditTrack = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [track, setTrack] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [nextTrackId, setNextTrackId] = useState(null);
  const [prevTrackId, setPrevTrackId] = useState(null);
  const [genres, setGenres] = useState([]);
  const [moods, setMoods] = useState([]);

  useEffect(() => {
    if (id) {
      fetchTrack();
      fetchAdjacentTracks();
      fetchCategories();
    }
  }, [id]);

  const fetchCategories = async () => {
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
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTrack = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setTrack(data);
      setTitle(data.title);
      setArtist(data.artist);
      setAlbum(data.album);
      setGenre(data.genre_id || '');
      setMood(data.mood_id || '');
      setReleaseYear(data.release_year?.toString() || '');
      setCoverPreview(data.cover_url);
    } catch (err) {
      console.error('Error fetching track:', err);
      setError('Failed to load track');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjacentTracks = async () => {
    try {
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (!tracks) return;

      const currentIndex = tracks.findIndex(t => t.id === id);
      if (currentIndex > 0) {
        setPrevTrackId(tracks[currentIndex - 1].id);
      }
      if (currentIndex < tracks.length - 1) {
        setNextTrackId(tracks[currentIndex + 1].id);
      }
    } catch (err) {
      console.error('Error fetching adjacent tracks:', err);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Cover image size should be less than 2MB');
        return;
      }
      
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  const sanitizeFileName = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !artist.trim() || !album.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!track) {
      setError('Track not found');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      let coverUrl = track.cover_url;
      
      // Upload new cover if selected
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const sanitizedTitle = sanitizeFileName(title);
        const fileName = `${sanitizedTitle}-${Date.now()}.${fileExt}`;
        const filePath = `covers/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, coverFile);
        
        if (uploadError) {
          throw new Error('Error uploading cover image');
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        coverUrl = publicUrl;
      }
      
      // Update track
      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          title,
          artist,
          album,
          genre_id: genre || null,
          mood_id: mood || null,
          release_year: releaseYear ? parseInt(releaseYear) : null,
          cover_url: coverUrl,
        })
        .eq('id', track.id);
      
      if (updateError) {
        throw new Error('Error updating track');
      }
      
      navigate('/admin/tracks');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Track update error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-neutral-800 w-1/4 rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="aspect-square bg-neutral-800 rounded-lg"></div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-10 bg-neutral-800 rounded"></div>
            <div className="h-10 bg-neutral-800 rounded"></div>
            <div className="h-10 bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-neutral-400 mb-6">Track not found</p>
        <button 
          onClick={() => navigate('/admin/tracks')}
          className="btn-primary"
        >
          Back to Tracks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/tracks')}
            className="p-2 rounded-full hover:bg-neutral-800"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Edit Track</h1>
        </div>

        <div className="flex gap-2">
          {prevTrackId && (
            <button
              onClick={() => navigate(`/admin/tracks/${prevTrackId}/edit`)}
              className="p-2 rounded-full hover:bg-neutral-800"
              title="Previous track"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          {nextTrackId && (
            <button
              onClick={() => navigate(`/admin/tracks/${nextTrackId}/edit`)}
              className="p-2 rounded-full hover:bg-neutral-800"
              title="Next track"
            >
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error-900/50 border border-error-800 text-error-200 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cover image upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Cover Image
            </label>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center">
              {coverPreview ? (
                <>
                  <img 
                    src={coverPreview} 
                    alt="Track cover preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeCover}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90"
                    title="Remove cover"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <Music className="h-12 w-12 mx-auto text-neutral-600 mb-2" />
                  <p className="text-xs text-neutral-500">No cover image</p>
                </div>
              )}
              
              <input
                type="file"
                id="cover"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
                disabled={saving}
              />
              
              <label
                htmlFor="cover"
                className={`absolute bottom-2 right-2 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 cursor-pointer
                  ${coverPreview ? 'opacity-70 hover:opacity-100' : ''}`}
              >
                <Image size={16} />
              </label>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Optional. Maximum size 2MB.
            </p>
          </div>
          
          {/* Track details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-300 mb-2">
                Track Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                placeholder="Enter track title"
                required
                disabled={saving}
              />
            </div>
            
            <div>
              <label htmlFor="artist" className="block text-sm font-medium text-neutral-300 mb-2">
                Artist *
              </label>
              <input
                id="artist"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="input w-full"
                placeholder="Enter artist name"
                required
                disabled={saving}
              />
            </div>
            
            <div>
              <label htmlFor="album" className="block text-sm font-medium text-neutral-300 mb-2">
                Album *
              </label>
              <input
                id="album"
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="input w-full"
                placeholder="Enter album name"
                required
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-neutral-300 mb-2">
                  Genre
                </label>
                <select
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="input w-full"
                  disabled={saving}
                >
                  <option value="">Select genre</option>
                  {genres.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mood" className="block text-sm font-medium text-neutral-300 mb-2">
                  Mood
                </label>
                <select
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="input w-full"
                  disabled={saving}
                >
                  <option value="">Select mood</option>
                  {moods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="releaseYear" className="block text-sm font-medium text-neutral-300 mb-2">
                Release Year
              </label>
              <input
                id="releaseYear"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="input w-full"
                placeholder="Enter release year"
                disabled={saving}
              />
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/tracks')}
            className="btn-ghost"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTrack;