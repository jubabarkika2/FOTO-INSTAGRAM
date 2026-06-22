/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, MouseEvent } from "react";
import { Camera, Image as ImageIcon, Heart, Sparkles, Smartphone, Share2, HelpCircle } from "lucide-react";
import { CameraView } from "./components/CameraView";
import { GalleryView } from "./components/GalleryView";
import { PhotoDetailModal } from "./components/PhotoDetailModal";
import { dbService, SavedPhoto } from "./services/db";

export default function App() {
  const [activeTab, setActiveTab] = useState<"camera" | "gallery">("camera");
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<SavedPhoto | null>(null);
  const [latestPhotoUrl, setLatestPhotoUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync / Load saved photos from IndexedDB on startup
  useEffect(() => {
    async function loadPhotos() {
      try {
        const storedPhotos = await dbService.getAllPhotos();
        setPhotos(storedPhotos);
        
        if (storedPhotos.length > 0) {
          // Generate active object URL for the latest photo thumbnail preview
          const url = URL.createObjectURL(storedPhotos[0].blob);
          setLatestPhotoUrl(url);
        }
      } catch (err) {
        console.error("Falha ao carregar galeria:", err);
      }
    }
    loadPhotos();
  }, []);

  // Show a clean temporary visual toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Callback when user snaps a new photo
  const handlePhotoCaptured = async (blob: Blob) => {
    try {
      const id = Date.now().toString();
      const newPhoto = await dbService.savePhoto({ id, blob });
      
      // Update state
      setPhotos(prev => [newPhoto, ...prev]);
      
      // Update camera preview thumbnail
      if (latestPhotoUrl) {
        URL.revokeObjectURL(latestPhotoUrl);
      }
      const newUrl = URL.createObjectURL(blob);
      setLatestPhotoUrl(newUrl);

      triggerToast("Foto capturada e salva na galeria! 📸");
    } catch (err) {
      console.error(err);
      triggerToast("Falha ao salvar fotografia.");
    }
  };

  // Toggle favorite status on a specific Photo
  const handleToggleFavorite = async (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation(); // Avoid triggering full screen viewer from card clicks
    try {
      const updated = await dbService.toggleFavorite(id);
      
      // Update memory lists
      setPhotos(prev => prev.map(p => p.id === id ? updated : p));
      
      // If currently viewed in detail modal, sync detail view
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto(updated);
      }
      
      triggerToast(updated.favorite ? "Adicionada às favoritas! ❤️" : "Removida das favoritas.");
    } catch (err) {
      console.error(err);
      triggerToast("Falha ao alterar preferência.");
    }
  };

  // Delete a specific Photo
  const handleDeletePhoto = async (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation(); // Avoid triggering full screen viewer
    try {
      // If we are deleting the photo currently shown as the latest thumbnail, update thumbnail
      await dbService.deletePhoto(id);
      
      const newPhotos = photos.filter(p => p.id !== id);
      setPhotos(newPhotos);

      // Reset detail viewer if current is deleted
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto(null);
      }

      // Update thumbnail image with next remaining
      if (newPhotos.length > 0) {
        const nextUrl = URL.createObjectURL(newPhotos[0].blob);
        setLatestPhotoUrl(nextUrl);
      } else {
        setLatestPhotoUrl(null);
      }

      triggerToast("Foto removida da galeria.");
    } catch (err) {
      console.error(err);
      triggerToast("Erro ao excluir foto.");
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex flex-col justify-between relative" id="app-root-container">
      
      {/* Decorative ambient glowing grids in background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,113,113,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.04),transparent_40%)] pointer-events-none" />

      {/* Main Responsive App Shell Container representing a phone or fluid layout */}
      <div className="w-full flex-1 max-w-md mx-auto bg-[#0b0c10] md:shadow-2xl md:border-x border-white/5 flex flex-col overflow-hidden relative min-h-screen pb-24">
        
        {/* Dynamic sliding tabs */}
        <main className="flex-1 w-full overflow-hidden">
          {activeTab === "camera" ? (
            <CameraView 
              onPhotoCaptured={handlePhotoCaptured}
              latestPhotoUrl={latestPhotoUrl}
              onOpenGallery={() => setActiveTab("gallery")}
            />
          ) : (
            <GalleryView 
              photos={photos}
              onPhotoClick={setSelectedPhoto}
              onToggleFavorite={handleToggleFavorite}
              onDeletePhoto={handleDeletePhoto}
              onNavigateToCamera={() => setActiveTab("camera")}
            />
          )}
        </main>

        {/* Global floating system notifications */}
        {toastMessage && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-md shadow-xl border border-white/10 flex items-center gap-2 animate-scale-up tracking-wide whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            {toastMessage}
          </div>
        )}

        {/* Bottom Immersive iOS/Android-inspired Floating Glass Dock/TabBar */}
        <nav className="absolute bottom-4 inset-x-4 h-16 rounded-2xl glass-panel-light flex items-center justify-around px-2 z-40 shadow-2xl border border-white/10">
          
          {/* CAMERA TAB BUTTON */}
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all ${
              activeTab === "camera"
                ? "text-rose-400 bg-rose-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="tab-trigger-camera"
            title="Abrir Categoria Câmera"
          >
            <Camera className={`w-5 h-5 ${activeTab === "camera" ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
            <span className="text-[10px] uppercase tracking-wider font-semibold">
              Câmera
            </span>
          </button>

          {/* GALLERY TAB BUTTON with counter badge */}
          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all relative ${
              activeTab === "gallery"
                ? "text-rose-400 bg-rose-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="tab-trigger-gallery"
            title="Abrir Categoria Galeria"
          >
            <ImageIcon className={`w-5 h-5 ${activeTab === "gallery" ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
            <span className="text-[10px] uppercase tracking-wider font-semibold">
              Galeria
            </span>

            {/* Notification badge */}
            {photos.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md border border-[#16171e]">
                {photos.length}
              </span>
            )}
          </button>

          {/* Quick Info/Help panel modal redirect inside Tabbar */}
          <button
            onClick={() => {
              triggerToast("Inicie a câmera e compartilhe fotos no Instagram! 📸📲");
            }}
            className="flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl text-slate-500 hover:text-slate-400 transition-all"
            title="Ajuda sobre compartilhamento"
          >
            <HelpCircle className="w-5 h-5 stroke-[1.5]" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Ajuda</span>
          </button>

        </nav>

        {/* Small desktop friendly floating card showing instructions on wider viewport sizes */}
        <div className="absolute -right-72 top-4 w-64 glass-panel p-4 rounded-xl hidden xl:block shadow-lg border border-white/15">
          <div className="flex items-center gap-2 mb-2 text-rose-400">
            <Smartphone className="w-5 h-5" />
            <h4 className="font-display font-semibold text-sm">Design Responsivo</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Este aplicativo foi otimizado primariamente para <b>dispositivos móveis</b> para abrir a câmera física e compartilhar com as redes sociais! 
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
            <Share2 className="w-3.5 h-3.5" />
            WEB SHARE ATIVO EM SMARTPHONES
          </div>
        </div>

      </div>

      {/* Expanded Full-screen Photo Detail Modal & Shared Assistant */}
      <PhotoDetailModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onToggleFavorite={handleToggleFavorite}
        onDeletePhoto={handleDeletePhoto}
      />

    </div>
  );
}
