import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  Upload, 
  Share2, 
  Eye, 
  Settings,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus,
  Clock,
  Download,
  AlertTriangle,
  Calendar,
  XCircle
} from 'lucide-react';

interface Portal {
  name: string;
  display_name: string;
  description: string;
  features: string[];
  requires_api: boolean;
}

interface PortalConfiguration {
  id: string;
  portal_name: string;
  portal_display_name: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  auto_sync: boolean;
  sync_images: boolean;
  max_images: number;
  last_sync: string | null;
  error_message: string | null;
}

interface PortalListing {
  id: string;
  property_title: string;
  property_id: string;
  portal_name: string;
  portal_display_name: string;
  status: 'draft' | 'published' | 'updated' | 'paused' | 'deleted' | 'error';
  external_id: string | null;
  external_url: string | null;
  views: number;
  inquiries: number;
  last_sync: string | null;
}

const PortalIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'configurations' | 'listings'>('overview');
  const [supportedPortals] = useState<Portal[]>([
    {
      name: 'immoscout24',
      display_name: 'ImmoScout24',
      description: 'Deutschlands führendes Immobilienportal',
      features: ['Auto-Sync', 'Bilder-Upload', 'Analytics'],
      requires_api: true
    },
    {
      name: 'immowelt',
      display_name: 'Immowelt', 
      description: 'Großes deutsches Immobilienportal',
      features: ['Auto-Sync', 'Bilder-Upload'],
      requires_api: true
    },
    {
      name: 'facebook_marketplace',
      display_name: 'Facebook Marketplace',
      description: 'Facebook Marktplatz für lokale Anzeigen',
      features: ['Auto-Sync', 'Social Sharing'],
      requires_api: true
    }
  ]);

  const [configurations] = useState<PortalConfiguration[]>([
    {
      id: '1',
      portal_name: 'immoscout24',
      portal_display_name: 'ImmoScout24',
      status: 'active',
      auto_sync: true,
      sync_images: true,
      max_images: 20,
      last_sync: '2024-01-15T10:30:00Z',
      error_message: null
    }
  ]);

  const [listings] = useState<PortalListing[]>([
    {
      id: '1',
      property_title: 'Moderne Villa mit Seeblick',
      property_id: 'prop-1',
      portal_name: 'immoscout24',
      portal_display_name: 'ImmoScout24',
      status: 'published',
      external_id: 'is24_12345',
      external_url: 'https://immoscout24.de/expose/villa-seeblick',
      views: 1234,
      inquiries: 15,
      last_sync: '2024-01-15T10:30:00Z'
    }
  ]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Aktiv' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inaktiv' },
      error: { color: 'bg-red-100 text-red-800', label: 'Fehler' },
      published: { color: 'bg-green-100 text-green-800', label: 'Veröffentlicht' },
      draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Entwurf' },
      paused: { color: 'bg-orange-100 text-orange-800', label: 'Pausiert' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleSyncProperty = async (propertyId: string) => {
    try {
      // TODO: API call to sync property
      console.log('Syncing property:', propertyId);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Aktive Portale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {configurations.filter(c => c.status === 'active').length}
          </div>
          <p className="text-gray-600">
            von {supportedPortals.length} verfügbaren Portalen
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Gesamt-Aufrufe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {listings.reduce((sum, l) => sum + l.views, 0).toLocaleString()}
          </div>
          <p className="text-gray-600">
            in den letzten 30 Tagen
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Anfragen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {listings.reduce((sum, l) => sum + l.inquiries, 0)}
          </div>
          <p className="text-gray-600">
            über alle Portale
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfigurations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Portal-Konfigurationen</h3>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Neues Portal konfigurieren
        </Button>
      </div>

      <div className="grid gap-4">
        {configurations.map(config => (
          <Card key={config.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-semibold">{config.portal_display_name}</h4>
                    <p className="text-sm text-gray-600">
                      Letzter Sync: {config.last_sync ? new Date(config.last_sync).toLocaleDateString() : 'Nie'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(config.status)}
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Auto-Sync:</span>
                  <span className={`ml-1 ${config.auto_sync ? 'text-green-600' : 'text-gray-600'}`}>
                    {config.auto_sync ? 'Ein' : 'Aus'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Bilder-Sync:</span>
                  <span className={`ml-1 ${config.sync_images ? 'text-green-600' : 'text-gray-600'}`}>
                    {config.sync_images ? 'Ein' : 'Aus'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Max. Bilder:</span>
                  <span className="ml-1">{config.max_images}</span>
                </div>
              </div>

              {config.error_message && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{config.error_message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verfügbare Portale */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Verfügbare Portale</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportedPortals.map(portal => (
            <Card key={portal.name} className="border-dashed border-2">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">{portal.display_name}</h4>
                <p className="text-sm text-gray-600 mb-3">{portal.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {portal.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  Konfigurieren
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Portal-Listings</h3>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Immobilie synchronisieren
        </Button>
      </div>

      <div className="space-y-4">
        {listings.map(listing => (
          <Card key={listing.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{listing.property_title}</h4>
                  <p className="text-sm text-gray-600">{listing.portal_display_name}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(listing.status)}
                  <Button variant="outline" size="sm" onClick={() => handleSyncProperty(listing.property_id)}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  {listing.external_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={listing.external_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Aufrufe:</span>
                  <span className="ml-1 font-medium">{listing.views.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Anfragen:</span>
                  <span className="ml-1 font-medium">{listing.inquiries}</span>
                </div>
                <div>
                  <span className="text-gray-600">Konversion:</span>
                  <span className="ml-1 font-medium">
                    {listing.views > 0 ? ((listing.inquiries / listing.views) * 100).toFixed(1) + '%' : '0%'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Letzter Sync:</span>
                  <span className="ml-1">
                    {listing.last_sync ? new Date(listing.last_sync).toLocaleDateString() : 'Nie'}
                  </span>
                </div>
              </div>

              {listing.external_id && (
                <div className="mt-2 text-xs text-gray-500">
                  External ID: {listing.external_id}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Portal-Integration</h2>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Übersicht', icon: Eye },
            { id: 'configurations', label: 'Konfigurationen', icon: Settings },
            { id: 'listings', label: 'Listings', icon: Upload }
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
      {activeTab === 'configurations' && renderConfigurations()}
      {activeTab === 'listings' && renderListings()}
    </div>
  );
};

export default PortalIntegration;
