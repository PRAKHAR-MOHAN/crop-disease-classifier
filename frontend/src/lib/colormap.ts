/**
 * Colormap utilities for Grad-CAM overlay rendering on HTML5 <canvas>.
 */

export type ColormapName = "jet" | "viridis";

export function getJetColor(val: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));
  let r = 0;
  let g = 0;
  let b = 0;

  if (v < 0.125) {
    r = 0;
    g = 0;
    b = 0.5 + v * 4;
  } else if (v < 0.375) {
    r = 0;
    g = (v - 0.125) * 4;
    b = 1;
  } else if (v < 0.625) {
    r = (v - 0.375) * 4;
    g = 1;
    b = 1 - (v - 0.375) * 4;
  } else if (v < 0.875) {
    r = 1;
    g = 1 - (v - 0.625) * 4;
    b = 0;
  } else {
    r = 1 - (v - 0.875) * 4 * 0.5;
    g = 0;
    b = 0;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function getViridisColor(val: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, val));
  // Viridis approximation
  const r = Math.round(Math.max(0, Math.min(255, 68 + v * (253 - 68) * Math.sin(v * Math.PI))));
  const g = Math.round(Math.max(0, Math.min(255, 1 + v * 231)));
  const b = Math.round(Math.max(0, Math.min(255, 84 + (1 - v) * 140)));
  return [r, g, b];
}

