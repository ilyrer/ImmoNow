import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { apiClient } from '../api/config';
import { toast } from 'react-hot-toast';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  campaign_type: string;
  recipient_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  open_rate: number;
  click_rate: number;
  sent_at: string | null;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  template_type: string;
  subject: string;
  content: string;
  html_content?: string;
  usage_count: number;
  is_default: boolean;
  created_at: string;
}

interface MarketingDashboard {
  period_days: number;
  overview: {
    total_campaigns: number;
    total_emails_sent: number;
    total_opens: number;
    total_clicks: number;
    avg_open_rate: number;
    avg_click_rate: number;
  };
  top_campaigns: Array<{
    name: string;
    open_rate: number;
    click_rate: number;
    sent_count: number;
  }>;
}

export const MailboxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'analytics'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dashboard, setDashboard] = useState<MarketingDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    campaign_type: 'newsletter',
    subject: '',
    content: '',
    html_content: '',
    recipient_ids: [] as string[],
    track_opens: true,
    track_clicks: true
  });

  // New template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    template_type: 'newsletter',
    subject: '',
    content: '',
    html_content: ''
  });

  const tabs = [
    { id: 'campaigns', label: 'Kampagnen', icon: 'ri-megaphone-line' },
    { id: 'templates', label: 'Vorlagen', icon: 'ri-file-copy-line' },
    { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-line' }
  ];

  // Load data
  useEffect(() => {
    if (activeTab === 'campaigns') {
      loadCampaigns();
    } else if (activeTab === 'templates') {
      loadTemplates();
    } else if (activeTab === 'analytics') {
      loadDashboard();
    }
  }, [activeTab]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/email-marketing/email-marketing/campaigns');
      if (response.data.success) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Fehler beim Laden der Kampagnen');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/email-marketing/email-marketing/templates');
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/email-marketing/email-marketing/dashboard?days=30');
      if (response.data.success) {
        setDashboard(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Fehler beim Laden der Analytics');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/email-marketing/email-marketing/campaigns', newCampaign);
      if (response.data.success) {
        toast.success('Kampagne erfolgreich erstellt');
        setShowCreateCampaign(false);
        setNewCampaign({
          name: '',
          campaign_type: 'newsletter',
          subject: '',
          content: '',
          html_content: '',
          recipient_ids: [],
          track_opens: true,
          track_clicks: true
        });
        loadCampaigns();
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.response?.data?.detail || 'Fehler beim Erstellen der Kampagne');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/email-marketing/email-marketing/templates', newTemplate);
      if (response.data.success) {
        toast.success('Vorlage erfolgreich erstellt');
        setShowCreateTemplate(false);
        setNewTemplate({
          name: '',
          template_type: 'newsletter',
          subject: '',
          content: '',
          html_content: ''
        });
        loadTemplates();
      }
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error.response?.data?.detail || 'Fehler beim Erstellen der Vorlage');
    } finally {
      setLoading(false);
    }
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/email-marketing/email-marketing/campaigns/${campaignId}/send`, {
        send_immediately: true
      });
      if (response.data.success) {
        toast.success(`Kampagne gesendet an ${response.data.sent_count} Empfänger`);
        loadCampaigns();
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error(error.response?.data?.detail || 'Fehler beim Senden der Kampagne');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'campaigns':
        return (
          <div className="space-y-6">
            {/* Campaign Creation Modal */}
            {showCreateCampaign && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Neue Kampagne erstellen</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Kampagnen-Name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Betreff</label>
                      <input
                        type="text"
                        value={newCampaign.subject}
                        onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="E-Mail Betreff"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Typ</label>
                      <select
                        value={newCampaign.campaign_type}
                        onChange={(e) => setNewCampaign({...newCampaign, campaign_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="newsletter">Newsletter</option>
                        <option value="promotional">Werbung</option>
                        <option value="notification">Benachrichtigung</option>
                        <option value="property_alert">Immobilien-Alert</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inhalt</label>
                      <textarea
                        value={newCampaign.content}
                        onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="E-Mail Inhalt..."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newCampaign.track_opens}
                          onChange={(e) => setNewCampaign({...newCampaign, track_opens: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Öffnungen tracken</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newCampaign.track_clicks}
                          onChange={(e) => setNewCampaign({...newCampaign, track_clicks: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Klicks tracken</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>Abbrechen</Button>
                    <Button onClick={createCampaign} disabled={loading}>
                      {loading ? 'Erstelle...' : 'Erstellen'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Campaigns Management */}
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">E-Mail Kampagnen</h3>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setShowCreateCampaign(true)}
                  >
                    <i className="ri-add-line mr-2"></i>
                    Neue Kampagne
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-gray-900 dark:text-white">{campaign.name}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                campaign.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                campaign.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                campaign.status === 'sending' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                              }`}>
                                {campaign.status === 'sent' ? 'Gesendet' :
                                 campaign.status === 'draft' ? 'Entwurf' :
                                 campaign.status === 'sending' ? 'Wird gesendet' : campaign.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {campaign.subject}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>Empfänger: {campaign.recipient_count}</span>
                              {campaign.status === 'sent' && (
                                <>
                                  <span>•</span>
                                  <span>Zugestellt: {campaign.delivered_count}</span>
                                  <span>•</span>
                                  <span>Öffnungsrate: {campaign.open_rate.toFixed(1)}%</span>
                                  <span>•</span>
                                  <span>Klickrate: {campaign.click_rate.toFixed(1)}%</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {campaign.status === 'draft' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => sendCampaign(campaign.id)}
                                disabled={loading}
                              >
                                <i className="ri-send-plane-line mr-1"></i>
                                Senden
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <i className="ri-edit-line mr-1"></i>
                              Bearbeiten
                            </Button>
                            {campaign.status === 'sent' && (
                              <Button variant="outline" size="sm">
                                <i className="ri-bar-chart-line mr-1"></i>
                                Analytics
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {campaigns.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i className="ri-mail-line text-4xl mb-4"></i>
                        <p>Noch keine Kampagnen erstellt</p>
                        <p className="text-sm mt-1">Erstellen Sie Ihre erste E-Mail-Kampagne</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-6">
            {/* Template Creation Modal */}
            {showCreateTemplate && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Neue Vorlage erstellen</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Vorlagen-Name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Typ</label>
                      <select
                        value={newTemplate.template_type}
                        onChange={(e) => setNewTemplate({...newTemplate, template_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="newsletter">Newsletter</option>
                        <option value="welcome">Begrüßung</option>
                        <option value="property_alert">Immobilien-Alert</option>
                        <option value="thank_you">Danksagung</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Betreff</label>
                      <input
                        type="text"
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Standard-Betreff"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inhalt</label>
                      <textarea
                        value={newTemplate.content}
                        onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Vorlagen-Inhalt..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>Abbrechen</Button>
                    <Button onClick={createTemplate} disabled={loading}>
                      {loading ? 'Erstelle...' : 'Erstellen'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Templates */}
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">E-Mail Vorlagen</h3>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setShowCreateTemplate(true)}
                  >
                    <i className="ri-add-line mr-2"></i>
                    Neue Vorlage
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center">
                          <div className="text-center">
                            <i className="ri-mail-line text-3xl text-gray-400 mb-2"></i>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{template.template_type}</p>
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{template.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.subject}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Verwendet: {template.usage_count} mal
                        </p>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setNewCampaign({
                                ...newCampaign,
                                name: `Kampagne - ${template.name}`,
                                subject: template.subject,
                                content: template.content,
                                html_content: template.html_content || ''
                              });
                              setShowCreateCampaign(true);
                            }}
                          >
                            Verwenden
                          </Button>
                          <Button variant="outline" size="sm">
                            <i className="ri-edit-line"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {templates.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                        <i className="ri-file-copy-line text-4xl mb-4"></i>
                        <p>Noch keine Vorlagen erstellt</p>
                        <p className="text-sm mt-1">Erstellen Sie Ihre erste E-Mail-Vorlage</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Analytics Dashboard */}
            {dashboard && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-white dark:bg-gray-800">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                          <i className="ri-mail-send-line text-xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesendete E-Mails</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {dashboard.overview.total_emails_sent.toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {dashboard.overview.total_campaigns} Kampagnen
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                          <i className="ri-eye-line text-xl text-green-600 dark:text-green-400"></i>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Öffnungsrate</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {dashboard.overview.avg_open_rate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {dashboard.overview.total_opens} Öffnungen
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                          <i className="ri-cursor-line text-xl text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Klickrate</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {dashboard.overview.avg_click_rate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {dashboard.overview.total_clicks} Klicks
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                          <i className="ri-trending-up-line text-xl text-orange-600 dark:text-orange-400"></i>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {((dashboard.overview.total_opens + dashboard.overview.total_clicks) / Math.max(dashboard.overview.total_emails_sent, 1) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-orange-600 dark:text-orange-400">Gesamt-Interaktion</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Top Campaigns */}
                <Card className="bg-white dark:bg-gray-800">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top-Performance Kampagnen</h3>
                    <div className="space-y-3">
                      {dashboard.top_campaigns.map((campaign, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {campaign.sent_count} Empfänger
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex space-x-4 text-sm">
                              <span className="text-green-600 dark:text-green-400">
                                {campaign.open_rate.toFixed(1)}% Öffnungen
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {campaign.click_rate.toFixed(1)}% Klicks
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )}

            {!dashboard && loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Email Marketing</h1>
          <p className="text-gray-600 dark:text-gray-400">Verwalten Sie Ihre E-Mail-Kampagnen und Newsletter mit echten Backend-Daten</p>
        </div>
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default MailboxPage;
