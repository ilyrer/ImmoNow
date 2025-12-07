import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  Mail, 
  Send,
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  Plus,
  Play,
  Pause,
  Edit3,
  Copy,
  BarChart3,
  Calendar,
  Filter,
  Download,
  UserCheck,
  Clock,
  Target
} from 'lucide-react';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  campaign_type: 'newsletter' | 'property_alert' | 'follow_up' | 'event' | 'market_report';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

interface CampaignRecipient {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  clicks: number;
  opens: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  template_type: string;
  subject_template: string;
  html_template: string;
  variables: string[];
}

const EmailMarketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'templates' | 'analytics'>('overview');
  
  // Mock data
  const [campaigns] = useState<EmailCampaign[]>([
    {
      id: '1',
      name: 'Neue Luxus-Immobilien München',
      subject: '🏡 Exklusive Immobilien-Angebote in München',
      campaign_type: 'property_alert',
      status: 'sent',
      created_at: '2024-01-10T10:00:00Z',
      sent_at: '2024-01-15T09:00:00Z',
      total_recipients: 1250,
      delivered: 1230,
      opened: 487,
      clicked: 89,
      bounced: 20,
      unsubscribed: 3,
      open_rate: 39.6,
      click_rate: 7.2,
      conversion_rate: 2.1
    },
    {
      id: '2',
      name: 'Januar Newsletter 2024',
      subject: 'Immobilienmarkt Update - Januar 2024',
      campaign_type: 'newsletter',
      status: 'scheduled',
      created_at: '2024-01-12T14:30:00Z',
      scheduled_at: '2024-01-20T10:00:00Z',
      total_recipients: 2150,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      open_rate: 0,
      click_rate: 0,
      conversion_rate: 0
    }
  ]);

  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Immobilien Newsletter',
      template_type: 'newsletter',
      subject_template: 'Immobilienmarkt Update - {month} {year}',
      html_template: '<h1>Hallo {first_name}!</h1><p>Hier sind die neuesten Immobilien-Trends...</p>',
      variables: ['first_name', 'month', 'year']
    }
  ]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Entwurf' },
      scheduled: { variant: 'warning' as const, label: 'Geplant' },
      sending: { variant: 'default' as const, label: 'Wird versendet' },
      sent: { variant: 'success' as const, label: 'Versendet' },
      paused: { variant: 'secondary' as const, label: 'Pausiert' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getCampaignTypeLabel = (type: string) => {
    const types = {
      newsletter: 'Newsletter',
      property_alert: 'Immobilien-Alert',
      follow_up: 'Follow-Up',
      event: 'Event',
      market_report: 'Marktbericht'
    };
    return types[type as keyof typeof types] || type;
  };

  const renderOverview = () => {
    const totalSent = campaigns.reduce((sum, c) => sum + c.delivered, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked, 0);
    const avgOpenRate = campaigns.length > 0 ? 
      campaigns.reduce((sum, c) => sum + c.open_rate, 0) / campaigns.length : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Emails versendet</span>
              </div>
              <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-500" />
                <span className="font-medium">Geöffnet</span>
              </div>
              <div className="text-2xl font-bold">{totalOpened.toLocaleString()}</div>
              <div className="text-sm text-gray-600">{avgOpenRate.toFixed(1)}% Rate</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Geklickt</span>
              </div>
              <div className="text-2xl font-bold">{totalClicked}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Aktive Kampagnen</span>
              </div>
              <div className="text-2xl font-bold">
                {campaigns.filter(c => c.status === 'scheduled' || c.status === 'sending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Kampagnen Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.slice(0, 3).map(campaign => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">
                        {getCampaignTypeLabel(campaign.campaign_type)}
                      </p>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>

                  {campaign.status === 'sent' && (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Zugestellt</div>
                        <div className="font-semibold">{campaign.delivered.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Geöffnet</div>
                        <div className="font-semibold">{campaign.open_rate}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Geklickt</div>
                        <div className="font-semibold">{campaign.click_rate}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Konvertiert</div>
                        <div className="font-semibold">{campaign.conversion_rate}%</div>
                      </div>
                    </div>
                  )}

                  {campaign.scheduled_at && campaign.status === 'scheduled' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Geplant für: {new Date(campaign.scheduled_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button className="h-auto p-4 text-left">
                <div className="flex items-start gap-3">
                  <Plus className="w-5 h-5 mt-1" />
                  <div>
                    <div className="font-medium">Neue Kampagne</div>
                    <div className="text-sm text-gray-600">
                      Email-Kampagne erstellen und versenden
                    </div>
                  </div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 text-left">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 mt-1" />
                  <div>
                    <div className="font-medium">Immobilien-Alert</div>
                    <div className="text-sm text-gray-600">
                      Neue Immobilien an Interessenten senden
                    </div>
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto p-4 text-left">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 mt-1" />
                  <div>
                    <div className="font-medium">Marktbericht</div>
                    <div className="text-sm text-gray-600">
                      Monatlichen Marktbericht versenden
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email Kampagnen</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Neue Kampagne
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {campaigns.map(campaign => (
          <Card key={campaign.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{campaign.name}</h4>
                  <p className="text-gray-600">{campaign.subject}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{getCampaignTypeLabel(campaign.campaign_type)}</span>
                    <span>•</span>
                    <span>{campaign.total_recipients.toLocaleString()} Empfänger</span>
                    <span>•</span>
                    <span>Erstellt: {new Date(campaign.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(campaign.status)}
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                  {campaign.status === 'scheduled' && (
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {campaign.status === 'sent' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Zugestellt</div>
                      <div className="font-semibold text-green-600">
                        {campaign.delivered.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Geöffnet</div>
                      <div className="font-semibold">
                        {campaign.opened} ({campaign.open_rate}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Geklickt</div>
                      <div className="font-semibold">
                        {campaign.clicked} ({campaign.click_rate}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Bounced</div>
                      <div className="font-semibold text-red-600">
                        {campaign.bounced}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Abgemeldet</div>
                      <div className="font-semibold text-orange-600">
                        {campaign.unsubscribed}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Konvertiert</div>
                      <div className="font-semibold text-purple-600">
                        {campaign.conversion_rate}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Versendet: {campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : 'N/A'}
                    </div>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              )}

              {campaign.status === 'scheduled' && campaign.scheduled_at && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        Geplant für: {new Date(campaign.scheduled_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit3 className="w-4 h-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-1" />
                        Pausieren
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email Vorlagen</h3>
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
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Betreff:</label>
                  <p className="text-sm bg-gray-50 rounded p-2 font-mono">
                    {template.subject_template}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Variablen:</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Für Kampagne verwenden
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email Analytics</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Zeitraum wählen
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportieren
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Öffnungsraten Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Chart wird hier angezeigt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Klickraten nach Kampagnentyp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Newsletter</span>
                <span className="font-semibold">8.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Immobilien-Alert</span>
                <span className="font-semibold">12.3%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Follow-Up</span>
                <span className="font-semibold">6.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performer Kampagnen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns
              .filter(c => c.status === 'sent')
              .sort((a, b) => b.open_rate - a.open_rate)
              .map((campaign, index) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">
                        {getCampaignTypeLabel(campaign.campaign_type)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{campaign.open_rate}%</div>
                    <div className="text-sm text-gray-600">{campaign.opened} Öffnungen</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Marketing</h2>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Übersicht', icon: Eye },
            { id: 'campaigns', label: 'Kampagnen', icon: Mail },
            { id: 'templates', label: 'Vorlagen', icon: Edit3 },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
      {activeTab === 'campaigns' && renderCampaigns()}
      {activeTab === 'templates' && renderTemplates()}
      {activeTab === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default EmailMarketing;
