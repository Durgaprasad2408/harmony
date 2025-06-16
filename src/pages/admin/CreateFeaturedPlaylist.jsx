import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Image, X, Music } from 'lucide-react';

const CreateFeaturedPlaylist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sanitizeFileName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50); // Limit length to avoid extremely long filenames
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a playlist title');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create a playlist');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let coverUrl = null;
      
      // Upload cover image if selected
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const sanitizedTitle = sanitizeFileName(title);
        const timestamp = new Date().getTime();
        const fileName = `featured-${sanitizedTitle}-${timestamp}.${fileExt}`;
        const filePath = `playlist-covers/${fileName}`;
        
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
      
      // Create featured playlist
      const { data: playlist, error: createError } = await supabase
        .from('playlists')
        .insert({
          title,
          description: description.trim() || null,
          user_id: user.id,
          cover_url: coverUrl,
          is_featured: true,
          featured_order: 0 // This will be updated based on existing featured playlists
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error('Error creating playlist');
      }
      
      // Navigate to the new playlist
      navigate(`/playlist/${playlist.id}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Playlist creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Create Featured Playlist</h1>
      
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
                    alt="Playlist cover preview" 
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
          
          {/* Playlist details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-300 mb-2">
                Playlist Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                placeholder="Featured Playlist Title"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full min-h-[120px]"
                placeholder="Describe this featured playlist..."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Optional. Add a description to tell people what this playlist is about.
              </p>
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/featured-playlists')}
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
              'Create Playlist'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFeaturedPlaylist;