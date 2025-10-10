import { useState, useEffect, useCallback, useMemo } from 'react';

// Types for better TypeScript support
interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  assignee: { id: string; name: string };
  labels: { id: string; name: string }[];
  complexity: 'low' | 'medium' | 'high';
  impactScore: number;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
}

interface Column {
  id: string;
  title: string;
  limit?: number;
}

interface TeamMember {
  id: string;
  name: string;
  skills?: string[];
}

interface Filters {
  search: string;
  priority: string[];
  assignee: string[];
  labels: string[];
  dateRange: any;
  complexity: string[];
  status: string[];
  impactScore: [number, number];
  estimatedHours: [number, number];
}

// Custom Hook für WIP Limit Checking
export const useWIPLimitChecking = (columns: Column[], tasks: Task[]) => {
  const [wipViolations, setWipViolations] = useState<Record<string, boolean>>({});
  const [wipWarnings, setWipWarnings] = useState<Record<string, boolean>>({});

  const checkWIPLimits = useCallback(() => {
    const violations: Record<string, boolean> = {};
    const warnings: Record<string, boolean> = {};

    columns.forEach(column => {
      const columnTasks = tasks.filter(task => task.status === column.id);
      const taskCount = columnTasks.length;
      
      if (column.limit) {
        violations[column.id] = taskCount > column.limit;
        warnings[column.id] = taskCount >= Math.ceil(column.limit * 0.8) && taskCount <= column.limit;
      }
    });

    setWipViolations(violations);
    setWipWarnings(warnings);
  }, [columns, tasks]);

  useEffect(() => {
    checkWIPLimits();
  }, [checkWIPLimits]);

  const getWIPStatus = useCallback((columnId: string) => {
    if (wipViolations[columnId]) return 'violation';
    if (wipWarnings[columnId]) return 'warning';
    return 'normal';
  }, [wipViolations, wipWarnings]);

  const canMoveTask = useCallback((taskId: string, fromColumnId: string, toColumnId: string) => {
    const targetColumn = columns.find(col => col.id === toColumnId);
    if (!targetColumn?.limit) return true;

    const currentTasksInTarget = tasks.filter(task => 
      task.status === toColumnId && task.id !== taskId
    ).length;

    return currentTasksInTarget < targetColumn.limit;
  }, [columns, tasks]);

  return {
    wipViolations,
    wipWarnings,
    getWIPStatus,
    canMoveTask,
    checkWIPLimits
  };
};

// Custom Hook für Keyboard Shortcuts
export const useKeyboardShortcuts = (handlers: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey, shiftKey, altKey } = event;
      const modifier = metaKey || ctrlKey;
      
      if (modifier && !shiftKey && !altKey) {
        switch (key) {
          case 'k':
            event.preventDefault();
            handlers.openCommandPalette?.();
            break;
          case 'n':
            event.preventDefault();
            handlers.createTask?.();
            break;
          case 'f':
            event.preventDefault();
            handlers.focusMode?.();
            break;
          case '/':
            event.preventDefault();
            handlers.search?.();
            break;
          case 'Enter':
            event.preventDefault();
            handlers.quickAdd?.();
            break;
        }
      }
      
      if (key === 'Escape') {
        handlers.escape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};

// Custom Hook für Real-time Collaboration
export const useRealtimeCollaboration = (boardId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; user: string }>>({});
  const [liveChanges, setLiveChanges] = useState<any[]>([]);

  useEffect(() => {
    const simulateRealtimeData = () => {
      const users = ['Anna Schmidt', 'Michael Wagner', 'Sarah Weber'];
      setOnlineUsers(users.slice(0, Math.floor(Math.random() * 3) + 1));
      
      if (Math.random() > 0.7) {
        setCursors(prev => ({
          ...prev,
          [`user-${Math.random()}`]: {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            user: users[Math.floor(Math.random() * users.length)]
          }
        }));
      }
    };

    const interval = setInterval(simulateRealtimeData, 5000);
    return () => clearInterval(interval);
  }, [boardId]);

  const broadcastCursor = useCallback((x: number, y: number) => {
    console.log('Broadcasting cursor position:', { x, y });
  }, []);

  const broadcastChange = useCallback((change: any) => {
    setLiveChanges(prev => [...prev.slice(-9), change]);
  }, []);

  return {
    onlineUsers,
    cursors,
    liveChanges,
    broadcastCursor,
    broadcastChange
  };
};

