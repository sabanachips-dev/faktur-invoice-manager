export function navigateBack({ historyLength, fallbackPath, goToHistory, goToFallback }: { historyLength: number; fallbackPath: string; goToHistory: () => void; goToFallback: (path: string) => void }) {
  if (historyLength > 1) {
    goToHistory();
    return "history" as const;
  }
  goToFallback(fallbackPath);
  return "fallback" as const;
}
