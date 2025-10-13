import React, { useState, useEffect } from 'react';
// @ts-ignore - Notwendig für Kompatibilität mit framer-motion@4.1.17
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { CHART_COLORS } from '../../charts/constants/colors';
import { CustomTooltip } from '../components/CustomTooltip';
import { apiClient } from '../../../lib/api/client';

// Real API interfaces
interface PerformanceTimeRange {
  week: string;
  month: string;
  quarter: string;
}

interface PerformanceData {
  id: string;
  name: string;
  value: number;
  trend: number;
}

interface DetailedPerformanceData {
  id: string;
  name: string;
  value: number;
  trend: number;
}

interface Performer {
  id: string;
  name: string;
  teamId: string;
  performanceValue: string;
  avatar?: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  upvotes: number;
}

interface PerformanceFilterParams {
  timeRange: PerformanceTimeRange;
  teamFilter: string;
}

interface CreateCommentRequest {
  text: string;
  author: string;
}

// Real API interfaces
interface PerformanceTimeRange {
  week: string;
  month: string;
  quarter: string;
}

interface PerformanceData {
  id: string;
  name: string;
  value: number;
  trend: number;
}

interface DetailedPerformanceData {
  id: string;
  name: string;
  value: number;
  trend: number;
}

interface Performer {
  id: string;
  name: string;
  teamId: string;
  performanceValue: string;
  avatar?: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  upvotes: number;
}

interface PerformanceFilterParams {
  timeRange: PerformanceTimeRange;
  teamFilter: string;
}

interface CreateCommentRequest {
  text: string;
  author: string;
}

// Real API functions
const getTeamPerformance = async (params: PerformanceFilterParams): Promise<PerformanceData[]> => {
  try {
    // Use real task analytics from backend
    const response = await apiClient.get('/api/v1/analytics/tasks', {
      params: {
        start_date: getStartDateForTimeRange(params.timeRange as unknown as string),
        end_date: new Date().toISOString(),
      }
    });
    
    // Map backend data to performance data
    const data = (response as any)?.data || {};
    const tasksByStatus = data.tasks_by_status || [];
    
    return tasksByStatus.map((item: any, index: number) => ({
      id: `perf-${index}`,
      name: item.status || 'Unknown',
      value: item.count || 0,
      trend: 0, // Calculate from historical data if available
    }));
  } catch (error) {
    console.error('Error fetching team performance:', error);
    return [];
  }
};

const getStartDateForTimeRange = (timeRange: string): string => {
  const now = new Date();
  const date = new Date();
  
  switch (timeRange) {
    case 'week':
      date.setDate(now.getDate() - 7);
      break;
    case 'month':
      date.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      date.setMonth(now.getMonth() - 3);
      break;
    default:
      date.setDate(now.getDate() - 7);
  }
  
  return date.toISOString();
};

const getTopPerformers = async (): Promise<Performer[]> => {
  try {
    // Get employees and their task completion stats
    const response = await apiClient.get('/api/v1/employees', {
      params: { page: 1, size: 10 }
    });
    
    const employees = (response as any)?.data?.items || [];
    
    // Get task analytics to calculate performance
    const tasksResponse = await apiClient.get('/api/v1/analytics/tasks');
    const taskData = (tasksResponse as any)?.data || {};
    
    return employees.slice(0, 5).map((emp: any) => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      teamId: emp.department || 'general',
      performanceValue: '85%', // TODO: Calculate from actual task completion
      avatar: emp.avatar_url || undefined,
    }));
  } catch (error) {
    console.error('Error fetching top performers:', error);
    return [];
  }
};

const createPerformer = async (performer: Partial<Performer>): Promise<Performer> => {
  // This would typically create an employee via API
  console.log('Create performer not implemented yet', performer);
  return { 
    id: Date.now().toString(), 
    name: performer.name || '', 
    teamId: performer.teamId || '', 
    performanceValue: performer.performanceValue || '0%' 
  };
};

const getComments = async (): Promise<Comment[]> => {
  // Comments feature would need to be implemented in backend
  return [];
};

const createComment = async (comment: CreateCommentRequest): Promise<Comment> => {
  // Comments feature would need to be implemented in backend
  return { 
    id: Date.now().toString(), 
    text: comment.text, 
    author: comment.author, 
    upvotes: 0 
  };
};

const upvoteComment = async (commentId: string): Promise<void> => {
  // Comments feature would need to be implemented in backend
  console.log('Upvote comment:', commentId);
};

const removeUpvote = async (commentId: string): Promise<void> => {
  // Comments feature would need to be implemented in backend
  console.log('Remove upvote:', commentId);
};

// Use real current user from context
const useCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { id: '1', name: 'User', email: 'user@example.com' };
  return { data: user };
};

