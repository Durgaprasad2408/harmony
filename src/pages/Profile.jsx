import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Upload, Save, Mail, Lock, Settings, Edit3, Camera } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Profile = () => {
  const { user, profile, updateProfile, updatePassword, updateEmail, signOut } = useAuth();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Email change state
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="text-neutral-400">You need to be signed in to view your profile</p>
      </div>
    );
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Avatar size should be less than 2MB');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let avatarUrl = profile?.avatar_url;
      
      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}_avatar.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, avatarFile, { upsert: true });
        
        if (uploadError) {
          throw new Error('Error uploading avatar');
        }
        
        const { data } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        avatarUrl = data.publicUrl;
      }
      
      // Update profile
      const { error } = await updateProfile({
        display_name: displayName,
        avatar_url: avatarUrl,
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) throw error;
      
      setSuccess('Password updated successfully');
      setShowPasswordChange(false);
      setShowSettingsMenu(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      setError('Please enter a new email address');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await updateEmail(newEmail);
      
      if (error) throw error;
      
      setSuccess('Email update confirmation sent. Please check your email.');
      setShowEmailChange(false);
      setShowSettingsMenu(false);
      setNewEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDisplayName(profile?.display_name || '');
    setAvatarPreview(profile?.avatar_url || null);
    setAvatarFile(null);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <div className="relative">
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
            title="Settings"
          >
            <Settings size={24} />
          </button>

          {/* Settings Dropdown Menu */}
          {showSettingsMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-background-light border border-neutral-800 rounded-lg shadow-xl z-10">
              <div className="py-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowPasswordChange(true);
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3"
                >
                  <Lock size={16} />
                  Change Password
                </button>
                <button
                  onClick={() => {
                    setShowEmailChange(true);
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-neutral-800 flex items-center gap-3"
                >
                  <Mail size={16} />
                  Change Email
                </button>
                <div className="border-t border-neutral-800 my-2"></div>
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-left hover:bg-neutral-800 text-error-400 hover:text-error-300"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error-900/50 border border-error-800 text-error-200 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-success-900/50 border border-success-800 text-success-200 rounded-lg">
          {success}
        </div>
      )}
      
      {/* Profile Display/Edit */}
      <div className="bg-background-light rounded-xl p-6 md:p-8 mb-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="w-full md:w-auto flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-800">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={loading}
                  />
                  
                  <label
                    htmlFor="avatar"
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 cursor-pointer"
                  >
                    <Camera size={16} />
                  </label>
                </div>
                <p className="text-xs text-neutral-500 text-center">
                  Click the camera icon to upload a new avatar.
                  <br />
                  Maximum size 2MB.
                </p>
              </div>
              
              {/* Profile details */}
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-neutral-300 mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input w-full"
                    placeholder="Your display name"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    className="input w-full bg-neutral-800/50"
                    readOnly
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Account Type
                  </label>
                  <div className="px-4 py-2.5 rounded-lg bg-neutral-800/50 text-neutral-300">
                    {profile?.role === 'admin' ? 'Administrator' : 'User'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Save/Cancel buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
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
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Profile Display */
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Display */}
            <div className="w-full md:w-auto flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-800 mb-4">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
                    <User size={48} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Profile Info Display */}
            <div className="flex-1 space-y-6 w-full">
              <div>
                <h2 className="text-2xl font-bold mb-2">{profile?.display_name || 'No name set'}</h2>
                <p className="text-neutral-400">{user.email}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-300 mb-2">Account Type</h3>
                  <div className="px-4 py-2.5 rounded-lg bg-neutral-800/50 text-neutral-300">
                    {profile?.role === 'admin' ? 'Administrator' : 'User'}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-300 mb-2">Member Since</h3>
                  <div className="px-4 py-2.5 rounded-lg bg-neutral-800/50 text-neutral-300">
                    {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Edit3 size={18} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background-light border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input w-full"
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input w-full"
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="btn-ghost"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailChange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background-light border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Change Email</h3>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div>
                  <label htmlFor="currentEmail" className="block text-sm font-medium text-neutral-300 mb-2">
                    Current Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    className="input w-full bg-neutral-800/50"
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-neutral-300 mb-2">
                    New Email Address
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="input w-full"
                    placeholder="Enter new email address"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailChange(false);
                      setNewEmail('');
                    }}
                    className="btn-ghost"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;