import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { userService } from '../../services/userService';

// User Invitation Component
export const UserInvitationWidget = ({ companyId }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const roles = ['admin', 'director', 'head', 'manager', 'supervisor', 'staff'];

  useEffect(() => {
    loadInvitations();
  }, [companyId]);

  const loadInvitations = async () => {
    try {
      const { data, error } = await userService.getPendingInvitations(companyId);
      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const { data, error } = await userService.inviteUser(companyId, email, role);
      if (error) throw error;

      setMessage(`Invitation sent to ${email}`);
      setEmail('');
      setRole('staff');
      loadInvitations();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (invitationId) => {
    try {
      const { error } = await userService.resendInvitation(invitationId);
      if (error) throw error;

      setMessage('Invitation resent');
      loadInvitations();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleRevoke = async (invitationId) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      const { error } = await userService.revokeInvitation(invitationId);
      if (error) throw error;

      setMessage('Invitation revoked');
      loadInvitations();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Invite Team Members</h3>
        
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={roles.map(r => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: r }))}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-800' 
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Pending Invitations ({invitations.length})</h4>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{invitation.email}</p>
                  <p className="text-xs text-gray-500">
                    Role: {invitation.role} • Invited by {invitation.invited_by}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                  <button
                    onClick={() => handleResend(invitation.id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => handleRevoke(invitation.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Quick User List Component
export const QuickUserList = ({ companyId, limit = 5 }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [companyId]);

  const loadUsers = async () => {
    try {
      const { data, error } = await userService.getCompanyUsers(companyId);
      if (error) throw error;
      setUsers((data || []).slice(0, limit));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Team Members</h3>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div>
              <p className="font-semibold text-sm">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// User Role Distribution Component
export const UserRoleDistribution = ({ companyId }) => {
  const [distribution, setDistribution] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const roleColors = {
    admin: 'bg-red-500',
    director: 'bg-purple-500',
    head: 'bg-blue-500',
    manager: 'bg-cyan-500',
    supervisor: 'bg-emerald-500',
    staff: 'bg-gray-500'
  };

  useEffect(() => {
    loadDistribution();
  }, [companyId]);

  const loadDistribution = async () => {
    try {
      const { data, error } = await userService.getCompanyUsers(companyId);
      if (error) throw error;

      const dist = {};
      data?.forEach(user => {
        dist[user.role] = (dist[user.role] || 0) + 1;
      });

      setDistribution(dist);
    } catch (error) {
      console.error('Error loading distribution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading...</div>;

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Team by Role</h3>
      <div className="space-y-3">
        {Object.entries(distribution).map(([role, count]) => (
          <div key={role}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-semibold capitalize">{role}</span>
              <span className="text-sm text-gray-600">{count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${roleColors[role] || 'bg-gray-500'} h-2 rounded-full`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
