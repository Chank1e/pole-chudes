export function normalizeLetter(ch: string): string {
  const t = ch.trim();
  if (!t) return "";
  const u = t.toLocaleUpperCase("ru-RU");
  return u === "Ё" ? "Е" : u;
}
