/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  RotateCw, 
  Grid, 
  Sparkles, 
  VolumeX, 
  Volume2, 
  Sliders,
  Image as ImageIcon,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { SavedPhoto, CAMERA_FILTERS, ASPECT_RATIOS, CameraFilter, AspectRatioType } from "../types";

interface CameraViewProps {
  onPhotoCaptured: (blob: Blob) => void;
  latestPhotoUrl: string | null;
  onOpenGallery: () => void;
}

// Mock scenes for desktop simulation fallback
const SIMULATED_SCENES = [
  { id: "beach", name: "Praia de Copacabana 🏖️", url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80" },
  { id: "cafe", name: "Café Colonial ☕", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80" },
  { id: "sunset", name: "Pôr do Sol Dourado 🌅", url: "https://images.unsplash.com/photo-1472244287413-566f1fc957ce?w=800&auto=format&fit=crop&q=80" },
  { id: "cats", name: "Gatinho Fofo 🐱", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80" },
  { id: "neon", name: "Cidade Neon 🌃", url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&auto=format&fit=crop&q=80" }
];

export function CameraView({ onPhotoCaptured, latestPhotoUrl, onOpenGallery }: CameraViewProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  
  // Custom camera options
  const [selectedFilter, setSelectedFilter] = useState<CameraFilter>(CAMERA_FILTERS[0]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("16:9");
  const [showGrid, setShowGrid] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Simulated Mode parameters
  const [isSimulated, setIsSimulated] = useState(false);
  const [activeSimulatedScene, setActiveSimulatedScene] = useState(SIMULATED_SCENES[0]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize camera stream
  useEffect(() => {
    let isActive = true;

    async function startCamera() {
      if (isSimulated) {
        setIsCameraLoading(false);
        return;
      }

      setIsCameraLoading(true);
      setCameraError(null);
      
      // Stop old stream tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      try {
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (isActive) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setIsCameraLoading(false);
        }
      } catch (err: any) {
        console.warn("Could not start native camera:", err);
        if (isActive) {
          // If native camera fails (blocked or not connected), seamlessly turn on Interactive Simulation Mode
          setIsSimulated(true);
          setIsCameraLoading(false);
        }
      }
    }

    startCamera();

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, isSimulated]);

  // Handle active camera toggle in case user wants to switch back
  const toggleSimulation = () => {
    if (isSimulated) {
      // Attempt manual reconnect
      setIsSimulated(false);
    } else {
      setIsSimulated(true);
    }
  };

  // Flip camera trigger
  const flipCamera = () => {
    if (isSimulated) {
      // Just toggle mock orientation
      setFacingMode(prev => prev === "user" ? "environment" : "user");
      return;
    }
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Play synthetic camera click sound using Web Audio API
  const playShutterSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Generate a sharp high white noise block followed by brief decaying sine wave for the realistic "shh-click" sound
      const bufferSize = audioCtx.sampleRate * 0.15; // 150ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
      }
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      // Filter the white noise
      const filterNode = audioCtx.createBiquadFilter();
      filterNode.type = "bandpass";
      filterNode.frequency.setValueAtTime(2000, audioCtx.currentTime);
      filterNode.Q.setValueAtTime(3, audioCtx.currentTime);
      
      // Envelope for the click snap
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      noise.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      noise.start();
      noise.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.log("No audio capability");
    }
  };

  // Capture Photo logic
  const handleCapture = async () => {
    if (isCameraLoading) return;
    
    // Trigger visual flash
    setIsFlashing(true);
    playShutterSound();
    setTimeout(() => setIsFlashing(false), 150);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isSimulated) {
      // Render simulated photo from Unsplash URL
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Select the active scene image
      img.src = activeSimulatedScene.url;
      
      img.onload = () => {
        // Set dimensions appropriately based on selected aspect ratio
        let targetWidth = 1080;
        let targetHeight = 1080; // 1:1 format

        if (aspectRatio === "4:3") {
          targetHeight = 810; // 4:3 is 1080x810
        } else if (aspectRatio === "16:9") {
          targetHeight = 1920; // 1080x1920 vertical
        } else if (aspectRatio === "full") {
          targetWidth = 1080;
          targetHeight = 1620;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Apply selected filter to canvas context
        ctx.filter = selectedFilter.cssStyle;
        
        // Draw image scaled to crop cleanly in selected ratio
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > targetRatio) {
          drawWidth = targetHeight * imgRatio;
          offsetX = (targetWidth - drawWidth) / 2;
        } else {
          drawHeight = targetWidth / imgRatio;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Add a tiny artistic stamp at bottom right
        ctx.filter = "none";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("Câmera & Galeria App", 24, targetHeight - 32);

        canvas.toBlob((blob) => {
          if (blob) onPhotoCaptured(blob);
        }, "image/jpeg", 0.9);
      };
      return;
    }

    // Native capture from video stream
    const video = videoRef.current;
    if (!video) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) return;

    // Define coordinates and width/height for capturing matching visual constraints
    let targetWidth = 1080;
    let targetHeight = 1080; // default 1:1

    if (aspectRatio === "4:3") {
      targetWidth = 1080;
      targetHeight = 810;
    } else if (aspectRatio === "16:9") {
      targetWidth = 1080;
      targetHeight = 1920;
    } else if (aspectRatio === "full") {
      targetWidth = videoWidth;
      targetHeight = videoHeight;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Set filter to match UI exactly
    ctx.filter = selectedFilter.cssStyle;

    // Handle flip horizontally if user-facing (selfie)
    if (facingMode === "user") {
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
    }

    // Capture frames with custom aspect ratio cropping
    const videoRatio = videoWidth / videoHeight;
    const targetRatio = targetWidth / targetHeight;

    let srcW = videoWidth;
    let srcH = videoHeight;
    let srcX = 0;
    let srcY = 0;

    if (videoRatio > targetRatio) {
      srcW = videoHeight * targetRatio;
      srcX = (videoWidth - srcW) / 2;
    } else {
      srcH = videoWidth / targetRatio;
      srcY = (videoHeight - srcH) / 2;
    }

    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);

    // Convert canvas to Blob
    canvas.toBlob((blob) => {
      if (blob) {
        onPhotoCaptured(blob);
      }
    }, "image/jpeg", 0.95);
  };

  // Get active CSS aspect ratio class name to style container preview
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "1:1":
        return "aspect-square max-h-[460px]";
      case "4:3":
        return "aspect-[4/3] max-h-[460px]";
      case "16:9":
        return "aspect-[9/16] max-h-[580px]";
      case "full":
        return "aspect-[3/4] max-h-[580px]";
      default:
        return "aspect-square";
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full bg-[#0b0c10] select-none text-slate-100">
      
      {/* Top Controls Toolbar */}
      <div className="w-full max-w-md px-6 py-4 flex items-center justify-between bg-[#111216] border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-rose-500 animate-pulse" />
          <h1 className="font-display font-bold text-lg tracking-wide text-white">
            CÂMERA
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Simulation status indicator */}
          <button 
            onClick={toggleSimulation}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5 transition-all ${
              isSimulated 
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
            title="Clique para alternar entre Câmera Real ou Modo Simulado"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSimulated ? "bg-amber-400" : "bg-emerald-400"} animate-ping`} />
            {isSimulated ? "Simulação" : "Dispositivo"}
          </button>

          {/* Grid view button */}
          <button 
            onClick={() => setShowGrid(!showGrid)} 
            className={`p-2 rounded-lg transition-colors ${showGrid ? "text-rose-400 bg-rose-500/15" : "text-slate-400 hover:text-white"}`}
            title="Alternar Grade"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Sound volume button */}
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            title={isMuted ? "Ativar som" : "Desativar som"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Viewfinder Section */}
      <div className="w-full flex-1 flex flex-col items-center justify-center p-3 relative max-w-md mx-auto">
        
        {/* Aspect Ratio Selector strip */}
        <div className="flex gap-2 mb-3 bg-white/[0.04] p-1 rounded-full border border-white/5 relative z-10">
          {(["1:1", "4:3", "16:9"] as AspectRatioType[]).map((ratio) => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`px-3 py-1 text-xs font-mono rounded-full font-medium transition-all ${
                aspectRatio === ratio
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>

        {/* The Live Video Container / Mock Simulator */}
        <div className={`relative w-full max-w-[380px] overflow-hidden rounded-2xl bg-black/80 border border-white/10 shadow-2xl transition-all duration-300 ${getAspectRatioClass()}`}>
          
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-[99] animate-fade-out" />
          )}

          {/* Loading view */}
          {isCameraLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0e12] z-20">
              <span className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-rose-500 animate-spin mb-3" />
              <p className="text-xs font-mono text-slate-400 tracking-wider">Lançando Lente...</p>
            </div>
          )}

          {/* Live stream */}
          {!isSimulated ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transition-all"
              style={{ 
                filter: selectedFilter.cssStyle,
                transform: facingMode === "user" ? "scaleX(-1)" : "none"
              }}
            />
          ) : (
            // Simulated Backdrop View
            <div className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden">
              <img
                src={activeSimulatedScene.url}
                alt="Simulated Stream"
                className="w-full h-full object-cover select-none pointer-events-none transition-all duration-500"
                style={{ filter: selectedFilter.cssStyle }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-mono tracking-wider flex items-center gap-1 border border-white/10">
                <HelpCircle className="w-3 h-3 text-amber-400" />
                CENÁRIO TESTE
              </div>
            </div>
          )}

          {/* Rule of Thirds Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
              <div className="w-full h-1/3 border-b border-white/15" />
              <div className="w-full h-1/3 border-b border-white/15" />
              <div className="absolute inset-0 flex justify-between">
                <div className="h-full w-1/3 border-r border-white/15" />
                <div className="h-full w-1/3 border-r border-white/15" />
              </div>
            </div>
          )}

          {/* Dark Vignette Overlay for focus feel */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)] z-10" />
        </div>

        {/* Simulated Scene Selector (Visible only in Simulated mode) */}
        {isSimulated && (
          <div className="w-full max-w-[380px] mt-3 bg-white/[0.04] p-2.5 rounded-xl border border-white/5 relative z-10 animate-fade-in text-center">
            <p className="text-[10px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
              Escolha um cenário para bater a foto:
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 justify-start px-1 snap-x scrollbar-none">
              {SIMULATED_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setActiveSimulatedScene(scene)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap snap-center transition-all ${
                    activeSimulatedScene.id === scene.id
                      ? "bg-amber-500 text-slate-950 font-semibold"
                      : "bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {scene.name}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Real-time Filter Selector Slider */}
      <div className="w-full bg-[#111216]/90 border-t border-b border-white/5 py-3 relative z-10">
        <div className="max-w-md mx-auto flex items-center gap-3 overflow-x-auto px-6 scrollbar-none snap-x">
          <div className="flex gap-3.5 pb-1">
            {CAMERA_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter)}
                className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group snap-center"
              >
                {/* Visual filter thumbnail preview ball */}
                <div 
                  className={`w-11 h-11 rounded-full border-2 transition-all overflow-hidden ${
                    selectedFilter.id === filter.id 
                      ? "border-rose-500 scale-110 shadow-lg shadow-rose-500/20" 
                      : "border-white/20 group-hover:border-white/50"
                  }`}
                >
                  <div 
                    className="w-full h-full bg-cover"
                    style={{ 
                      filter: filter.cssStyle,
                      backgroundImage: "url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=100&auto=format&fit=crop&q=80')" 
                    }}
                  />
                </div>
                <span className={`text-[10px] font-medium tracking-wide transition-all ${
                  selectedFilter.id === filter.id ? "text-rose-400 font-semibold" : "text-slate-400"
                }`}>
                  {filter.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Big Action Shutter Panel */}
      <div className="w-full max-w-md px-6 py-6 bg-[#0b0c10] flex items-center justify-around relative z-10">
        
        {/* Left Side: Recent taken photo redirect */}
        <button 
          onClick={onOpenGallery}
          className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-slate-300 relative group"
          title="Abrir Galeria"
          id="btn-goto-gallery"
        >
          {latestPhotoUrl ? (
            <img 
              src={latestPhotoUrl} 
              alt="Mais recente" 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-400" />
          )}
          {latestPhotoUrl && (
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          )}
        </button>

        {/* Center: Interactive Shutter Trigger Button */}
        <button
          onClick={handleCapture}
          className="relative -translate-y-4 inline-flex items-center justify-center focus:outline-none active:scale-90 transition-transform cursor-pointer"
          style={{ animation: isCameraLoading ? "none" : "camera-shutter-pulse 2.5s infinite" }}
          disabled={isCameraLoading}
          id="btn-capture-shutter"
          title="Bater Foto"
        >
          {/* Inner ring & solid pad */}
          <div className="shutter-glow w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-transparent">
            <div className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors duration-200" />
          </div>
        </button>

        {/* Right Side: Lens Switch / Camera flip */}
        <button 
          onClick={flipCamera}
          className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all active:rotate-180 text-white"
          title="Inverter Lente (Frontal/Traseira)"
          id="btn-flip-lens"
        >
          <RotateCw className="w-5 h-5 text-slate-300" />
        </button>

      </div>

      {/* Hidden static capture canvas to compile stream details */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
