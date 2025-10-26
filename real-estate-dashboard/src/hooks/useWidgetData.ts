import { useState, useEffect } from 'react';

// Storage Usage Hook
export const useStorageUsage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usageResponse, billingResponse] = await Promise.all([
          fetch('/api/v1/storage/usage'),
          fetch('/api/v1/billing/usage/summary')
        ]);

        const usageData = await usageResponse.json();
        const billingData = await billingResponse.json();

        const totalBytes = usageData.total_bytes || 0;
        const totalGB = totalBytes / (1024 ** 3);
        const limitGB = billingData.storage_limit_gb || 100;
        const usagePercentage = limitGB > 0 ? (totalGB / limitGB) * 100 : 0;

        setData({
          totalBytes,
          totalGB,
          limitGB,
          usagePercentage,
          breakdown: {
            documents: usageData.documents_bytes || 0,
            propertyImages: usageData.property_images_bytes || 0,
            propertyDocuments: usageData.property_documents_bytes || 0,
            other: totalBytes - (usageData.documents_bytes || 0) - (usageData.property_images_bytes || 0) - (usageData.property_documents_bytes || 0)
          }
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// Subscription Limits Hook
export const useSubscriptionLimits = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/billing/usage/summary');
        const data = await response.json();

        const usagePercentages = {
          users: data.users.limit > 0 ? (data.users.used / data.users.limit) * 100 : 0,
          properties: data.properties.limit > 0 ? (data.properties.used / data.properties.limit) * 100 : 0,
          storage: data.storage.limit_gb > 0 ? (data.storage.used_gb / data.storage.limit_gb) * 100 : 0
        };

        setData({
          planName: data.plan_name || 'Starter',
          planKey: data.plan_key || 'starter',
          limits: {
            users: data.users.limit || 0,
            properties: data.properties.limit || 0,
            storageGB: data.storage.limit_gb || 0
          },
          usage: {
            users: data.users.used || 0,
            properties: data.properties.used || 0,
            storageGB: data.storage.used_gb || 0
          },
          usagePercentages
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// Document Analytics Hook
export const useDocumentAnalytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/documents/analytics');
        const data = await response.json();

        const typeColors = {
          'contract': '#3b82f6',
          'expose': '#10b981',
          'energy_certificate': '#f59e0b',
          'floor_plan': '#ef4444',
          'photo': '#8b5cf6',
          'video': '#06b6d4',
          'document': '#6b7280',
          'other': '#9ca3af'
        };

        const documentsByType = Object.entries(data.documents_by_type || {}).map(([type, count]) => ({
          type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count: count as number,
          color: typeColors[type as keyof typeof typeColors] || typeColors.other
        }));

        setData({
          totalDocuments: data.total_documents || 0,
          documentsByType,
          recentUploads: (data.recent_uploads || []).map((upload: any) => ({
            name: upload.name || 'Unbekannt',
            type: upload.type || 'document',
            size: upload.size ? `${(upload.size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
            uploadedAt: upload.created_at ? new Date(upload.created_at).toLocaleDateString('de-DE') : 'Unbekannt'
          }))
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// HR Stats Hook
export const useHRStats = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/hr/stats');
        const data = await response.json();

        setData({
          activeEmployees: data.active_employees || 0,
          pendingLeaveRequests: data.pending_leave_requests || 0,
          weeklyOvertime: data.weekly_overtime || 0,
          openExpenses: data.open_expenses || 0,
          recentActivities: (data.recent_activities || []).map((activity: any) => ({
            type: activity.type || 'unknown',
            description: activity.description || 'Unbekannte Aktivität',
            date: activity.date ? new Date(activity.date).toLocaleDateString('de-DE') : 'Unbekannt',
            status: activity.status || 'pending'
          }))
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// Payroll Runs Hook
export const usePayrollRuns = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/admin/payroll/runs?size=1');
        const data = await response.json();

        const runs = data.payroll_runs || [];
        const lastRun = runs[0] || null;

        setData({
          lastRun: lastRun ? {
            id: lastRun.id || '',
            status: lastRun.status || 'draft',
            period: lastRun.period || 'Unbekannt',
            totalAmount: lastRun.total_amount || 0,
            employeeCount: lastRun.employee_count || 0,
            createdAt: lastRun.created_at || new Date().toISOString()
          } : null,
          nextRun: '2024-02-01', // Mock data
          monthlyTotal: data.monthly_total || 0,
          pendingRuns: data.pending_runs || 0
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// Social Analytics Hook
export const useSocialAnalytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [accountsResponse, analyticsResponse] = await Promise.all([
          fetch('/api/v1/social/accounts'),
          fetch('/api/v1/social/analytics')
        ]);

        const accountsData = await accountsResponse.json();
        const analyticsData = await analyticsResponse.json();

        setData({
          connectedAccounts: (accountsData.accounts || []).map((account: any) => ({
            platform: account.platform || 'unknown',
            username: account.username || 'Unbekannt',
            followers: account.followers_count || 0,
            isActive: account.is_active || false
          })),
          recentPosts: (analyticsData.recent_posts || []).map((post: any) => ({
            id: post.id || '',
            platform: post.platform || 'unknown',
            content: post.content || 'Kein Inhalt',
            views: post.views || 0,
            likes: post.likes || 0,
            comments: post.comments || 0,
            createdAt: post.created_at || new Date().toISOString()
          })),
          totalEngagement: analyticsData.total_engagement || 0,
          totalReach: analyticsData.total_reach || 0
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// Notifications Hook
export const useNotifications = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/notifications?unread_only=true&size=10');
        const data = await response.json();

        setData({
          unreadCount: data.unread_count || 0,
          notifications: (data.notifications || []).map((notif: any) => ({
            id: notif.id || '',
            title: notif.title || 'Benachrichtigung',
            message: notif.message || 'Keine Nachricht',
            type: notif.type || 'info',
            createdAt: notif.created_at || new Date().toISOString(),
            isRead: notif.is_read || false
          }))
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// Appointments Hook
export const useAppointments = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/v1/appointments?start_date=${today}&size=10`);
        const data = await response.json();

        const appointments = data.appointments || [];
        const todayAppointments = appointments.filter((apt: any) => 
          apt.start_datetime && apt.start_datetime.startsWith(today)
        );
        const upcomingAppointments = appointments.filter((apt: any) => 
          apt.start_datetime && !apt.start_datetime.startsWith(today)
        );

        setData({
          todayAppointments: todayAppointments.map((apt: any) => ({
            id: apt.id || '',
            title: apt.title || 'Unbekannter Termin',
            time: apt.start_datetime ? new Date(apt.start_datetime).toLocaleTimeString('de-DE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : 'Unbekannt',
            type: apt.type || 'meeting',
            location: apt.location,
            attendees: apt.attendees?.length || 0
          })),
          upcomingAppointments: upcomingAppointments.slice(0, 5).map((apt: any) => ({
            id: apt.id || '',
            title: apt.title || 'Unbekannter Termin',
            date: apt.start_datetime ? new Date(apt.start_datetime).toLocaleDateString('de-DE') : 'Unbekannt',
            time: apt.start_datetime ? new Date(apt.start_datetime).toLocaleTimeString('de-DE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : 'Unbekannt',
            type: apt.type || 'meeting'
          })),
          totalToday: todayAppointments.length,
          totalUpcoming: upcomingAppointments.length
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// Property Inquiries Hook
export const usePropertyInquiries = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/analytics/properties');
        const data = await response.json();

        setData({
          weeklyInquiries: data.weekly_inquiries || 0,
          topProperties: (data.top_properties || []).map((property: any) => ({
            id: property.id || '',
            title: property.title || 'Unbekannte Immobilie',
            inquiries: property.inquiries || 0,
            views: property.views || 0,
            price: property.price || 0
          })),
          responseRate: data.response_rate || 0,
          avgResponseTime: data.avg_response_time || 0,
          recentInquiries: (data.recent_inquiries || []).map((inquiry: any) => ({
            id: inquiry.id || '',
            propertyTitle: inquiry.property_title || 'Unbekannte Immobilie',
            customerName: inquiry.customer_name || 'Unbekannter Kunde',
            createdAt: inquiry.created_at || new Date().toISOString(),
            status: inquiry.status || 'new'
          }))
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};

// Team Communications Hook
export const useTeamCommunications = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [conversationsResponse, membersResponse] = await Promise.all([
          fetch('/api/v1/communications/conversations'),
          fetch('/api/v1/users')
        ]);

        const conversationsData = await conversationsResponse.json();
        const membersData = await membersResponse.json();

        const totalUnread = conversationsData.conversations?.reduce((sum: number, conv: any) => 
          sum + (conv.unread_count || 0), 0) || 0;

        setData({
          unreadMessages: totalUnread,
          activeConversations: (conversationsData.conversations || []).map((conv: any) => ({
            id: conv.id || '',
            title: conv.title || 'Unbekannte Konversation',
            lastMessage: conv.last_message || 'Keine Nachrichten',
            unreadCount: conv.unread_count || 0,
            participants: (conv.participants || []).map((p: any) => ({
              name: p.name || 'Unbekannt',
              isOnline: p.is_online || false
            })),
            lastActivity: conv.last_activity || new Date().toISOString()
          })),
          onlineMembers: (membersData.users || []).filter((user: any) => user.is_online).map((user: any) => ({
            id: user.id || '',
            name: user.name || 'Unbekannt',
            status: user.status || 'online'
          })),
          totalMembers: membersData.users?.length || 0
        });
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
};
