import React, { useState, useEffect } from 'react';
import { leadScoringService } from '../../services/leadScoringService';
import { useAuth } from '../../contexts/AuthContext';

// Lead Score Badge Component
export const LeadScoreBadge = ({ score, grade, size = 'medium' }) => {
  const gradeColors = {
    'A': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'B': 'bg-blue-100 text-blue-800 border-blue-300',
    'C': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'D': 'bg-orange-100 text-orange-800 border-orange-300',
    'F': 'bg-red-100 text-red-800 border-red-300'
  };

  const sizes = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  return (
    <div className={`flex items-center gap-2 border rounded-lg ${gradeColors[grade]} ${sizes[size]}`}>
      <span className="font-bold">{grade}</span>
      <span className="text-xs opacity-75">{score}</span>
    </div>
  );
};

// Lead Score Detail Card
export const LeadScoreDetailCard = ({ contactId }) => {
  const [scoreDetails, setScoreDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { company } = useAuth();

  useEffect(() => {
    loadScoreDetails();
  }, [contactId]);

  const loadScoreDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await leadScoringService.getLeadScoreDetails(contactId);
      if (error) throw error;
      setScoreDetails(data);
    } catch (error) {
      console.error('Error loading score details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;
  if (!scoreDetails) return <div className="text-center text-gray-500">No score data available</div>;

  const scores = [
    { label: 'Activity', value: scoreDetails.activity_score, max: 30 },
    { label: 'Engagement', value: scoreDetails.engagement_score, max: 40 },
    { label: 'Deal Value', value: scoreDetails.deal_score, max: 50 },
    { label: 'Profile', value: scoreDetails.profile_score, max: 25 },
    { label: 'Recency', value: scoreDetails.recency_score, max: 20 }
  ];

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lead Score</h3>
        <LeadScoreBadge score={scoreDetails.total_score} grade={scoreDetails.grade} size="large" />
      </div>

      <div className="space-y-3">
        {scores.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-semibold">{item.value}/{item.max}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(item.value / item.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Activities (90d)</span>
          <span className="font-semibold">{scoreDetails.total_activities}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Active Deals</span>
          <span className="font-semibold">{scoreDetails.total_deals}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Deal Value</span>
          <span className="font-semibold">${scoreDetails.total_deal_value?.toLocaleString() || '0'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Last Activity</span>
          <span className="font-semibold">
            {scoreDetails.last_activity_at 
              ? new Date(scoreDetails.last_activity_at).toLocaleDateString()
              : 'No activity'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

// Top Leads Component
export const TopLeadsWidget = ({ limit = 5 }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { company } = useAuth();

  useEffect(() => {
    loadTopLeads();
  }, [company?.id]);

  const loadTopLeads = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const { data, error } = await leadScoringService.getTopLeads(company.id, limit);
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading top leads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-2">
    {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded" />)}
  </div>;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg mb-4">Top Leads</h3>
      {leads.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No leads available</p>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <div key={lead.contact_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <div className="flex-1">
                <p className="font-semibold text-sm">{lead.first_name} {lead.last_name}</p>
                <p className="text-xs text-gray-500">{lead.email}</p>
              </div>
              <LeadScoreBadge score={lead.total_score} grade={lead.grade} size="small" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Lead Score Summary Component
export const LeadScoreSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { company } = useAuth();

  useEffect(() => {
    loadSummary();
  }, [company?.id]);

  const loadSummary = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const { data, error } = await leadScoringService.getLeadScoringsSummary(company.id);
      if (error) throw error;
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />;
  if (!summary) return null;

  const gradeDistribution = [
    { grade: 'A', count: summary.grade_a_count, color: 'bg-emerald-500' },
    { grade: 'B', count: summary.grade_b_count, color: 'bg-blue-500' },
    { grade: 'C', count: summary.grade_c_count, color: 'bg-yellow-500' },
    { grade: 'D', count: summary.grade_d_count, color: 'bg-orange-500' },
    { grade: 'F', count: summary.grade_f_count, color: 'bg-red-500' }
  ];

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <h3 className="font-semibold text-lg">Lead Scoring Summary</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-gray-600 text-sm">Total Leads</p>
          <p className="text-2xl font-bold">{summary.total_leads}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Average Score</p>
          <p className="text-2xl font-bold">{summary.average_score}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Active (7 days)</p>
          <p className="text-2xl font-bold text-emerald-600">{summary.leads_with_activity_last_7_days}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Stale (30+ days)</p>
          <p className="text-2xl font-bold text-red-600">{summary.stale_leads_count}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Avg Deal Value</p>
          <p className="text-2xl font-bold">${(summary.avg_deal_value || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-3">Grade Distribution</p>
        <div className="flex gap-2 h-8">
          {gradeDistribution.map((item) => (
            <div
              key={item.grade}
              className={`flex-1 rounded-lg ${item.color} flex items-center justify-center relative group`}
              title={`${item.grade}: ${item.count} leads`}
            >
              <span className="text-white text-xs font-bold">{item.grade}</span>
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {item.count} leads
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
