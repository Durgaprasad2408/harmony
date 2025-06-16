import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error updating user role:', error);
      } else {
        // Update local state
        setUsers(users.map(user => 
          user.user_id === userId ? { ...user, role: newRole } : user
        ));
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If no users from Supabase, show demo data
  const demoUsers = [
    {
      id: '1',
      user_id: '1',
      display_name: 'John Doe',
      avatar_url: null,
      role: 'admin',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      user_id: '2',
      display_name: 'Jane Smith',
      avatar_url: null,
      role: 'user',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      user_id: '3',
      display_name: 'Alex Johnson',
      avatar_url: null,
      role: 'user',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      user_id: '4',
      display_name: 'Samuel Wilson',
      avatar_url: null,
      role: 'user',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      user_id: '5',
      display_name: 'Emily Parker',
      avatar_url: null,
      role: 'user',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const usersToDisplay = filteredUsers.length > 0 ? filteredUsers : demoUsers;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button className="btn-primary">Add User</button>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
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
      </div>
      
      {/* Users table */}
      <div className="bg-background-light rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-neutral-800 animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 mr-3"></div>
                        <div className="w-32 h-4 bg-neutral-800 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-4 bg-neutral-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-4 bg-neutral-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="w-20 h-4 bg-neutral-800 rounded ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : (
                usersToDisplay.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-800 hover:bg-background-dark/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-neutral-700 mr-3 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.display_name} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs">{user.display_name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-medium">{user.display_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-primary-900/30 text-primary-400' 
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => toggleUserRole(user.user_id, user.role)}
                          className={`p-1.5 rounded-full ${
                            user.role === 'admin' 
                              ? 'text-primary-400 hover:bg-primary-900/20' 
                              : 'text-neutral-400 hover:bg-neutral-800'
                          }`}
                          title={`Toggle to ${user.role === 'admin' ? 'user' : 'admin'}`}
                        >
                          {user.role === 'admin' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        </button>
                        <button 
                          className="p-1.5 rounded-full text-neutral-400 hover:bg-neutral-800"
                          title="Edit user"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="p-1.5 rounded-full text-error-400 hover:bg-error-900/20"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;