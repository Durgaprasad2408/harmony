import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Music, Plus, Edit2, Trash2, Image, X, Save } from 'lucide-react';

const Moods = () => {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMood, setEditingMood] = useState(null);
  const [newMood, setNewMood] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    try {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .order('name');

      if (error) throw error;
      setMoods(data || []);
    } catch (err) {
      console.error('Error fetching moods:', err);
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

  const handleSaveMood = async () => {
    if (!newMood.trim()) {
      setError('Please enter a mood name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let coverUrl = null;

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `moods/${newMood.toLowerCase().replace(/\s+/g, '-')}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, coverFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrl;
      }

      if (editingMood) {
        // Update existing mood
        const { error: updateError } = await supabase
          .from('moods')
          .update({
            name: newMood,
            description: description.trim() || null,
            cover_url: coverUrl || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMood);

        if (updateError) throw updateError;
      } else {
        // Create new mood
        const { error: insertError } = await supabase
          .from('moods')
          .insert({
            name: newMood,
            description: description.trim() || null,
            cover_url: coverUrl
          });

        if (insertError) throw insertError;
      }

      // Refresh moods list
      await fetchMoods();
      
      // Reset form
      setNewMood('');
      setDescription('');
      setCoverFile(null);
      setCoverPreview(null);
      setEditingMood(null);
    } catch (err) {
      console.error('Error saving mood:', err);
      setError('Failed to save mood');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMood = async (id) => {
    if (!confirm('Are you sure you want to delete this mood?')) return;

    try {
      const { error } = await supabase
        .from('moods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchMoods();
    } catch (err) {
      console.error('Error deleting mood:', err);
      setError('Failed to delete mood');
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
        <h1 className="text-3xl font-bold">Manage Moods</h1>
      </div>

      {/* Add/Edit Mood Form */}
      <div className="bg-background-light rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cover image upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Mood Cover
            </label>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center">
              {coverPreview ? (
                <>
                  <img 
                    src={coverPreview} 
                    alt="Mood cover preview" 
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

          {/* Mood details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Mood Name
              </label>
              <input
                type="text"
                value={newMood}
                onChange={(e) => setNewMood(e.target.value)}
                className="input w-full"
                placeholder="Enter mood name"
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
                placeholder="Enter mood description"
                disabled={saving}
              />
            </div>

            {error && (
              <div className="p-4 bg-error-900/50 border border-error-800 text-error-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {editingMood && (
                <button
                  onClick={() => {
                    setEditingMood(null);
                    setNewMood('');
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
                onClick={handleSaveMood}
                className="btn-primary flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{editingMood ? 'Save Changes' : 'Add Mood'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Moods Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {moods.map((mood) => (
          <div
            key={mood.id}
            className="bg-background-light rounded-lg p-4 hover:bg-background-light/80 transition-colors"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800 mb-3">
              {mood.cover_url ? (
                <img
                  src={mood.cover_url}
                  alt={mood.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-12 w-12 text-neutral-600" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-lg truncate">{mood.name}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingMood(mood.id);
                    setNewMood(mood.name);
                    setDescription(mood.description || '');
                    setCoverPreview(mood.cover_url);
                  }}
                  className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteMood(mood.id)}
                  className="p-1 text-error-400 hover:text-error-300 rounded-full hover:bg-error-900/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {mood.description && (
              <p className="text-sm text-neutral-400 line-clamp-2">
                {mood.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Moods;