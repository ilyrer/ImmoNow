import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  Eye,
  Maximize,
  RotateCcw,
  Settings,
  Share2,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Move3D,
  Camera,
  MapPin,
  Info,
  Fullscreen,
  Home,
  Navigation,
  MousePointer,
  Smartphone,
  Monitor,
  Headphones,
  Clock,
  TrendingUp,
  Plus
} from 'lucide-react';

interface VirtualTour {
  id: string;
  property_id: string;
  property_title: string;
  tour_type: 'panorama' | '3d_model' | 'video_tour' | 'walkthrough';
  viewer_type: 'standard' | 'webgl' | 'threejs' | 'aframe';
  tour_url?: string;
  thumbnail_url: string;
  panorama_images: PanoramaImage[];
  hotspots: Hotspot[];
  audio_guide?: boolean;
  vr_enabled: boolean;
  ar_enabled: boolean;
  created_at: string;
  views_count: number;
  avg_view_duration: number;
  completion_rate: number;
}

interface PanoramaImage {
  id: string;
  room_name: string;
  image_url: string;
  order: number;
  is_starting_point: boolean;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  hotspot_type: 'room_transition' | 'info_point' | 'media' | 'external_link';
  title: string;
  description?: string;
  target_room_id?: string;
  media_url?: string;
  external_url?: string;
}

