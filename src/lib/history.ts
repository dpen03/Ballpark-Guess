// Local history of games played. Stored per device in localStorage.

const KEY = "ballpark-history";
const MAX_GAMES = 50;

export interface PastGame {
  code: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number | null;
  homeScore: number | null;
  myScore: number;
  correctPicks: number;
  totalPicks: number;
  status: string; // "live", "final", "lobby"
  rank: number | null;
  totalPlayers: number;
  lastPlayed: string; // ISO
}

export function loadHistory(): PastGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PastGame[]) : [];
  } catch {
    return [];
  }
}

export function recordGameVisit(game: PastGame) {
  if (typeof window === "undefined") return;
  const all = loadHistory().filter((g) => g.code !== game.code);
  all.unshift(game);
  if (all.length > MAX_GAMES) all.length = MAX_GAMES;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* quota -- ignore */
  }
}

export interface AggregateStats {
  gamesPlayed: number;
  totalPoints: number;
  totalCorrect: number;
  totalPicks: number;
  bestScore: number;
  bestRank: number | null;
  accuracy: number; // 0..1
}

export function aggregateStats(games: PastGame[]): AggregateStats {
  let totalPoints = 0;
  let totalCorrect = 0;
  let totalPicks = 0;
  let bestScore = 0;
  let bestRank: number | null = null;
  for (const g of games) {
    totalPoints += g.myScore;
    totalCorrect += g.correctPicks;
    totalPicks += g.totalPicks;
    if (g.myScore > bestScore) bestScore = g.myScore;
    if (g.rank !== null && (bestRank === null || g.rank < bestRank)) {
      bestRank = g.rank;
    }
  }
  return {
    gamesPlayed: games.length,
    totalPoints,
    totalCorrect,
    totalPicks,
    bestScore,
    bestRank,
    accuracy: totalPicks > 0 ? totalCorrect / totalPicks : 0,
  };
}
