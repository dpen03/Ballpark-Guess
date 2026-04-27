import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useSession } from "@/lib/session";
import {
  useGetGameByCode,
  getGetGameByCodeQueryKey,
  useGetCurrentAtBat,
  getGetCurrentAtBatQueryKey,
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  useGetAtBatPredictionSummary,
  getGetAtBatPredictionSummaryQueryKey,
  useGetRecentActivity,
  getGetRecentActivityQueryKey,
  usePredictAtBat,
  useSyncGameWithMlb,
  PitchOutcome,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles, CheckCircle2 } from "lucide-react";
import { TeamLogo } from "@/components/team-badge";
import { CountdownPill } from "@/components/countdown-pill";
import { LockBurst } from "@/components/lock-burst";
import { sfx } from "@/lib/sounds";
import { getTeam } from "@/lib/teams";
import { recordGameVisit } from "@/lib/history";

interface OutcomeMeta {
  label: string;
  points: number;
  tally: string;
}

const OUTCOME_CONFIG: Record<PitchOutcome, OutcomeMeta> = {
  single:    { label: "1B",  points: 100, tally: "bg-sky-500" },
  double:    { label: "2B",  points: 200, tally: "bg-indigo-500" },
  triple:    { label: "3B",  points: 400, tally: "bg-violet-500" },
  home_run:  { label: "HR",  points: 600, tally: "bg-destructive" },
  out:       { label: "OUT", points: 75,  tally: "bg-zinc-400" },
  walk:      { label: "BB",  points: 250, tally: "bg-emerald-500" },
  strikeout: { label: "K",   points: 250, tally: "bg-rose-500" },
};

function formatHalf(half: string | null | undefined): string {
  if (half === "top") return "TOP";
  if (half === "bottom") return "BOT";
  if (half === "middle") return "MID";
  if (half === "end") return "END";
  return "—";
}

export default function GameScreen() {
  const { code } = useParams<{ code: string }>();
  const { session } = useSession(code || "");
  const queryClient = useQueryClient();
  const predict = usePredictAtBat();
  const syncMlb = useSyncGameWithMlb();

  const { data: gameData } = useGetGameByCode(code!, {
    query: {
      enabled: !!code,
      queryKey: getGetGameByCodeQueryKey(code!),
      refetchInterval: 10000,
    },
  });

  const { data: currentAbData } = useGetCurrentAtBat(code!, {
    query: {
      enabled: !!code,
      queryKey: getGetCurrentAtBatQueryKey(code!),
      refetchInterval: 3000,
    },
  });
  const currentAb = currentAbData?.atBat;

  const { data: leaderboard, isFetching: leaderboardFetching } =
    useGetLeaderboard(code!, {
      query: {
        enabled: !!code,
        queryKey: getGetLeaderboardQueryKey(code!),
        refetchInterval: 3000,
      },
    });

  // Track last-seen score per player so we can flash a +N delta when it bumps.
  const lastScoresRef = useRef<Map<string, number>>(new Map());
  const [scoreDeltas, setScoreDeltas] = useState<Map<string, number>>(new Map());
  const myPrevScoreRef = useRef<number | null>(null);
  useEffect(() => {
    if (!leaderboard) return;
    const next = new Map<string, number>();
    const deltas = new Map<string, number>();
    for (const entry of leaderboard) {
      const prev = lastScoresRef.current.get(entry.playerId);
      if (prev !== undefined && entry.totalScore > prev) {
        deltas.set(entry.playerId, entry.totalScore - prev);
      }
      next.set(entry.playerId, entry.totalScore);
    }
    lastScoresRef.current = next;

    // Sound when YOU gain points
    if (session?.playerId) {
      const me = leaderboard.find((p) => p.playerId === session.playerId);
      if (me) {
        if (
          myPrevScoreRef.current !== null &&
          me.totalScore > myPrevScoreRef.current
        ) {
          sfx.scoreUp();
        }
        myPrevScoreRef.current = me.totalScore;
      }
    }

    if (deltas.size > 0) {
      setScoreDeltas(deltas);
      const t = window.setTimeout(() => setScoreDeltas(new Map()), 2400);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [leaderboard, session?.playerId]);

  const { data: summary } = useGetAtBatPredictionSummary(currentAb?.id || "", {
    query: {
      enabled: !!currentAb?.id && currentAb.status === "open",
      queryKey: getGetAtBatPredictionSummaryQueryKey(currentAb?.id || ""),
      refetchInterval: 2000,
    },
  });

  const { data: activity } = useGetRecentActivity(code!, {
    query: {
      enabled: !!code,
      queryKey: getGetRecentActivityQueryKey(code!),
      refetchInterval: 5000,
    },
  });

  const [lockedPrediction, setLockedPrediction] = useState<PitchOutcome | null>(null);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    setLockedPrediction(null);
    setShowBurst(false);
  }, [currentAb?.id]);

  const isMlbLinked = !!gameData?.game.mlbGamePk;
  useEffect(() => {
    if (!code || !isMlbLinked) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await syncMlb.mutateAsync({ code });
        if (res.resolvedCount > 0 || res.openedCurrent) {
          queryClient.invalidateQueries({ queryKey: getGetCurrentAtBatQueryKey(code) });
          queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey(code) });
          queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey(code) });
          queryClient.invalidateQueries({ queryKey: getGetGameByCodeQueryKey(code) });
        }
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = window.setInterval(tick, 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isMlbLinked]);

  const isStretch = currentAb?.inning === 7 && currentAb?.status === "open";

  const handlePredict = async (outcome: PitchOutcome) => {
    if (!session || !currentAb) return;
    const isChange = lockedPrediction !== null && lockedPrediction !== outcome;
    if (lockedPrediction === outcome) {
      sfx.tap();
      return;
    }
    const previous = lockedPrediction;
    if (isChange) sfx.unlock();
    sfx.lock();
    setLockedPrediction(outcome);
    setShowBurst(true);
    window.setTimeout(() => setShowBurst(false), 700);
    try {
      await predict.mutateAsync({
        atBatId: currentAb.id,
        data: { playerId: session.playerId, prediction: outcome },
      });
      toast.success(
        isChange ? `Switched to ${OUTCOME_CONFIG[outcome].label}` : "Pick locked!",
      );
      queryClient.invalidateQueries({
        queryKey: getGetAtBatPredictionSummaryQueryKey(currentAb.id),
      });
    } catch (err: any) {
      setLockedPrediction(previous);
      toast.error(err.message || "Failed to submit pick");
    }
  };

  // Record this game in local history whenever something material changes.
  const myEntry = leaderboard?.find((p) => p.playerId === session?.playerId);
  const myRank = myEntry
    ? (leaderboard?.findIndex((p) => p.playerId === session?.playerId) ?? -1) + 1
    : null;
  useEffect(() => {
    if (!gameData?.game || !code) return;
    recordGameVisit({
      code,
      awayTeam: gameData.game.awayTeam,
      homeTeam: gameData.game.homeTeam,
      awayScore: gameData.game.mlbAwayScore ?? null,
      homeScore: gameData.game.mlbHomeScore ?? null,
      myScore: myEntry?.totalScore ?? 0,
      correctPicks: myEntry?.correctPicks ?? 0,
      totalPicks: myEntry?.totalPicks ?? 0,
      status: gameData.game.status,
      rank: myRank && myRank > 0 ? myRank : null,
      totalPlayers: leaderboard?.length ?? 0,
      lastPlayed: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    code,
    gameData?.game?.status,
    gameData?.game?.mlbAwayScore,
    gameData?.game?.mlbHomeScore,
    myEntry?.totalScore,
    myEntry?.correctPicks,
    myEntry?.totalPicks,
    myRank,
    leaderboard?.length,
  ]);

  if (!code) return null;

  const game = gameData?.game;
  const isFinal = game?.status === "final";
  const isLive = game?.mlbDetailedState && !isFinal;
  const totalPicks = summary?.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const awayTeamInfo = game ? getTeam(game.awayTeam) : null;
  const homeTeamInfo = game ? getTeam(game.homeTeam) : null;
  const accuracy =
    myEntry && myEntry.totalPicks > 0
      ? Math.round((myEntry.correctPicks / myEntry.totalPicks) * 100)
      : 0;

  return (
    <Layout code={code}>
      {/* Scoreboard with team logos + colors */}
      {game && awayTeamInfo && homeTeamInfo && (
        <section className="rounded-2xl bg-foreground text-background overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(90deg, ${awayTeamInfo.primary} 0%, transparent 35%, transparent 65%, ${homeTeamInfo.primary} 100%)`,
            }}
          />
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-stretch">
            <div className="p-4">
              <div className="text-[10px] font-extrabold tracking-widest text-background/60 uppercase mb-1">
                Away
              </div>
              <div className="flex items-center gap-2 mb-1">
                <TeamLogo
                  name={game.awayTeam}
                  size={28}
                  className="rounded-full bg-white/95 p-0.5"
                />
                <span className="font-mono text-[10px] font-extrabold tracking-wider">
                  {awayTeamInfo.abbr}
                </span>
              </div>
              <div className="font-extrabold text-sm leading-tight truncate">
                {game.awayTeam}
              </div>
              <div className="font-mono font-extrabold text-4xl tabular-nums mt-1.5">
                {game.mlbAwayScore ?? 0}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-3 border-x border-background/10">
              <div className="text-[10px] font-extrabold tracking-widest text-background/60 uppercase">
                {isFinal
                  ? "Final"
                  : game.mlbCurrentInning
                    ? `${formatHalf(game.mlbCurrentHalf)} ${game.mlbCurrentInning}`
                    : "Pre-Game"}
              </div>
              {isLive && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-destructive">
                    Live
                  </span>
                </div>
              )}
              {game.mlbCurrentInning === 7 && !isFinal && (
                <div className="mt-1.5 px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground text-[9px] font-extrabold tracking-wider uppercase flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Stretch 2x
                </div>
              )}
              {game.mlbDetailedState && (
                <div className="text-[10px] font-bold text-background/40 mt-1 text-center max-w-[8ch] truncate">
                  {game.mlbDetailedState}
                </div>
              )}
            </div>
            <div className="p-4 text-right">
              <div className="text-[10px] font-extrabold tracking-widest text-background/60 uppercase mb-1">
                Home
              </div>
              <div className="flex items-center gap-2 mb-1 justify-end">
                <span className="font-mono text-[10px] font-extrabold tracking-wider">
                  {homeTeamInfo.abbr}
                </span>
                <TeamLogo
                  name={game.homeTeam}
                  size={28}
                  className="rounded-full bg-white/95 p-0.5"
                />
              </div>
              <div className="font-extrabold text-sm leading-tight truncate">
                {game.homeTeam}
              </div>
              <div className="font-mono font-extrabold text-4xl tabular-nums mt-1.5">
                {game.mlbHomeScore ?? 0}
              </div>
            </div>
          </div>
        </section>
      )}

      {isFinal && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl bg-accent/15 border border-accent/30 text-accent-foreground px-4 py-3 flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          <span className="font-extrabold uppercase text-sm tracking-wider">
            Game Over
          </span>
        </motion.div>
      )}

      {/* My stats card */}
      {myEntry && (
        <section className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-extrabold tracking-widest uppercase text-muted-foreground">
              You
            </div>
            {myRank && (
              <div className="text-[10px] font-extrabold tracking-widest uppercase text-muted-foreground">
                Rank #{myRank} of {leaderboard?.length}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatBlock label="Score" value={myEntry.totalScore.toLocaleString()} highlight />
            <StatBlock label="Correct" value={`${myEntry.correctPicks}/${myEntry.totalPicks}`} />
            <StatBlock label="Accuracy" value={`${accuracy}%`} />
          </div>
        </section>
      )}

      {/* Live At-Bat */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <h3 className="text-xs font-extrabold tracking-widest uppercase">
              At Bat
            </h3>
            {isStretch && (
              <span className="px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground text-[9px] font-extrabold tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                2x Points
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentAb && currentAb.status === "open" && (
              <CountdownPill roundKey={currentAb.id} seconds={25} />
            )}
            {totalPicks > 0 && (
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {totalPicks} pick{totalPicks === 1 ? "" : "s"}
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {currentAb && currentAb.status === "open" ? (
              <motion.div
                key={currentAb.id}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span>
                    {currentAb.team} ·{" "}
                    {currentAb.half === "top" ? "Top" : "Bot"} {currentAb.inning}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-center mb-4">
                  {currentAb.batterName}
                </div>

                {/* Big in-your-face LOCKED banner */}
                <AnimatePresence>
                  {lockedPrediction && (
                    <motion.div
                      key="locked-banner"
                      initial={{ y: -12, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="w-full mb-4 rounded-xl bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg shadow-primary/30 relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-primary-foreground/10"
                        animate={{ opacity: [0.05, 0.2, 0.05] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                        className="shrink-0 relative"
                      >
                        <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
                      </motion.div>
                      <div className="flex-1 min-w-0 relative">
                        <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase opacity-80">
                          Pick Locked In
                        </div>
                        <div className="font-extrabold text-lg leading-tight">
                          {OUTCOME_CONFIG[lockedPrediction].label}
                          {" "}
                          <span className="opacity-80 text-sm font-bold">
                            for +
                            {(isStretch ? 2 : 1) *
                              OUTCOME_CONFIG[lockedPrediction].points}
                            {isStretch && " (2x)"}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-[10px] font-extrabold uppercase tracking-widest opacity-90 text-right leading-tight">
                        Tap another<br />to switch
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full grid grid-cols-3 gap-2 relative">
                  {(Object.entries(OUTCOME_CONFIG) as [PitchOutcome, OutcomeMeta][]).map(
                    ([key, cfg]) => {
                      const isHomer = key === "home_run";
                      const isLocked = lockedPrediction === key;
                      const isOtherLocked =
                        lockedPrediction !== null && !isLocked;
                      const displayPoints = isStretch ? cfg.points * 2 : cfg.points;
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          onClick={() => handlePredict(key)}
                          whileTap={{ scale: 0.94 }}
                          animate={
                            isLocked
                              ? {
                                  scale: [1, 1.08, 1.04],
                                  transition: {
                                    duration: 1.4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  },
                                }
                              : { scale: 1 }
                          }
                          className={`relative rounded-xl border h-16 flex flex-col items-center justify-center font-extrabold transition-colors ${
                            isHomer ? "col-span-3 h-16" : ""
                          } ${
                            isLocked
                              ? "bg-primary text-primary-foreground border-primary border-2 shadow-xl shadow-primary/40"
                              : isOtherLocked
                                ? "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                                : "bg-card hover:bg-muted text-foreground border-border"
                          }`}
                        >
                          {/* Continuous ring pulse on locked button */}
                          {isLocked && (
                            <motion.span
                              className="absolute -inset-1 rounded-xl border-2 border-primary"
                              animate={{
                                opacity: [0.6, 0, 0.6],
                                scale: [1, 1.08, 1],
                              }}
                              transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          )}
                          {isLocked && showBurst && <LockBurst />}
                          <div className="flex items-center gap-1.5 relative">
                            <span className="text-base">{cfg.label}</span>
                            {isLocked && (
                              <motion.span
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 500 }}
                                className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-foreground text-primary text-xs font-black"
                              >
                                ✓
                              </motion.span>
                            )}
                          </div>
                          <div
                            className={`text-[10px] font-bold tabular-nums tracking-wider relative ${
                              isLocked ? "text-primary-foreground/90" : "text-muted-foreground"
                            }`}
                          >
                            +{displayPoints}
                            {isStretch && (
                              <span className="ml-1 text-accent">2x</span>
                            )}
                          </div>
                        </motion.button>
                      );
                    },
                  )}
                </div>

                {summary && summary.length > 0 && (
                  <div className="w-full mt-5 space-y-1.5">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Crowd
                    </div>
                    {summary.map((s) => {
                      const pct =
                        totalPicks > 0 ? (s.count / totalPicks) * 100 : 0;
                      return (
                        <div
                          key={s.outcome}
                          className="flex items-center gap-2 text-xs font-bold"
                        >
                          <div className="w-9 font-mono text-muted-foreground">
                            {OUTCOME_CONFIG[s.outcome].label}
                          </div>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${OUTCOME_CONFIG[s.outcome].tally}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                          <div className="w-6 text-right tabular-nums text-muted-foreground">
                            {s.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 flex flex-col items-center text-center text-muted-foreground"
              >
                <motion.div
                  className="text-3xl mb-2"
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  ⚾️
                </motion.div>
                <div className="text-sm font-bold uppercase tracking-wider">
                  Waiting for next batter
                </div>
                <div className="text-xs mt-1 text-muted-foreground/70">
                  Plays sync from the live MLB feed every few seconds.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${
                  leaderboardFetching ? "animate-ping" : ""
                }`}
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <h3 className="text-xs font-extrabold tracking-widest uppercase">
              Live Leaderboard
            </h3>
          </div>
          {leaderboard && leaderboard.length > 0 && (
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {leaderboard.length} player{leaderboard.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
        {leaderboard && leaderboard.length > 0 ? (
          <ol className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {leaderboard.map((entry, idx) => {
                const isMe = session?.playerId === entry.playerId;
                const rankBadge =
                  idx === 0
                    ? "bg-accent text-accent-foreground"
                    : idx === 1
                      ? "bg-muted-foreground/20 text-foreground"
                      : idx === 2
                        ? "bg-amber-700/20 text-amber-900"
                        : "bg-transparent text-muted-foreground";
                const delta = scoreDeltas.get(entry.playerId);
                const rowAccuracy =
                  entry.totalPicks > 0
                    ? Math.round((entry.correctPicks / entry.totalPicks) * 100)
                    : null;
                return (
                  <motion.li
                    key={entry.playerId}
                    layout
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      isMe ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-extrabold ${rankBadge}`}
                    >
                      {idx + 1}
                    </div>
                    <div className="text-xl">{entry.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">
                        {entry.name}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                            you
                          </span>
                        )}
                      </div>
                      {rowAccuracy !== null && (
                        <div className="text-[10px] font-bold text-muted-foreground tabular-nums">
                          {entry.correctPicks}/{entry.totalPicks} · {rowAccuracy}%
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <div className="font-mono font-extrabold tabular-nums">
                        {entry.totalScore}
                      </div>
                      <AnimatePresence>
                        {delta !== undefined && delta > 0 && (
                          <motion.div
                            key={`d-${entry.totalScore}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: -14 }}
                            exit={{ opacity: 0, y: -22 }}
                            transition={{ duration: 1.6 }}
                            className="absolute right-0 -top-1 text-[10px] font-extrabold text-primary tabular-nums pointer-events-none"
                          >
                            +{delta}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No players yet — be the first.
          </div>
        )}
      </section>

      {/* Recent Plays */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/40">
          <h3 className="text-xs font-extrabold tracking-widest uppercase">
            Recent Plays
          </h3>
        </div>
        {activity && activity.length > 0 ? (
          <ul className="divide-y divide-border">
            {activity.map((event) => {
              const cfg = OUTCOME_CONFIG[event.outcome];
              const isStretchPlay = event.inning === 7;
              return (
                <li
                  key={event.id}
                  className="px-4 py-2.5 flex items-center gap-3"
                >
                  <div className="font-mono text-[10px] text-muted-foreground w-10 shrink-0">
                    {event.half === "top" ? "T" : "B"}
                    {event.inning}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {event.batterName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {event.awardedCount} won · +
                      {isStretchPlay ? cfg.points * 2 : cfg.points}
                      {isStretchPlay && (
                        <span className="ml-1 text-accent font-extrabold">2x</span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 px-2 h-7 rounded-md font-mono font-extrabold text-xs flex items-center ${cfg.tally} text-white`}
                  >
                    {cfg.label}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No plays yet. Hang tight.
          </div>
        )}
      </section>
    </Layout>
  );
}

function StatBlock({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-2.5 ${
        highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/40"
      }`}
    >
      <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-mono font-extrabold text-lg tabular-nums leading-tight mt-0.5 ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
