// Телефон/планшет (тар экран немесе саусақпен басқару) — ауыр графиканы жеңілдету үшін.
export const isLightDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 768px), (pointer: coarse)").matches
