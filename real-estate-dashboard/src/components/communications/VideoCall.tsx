import React, { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Users } from 'lucide-react';
import SimplePeer from 'simple-peer';
import { wsService } from '../../services/websocket';

interface VideoCallProps {
  conversationId: string;
  onEndCall: () => void;
}

interface CallState {
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isInitiator: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({ conversationId, onEndCall }) => {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    isInitiator: false
  });
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [localStream]);

  const startCall = async (initiator: boolean = false) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !callState.isVideoOff,
        audio: !callState.isMuted
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const peerInstance = new SimplePeer({
        initiator,
        trickle: false,
        stream: stream
      });
      
      peerRef.current = peerInstance;
      setPeer(peerInstance);
      
      // Handle peer events
      peerInstance.on('signal', (data) => {
        console.log('Sending signal:', data);
        wsService.sendVideoSignal(data);
      });
      
      peerInstance.on('stream', (stream) => {
        console.log('Received remote stream');
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });
      
      peerInstance.on('connect', () => {
        console.log('Peer connected');
        setCallState(prev => ({ ...prev, isConnected: true }));
        setIsCallActive(true);
      });
      
      peerInstance.on('error', (err) => {
        console.error('Peer error:', err);
      });
      
      peerInstance.on('close', () => {
        console.log('Peer connection closed');
        setCallState(prev => ({ ...prev, isConnected: false }));
        setIsCallActive(false);
      });
      
      setCallState(prev => ({ ...prev, isInitiator: initiator }));
      
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    setRemoteStream(null);
    setIsCallActive(false);
    setCallState({
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
      isInitiator: false
    });
    
    onEndCall();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = callState.isMuted;
      });
      
      setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = callState.isVideoOff;
      });
      
      setCallState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
    }
  };

  // Handle incoming video signals
  useEffect(() => {
    const handleVideoSignal = (signal: any, sender: string) => {
      console.log('Received video signal from:', sender);
      
      if (peerRef.current && !callState.isInitiator) {
        peerRef.current.signal(signal);
      }
    };

    // This would be connected to the WebSocket service
    // For now, we'll simulate it
    return () => {
      // Cleanup
    };
  }, [callState.isInitiator]);

  if (!isCallActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Video-Anruf starten
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Starten Sie einen Video-Anruf mit den Teilnehmern dieser Unterhaltung
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startCall(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Anruf starten
              </button>
              <button
                onClick={onEndCall}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <div className="absolute inset-0">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Warten auf Verbindung...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Local Video */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Call Status */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${callState.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {callState.isConnected ? 'Verbunden' : 'Verbindung...'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-black bg-opacity-50 p-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              callState.isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {callState.isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              callState.isVideoOff 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {callState.isVideoOff ? (
              <VideoOff className="w-6 h-6 text-white" />
            ) : (
              <Video className="w-6 h-6 text-white" />
            )}
          </button>
          
          <button
            onClick={endCall}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