const VirtualTourViewer: React.FC = () => {
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'vr'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasAudio, setHasAudio] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<number>(0);
  const [showHotspots, setShowHotspots] = useState(true);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Mock data
  const [tours] = useState<VirtualTour[]>([
    {
      id: '1',
      property_id: 'prop-1',
      property_title: 'Luxusvilla München-Bogenhausen',
      tour_type: 'panorama',
      viewer_type: 'threejs',
      thumbnail_url: '/api/placeholder/400/300',
      panorama_images: [
        {
          id: '1',
          room_name: 'Wohnzimmer',
          image_url: '/api/placeholder/2048/1024',
          order: 1,
          is_starting_point: true
        },
        {
          id: '2',
          room_name: 'Küche',
          image_url: '/api/placeholder/2048/1024',
          order: 2,
          is_starting_point: false
        },
        {
          id: '3',
          room_name: 'Schlafzimmer',
          image_url: '/api/placeholder/2048/1024',
          order: 3,
          is_starting_point: false
        }
      ],
      hotspots: [
        {
          id: '1',
          x: 0.3,
          y: 0.5,
          hotspot_type: 'room_transition',
          title: 'Zur Küche',
          target_room_id: '2'
        },
        {
          id: '2',
          x: 0.7,
          y: 0.3,
          hotspot_type: 'info_point',
          title: 'Kamin Details',
          description: 'Hochwertiger Marmorkamin aus Italien'
        }
      ],
      audio_guide: true,
      vr_enabled: true,
      ar_enabled: false,
      created_at: '2024-01-15T10:00:00Z',
      views_count: 1247,
      avg_view_duration: 185,
      completion_rate: 78.5
    },
    {
      id: '2',
      property_id: 'prop-2',
      property_title: 'Penthouse Berlin-Mitte',
      tour_type: '3d_model',
      viewer_type: 'webgl',
      tour_url: 'https://example.com/3d-tour/penthouse',
      thumbnail_url: '/api/placeholder/400/300',
      panorama_images: [],
      hotspots: [],
      audio_guide: false,
      vr_enabled: true,
      ar_enabled: true,
      created_at: '2024-01-12T14:30:00Z',
      views_count: 856,
      avg_view_duration: 142,
      completion_rate: 65.2
    }
  ]);

  const activeTour = selectedTour ? tours.find(t => t.id === selectedTour) : null;

  useEffect(() => {
    // Hier würde Three.js oder WebGL Viewer initialisiert werden
    if (selectedTour && activeTour) {
      console.log('Initializing tour viewer for:', activeTour.property_title);
      // Initialize 3D viewer based on activeTour.viewer_type
    }
  }, [selectedTour, activeTour]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement && viewerRef.current) {
      viewerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRoomNavigation = (roomIndex: number) => {
    setCurrentRoom(roomIndex);
    // Navigate to specific room in 3D viewer
  };

  const renderTourSelector = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tours.map(tour => (
        <div 
          key={tour.id} 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedTour === tour.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedTour(tour.id)}
        >
          <Card>
            <div className="relative">
              <img 
                src={tour.thumbnail_url} 
                alt={tour.property_title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                {tour.vr_enabled && (
                  <Badge variant="secondary" className="text-xs">
                    <Headphones className="w-3 h-3 mr-1" />
                    VR
                  </Badge>
                )}
                {tour.ar_enabled && (
                  <Badge variant="secondary" className="text-xs">
                    <Smartphone className="w-3 h-3 mr-1" />
                    AR
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary">
                  {tour.tour_type === 'panorama' && '360°'}
                  {tour.tour_type === '3d_model' && '3D'}
                  {tour.tour_type === 'video_tour' && 'Video'}
                  {tour.tour_type === 'walkthrough' && 'Tour'}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">{tour.property_title}</h4>
              
              <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{tour.views_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor(tour.avg_view_duration / 60)}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{tour.completion_rate}%</span>
                </div>
              </div>
              
              {tour.panorama_images.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {tour.panorama_images.length} Räume verfügbar
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );

  const renderViewer = () => {
    if (!activeTour) return null;

    return (
      <div className="space-y-4">
        {/* Viewer Controls */}
        <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTour(null)}
            >
              <Home className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            
            <h3 className="font-semibold">{activeTour.property_title}</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            <div className="flex border rounded">
              <Button
                variant={viewMode === 'desktop' ? 'primary' : 'outline'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'primary' : 'outline'}
                size="sm"
                className="rounded-none border-l-0"
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              {activeTour.vr_enabled && (
                <Button
                  variant={viewMode === 'vr' ? 'primary' : 'outline'}
                  size="sm"
                  className="rounded-l-none border-l-0"
                  onClick={() => setViewMode('vr')}
                >
                  <Headphones className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Audio Control */}
            {activeTour.audio_guide && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHasAudio(!hasAudio)}
              >
                {hasAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            )}

            {/* Hotspots Toggle */}
            <Button
              variant={showHotspots ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowHotspots(!showHotspots)}
            >
              <Info className="w-4 h-4" />
            </Button>

            {/* Fullscreen */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
            >
              <Fullscreen className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Viewer */}
        <div className="relative">
          <div 
            ref={viewerRef}
            className={`relative bg-black rounded-lg overflow-hidden ${
              viewMode === 'mobile' ? 'aspect-[9/16] max-w-sm mx-auto' : 'aspect-video'
            }`}
          >
            {/* 3D Viewer Container */}
            <div className="absolute inset-0 flex items-center justify-center">
              {activeTour.tour_type === 'panorama' ? (
                <div className="text-center text-white">
                  <Move3D className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">360° Panorama Viewer</p>
                  <p className="text-sm opacity-75">Three.js/WebGL Viewer würde hier geladen</p>
                </div>
              ) : activeTour.tour_type === '3d_model' ? (
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">3D Model Viewer</p>
                  <p className="text-sm opacity-75">WebGL 3D Viewer würde hier geladen</p>
                </div>
              ) : (
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Virtual Tour Player</p>
                  <p className="text-sm opacity-75">Tour wird hier abgespielt</p>
                </div>
              )}
            </div>

            {/* Hotspots Overlay */}
            {showHotspots && activeTour.hotspots.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {activeTour.hotspots.map(hotspot => (
                  <div
                    key={hotspot.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${hotspot.x * 100}%`,
                      top: `${hotspot.y * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors animate-pulse">
                      {hotspot.hotspot_type === 'room_transition' && <Navigation className="w-4 h-4" />}
                      {hotspot.hotspot_type === 'info_point' && <Info className="w-4 h-4" />}
                      {hotspot.hotspot_type === 'media' && <Play className="w-4 h-4" />}
                      {hotspot.hotspot_type === 'external_link' && <MousePointer className="w-4 h-4" />}
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {hotspot.title}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button variant="secondary" size="sm">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="secondary" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Room Navigation */}
          {activeTour.panorama_images.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Räume</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeTour.panorama_images.map((room, index) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomNavigation(index)}
                    className={`flex-shrink-0 p-3 rounded-lg border text-sm font-medium transition-colors ${
                      currentRoom === index
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mx-auto mb-1" />
                    {room.room_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tour Information */}
        <Card>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Aufrufe:</span>
                <span className="ml-2 font-semibold">{activeTour.views_count.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Ø Dauer:</span>
                <span className="ml-2 font-semibold">
                  {Math.floor(activeTour.avg_view_duration / 60)}:{(activeTour.avg_view_duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Abschlussrate:</span>
                <span className="ml-2 font-semibold">{activeTour.completion_rate}%</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Teilen
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">360° Virtual Tours</h2>
        {!selectedTour && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Neue Tour erstellen
          </Button>
        )}
      </div>

      {selectedTour ? renderViewer() : renderTourSelector()}
    </div>
  );
};

export default VirtualTourViewer;
