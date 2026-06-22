/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, MouseEvent } from "react";
import { Camera, Image as ImageIcon, Heart, Sparkles, Smartphone, Share2, HelpCircle, Lock, Unlock } from "lucide-react";
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

  // Lock protection state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem("app_unlocked") === "true";
  });
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  // Set default passcode value "1234"
  const MASTER_PASSCODE = "1234";

  // Check PIN as they type
  useEffect(() => {
    if (passcodeInput.length === 4) {
      if (passcodeInput === MASTER_PASSCODE) {
        localStorage.setItem("app_unlocked", "true");
        setIsUnlocked(true);
        setPasscodeError(false);
        triggerToast("Acesso autorizado! Bem-vindo(a). 🔓");
      } else {
        setPasscodeError(true);
        setPasscodeInput("");
        triggerToast("Senha incorreta. Tente novamente! 🔒");
      }
    }
  }, [passcodeInput]);

  const handleUnlockManual = () => {
    if (passcodeInput === MASTER_PASSCODE) {
      localStorage.setItem("app_unlocked", "true");
      setIsUnlocked(true);
      setPasscodeError(false);
      triggerToast("Acesso autorizado! Bem-vindo(a). 🔓");
    } else {
      setPasscodeError(true);
      setPasscodeInput("");
      triggerToast("Senha incorreta. Tente novamente! 🔒");
    }
  };

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

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col justify-center items-center relative p-4" id="app-root-container">
        {/* Decorative background ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.08),transparent_60%)] pointer-events-none" />
        
        {/* Lock Screen Centered Card */}
        <div className="w-full max-w-sm bg-[#0b0c10] rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-6 border border-rose-500/20">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight mb-2">Acesso Restrito</h2>
          <p className="text-xs text-slate-400 max-w-xs mb-8 leading-relaxed">
            Este aplicativo de câmera e galeria privado é fechado. Insira a senha de acesso de 4 dígitos para usar.
          </p>

          <div className="w-full space-y-5">
            {/* PIN Indicator dots */}
            <div className="flex justify-center gap-3.5 mb-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border ${
                    passcodeError 
                      ? "border-rose-500 bg-rose-500/30" 
                      : index < passcodeInput.length 
                        ? "bg-rose-500 border-rose-400 scale-110 shadow-md shadow-rose-500/30" 
                        : "border-white/20 bg-white/5"
                  }`}
                />
              ))}
            </div>

            {/* Target Area to trigger native keypad on mobile */}
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              value={passcodeInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPasscodeInput(val);
                setPasscodeError(false);
              }}
              className="absolute opacity-0 pointer-events-none"
              autoFocus
              id="passcode-input-hidden"
            />

            <label 
              htmlFor="passcode-input-hidden" 
              className="block font-mono text-center cursor-pointer select-none"
            >
              <span className="text-[11px] text-rose-400/70 hover:text-rose-400 font-medium tracking-wide transition-colors">
                [ Clique aqui para abrir o teclado virtual ]
              </span>
            </label>

            {/* Custom On-screen Numeric Pad for quick clicking on any viewport */}
            <div className="grid grid-cols-3 gap-3.5 pt-4 max-w-[250px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (passcodeInput.length < 4) {
                      setPasscodeInput(prev => prev + num);
                      setPasscodeError(false);
                    }
                  }}
                  className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 text-base font-semibold text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              {/* Clear */}
              <button
                type="button"
                onClick={() => setPasscodeInput("")}
                className="w-14 h-14 rounded-full bg-white/5 hover:bg-rose-500/10 text-[11px] font-semibold text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
              >
                Limpar
              </button>
              {/* 0 */}
              <button
                type="button"
                onClick={() => {
                  if (passcodeInput.length < 4) {
                    setPasscodeInput(prev => prev + "0");
                    setPasscodeError(false);
                  }
                }}
                className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 text-base font-semibold text-white flex items-center justify-center transition-all cursor-pointer"
              >
                0
              </button>
              {/* Backspace */}
              <button
                type="button"
                onClick={() => setPasscodeInput(prev => prev.slice(0, -1))}
                className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-all cursor-pointer text-sm font-semibold"
              >
                ←
              </button>
            </div>

            <div className="pt-2 text-[10px] text-slate-600 font-mono tracking-wider">
              Senha Padrão: {MASTER_PASSCODE}
            </div>
          </div>
        </div>

        {/* Global floating system notifications */}
        {toastMessage && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-md shadow-xl border border-white/10 flex items-center gap-2 animate-scale-up tracking-wide whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] flex flex-col justify-between relative" id="app-root-container">
      
      {/* Decorative ambient glowing grids in background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,113,113,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.04),transparent_40%)] pointer-events-none" />

      {/* Main Responsive App Shell Container representing a phone or fluid layout */}
      <div className="w-full flex-1 max-w-md mx-auto bg-[#0b0c10] md:shadow-2xl md:border-x border-white/5 flex flex-col overflow-hidden relative min-h-screen pb-24">
        
        {/* Subtle security lockout button */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => {
              localStorage.removeItem("app_unlocked");
              setIsUnlocked(false);
              setPasscodeInput("");
              triggerToast("Aplicativo bloqueado com segurança! 🔒");
            }}
            className="w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            title="Bloquear Aplicativo"
            id="btn-lock-app"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>

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
