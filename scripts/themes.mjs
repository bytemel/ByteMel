// One palette per GitHub theme. Every SVG in the README is drawn twice from these,
// and the README swaps them with <picture> so text stays readable in light and dark mode.

export const THEMES = {
  dark: {
    bg: "#0d1117",
    panel: "#010409",
    border: "#30363d",
    text: "#e6edf3",
    muted: "#8b949e",
    accent: "#00ff41",
    down: "#ff3b3b",
    shades: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
    snake: "#00ff41",
    snakeHead: "#eafff0",
    glow: true,
  },
  light: {
    bg: "#f6f8fa",
    panel: "#ffffff",
    border: "#d0d7de",
    text: "#1f2328",
    muted: "#59636e",
    accent: "#1a7f37",
    down: "#cf222e",
    shades: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    snake: "#1f2328",
    snakeHead: "#1a7f37",
    glow: false,
  },
};

export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
