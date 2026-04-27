export const POINTS_BY_OUTCOME: Record<string, number> = {
  single: 100,
  double: 200,
  triple: 400,
  home_run: 600,
  out: 75,
  walk: 250,
  strikeout: 250,
};

/** Points awarded for a correct pick. The 7th-inning stretch doubles all points. */
export function pointsForCorrect(
  outcome: string,
  inning?: number | null,
): number {
  const base = POINTS_BY_OUTCOME[outcome] ?? 100;
  const multiplier = inning === 7 ? 2 : 1;
  return base * multiplier;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
