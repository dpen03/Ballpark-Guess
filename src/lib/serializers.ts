import type {
  Game,
  Player,
  AtBat,
  PlayerPick,
  InningGuess,
} from "@workspace/db";

export function serializeGame(g: Game) {
  return {
    id: g.id,
    code: g.code,
    awayTeam: g.awayTeam,
    homeTeam: g.homeTeam,
    venue: g.venue ?? null,
    status: g.status as "lobby" | "live" | "final",
    hostPlayerId: g.hostPlayerId ?? "",
    mlbGamePk: g.mlbGamePk ?? null,
    mlbDetailedState: g.mlbDetailedState ?? null,
    mlbAwayScore: g.mlbAwayScore ?? null,
    mlbHomeScore: g.mlbHomeScore ?? null,
    mlbCurrentInning: g.mlbCurrentInning ?? null,
    mlbCurrentHalf: g.mlbCurrentHalf ?? null,
    createdAt: g.createdAt.toISOString(),
  };
}

export function serializePlayer(p: Player) {
  return {
    id: p.id,
    gameId: p.gameId,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    totalScore: p.totalScore,
    joinedAt: p.joinedAt.toISOString(),
  };
}

export function serializeAtBat(a: AtBat) {
  return {
    id: a.id,
    gameId: a.gameId,
    batterName: a.batterName,
    team: a.team,
    inning: a.inning,
    half: a.half as "top" | "bottom",
    status: a.status as "open" | "resolved",
    actualOutcome: (a.actualOutcome ?? null) as
      | "single"
      | "double"
      | "triple"
      | "home_run"
      | "out"
      | "walk"
      | "strikeout"
      | null,
    createdAt: a.createdAt.toISOString(),
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
  };
}

export function serializePicks(p: PlayerPick | undefined, gameId: string, playerId: string) {
  if (!p) {
    return {
      playerId,
      gameId,
      winnerTeam: null,
      awayFinalScore: null,
      homeFinalScore: null,
      hrHitters: [],
      totalWalks: null,
      totalStrikeouts: null,
    };
  }
  return {
    playerId: p.playerId,
    gameId: p.gameId,
    winnerTeam: p.winnerTeam ?? null,
    awayFinalScore: p.awayFinalScore ?? null,
    homeFinalScore: p.homeFinalScore ?? null,
    hrHitters: p.hrHitters ?? [],
    totalWalks: p.totalWalks ?? null,
    totalStrikeouts: p.totalStrikeouts ?? null,
  };
}

export function serializeInningGuess(g: InningGuess) {
  return {
    playerId: g.playerId,
    gameId: g.gameId,
    inning: g.inning,
    half: g.half as "top" | "bottom",
    runs: g.runs,
  };
}
