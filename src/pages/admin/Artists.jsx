import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Music, Plus, Edit2, Trash2, Image, X, Save, Search, ArrowLeft } from 'lucide-react';

const Artists = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArtist, setEditingArtist] = useState(null);
  const [newArtist, setNewArtist] = useState('');
  const [bio, setBio] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
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

  const handleImageChange = (e) => {
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

  const handleSaveArtist = async () => {
    if (!newArtist.trim()) {
      setError('Please enter an artist name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let coverUrl = null;

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `artists/${newArtist.toLowerCase().replace(/\s+/g, '-')}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('media')
          .upload(fileName, coverFile, {
            upsert: true,
            cacheControl: '3600'
          });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload image');
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrl;
      }

      if (editingArtist) {
        // Update existing artist
        const { error: updateError } = await supabase
          .from('artists')
          .update({
            name: newArtist,
            bio: bio.trim() || null,
            image_url: coverUrl || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingArtist);

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error('Failed to update artist');
        }
      } else {
        // Create new artist
        const { error: insertError } = await supabase
          .from('artists')
          .insert({
            name: newArtist,
            bio: bio.trim() || null,
            image_url: coverUrl
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error('Failed to create artist');
        }
      }

      // Refresh artists list
      await fetchArtists();
      
      // Reset form
      setNewArtist('');
      setBio('');
      setCoverFile(null);
      setCoverPreview(null);
      setEditingArtist(null);
    } catch (err) {
      console.error('Error saving artist:', err);
      setError(err.message || 'Failed to save artist');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArtist = async (id) => {
    if (!confirm('Are you sure you want to delete this artist?')) return;

    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchArtists();
    } catch (err) {
      console.error('Error deleting artist:', err);
      setError('Failed to delete artist');
    }
  };

  const handleArtistClick = (artist) => {
    navigate(`/admin/artists/${artist.id}`);
  };

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (artist.bio?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 rounded-full hover:bg-neutral-800"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Manage Artists</h1>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl mb-8">
        <input
          type="text"
          placeholder="Search artists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full pl-12"
        />
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400"
          size={20}
        />
      </div>

      {/* Add/Edit Artist Form */}
      <div className="bg-background-light rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cover image upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Artist Cover
            </label>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center">
              {coverPreview ? (
                <>
                  <img 
                    src={coverPreview} 
                    alt="Artist cover preview" 
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
                onChange={handleImageChange}
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

          {/* Artist details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Artist Name
              </label>
              <input
                type="text"
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                className="input w-full"
                placeholder="Enter artist name"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Biography
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input w-full min-h-[100px]"
                placeholder="Enter artist biography"
                disabled={saving}
              />
            </div>

            {error && (
              <div className="p-4 bg-error-900/50 border border-error-800 text-error-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {editingArtist && (
                <button
                  onClick={() => {
                    setEditingArtist(null);
                    setNewArtist('');
                    setBio('');
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
                onClick={handleSaveArtist}
                className="btn-primary flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{editingArtist ? 'Save Changes' : 'Add Artist'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredArtists.map((artist) => (
          <div
            key={artist.id}
            className="bg-background-light rounded-lg p-4 hover:bg-background-light/80 transition-colors"
          >
            <div 
              className="aspect-square rounded-lg overflow-hidden bg-neutral-800 mb-3 cursor-pointer"
              onClick={() => handleArtistClick(artist)}
            >
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
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-lg truncate">{artist.name}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingArtist(artist.id);
                    setNewArtist(artist.name);
                    setBio(artist.bio || '');
                    setCoverPreview(artist.image_url);
                  }}
                  className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteArtist(artist.id)}
                  className="p-1 text-error-400 hover:text-error-300 rounded-full hover:bg-error-900/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {artist.bio && (
              <p className="text-sm text-neutral-400 line-clamp-2">
                {artist.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Artists;