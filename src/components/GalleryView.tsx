/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, MouseEvent } from "react";
import { 
  Heart, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Grid, 
  Camera,
  Share2,
  ExternalLink
} from "lucide-react";
import { SavedPhoto } from "../types";

interface GalleryViewProps {
  photos: SavedPhoto[];
  onPhotoClick: (photo: SavedPhoto) => void;
  onToggleFavorite: (id: string, e: MouseEvent) => void;
  onDeletePhoto: (id: string, e: MouseEvent) => void;
  onNavigateToCamera: () => void;
}

export function GalleryView({
  photos,
  onPhotoClick,
  onToggleFavorite,
  onDeletePhoto,
  onNavigateToCamera
}: GalleryViewProps) {
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  const displayedPhotos = filter === "all" 
    ? photos 
    : photos.filter(p => p.favorite);

  // Group photos by date string e.g. "Hoje", "Ontem" or date format for an elegant timeline list
  const formatGroupDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      });
    }
  };

  // Create absolute local ObjectURLs for the BLOBS so the browser renders them dynamically
  const getObjectURL = (blob: Blob) => {
    try {
      return URL.createObjectURL(blob);
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0c10] select-none text-slate-100">
      
      {/* Top Gallery Bar */}
      <div className="w-full px-6 py-4 flex flex-col gap-4 bg-[#111216] border-b border-white/5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-rose-500" />
            <h1 className="font-display font-bold text-lg tracking-wide text-white">
              GALERIA LOCAL
            </h1>
          </div>
          
          <button
            onClick={onNavigateToCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 font-medium text-xs text-white transition-all active:scale-95"
            id="btn-nav-shoot"
          >
            <Camera className="w-3.5 h-3.5" />
            Bater Foto
          </button>
        </div>

        {/* Gallery Segment Switcher */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 self-start w-full sm:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              filter === "all"
                ? "bg-[#1e293b] text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Todas ({photos.length})
          </button>
          <button
            onClick={() => setFilter("favorites")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all ${
              filter === "favorites"
                ? "bg-rose-500 text-white shadow-sm shadow-rose-500/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Heart className={`w-3 h-3 ${filter === "favorites" ? "fill-white" : ""}`} />
            Favoritas ({photos.filter(p => p.favorite).length})
          </button>
        </div>
      </div>

      {/* Gallery Content area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
        {displayedPhotos.length === 0 ? (
          /* Empty State */
          <div className="w-full h-[60vh] max-w-sm mx-auto flex flex-col items-center justify-center text-center px-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <h2 className="font-display font-semibold text-lg text-white mb-2">
              {filter === "all" ? "Nenhuma foto capturada" : "Nenhuma favorita adicionada"}
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {filter === "all"
                ? "Abra a câmera do aplicativo para bater fotos incríveis e vê-las salvas aqui na sua galeria!"
                : "Marque as suas fotos prediletas como favoritas usando o ícone de coração para que apareçam aqui."}
            </p>
            {filter === "all" && (
              <button
                onClick={onNavigateToCamera}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-semibold tracking-wide shadow-lg shadow-rose-500/25 active:scale-95 transition-transform flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Começar a fotografar
              </button>
            )}
          </div>
        ) : (
          /* Image Grid organized by dates */
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedPhotos.map((photo) => {
                const photoSrc = getObjectURL(photo.blob);
                
                return (
                  <div
                    key={photo.id}
                    onClick={() => onPhotoClick(photo)}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 hover:border-rose-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-950/10"
                    id={`gallery-item-${photo.id}`}
                  >
                    {/* The Image */}
                    <div className="aspect-square w-full h-full overflow-hidden relative bg-black/40">
                      <img
                        src={photoSrc}
                        alt={photo.title || "Foto batida"}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        onLoad={() => {
                          // Clean up object URLs as needed if many render, but usually let them live for session
                        }}
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Gradient Ambient overlay visible on hover */}
                      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Favorite item indicator flag (permanent if favorited, or visible on hover) */}
                      <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
                        {photo.favorite && (
                          <span className="bg-rose-500/90 text-white p-1.5 rounded-lg shadow-md border border-rose-400/20 backdrop-blur-md">
                            <Heart className="w-3.5 h-3.5 fill-white" />
                          </span>
                        )}
                      </div>

                      {/* Display quick tag details */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="text-[9px] font-mono font-medium tracking-wider text-slate-300 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-white/5">
                          <Calendar className="w-2.5 h-2.5" />
                          {photo.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Compact Card Details Footer on Hover */}
                    <div className="p-2 bg-[#121318]/90 border-t border-white/5 flex items-center justify-between text-slate-400 text-xs">
                      <span className="text-[10px] font-medium font-sans text-slate-300 truncate max-w-[80px]">
                        {photo.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => onToggleFavorite(photo.id, e)}
                          className={`p-1 rounded-md transition-colors hover:bg-white/5 ${
                            photo.favorite ? "text-rose-400" : "text-slate-500 hover:text-slate-300"
                          }`}
                          title={photo.favorite ? "Desmarcar favorita" : "Marcar favorita"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${photo.favorite ? "fill-rose-400" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => onDeletePhoto(photo.id, e)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded-md hover:bg-red-500/5 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