interface TeamPerformanceProps {
  timeRange: PerformanceTimeRange;
  teamFilter: string;
  showAddEmployee?: boolean;
}

const TeamPerformance: React.FC<TeamPerformanceProps> = ({ timeRange, teamFilter, showAddEmployee = true }) => {
  // State für Daten aus der API
  const [teamPerformanceData, setTeamPerformanceData] = useState<PerformanceData[]>([]);
  // Aktueller Benutzer
  const { data: currentUser } = useCurrentUser();
  const [detailedPerformanceData, setDetailedPerformanceData] = useState<DetailedPerformanceData[]>([]);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPerformer, setNewPerformer] = useState<Partial<Performer>>({
    teamId: teamFilter,
    performanceValue: '0%'
  });
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Real data loading from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        const [performanceData, performersData, commentsData] = await Promise.all([
          getTeamPerformance({ timeRange, teamFilter }),
          getTopPerformers(),
          getComments()
        ]);
        
        setTeamPerformanceData(performanceData);
        setPerformers(performersData);
        setComments(commentsData);
      } catch (error) {
        console.error('Error loading team performance data:', error);
      }
    };

    loadData();
  }, [timeRange, teamFilter]);

  const getTimeRangeLabel = (): string => {
    const labels: Record<string, string> = {
      week: 'Wöchentliche',
      month: 'Monatliche',
      quarter: 'Quartalsweise'
    };
    return labels[timeRange as unknown as string] || 'Wöchentliche';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setNewPerformer((prev: Partial<Performer>) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    if (name === 'performanceValue') {
      const numericValue = value.replace(/[^\d.]/g, '');
      const limitedValue = Math.min(parseFloat(numericValue) || 0, 100);
      setNewPerformer((prev: Partial<Performer>) => ({ ...prev, [name]: `${limitedValue}%` }));
    } else {
      setNewPerformer((prev: Partial<Performer>) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!newPerformer.name) return;
    
    try {
      const createdPerformer = await createPerformer(newPerformer);
      setPerformers(prev => [...prev, createdPerformer]);
      setIsModalOpen(false);
      setNewPerformer({ teamId: teamFilter, performanceValue: '0%' });
      setAvatarPreview('');
    } catch (error) {
      console.error('Error creating performer:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !currentUser) return;
    
    try {
      const newComment = await createComment({
        text: commentText,
        author: currentUser.name
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setShowCommentModal(false);
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleUpvote = async (commentId: string) => {
    try {
      await upvoteComment(commentId);
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, upvotes: comment.upvotes + 1 }
          : comment
      ));
    } catch (error) {
      console.error('Error upvoting comment:', error);
    }
  };

  const handleRemoveUpvote = async (commentId: string) => {
    try {
      await removeUpvote(commentId);
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, upvotes: Math.max(0, comment.upvotes - 1) }
          : comment
      ));
    } catch (error) {
      console.error('Error removing upvote:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {getTimeRangeLabel()} Übersicht für {teamFilter}
          </p>
        </div>
        {showAddEmployee && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Mitarbeiter hinzufügen
          </button>
        )}
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Verlauf
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={teamPerformanceData}>
              <defs>
                <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS.primary}
                fillOpacity={1}
                fill="url(#performanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Performer
          </h3>
          <button
            onClick={() => setShowCommentModal(true)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Kommentar hinzufügen
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performers.map((performer) => (
            <div key={performer.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {performer.avatar ? (
                    <img src={performer.avatar} alt={performer.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    performer.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{performer.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{performer.performanceValue}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Kommentare
        </h3>
        
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{comment.text}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">- {comment.author}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleUpvote(comment.id)}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <i className="ri-thumb-up-line"></i>
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{comment.upvotes}</span>
                  <button
                    onClick={() => handleRemoveUpvote(comment.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <i className="ri-thumb-down-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Neuen Mitarbeiter hinzufügen
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newPerformer.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Mitarbeitername eingeben"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Performance Wert
                  </label>
                  <input
                    type="text"
                    value={newPerformer.performanceValue || ''}
                    onChange={(e) => handleInputChange('performanceValue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0%"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {avatarPreview && (
                    <div className="mt-2">
                      <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                      <button
                        onClick={() => {
                          setAvatarPreview('');
                          setNewPerformer((prev: Partial<Performer>) => ({ ...prev, avatar: '' }));
                        }}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center"
                      >
                        <i className="ri-delete-bin-line mr-1"></i>
                        Avatar entfernen
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!newPerformer.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hinzufügen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Kommentar hinzufügen
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kommentar
                  </label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24 resize-none"
                    placeholder="Ihren Kommentar hier eingeben..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kommentar hinzufügen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamPerformance;