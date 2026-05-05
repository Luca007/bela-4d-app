// Color palette configuration
export const Colors = {
  // Base
  bg: "#0c0c0e",
  text: "#f0f0f4",
  muted: "#8a8aa0",
  
  // Primary gradient
  pink: "#f0059a",
  pinkGlow: "rgba(240,5,154,0.28)",
  pinkLight: "#ff4dc4",
  
  // Status colors
  success: "#1fcc74",
  warning: "#f59e0b",
  danger: "#f43f5e",
  
  // Accent colors
  gold: "#eab308",
  silver: "#94a3b8",
  bronze: "#b45309",
  purple: "#a78bfa",
  blue: "#38bdf8",
  
  // Glass effect
  glass: "rgba(255,255,255,0.055)",
  border: "rgba(255,255,255,0.09)",
};

export const getRGBAColor = (hex, alpha) => {
  const hex2rgb = hex.replace(/^#/, '').match(/.{1,2}/g);
  const [r, g, b] = hex2rgb.map(x => parseInt(x, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
