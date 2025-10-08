export function mapShaliahToTelegramLocale(
  shaliahLocale: string | null | undefined,
): string {
  if (!shaliahLocale) return "pt_BR";
  const map: Record<string, string> = {
    "pt-BR": "pt_BR",
    "en-US": "en_US",
  };
  return map[shaliahLocale] ?? shaliahLocale;
}
