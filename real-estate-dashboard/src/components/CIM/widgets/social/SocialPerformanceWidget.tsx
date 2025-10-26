import React, { useState, useEffect } from 'react';
import { Share2, Instagram, Facebook, Linkedin, Plus, Eye, Heart, MessageCircle } from 'lucide-react';

interface SocialData {
  connectedAccounts: Array<{
    platform: string;
    username: string;
    followers: number;
    isActive: boolean;
  }>;
  recentPosts: Array<{
    id: string;
    platform: string;
    content: string;
    views: number;
    likes: number;
    comments: number;
    createdAt: string;
  }>;
  totalEngagement: number;
  totalReach: number;
}

const SocialPerformanceWidget: React.FC = () => {
  const [socialData, setSocialData] = useState<SocialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch social analytics
        const [accountsResponse, analyticsResponse] = await Promise.all([
          fetch('/api/v1/social/accounts'),
          fetch('/api/v1/social/analytics')
        ]);

        const accountsData = await accountsResponse.json();
        const analyticsData = await analyticsResponse.json();

        console.log('📊 Social Accounts Response:', accountsData);
        console.log('📊 Social Analytics Response:', analyticsData);

        setSocialData({
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

      } catch (error) {
        console.error('❌ Error fetching social data:', error);
        // Fallback data
        setSocialData({
          connectedAccounts: [],
          recentPosts: [],
          totalEngagement: 0,
          totalReach: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchSocialData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Social Media Daten...</p>
        </div>
      </div>
    );
  }

  if (!socialData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Share2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Keine Social Media Daten verfügbar</p>
        </div>
      </div>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-700" />;
      default:
        return <Share2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200';
      case 'facebook':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'linkedin':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <Share2 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Social Media
        </h3>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {socialData.totalReach.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Reichweite
          </div>
        </div>
      </div>

      {/* Verbundene Accounts */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Verbundene Accounts
          </h4>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Verwalten
          </button>
        </div>
        
        <div className="space-y-2">
          {socialData.connectedAccounts.length > 0 ? (
            socialData.connectedAccounts.map((account, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(account.platform)}`}>
                    {getPlatformIcon(account.platform)}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                      @{account.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {account.followers.toLocaleString()} Follower
                    </div>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
            ))
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <Share2 className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Keine Accounts verbunden</p>
            </div>
          )}
        </div>
      </div>

      {/* Neueste Posts */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Neueste Posts
          </h4>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-2">
          {socialData.recentPosts.length > 0 ? (
            socialData.recentPosts.slice(0, 3).map((post, index) => (
              <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(post.platform)}`}>
                      {getPlatformIcon(post.platform)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {post.content}
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{post.views}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Keine Posts vorhanden</p>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Engagement</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {socialData.totalEngagement.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Accounts</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {socialData.connectedAccounts.length}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Plus className="w-3 h-3" />
          <span>Neuer Post</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Share2 className="w-3 h-3" />
          <span>Verwalten</span>
        </button>
      </div>
    </div>
  );
};

export default SocialPerformanceWidget;
