import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Music, Image, X, Save } from 'lucide-react';

export default function CreateAlbum() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState(null);

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
      .replace(/[^a-z0-9]/g, '-') // Replace special chars with hyphen
      .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '');     // Remove leading/trailing hyphens
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !artist.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) {
      setError('You must be logged in to create an album');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let coverUrl = null;
      
      // Upload cover if selected
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const sanitizedTitle = sanitizeFileName(title);
        const fileName = `${sanitizedTitle}.${fileExt}`;
        const filePath = `covers/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, coverFile, { upsert: true });
        
        if (uploadError) {
          throw new Error('Error uploading cover image');
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        coverUrl = publicUrl;
      }

      // Create album
      const { error: createError } = await supabase
        .from('albums')
        .insert({
          title,
          artist,
          cover_url: coverUrl,
          uploaded_by: user.id,
        });

      if (createError) {
        throw new Error('Error creating album');
      }

      navigate('/admin/albums');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Album creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Create New Album</h1>
      
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
                    alt="Album cover preview" 
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
                disabled={loading}
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
          
          {/* Album details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-300 mb-2">
                Album Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                placeholder="Enter album title"
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
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/albums')}
            className="btn-ghost"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Save size={18} />
                <span>Create Album</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}