import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  Share2, 
  Instagram, 
  Facebook, 
  Linkedin,
  Twitter,
  Plus,
  Settings,
  Eye,
  Heart,
  MessageCircle,
  Share,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Hash
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter';
  platform_display: string;
  account_name: string;
  status: 'active' | 'inactive' | 'error';
  auto_post: boolean;
  last_post: string | null;
}

interface SocialPost {
  id: string;
  platform: string;
  platform_display: string;
  account_name: string;
  post_type: string;
  content: string;
  hashtags: string[];
  images: string[];
  property_title?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at: string | null;
  published_at: string | null;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  external_url?: string;
}

interface SocialTemplate {
  id: string;
  name: string;
  template_type: string;
  content_template: string;
  hashtags: string[];
  platforms: string[];
}

const SocialMediaMarketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'posts' | 'templates'>('overview');
  
  // Mock data
  const [accounts] = useState<SocialAccount[]>([
    {
      id: '1',
      platform: 'instagram',
      platform_display: 'Instagram',
      account_name: '@immobilien_mueller',
      status: 'active',
      auto_post: true,
      last_post: '2024-01-15T08:30:00Z'
    },
    {
      id: '2',
      platform: 'facebook',
      platform_display: 'Facebook',
      account_name: 'Immobilien Müller',
      status: 'active',
      auto_post: false,
      last_post: '2024-01-14T15:45:00Z'
    }
  ]);

  const [posts] = useState<SocialPost[]>([
    {
      id: '1',
      platform: 'instagram',
      platform_display: 'Instagram',
      account_name: '@immobilien_mueller',
      post_type: 'property',
      content: '🏡 Traumhafte Villa mit Seeblick\n\n📍 München-Bogenhausen\n💰 2.500.000€\n📐 280m²\n🛏️ 6 Zimmer\n\nModerne Architektur trifft auf klassische Eleganz...\n\n#immobilien #münchen #villa #luxus #seeblick',
      hashtags: ['#immobilien', '#münchen', '#villa', '#luxus', '#seeblick'],
      images: ['/api/placeholder/800/600'],
      property_title: 'Villa mit Seeblick München',
      status: 'published',
      scheduled_at: null,
      published_at: '2024-01-15T08:30:00Z',
      views: 2847,
      likes: 89,
      shares: 12,
      comments: 15,
      clicks: 23,
      external_url: 'https://instagram.com/p/abc123'
    }
  ]);

  const [templates] = useState<SocialTemplate[]>([
    {
      id: '1',
      name: 'Villa Verkauf',
      template_type: 'property_sale',
      content_template: '🏡 {property_title}\n\n📍 {location}\n💰 {price}€\n📐 {living_area}m²\n🛏️ {rooms} Zimmer\n\n{description}\n\n#immobilien #verkauf #traumhaus #investment',
      hashtags: ['#immobilien', '#verkauf', '#traumhaus', '#investment'],
      platforms: ['instagram', 'facebook']
    }
  ]);

  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: Instagram,
      facebook: Facebook,
      linkedin: Linkedin,
      twitter: Twitter
    };
    return icons[platform as keyof typeof icons] || Share2;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'success' as const, label: 'Aktiv' },
      inactive: { variant: 'secondary' as const, label: 'Inaktiv' },
      error: { variant: 'danger' as const, label: 'Fehler' },
      published: { variant: 'success' as const, label: 'Veröffentlicht' },
      draft: { variant: 'secondary' as const, label: 'Entwurf' },
      scheduled: { variant: 'warning' as const, label: 'Geplant' },
      failed: { variant: 'danger' as const, label: 'Fehlgeschlagen' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleCreatePropertyPost = async () => {
    // TODO: Open property selection dialog
    console.log('Creating property post...');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Aktive Konten</span>
            </div>
            <div className="text-2xl font-bold">
              {accounts.filter(a => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-green-500" />
              <span className="font-medium">Gesamt-Aufrufe</span>
            </div>
            <div className="text-2xl font-bold">
              {posts.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-medium">Engagement</span>
            </div>
            <div className="text-2xl font-bold">
              {posts.reduce((sum, p) => sum + p.likes + p.shares + p.comments, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Klicks</span>
            </div>
            <div className="text-2xl font-bold">
              {posts.reduce((sum, p) => sum + p.clicks, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button onClick={handleCreatePropertyPost} className="h-auto p-4 text-left">
              <div className="flex items-start gap-3">
                <Plus className="w-5 h-5 mt-1" />
                <div>
                  <div className="font-medium">Immobilien-Post erstellen</div>
                  <div className="text-sm text-gray-600">
                    Erstelle automatisch einen Post für eine Immobilie
                  </div>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 text-left">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 mt-1" />
                <div>
                  <div className="font-medium">Konten verwalten</div>
                  <div className="text-sm text-gray-600">
                    Social Media Konten konfigurieren
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccounts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Social Media Konten</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Konto verbinden
        </Button>
      </div>

      <div className="grid gap-4">
        {accounts.map(account => {
          const PlatformIcon = getPlatformIcon(account.platform);
          
          return (
            <Card key={account.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <PlatformIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{account.account_name}</h4>
                      <p className="text-sm text-gray-600">{account.platform_display}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(account.status)}
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Auto-Post:</span>
                    <span className={`ml-1 ${account.auto_post ? 'text-green-600' : 'text-gray-600'}`}>
                      {account.auto_post ? 'Ein' : 'Aus'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Letzter Post:</span>
                    <span className="ml-1">
                      {account.last_post ? new Date(account.last_post).toLocaleDateString() : 'Nie'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderPosts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Social Media Posts</h3>
        <Button onClick={handleCreatePropertyPost}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Post
        </Button>
      </div>

      <div className="space-y-4">
        {posts.map(post => {
          const PlatformIcon = getPlatformIcon(post.platform);
          
          return (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">{post.property_title || 'Social Media Post'}</h4>
                      <p className="text-sm text-gray-600">
                        {post.platform_display} • {post.account_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(post.status)}
                    {post.external_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={post.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm whitespace-pre-line">{post.content}</p>
                  {post.images.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <ImageIcon className="w-4 h-4" />
                      {post.images.length} Bild{post.images.length !== 1 ? 'er' : ''}
                    </div>
                  )}
                </div>

                {post.status === 'published' && (
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span>{post.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share className="w-4 h-4 text-blue-400" />
                      <span>{post.shares}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-green-400" />
                      <span>{post.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                      <span>{post.clicks}</span>
                    </div>
                  </div>
                )}

                {post.scheduled_at && (
                  <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Geplant für: {new Date(post.scheduled_at).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Post-Vorlagen</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neue Vorlage
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {template.template_type.replace('_', ' ')}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              <div className="bg-gray-50 rounded p-3 mb-3">
                <p className="text-sm font-mono text-gray-700">
                  {template.content_template.substring(0, 150)}...
                </p>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {template.hashtags.map(hashtag => (
                  <Badge key={hashtag} variant="secondary" className="text-xs">
                    {hashtag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Plattformen:</span>
                {template.platforms.map(platform => {
                  const PlatformIcon = getPlatformIcon(platform);
                  return (
                    <PlatformIcon key={platform} className="w-4 h-4 text-gray-400" />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Social Media Marketing</h2>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Übersicht', icon: Eye },
            { id: 'accounts', label: 'Konten', icon: Settings },
            { id: 'posts', label: 'Posts', icon: Share2 },
            { id: 'templates', label: 'Vorlagen', icon: Hash }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'accounts' && renderAccounts()}
      {activeTab === 'posts' && renderPosts()}
      {activeTab === 'templates' && renderTemplates()}
    </div>
  );
};

export default SocialMediaMarketing;
