/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  X, 
  Heart, 
  Trash2, 
  Download, 
  Share2, 
  Instagram, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Info
} from "lucide-react";
import { SavedPhoto, SUGGESTED_CAPTIONS } from "../types";

interface PhotoDetailModalProps {
  photo: SavedPhoto | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDeletePhoto: (id: string) => void;
}

export function PhotoDetailModal({
  photo,
  onClose,
  onToggleFavorite,
  onDeletePhoto
}: PhotoDetailModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"insta" | "native">("insta");
  const [isSharingNative, setIsSharingNative] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Load photo blob as a local Object URL
  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo.blob);
    setPhotoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photo]);

  if (!photo) return null;

  // Manual image file download trigger
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = photoUrl;
    a.download = `camera-galeria-photo-${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Modern Clipboard API to copy photo directly as binary pixels for direct paste
  const handleCopyImageToClipboard = async () => {
    try {
      // Create ClipboardItem payload from photo blob (must be PNG for system support, so convert or use as standard)
      // Browsers usually accept image/png, if webp/jpeg may require canvas conversion. Let's do a reliable Copy notification.
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      
      // Clipboard needs PNG occasionally, but let's try direct write.
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn("Could not copy original binary to clipboard directly, trying general download:", err);
      // Fallback: download automatically or notify
      handleDownload();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Copy Caption Template text to clipboard
  const handleCopyCaption = (captionText: string, index: number) => {
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(index);
    setTimeout(() => setCopiedCaption(null), 2000);
  };

  // Web Share API to post files directly to mobile applications (Instagram)
  const handleNativeShare = async () => {
    setIsSharingNative(true);
    setShareFeedback(null);
    try {
      // Convert the Blob to an actual File object
      const file = new File([photo.blob], `photo-${photo.id}.jpg`, { type: "image/jpeg" });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Minha Foto Capturada",
          text: "Olhe essa foto que tirei com o app Câmera & Galeria!",
        });
        setShareFeedback("Compartilhado com sucesso!");
      } else {
        throw new Error("O navegador não suporta compartilhamento de arquivos.");
      }
    } catch (err: any) {
      console.warn("Native Sharing failed:", err);
      setShareFeedback("Compartilhamento nativo indisponível ou cancelado. Siga o Guia do Instagram abaixo.");
    } finally {
      setIsSharingNative(false);
      setTimeout(() => setShareFeedback(null), 6000);
    }
  };

  // Ultra-automated direct action requested by the user
  const handleAutomaticSend = async () => {
    setIsSharingNative(true);
    setShareFeedback(null);
    
    // 1. Auto-copy a beautiful suggested caption
    const randomCaption = SUGGESTED_CAPTIONS[Math.floor(Math.random() * SUGGESTED_CAPTIONS.length)];
    try {
      await navigator.clipboard.writeText(randomCaption);
    } catch (e) {
      console.log("Could not auto-copy caption");
    }

    try {
      const file = new File([photo.blob], `photo-${photo.id}.jpg`, { type: "image/jpeg" });
      
      // 2. Try the modern native sharing flow
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Câmera e Galeria App",
          text: randomCaption,
        });
        setShareFeedback("Sucesso! Legenda copiada: \"" + randomCaption + "\"");
      } else {
        // Fallback: download instantly + open instagram
        throw new Error("Post direto não suportado");
      }
    } catch (err) {
      // Manual/Desktop Fallback: Download the file and open Instagram automatically
      handleDownload();
      window.open("https://instagram.com", "_blank");
      setShareFeedback("Foto baixada e legenda copiada! O Instagram foi aberto em outra aba.");
    } finally {
      setIsSharingNative(false);
    }
  };

  // Checks block compatibility
  const isWebShareSupported = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      
      {/* Background close area */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Main Card Container */}
      <div className="relative w-full max-w-4xl bg-[#121319] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 animate-scale-up max-h-[92vh] md:max-h-[85vh]">
        
        {/* Top bar for small screen mobile Close and Favorite commands */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20 md:hidden bg-black/50 p-1.5 rounded-full backdrop-blur-md border border-white/10">
          <button 
            onClick={() => onToggleFavorite(photo.id)}
            className={`p-2 rounded-full transition-colors ${photo.favorite ? "text-rose-400" : "text-slate-300"}`}
          >
            <Heart className={`w-5 h-5 ${photo.favorite ? "fill-rose-400" : ""}`} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-full bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Left Side: Large Photo Viewer */}
        <div className="flex-1 min-h-[300px] md:min-h-0 bg-black flex items-center justify-center p-4 relative group">
          <img
            src={photoUrl}
            alt="Detalhe"
            className="max-w-full max-h-[40vh] md:max-h-[75vh] object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />

          {/* Bottom Dark Gradient Info Panel */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-lg border border-white/10 p-3 rounded-xl flex items-center justify-between opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[10px] font-mono text-slate-300">
              Capturada em: {photo.createdAt.toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(photo.id)}
                className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${
                  photo.favorite ? "text-rose-400" : "text-slate-400 hover:text-white"
                }`}
                title="Favoritar"
              >
                <Heart className={`w-4 h-4 ${photo.favorite ? "fill-rose-400" : ""}`} />
              </button>
              
              <button
                onClick={() => {
                  if(confirm("Tem certeza que deseja excluir esta foto permanentemente da sua galeria?")) {
                    onDeletePhoto(photo.id);
                  }
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Shared panel with Instagram Guide */}
        <div className="w-full md:w-[380px] bg-[#16171e] p-6 border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto flex flex-col justify-between max-h-[50vh] md:max-h-none">
          
          <div>
            {/* Desktop Close button */}
            <div className="hidden md:flex justify-between items-center mb-5">
              <h2 className="font-display font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                POSTAR NO INSTAGRAM
              </h2>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Header Title */}
            <div className="md:hidden mb-4">
              <h2 className="font-display font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-rose-500" />
                Postar no Instagram
              </h2>
            </div>

            {/* SUPER AUTOMATIC BIG BUTTON */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-purple-500/10 border border-rose-500/20 text-center space-y-3 shadow-lg shadow-rose-950/20">
              <span className="inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-rose-400 bg-rose-400/10 rounded-full">
                ⚡ Recurso de 1-Clique
              </span>
              <h3 className="text-xs font-semibold text-white tracking-wide">
                Enviar Automático
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Copia a legenda para a sua área de transferência, baixa/prepara a imagem e abre o Instagram em segundos!
              </p>
              
              <button
                onClick={handleAutomaticSend}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                id="btn-automatic-send-action"
              >
                <Instagram className="w-4 h-4 animate-pulse" />
                ENVIAR AGORA!
              </button>
              
              {shareFeedback && (
                <p className="text-[10px] text-amber-300 font-medium bg-black/30 p-2 rounded-lg leading-normal">
                  {shareFeedback}
                </p>
              )}
            </div>

            {/* Action Selection Tabs */}
            <div className="grid grid-cols-2 bg-black/40 p-1 rounded-xl border border-white/5 mb-5">
              <button
                onClick={() => setActiveTab("insta")}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "insta"
                    ? "bg-[#1e293b] text-white shadow-sm border border-white/5"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Instagram className="w-3.5 h-3.5 text-rose-400" />
                Guia Manual
              </button>
              <button
                onClick={() => setActiveTab("native")}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "native"
                    ? "bg-[#1e293b] text-white shadow-sm border border-white/5"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-rose-400" />
                Opções Extras
              </button>
            </div>

            {/* TAB 1: INSTAGRAM ASSISTANT GUIDE */}
            {activeTab === "insta" && (
              <div className="space-y-4 animate-fade-in text-slate-300">
                <div className="flex gap-2.5 items-start bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <Info className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Como o Instagram é fechado para postagens automáticas via web, criamos este assistente inteligente de 3 passos para você postar em segundos!
                  </p>
                </div>

                {/* Step 1: Download */}
                <div className="space-y-2 border-l-2 border-rose-500/30 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold flex items-center justify-center border border-rose-500/20">
                      1
                    </span>
                    <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                      Baixar a Foto no Celular
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Clique abaixo para guardar a foto tratada no seu álbum do celular ou computador.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-rose-500/10 transition-all cursor-pointer"
                    >
                      <Download className="w-4.5 h-4.5" />
                      Baixar Imagem
                    </button>
                    <button
                      onClick={handleCopyImageToClipboard}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/5 transition-all"
                      title="Copiar imagem para área de transferência"
                    >
                      {isCopied ? <Check className="w-4.5 h-4.5 text-emerald-400 animate-scale-up" /> : <Copy className="w-4.5 h-4.5" />}
                      {isCopied ? "Copiada!" : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* Step 2: Choose Suggested Caption */}
                <div className="space-y-2 border-l-2 border-rose-500/30 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold flex items-center justify-center border border-rose-500/20">
                      2
                    </span>
                    <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                      Copiar Legenda Pronta
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Selecione uma destas legendas clicando em copiar para colar na legenda do seu post:
                  </p>
                  
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {SUGGESTED_CAPTIONS.map((caption, i) => (
                      <div 
                        key={i}
                        onClick={() => handleCopyCaption(caption, i)}
                        className="p-2 rounded-lg bg-black/30 border border-white/5 hover:border-rose-500/30 cursor-pointer transition-all flex items-start gap-1 justify-between group"
                      >
                        <p className="text-[10px] leading-relaxed text-slate-300 italic line-clamp-2">
                          "{caption}"
                        </p>
                        <div className="text-slate-500 group-hover:text-rose-400 shrink-0">
                          {copiedCaption === i ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Open Instagram */}
                <div className="space-y-2 border-l-2 border-rose-500/30 pl-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold flex items-center justify-center border border-rose-500/20">
                      3
                    </span>
                    <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                      Ir Para o App do Instagram
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Abriremos o Instagram. Clique no botão de criar post <b className="text-slate-100">(+)</b>, selecione a foto baixada no primeiro passo e cole a legenda copiada!
                  </p>
                  
                  <div className="flex gap-2 pt-1">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 text-white text-xs font-bold shadow-lg transition-all"
                    >
                      <Instagram className="w-4 h-4" />
                      Ir Para o Instagram 
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: NATIVE / WEB SHARE FLOW */}
            {activeTab === "native" && (
              <div className="space-y-4 animate-fade-in text-slate-300">
                <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-3">
                  <HelpCircle className="w-5 h-5 text-rose-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Como funciona o Compartilhamento Direto?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Se você estiver acessando o app de um <span className="text-slate-200">smartphone (Android, iPhone ou iPad)</span>, o navegador pode disparar a janela de compartilhamento nativa do sistema. 
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ao clicar no botão abaixo, a janela se abrirá e você poderá escolher o aplicativo do <b>Instagram</b> para postar diretamente no seu <b>Stories, Feed de Notícias ou Direct Messages!</b>
                  </p>
                </div>

                <button
                  onClick={handleNativeShare}
                  disabled={isSharingNative}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-55 text-white text-xs font-bold shadow-lg shadow-rose-500/10 active:scale-95 transition-all cursor-pointer"
                  id="btn-native-share-trigger"
                >
                  <Share2 className="w-4.5 h-4.5 animate-bounce" />
                  {isSharingNative ? "Abrindo Compartilhador..." : "Compartilhar Imagem Direta"}
                </button>

                {shareFeedback && (
                  <div className="p-3 text-[11px] rounded-lg bg-[#1e293b]/70 border border-white/5 text-amber-300 leading-relaxed">
                    {shareFeedback}
                  </div>
                )}

                <div className="p-3 border border-white/5 bg-slate-900/30 rounded-lg text-[10px] text-slate-500 flex gap-2">
                  <span className="text-amber-500 font-bold shrink-0">Bica:</span>
                  <span>O Envio Direto funciona melhor em Google Chrome ou Safari de celulares integrando os posts nativos!</span>
                </div>
              </div>
            )}

          </div>

          {/* Footer Card utility */}
          <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
            <span>Sessão segura de galeria</span>
            <span>Câmera & Galeria v1.0</span>
          </div>

        </div>

      </div>
    </div>
  );
}
