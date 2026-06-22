/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SavedPhoto {
  id: string;
  blob: Blob;
  createdAt: Date;
  title?: string;
  favorite?: boolean;
}

export type AspectRatioType = "1:1" | "4:3" | "16:9" | "full";

export interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  className: string; // Tailwind class to style container aspect ratio
  aspectDecimal: number;
}

export interface CameraFilter {
  id: string;
  name: string;
  cssStyle: string; // The standard CSS filter rules applied to the video & canvas
}

export const CAMERA_FILTERS: CameraFilter[] = [
  { id: "normal", name: "Normal", cssStyle: "none" },
  { id: "bw", name: "P&B", cssStyle: "grayscale(100%)" },
  { id: "vintage", name: "Vintage", cssStyle: "sepia(50%) contrast(115%) brightness(95%)" },
  { id: "warm", name: "Cálido", cssStyle: "sepia(25%) saturate(145%) contrast(105%)" },
  { id: "cool", name: "Frio", cssStyle: "saturate(90%) hue-rotate(10deg) brightness(105%) contrast(95%)" },
  { id: "dramatic", name: "Drama", cssStyle: "contrast(135%) saturate(115%) brightness(90%)" },
  { id: "retro", name: "Nostalgia", cssStyle: "sepia(25%) saturate(120%) contrast(110%) hue-rotate(-10deg)" }
];

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: "1:1", label: "1:1 (Quadrada)", className: "aspect-square", aspectDecimal: 1 },
  { id: "4:3", label: "4:3 (Retrato)", className: "aspect-[4/3]", aspectDecimal: 4 / 3 },
  { id: "16:9", label: "16:9 (Stories)", className: "aspect-[9/16]", aspectDecimal: 9 / 16 }, // swapped for vertical/mobile orientation!
  { id: "full", label: "Cheia", className: "h-full w-full", aspectDecimal: 0 }
];

export const SUGGESTED_CAPTIONS = [
  "Capturado com o app Câmera & Galeria! 📸✨ #camera #photooftheday",
  "Momento especial registrado na hora! 🌟 #instaphoto #capture",
  "Foco, ângulo e clique! Voltando pro feed com tudo. ⚡️ #aesthetic #feed",
  "Colecionando momentos imperfeitos de forma perfeita. 🎞️ #vintage #memory",
  "A vida acontece em frações de segundos. Registro feito! 🌅 #goodvibes #lifestyle"
];
