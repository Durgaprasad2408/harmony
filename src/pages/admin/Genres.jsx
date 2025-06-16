import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Music, Plus, Edit2, Trash2, Image, X, Save } from 'lucide-react';

const Genres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGenre, setEditingGenre] = useState(null);
  const [newGenre, setNewGenre] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const { data, error } = await supabase
        .from('genres')
        .select('*')
        .order('name');

      if (error) throw error;
      setGenres(data || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
    } finally {
      setLoading(false);
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

  const handleSaveGenre = async () => {
    if (!newGenre.trim()) {
      setError('Please enter a genre name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let coverUrl = null;

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `genres/${newGenre.toLowerCase().replace(/\s+/g, '-')}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, coverFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrl;
      }

      if (editingGenre) {
        // Update existing genre
        const { error: updateError } = await supabase
          .from('genres')
          .update({
            name: newGenre,
            description: description.trim() || null,
            cover_url: coverUrl || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingGenre);

        if (updateError) throw updateError;
      } else {
        // Create new genre
        const { error: insertError } = await supabase
          .from('genres')
          .insert({
            name: newGenre,
            description: description.trim() || null,
            cover_url: coverUrl
          });

        if (insertError) throw insertError;
      }

      // Refresh genres list
      await fetchGenres();
      
      // Reset form
      setNewGenre('');
      setDescription('');
      setCoverFile(null);
      setCoverPreview(null);
      setEditingGenre(null);
    } catch (err) {
      console.error('Error saving genre:', err);
      setError('Failed to save genre');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGenre = async (id) => {
    if (!confirm('Are you sure you want to delete this genre?')) return;

    try {
      const { error } = await supabase
        .from('genres')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchGenres();
    } catch (err) {
      console.error('Error deleting genre:', err);
      setError('Failed to delete genre');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-neutral-800 w-1/4 rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Genres</h1>
      </div>

      {/* Add/Edit Genre Form */}
      <div className="bg-background-light rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cover image upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Genre Cover
            </label>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center">
              {coverPreview ? (
                <>
                  <img 
                    src={coverPreview} 
                    alt="Genre cover preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90"
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
                className="absolute bottom-2 right-2 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 cursor-pointer"
              >
                <Image size={16} />
              </label>
            </div>
          </div>

          {/* Genre details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Genre Name
              </label>
              <input
                type="text"
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                className="input w-full"
                placeholder="Enter genre name"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full min-h-[100px]"
                placeholder="Enter genre description"
                disabled={saving}
              />
            </div>

            {error && (
              <div className="p-4 bg-error-900/50 border border-error-800 text-error-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {editingGenre && (
                <button
                  onClick={() => {
                    setEditingGenre(null);
                    setNewGenre('');
                    setDescription('');
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}
                  className="btn-ghost"
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveGenre}
                className="btn-primary flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{editingGenre ? 'Save Changes' : 'Add Genre'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Genres Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {genres.map((genre) => (
          <div
            key={genre.id}
            className="bg-background-light rounded-lg p-4 hover:bg-background-light/80 transition-colors"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800 mb-3">
              {genre.cover_url ? (
                <img
                  src={genre.cover_url}
                  alt={genre.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-12 w-12 text-neutral-600" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-lg truncate">{genre.name}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingGenre(genre.id);
                    setNewGenre(genre.name);
                    setDescription(genre.description || '');
                    setCoverPreview(genre.cover_url);
                  }}
                  className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteGenre(genre.id)}
                  className="p-1 text-error-400 hover:text-error-300 rounded-full hover:bg-error-900/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {genre.description && (
              <p className="text-sm text-neutral-400 line-clamp-2">
                {genre.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Genres;