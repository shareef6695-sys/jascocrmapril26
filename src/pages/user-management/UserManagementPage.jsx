import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

const UserManagement = () => {
  const { company, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: 'active'
  });

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'staff',
    department: '',
    job_title: '',
    phone: ''
  });

  const roles = ['admin', 'director', 'head', 'manager', 'supervisor', 'staff'];

  useEffect(() => {
    if (company?.id) {
      loadUsers();
    }
  }, [company?.id]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await userService.getCompanyUsers(company.id);
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await userService.createUser({
        ...formData,
        company_id: company.id
      });

      if (error) throw error;

      setUsers([data, ...users]);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'staff',
        department: '',
        job_title: '',
        phone: ''
      });
      setShowCreateModal(false);
      alert('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await userService.updateUser(selectedUser.id, formData);
      if (error) throw error;

      setUsers(users.map(u => u.id === selectedUser.id ? data : u));
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const { error } = await userService.deactivateUser(userId);
      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, is_active: false } : u));
      alert('User deactivated successfully');
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department: user.department || '',
      job_title: user.job_title || '',
      phone: user.phone || ''
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(u => {
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = 
      u.first_name.toLowerCase().includes(searchTerm) ||
      u.last_name.toLowerCase().includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm);
    
    const matchesRole = !filters.role || u.role === filters.role;
    const matchesStatus = filters.status === 'all' || (filters.status === 'active' ? u.is_active : !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage your team members and their access</p>
        </div>
        {(currentUser?.role === 'admin' || currentUser?.role === 'director') && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icon name="Plus" className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-600 text-sm">Active Users</p>
          <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.is_active).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-600 text-sm">Managers</p>
          <p className="text-2xl font-bold">{users.filter(u => u.role === 'manager').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-600 text-sm">Staff</p>
          <p className="text-2xl font-bold">{users.filter(u => u.role === 'staff').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <h3 className="font-semibold">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            options={[
              { label: 'All Roles', value: '' },
              ...roles.map(r => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: r }))
            ]}
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'All', value: 'all' }
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-500">{user.job_title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.department || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {(currentUser?.role === 'admin' || currentUser?.role === 'director') && (
                          <>
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            {user.is_active && (
                              <button
                                onClick={() => handleDeactivateUser(user.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Deactivate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="First Name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
              <Input
                label="Last Name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={roles.map(r => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: r }))}
              />
              <Input
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              <Input
                label="Job Title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create User
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <Input
                label="Email"
                disabled
                value={formData.email}
              />
              <Input
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
              <Input
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={roles.map(r => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: r }))}
              />
              <Input
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              <Input
                label="Job Title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