// Custom Hook für Advanced Filtering
export const useAdvancedFiltering = (tasks: Task[]) => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    priority: [],
    assignee: [],
    labels: [],
    dateRange: null,
    complexity: [],
    status: [],
    impactScore: [1, 10],
    estimatedHours: [0, 40]
  });

  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.assignee.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.priority.length > 0) {
      result = result.filter(task => filters.priority.includes(task.priority));
    }

    if (filters.assignee.length > 0) {
      result = result.filter(task => filters.assignee.includes(task.assignee.id));
    }

    if (filters.labels.length > 0) {
      result = result.filter(task => 
        task.labels.some(label => filters.labels.includes(label.id))
      );
    }

    if (filters.complexity.length > 0) {
      result = result.filter(task => filters.complexity.includes(task.complexity));
    }

    if (filters.status.length > 0) {
      result = result.filter(task => filters.status.includes(task.status));
    }

    result = result.filter(task => 
      task.impactScore >= filters.impactScore[0] && 
      task.impactScore <= filters.impactScore[1]
    );

    result = result.filter(task => 
      task.estimatedHours >= filters.estimatedHours[0] && 
      task.estimatedHours <= filters.estimatedHours[1]
    );

    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Task];
      let bValue: any = b[sortBy as keyof Task];

      if (sortBy === 'dueDate') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [tasks, filters, sortBy, sortOrder]);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      priority: [],
      assignee: [],
      labels: [],
      dateRange: null,
      complexity: [],
      status: [],
      impactScore: [1, 10],
      estimatedHours: [0, 40]
    });
  }, []);

  return {
    filteredTasks,
    filters,
    sortBy,
    sortOrder,
    updateFilter,
    setSortBy,
    setSortOrder,
    clearFilters
  };
};

