import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Music } from 'lucide-react';

const UploadTrack = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [genres, setGenres] = useState([]);
  const [moods, setMoods] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Audio file size should be less than 10MB');
        return;
      }
      
      setAudioFile(file);
      setError(null);
    }
  };

  const sanitizeFileName = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !artist.trim() || !album.trim() || !audioFile) {
      setError('Please fill in all required fields and upload an audio file');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to upload tracks');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const sanitizedTitle = sanitizeFileName(title);

      // Upload audio file
      const audioExt = audioFile.name.split('.').pop();
      const audioFileName = `${sanitizedTitle}.${audioExt}`;
      const audioPath = `tracks/${audioFileName}`;
      
      const { error: audioUploadError } = await supabase.storage
        .from('media')
        .upload(audioPath, audioFile, { upsert: true });
      
      if (audioUploadError) {
        throw new Error('Error uploading audio file: ' + audioUploadError.message);
      }
      
      // Get audio URL
      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(audioPath);

      let coverUrl = null;
      
      // Upload cover if selected
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverFileName = `${sanitizedTitle}-cover.${coverExt}`;
        const coverPath = `covers/${coverFileName}`;
        
        const { error: coverUploadError } = await supabase.storage
          .from('media')
          .upload(coverPath, coverFile, { upsert: true });
        
        if (coverUploadError) {
          throw new Error('Error uploading cover image: ' + coverUploadError.message);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(coverPath);
          
        coverUrl = publicUrl;
      }
      
      // Create track record
      const { error: createError } = await supabase
        .from('tracks')
        .insert({
          title,
          artist,
          album,
          genre_id: genre || null,
          mood_id: mood || null,
          release_year: releaseYear ? parseInt(releaseYear) : null,
          duration: 0, // This should be calculated from the audio file
          url: audioUrl,
          cover_url: coverUrl,
          uploaded_by: user.id,
        });
      
      if (createError) {
        throw new Error('Error creating track: ' + createError.message);
      }
      
      // Redirect to tracks list
      navigate('/admin/tracks');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Track upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Upload New Track</h1>
      
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
                <img 
                  src={coverPreview} 
                  alt="Track cover preview" 
                  className="w-full h-full object-cover"
                />
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
                disabled={loading}
              />
              
              <label
                htmlFor="cover"
                className="absolute bottom-2 right-2 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 cursor-pointer"
              >
                <Upload size={16} />
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="audio" className="block text-sm font-medium text-neutral-300 mb-2">
                Audio File *
              </label>
              <input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="input w-full"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Maximum size 10MB. Supported formats: MP3, WAV
              </p>
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/tracks')}
            className="btn-ghost"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary min-w-[120px]"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Upload Track'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadTrack;