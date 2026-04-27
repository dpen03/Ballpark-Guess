export type MlbOutcome =
  | "single"
  | "double"
  | "triple"
  | "home_run"
  | "out"
  | "walk"
  | "strikeout";

export interface MlbScheduledGame {
  gamePk: number;
  awayTeam: string;
  homeTeam: string;
  venue: string;
  gameDate: string;
  detailedState: string;
  abstractGameState: string;
  awayScore: number | null;
  homeScore: number | null;
}

export interface MlbLivePlay {
  atBatIndex: number;
  inning: number;
  half: "top" | "bottom";
  batterName: string;
  team: string;
  isComplete: boolean;
  outcome: MlbOutcome | null;
  awayScore: number | null;
  homeScore: number | null;
}

export interface MlbLiveSummary {
  detailedState: string;
  abstractGameState: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number | null;
  homeScore: number | null;
  currentInning: number | null;
  currentHalf: "top" | "bottom" | null;
  isFinal: boolean;
  plays: MlbLivePlay[];
  currentPlay: MlbLivePlay | null;
}

function todayInEastern(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

export async function fetchSchedule(date?: string): Promise<MlbScheduledGame[]> {
  const d = date ?? todayInEastern();
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${d}&hydrate=venue`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MLB schedule request failed: ${res.status}`);
  }
  const data = (await res.json()) as any;
  const games = (data?.dates?.[0]?.games ?? []) as any[];
  return games.map((g) => ({
    gamePk: g.gamePk,
    awayTeam: g.teams?.away?.team?.name ?? "Away",
    homeTeam: g.teams?.home?.team?.name ?? "Home",
    venue: g.venue?.name ?? "",
    gameDate: g.gameDate,
    detailedState: g.status?.detailedState ?? "Scheduled",
    abstractGameState: g.status?.abstractGameState ?? "Preview",
    awayScore: typeof g.teams?.away?.score === "number" ? g.teams.away.score : null,
    homeScore: typeof g.teams?.home?.score === "number" ? g.teams.home.score : null,
  }));
}

function mapEvent(eventType: string | undefined, isOut: boolean): MlbOutcome | null {
  if (!eventType) return null;
  const e = eventType.toLowerCase();
  if (e === "single") return "single";
  if (e === "double") return "double";
  if (e === "triple") return "triple";
  if (e === "home_run") return "home_run";
  if (e === "walk" || e === "intent_walk") return "walk";
  if (e.startsWith("strikeout")) return "strikeout";
  // Anything else that constitutes a completed at-bat outcome: treat as "out".
  // Skip non-AB events (caught_stealing, pickoff, etc.) — they have type !== 'atBat'.
  if (isOut) return "out";
  // Hit-by-pitch, sac, fielders choice etc. — treat as out for kid-friendly play
  return "out";
}

function normalizePlay(p: any): MlbLivePlay | null {
  const result = p?.result;
  const about = p?.about;
  const matchup = p?.matchup;
  if (!about || !matchup?.batter) return null;
  if (result?.type && result.type !== "atBat") return null;
  const inning = about.inning;
  const half: "top" | "bottom" = about.isTopInning ? "top" : "bottom";
  const isComplete = !!about.isComplete;
  const outcome = isComplete ? mapEvent(result?.eventType, !!result?.isOut) : null;
  return {
    atBatIndex: about.atBatIndex,
    inning,
    half,
    batterName: matchup.batter.fullName ?? "Batter",
    // team is implied by half: top => away batting, bottom => home batting
    team: half === "top" ? "away" : "home",
    isComplete,
    outcome,
    awayScore: typeof result?.awayScore === "number" ? result.awayScore : null,
    homeScore: typeof result?.homeScore === "number" ? result.homeScore : null,
  };
}

export interface MlbRosterPlayer {
  id: number;
  name: string;
  position: string;
  jerseyNumber: string | null;
}

export interface MlbRosterResult {
  awayTeam: string;
  homeTeam: string;
  away: MlbRosterPlayer[];
  home: MlbRosterPlayer[];
}

export async function fetchScheduleEntry(
  gamePk: number,
): Promise<MlbScheduledGame | null> {
  // Hit the schedule endpoint by gamePk to fetch the matchup metadata.
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk=${gamePk}&hydrate=venue`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  for (const date of data?.dates ?? []) {
    for (const g of date?.games ?? []) {
      if (g.gamePk === gamePk) {
        return {
          gamePk: g.gamePk,
          awayTeam: g.teams?.away?.team?.name ?? "Away",
          homeTeam: g.teams?.home?.team?.name ?? "Home",
          venue: g.venue?.name ?? "",
          gameDate: g.gameDate,
          detailedState: g.status?.detailedState ?? "Scheduled",
          abstractGameState: g.status?.abstractGameState ?? "Preview",
          awayScore:
            typeof g.teams?.away?.score === "number"
              ? g.teams.away.score
              : null,
          homeScore:
            typeof g.teams?.home?.score === "number"
              ? g.teams.home.score
              : null,
        };
      }
    }
  }
  return null;
}

export async function fetchRoster(gamePk: number): Promise<MlbRosterResult> {
  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MLB boxscore request failed: ${res.status}`);
  }
  const data = (await res.json()) as any;
  const buildSide = (side: any): MlbRosterPlayer[] => {
    const players = Object.values(side?.players ?? {}) as any[];
    // Prefer everyday position players (non-pitchers); fall back to all.
    const batters = players.filter(
      (p) => p?.position?.abbreviation && p.position.abbreviation !== "P",
    );
    const list = (batters.length > 0 ? batters : players).map((p) => ({
      id: p?.person?.id ?? 0,
      name: p?.person?.fullName ?? "Unknown",
      position: p?.position?.abbreviation ?? "?",
      jerseyNumber: p?.jerseyNumber ?? null,
    }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  };
  return {
    awayTeam: data?.teams?.away?.team?.name ?? "Away",
    homeTeam: data?.teams?.home?.team?.name ?? "Home",
    away: buildSide(data?.teams?.away),
    home: buildSide(data?.teams?.home),
  };
}

export async function fetchLiveFeed(gamePk: number): Promise<MlbLiveSummary> {
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MLB live feed request failed: ${res.status}`);
  }
  const data = (await res.json()) as any;
  const status = data?.gameData?.status;
  const teams = data?.gameData?.teams;
  const linescore = data?.liveData?.linescore;
  const allPlays: any[] = data?.liveData?.plays?.allPlays ?? [];
  const currentPlayRaw = data?.liveData?.plays?.currentPlay ?? null;

  const plays = allPlays
    .map(normalizePlay)
    .filter((p): p is MlbLivePlay => p !== null);

  const currentPlay = currentPlayRaw ? normalizePlay(currentPlayRaw) : null;

  const detailedState: string = status?.detailedState ?? "Scheduled";
  const abstractGameState: string = status?.abstractGameState ?? "Preview";
  const isFinal = abstractGameState === "Final";

  const currentHalfRaw: string | undefined = linescore?.inningHalf?.toLowerCase();
  const currentHalf: "top" | "bottom" | null =
    currentHalfRaw === "top"
      ? "top"
      : currentHalfRaw === "bottom"
        ? "bottom"
        : null;

  return {
    detailedState,
    abstractGameState,
    awayTeam: teams?.away?.name ?? "Away",
    homeTeam: teams?.home?.name ?? "Home",
    awayScore:
      typeof linescore?.teams?.away?.runs === "number"
        ? linescore.teams.away.runs
        : null,
    homeScore:
      typeof linescore?.teams?.home?.runs === "number"
        ? linescore.teams.home.runs
        : null,
    currentInning:
      typeof linescore?.currentInning === "number"
        ? linescore.currentInning
        : null,
    currentHalf,
    isFinal,
    plays,
    currentPlay,
  };
}