// Custom Hook für Team Insights
export const useTeamInsights = (tasks: Task[], teamMembers: TeamMember[]) => {
  const [insights, setInsights] = useState({
    productivityMetrics: {},
    teamBalance: {},
    velocityTrends: {},
    blockageAnalysis: {},
    collaborationScore: 0
  });

  const calculateInsights = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Helper functions
    const complexityPoints: Record<string, number> = { low: 1, medium: 3, high: 5 };
    
    const calculateAverageTaskTime = (tasks: Task[]) => {
      if (tasks.length === 0) return 0;
      const totalTime = tasks.reduce((sum, task) => {
        if (task.completedAt && task.createdAt) {
          return sum + (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime());
        }
        return sum;
      }, 0);
      return totalTime / tasks.length / (1000 * 60 * 60 * 24);
    };

    const calculateWorkloadScore = (tasks: Task[]) => {
      const activeTasks = tasks.filter(task => ['in-progress', 'review'].includes(task.status));
      const totalComplexity = activeTasks.reduce((sum, task) => {
        return sum + (complexityPoints[task.complexity] || 1);
      }, 0);
      return Math.min(totalComplexity * 10, 100);
    };

    const calculateWeeklyVelocity = (tasks: Task[]) => {
      const completedThisWeek = tasks.filter(task => 
        task.status === 'completed' && 
        task.completedAt && 
        new Date(task.completedAt) >= weekAgo
      );
      
      return {
        tasksCompleted: completedThisWeek.length,
        storyPoints: completedThisWeek.reduce((sum, task) => {
          return sum + (complexityPoints[task.complexity] || 1);
        }, 0)
      };
    };

    // Productivity metrics per team member
    const productivityMetrics = teamMembers.reduce((acc: any, member) => {
      const memberTasks = tasks.filter(task => task.assignee.id === member.id);
      const completedTasks = memberTasks.filter(task => task.status === 'completed');
      const completedThisWeek = completedTasks.filter(task => 
        task.completedAt && new Date(task.completedAt) >= weekAgo
      );

      acc[member.id] = {
        totalTasks: memberTasks.length,
        completedTasks: completedTasks.length,
        completedThisWeek: completedThisWeek.length,
        completionRate: memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0,
        averageTaskTime: calculateAverageTaskTime(completedTasks),
        workloadScore: calculateWorkloadScore(memberTasks)
      };
      return acc;
    }, {});

    // Team balance analysis
    const teamBalance = {
      workloadDistribution: calculateWorkloadDistribution(),
      skillsetCoverage: calculateSkillsetCoverage(),
      bottleneckRisk: identifyBottleneckRisks()
    };

    // Velocity trends
    const velocityTrends = {
      weeklyVelocity: calculateWeeklyVelocity(tasks),
      burndownRate: calculateBurndownRate(),
      scopeCreep: detectScopeCreep()
    };

    // Blockage analysis
    const blockageAnalysis = {
      blockedTasks: tasks.filter(task => task.status === 'blocked').length,
      averageBlockageTime: calculateAverageBlockageTime(),
      commonBlockageReasons: identifyCommonBlockageReasons()
    };

    // Collaboration score
    const collaborationScore = calculateCollaborationScore();

    function calculateWorkloadDistribution() {
      const distribution = teamMembers.map(member => {
        const memberTasks = tasks.filter(task => task.assignee.id === member.id && task.status !== 'completed');
        return {
          memberId: member.id,
          taskCount: memberTasks.length,
          complexity: memberTasks.reduce((sum, task) => {
            return sum + (complexityPoints[task.complexity] || 1);
          }, 0)
        };
      });

      const avgComplexity = distribution.reduce((sum, d) => sum + d.complexity, 0) / distribution.length;
      const balanceScore = distribution.length > 0 ? 
        100 - (Math.max(...distribution.map(d => Math.abs(d.complexity - avgComplexity))) / avgComplexity * 100) : 100;
      
      return { distribution, balanceScore: Math.max(balanceScore, 0) };
    }

    function calculateSkillsetCoverage() {
      const requiredSkills = Array.from(new Set(tasks.flatMap(task => task.labels?.map(l => l.name) || [])));
      const memberSkills = teamMembers.flatMap(member => member.skills || []);
      const coverage = requiredSkills.length > 0 ?
        (memberSkills.filter(skill => requiredSkills.includes(skill)).length / requiredSkills.length) * 100 : 100;
      return Math.min(coverage, 100);
    }

    function identifyBottleneckRisks() {
      return teamMembers.map(member => {
        const memberTasks = tasks.filter(task => task.assignee.id === member.id && task.status !== 'completed');
        const highPriorityTasks = memberTasks.filter(task => task.priority === 'high');
        
        return {
          memberId: member.id,
          risk: memberTasks.length > 5 ? 'high' : memberTasks.length > 3 ? 'medium' : 'low',
          taskCount: memberTasks.length,
          criticalTasks: highPriorityTasks.length
        };
      }).filter(risk => risk.risk !== 'low');
    }

    function calculateBurndownRate() {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const remainingTasks = totalTasks - completedTasks;
      
      const weeklyVelocity = calculateWeeklyVelocity(tasks);
      const weeksToComplete = weeklyVelocity.tasksCompleted > 0 ? remainingTasks / weeklyVelocity.tasksCompleted : 0;
      
      return {
        completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        estimatedWeeksRemaining: Math.ceil(weeksToComplete),
        onTrack: weeksToComplete <= 4
      };
    }

    function detectScopeCreep() {
      const newTasksThisMonth = tasks.filter(task => 
        new Date(task.createdAt) >= monthAgo
      );
      
      const originalTasks = tasks.filter(task => 
        new Date(task.createdAt) < monthAgo
      );
      
      const scopeCreepPercentage = originalTasks.length > 0 ? 
        (newTasksThisMonth.length / originalTasks.length) * 100 : 0;
      
      return {
        newTasks: newTasksThisMonth.length,
        scopeCreepPercentage,
        riskLevel: scopeCreepPercentage > 25 ? 'high' : scopeCreepPercentage > 10 ? 'medium' : 'low'
      };
    }

    function calculateAverageBlockageTime() {
      const blockedTasks = tasks.filter(task => task.status === 'blocked');
      if (blockedTasks.length === 0) return 0;
      
      const totalBlockageTime = blockedTasks.reduce((sum, task) => {
        const daysSinceUpdate = (Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        return sum + daysSinceUpdate;
      }, 0);
      
      return totalBlockageTime / blockedTasks.length;
    }

    function identifyCommonBlockageReasons() {
      const blockedTasks = tasks.filter(task => task.status === 'blocked');
      
      const reasons = blockedTasks.map(task => {
        if (task.labels.some(label => label.name.includes('approval'))) return 'Waiting for approval';
        if (task.labels.some(label => label.name.includes('external'))) return 'External dependency';
        if (task.complexity === 'high') return 'Technical complexity';
        return 'Resource unavailable';
      });
      
      const reasonCounts = reasons.reduce((acc: Record<string, number>, reason) => {
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(reasonCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([reason, count]) => ({ reason, count }));
    }

    function calculateCollaborationScore() {
      const tasksByMember = teamMembers.reduce((acc: Record<string, Task[]>, member) => {
        acc[member.id] = tasks.filter(task => task.assignee.id === member.id);
        return acc;
      }, {});
      
      const taskCounts = Object.values(tasksByMember).map(tasks => tasks.length);
      if (taskCounts.length === 0) return 0;
      
      const avgTasks = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length;
      const variance = taskCounts.reduce((sum, count) => sum + Math.pow(count - avgTasks, 2), 0) / taskCounts.length;
      const balanceScore = avgTasks > 0 ? Math.max(0, 100 - (variance / avgTasks) * 50) : 0;
      
      const collaborativeTasks = tasks.filter(task => task.labels.length > 2);
      const collaborationRatio = tasks.length > 0 ? collaborativeTasks.length / tasks.length : 0;
      
      return Math.round((balanceScore * 0.6) + (collaborationRatio * 100 * 0.4));
    }

    setInsights({
      productivityMetrics,
      teamBalance,
      velocityTrends,
      blockageAnalysis,
      collaborationScore
    });
  }, [tasks, teamMembers]);

  useEffect(() => {
    calculateInsights();
  }, [calculateInsights]);

  return insights;
};

// Custom Hook für Focus Timer
export const useFocusTimer = () => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(25 * 60);
  const [sessions, setSessions] = useState(0);
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime(time => {
          if (time === 0) {
            setIsActive(false);
            setSessions(prev => prev + 1);
            
            if (mode === 'work') {
              if ((sessions + 1) % 4 === 0) {
                setMode('longBreak');
                setTime(15 * 60);
              } else {
                setMode('break');
                setTime(5 * 60);
              }
            } else {
              setMode('work');
              setTime(25 * 60);
            }
            
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (!isActive) {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, mode, sessions]);

  const startTimer = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setTime(25 * 60);
    setMode('work');
  }, []);

  const skipSession = useCallback(() => {
    setIsActive(false);
    setSessions(prev => prev + 1);
    
    if (mode === 'work') {
      setMode('break');
      setTime(5 * 60);
    } else {
      setMode('work');
      setTime(25 * 60);
    }
  }, [mode]);

  return {
    time,
    isActive,
    isPaused,
    mode,
    sessions,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession
  };
};

// Custom Hook für Auto-save
export const useAutoSave = (data: any, saveFunction: (data: any) => void, delay: number = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!data) return;

    setIsSaving(true);
    const timeoutId = setTimeout(async () => {
      try {
        await saveFunction(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [data, saveFunction, delay]);

  return { isSaving, lastSaved };
};
