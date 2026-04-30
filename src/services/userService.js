import { supabase } from "../lib/supabase";

// ========================================
// USER MANAGEMENT SERVICES
// ========================================

export const userService = {
  // Get current user profile
  async getCurrentUserProfile() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return { data: null, error: authError };

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all company users
  async getCompanyUsers(companyId) {
    try {
      const { data, error } = await supabase.rpc('get_company_users', {
        p_company_id: companyId
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get users by role
  async getUsersByRole(companyId, role) {
    try {
      const { data, error } = await supabase.rpc('get_users_by_role', {
        p_company_id: companyId,
        p_role: role
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const { data, error } = await supabase.rpc('create_user', {
        p_email: userData.email,
        p_first_name: userData.first_name,
        p_last_name: userData.last_name,
        p_company_id: userData.company_id,
        p_role: userData.role,
        p_department: userData.department || null,
        p_job_title: userData.job_title || null,
        p_phone: userData.phone || null
      });

      return { data: data ? data[0] : null, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update user
  async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase.rpc('update_user', {
        p_user_id: userId,
        p_first_name: updates.first_name || null,
        p_last_name: updates.last_name || null,
        p_role: updates.role || null,
        p_department: updates.department || null,
        p_job_title: updates.job_title || null,
        p_phone: updates.phone || null,
        p_is_active: updates.is_active !== undefined ? updates.is_active : null
      });

      return { data: data ? data[0] : null, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Deactivate user
  async deactivateUser(userId) {
    try {
      const { data, error } = await supabase.rpc('deactivate_user', {
        p_user_id: userId
      });

      return { data: data ? data[0] : null, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get team members for assignment
  async getTeamMembers(companyId) {
    try {
      const { data, error } = await supabase.rpc('get_team_members', {
        p_company_id: companyId
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get user hierarchy
  async getUserHierarchy(companyId, userId) {
    try {
      const { data, error } = await supabase.rpc('get_user_hierarchy', {
        p_company_id: companyId,
        p_user_id: userId
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get single user
  async getUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update user role
  async updateUserRole(userId, role) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date() })
        .eq('id', userId)
        .select();

      return { data: data ? data[0] : null, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Bulk deactivate users
  async bulkDeactivateUsers(userIds) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .in('id', userIds);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  // ========================================
  // USER INVITATIONS
  // ========================================

  // Invite user to company
  async inviteUser(companyId, email, role) {
    try {
      const { data, error } = await supabase.rpc('invite_user', {
        p_company_id: companyId,
        p_email: email,
        p_role: role
      });

      return { data: data ? data[0] : null, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get pending invitations
  async getPendingInvitations(companyId) {
    try {
      const { data, error } = await supabase.rpc('get_pending_invitations', {
        p_company_id: companyId
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all invitations
  async getInvitations(companyId) {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Resend invitation
  async resendInvitation(invitationId) {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .select();

      return { data: data ? data[0] : null, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Revoke invitation
  async revokeInvitation(invitationId) {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      return { error };
    } catch (error) {
      return { error };
    }
  }
};
