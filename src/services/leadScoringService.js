import { supabase } from "../lib/supabase";

// ========================================
// LEAD SCORING SERVICES
// ========================================

export const leadScoringService = {
  // Get top leads by score
  async getTopLeads(companyId, limit = 10) {
    try {
      const { data, error } = await supabase.rpc('get_top_leads', {
        p_company_id: companyId,
        p_limit: limit
      });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get leads by grade (A, B, C, D, F)
  async getLeadsByGrade(companyId, grade) {
    try {
      const { data, error } = await supabase.rpc('get_leads_by_grade', {
        p_company_id: companyId,
        p_grade: grade
      });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get detailed lead score information
  async getLeadScoreDetails(contactId) {
    try {
      const { data, error } = await supabase.rpc('get_lead_score_details', {
        p_contact_id: contactId
      });
      
      return { 
        data: data && data.length > 0 ? data[0] : null, 
        error 
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get stale leads (no activity for X days)
  async getStaleLead(companyId, daysSinceActivity = 30) {
    try {
      const { data, error } = await supabase.rpc('get_stale_leads', {
        p_company_id: companyId,
        p_days_since_activity: daysSinceActivity
      });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get high-value leads
  async getHighValueLeads(companyId) {
    try {
      const { data, error } = await supabase.rpc('get_high_value_leads', {
        p_company_id: companyId
      });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get recently improved leads
  async getImprovedLeads(companyId, days = 7) {
    try {
      const { data, error } = await supabase.rpc('get_improved_leads', {
        p_company_id: companyId,
        p_days: days
      });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get lead scoring summary/statistics
  async getLeadScoringsSummary(companyId) {
    try {
      const { data, error } = await supabase.rpc('get_lead_score_summary', {
        p_company_id: companyId
      });
      
      return { 
        data: data && data.length > 0 ? data[0] : null, 
        error 
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Manually adjust lead score
  async adjustLeadScore(contactId, adjustment, reason) {
    try {
      const { error } = await supabase
        .from('lead_scores')
        .update({
          manual_adjustment: adjustment
        })
        .eq('contact_id', contactId);

      if (error) throw error;

      // Add history record
      await supabase
        .from('lead_score_history')
        .insert({
          contact_id: contactId,
          score_change: adjustment,
          change_reason: reason,
          changed_by: (await supabase.auth.getUser()).data.user?.id
        });

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get lead score history
  async getLeadScoreHistory(contactId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('lead_score_history')
        .select(`
          id,
          previous_score,
          new_score,
          score_change,
          change_reason,
          created_at,
          changed_by:users(first_name, last_name)
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get scoring rules for company
  async getScoringRules(companyId) {
    try {
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('rule_type');

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Create/update scoring rule
  async upsertScoringRule(rule) {
    try {
      if (rule.id) {
        // Update existing
        const { error } = await supabase
          .from('lead_scoring_rules')
          .update(rule)
          .eq('id', rule.id);
        
        return { error };
      } else {
        // Create new
        const { data, error } = await supabase
          .from('lead_scoring_rules')
          .insert([rule])
          .select();

        return { data: data ? data[0] : null, error };
      }
    } catch (error) {
      return { data: null, error };
    }
  },

  // Bulk recalculate scores for all leads
  async bulkRecalculateScores(companyId) {
    try {
      // Get all active contacts
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (contactError) throw contactError;

      // Recalculate each (this will trigger via activities/deals if they exist)
      for (const contact of contacts) {
        await supabase.rpc('recalculate_lead_score', {
          p_contact_id: contact.id
        });
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }
};
