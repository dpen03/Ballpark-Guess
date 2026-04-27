import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  useGetMlbSchedule,
  useJoinMlbGame,
  useJoinGame,
  getGetMlbScheduleQueryKey,
  type MlbScheduledGame,
} from "@workspace/api-client-react";
import { saveSession } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, Radio, Trophy, Clock, KeyRound, BarChart3 } from "lucide-react";
import { TeamLogo } from "@/components/team-badge";
import { Link } from "wouter";

function formatGameTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function GameCardStatus({ g }: { g: MlbScheduledGame }) {
  if (g.abstractGameState === "Live") {
    return (
      <div className="flex items-center gap-1.5 text-destructive">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-wider">
          Live
        </span>
      </div>
    );
  }
  if (g.abstractGameState === "Final") {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Trophy className="h-3 w-3" />
        <span className="text-[11px] font-extrabold uppercase tracking-wider">
          Final
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span className="text-[11px] font-extrabold uppercase tracking-wider">
        {formatGameTime(g.gameDate)}
      </span>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [joiningPk, setJoiningPk] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);

  const joinMlb = useJoinMlbGame();
  const joinByCode = useJoinGame();

  const { data: mlbGames, isLoading, error, refetch } = useGetMlbSchedule(
    undefined,
    {
      query: {
        queryKey: getGetMlbScheduleQueryKey(),
        staleTime: 60_000,
        refetchInterval: 60_000,
      },
    },
  );

  const sortedGames = useMemo(() => {
    if (!mlbGames) return [];
    const order = (g: MlbScheduledGame) =>
      g.abstractGameState === "Live"
        ? 0
        : g.abstractGameState === "Preview"
          ? 1
          : 2;
    return [...mlbGames].sort((a, b) => {
      const o = order(a) - order(b);
      if (o !== 0) return o;
      return a.gameDate.localeCompare(b.gameDate);
    });
  }, [mlbGames]);

  const handleJoin = async (g: MlbScheduledGame) => {
    if (!user) return;
    setJoiningPk(g.gamePk);
    try {
      const res = await joinMlb.mutateAsync({
        gamePk: g.gamePk,
        data: { name: user.displayName, avatar: user.avatar },
      });
      saveSession({
        code: res.game.code,
        playerId: res.player.id,
        name: res.player.name,
        avatar: res.player.avatar,
        isHost: false,
      });
      setLocation(`/game/${res.game.code}`);
    } catch (err: any) {
      toast.error(err?.message || "Could not join that game");
      setJoiningPk(null);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmedCode = joinCode.trim().toUpperCase();
    if (trimmedCode.length < 4) {
      toast.error("Codes are 4 characters");
      return;
    }
    setJoiningCode(true);
    try {
      const player = await joinByCode.mutateAsync({
        code: trimmedCode,
        data: { name: user.displayName, avatar: user.avatar },
      });
      saveSession({
        code: trimmedCode,
        playerId: player.id,
        name: player.name,
        avatar: player.avatar,
        isHost: false,
      });
      setLocation(`/game/${trimmedCode}`);
    } catch (err: any) {
      toast.error(err?.message || "No game with that code");
      setJoiningCode(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-[hsl(220,30%,8%)] text-background">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage:
            "radial-gradient(circle at 25% 20%, white 1px, transparent 1px), radial-gradient(circle at 75% 60%, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-12">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-base">
                ⚾️
              </div>
              <span className="text-xs font-extrabold tracking-[0.2em] text-primary uppercase">
                Ballpark Predict
              </span>
            </div>
            <Link
              href="/stats"
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-background/10 hover:bg-background/20 text-background text-[11px] font-extrabold uppercase tracking-wider transition-colors"
            >
              <BarChart3 className="h-3 w-3" />
              My Stats
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
            Today’s MLB games.<br />
            <span className="text-primary">Tap one to play.</span>
          </h1>
          <p className="mt-3 text-base text-background/70 max-w-md">
            Pick the next pitch, call the homers, beat your friends. Real games,
            real plays, live scoring.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 -mt-6 pb-12">
        {/* Identity card */}
        {user && (
          <section className="rounded-2xl bg-card border border-border shadow-sm p-4 mb-6 flex items-center gap-3">
            <div className="text-3xl w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
                Signed in as
              </div>
              <div className="text-base font-extrabold truncate">
                {user.displayName}
              </div>
              <div className="text-[11px] text-muted-foreground font-bold truncate">
                @{user.username}
              </div>
            </div>
            <Link
              href="/stats"
              className="shrink-0 h-9 px-3 rounded-lg bg-muted text-foreground text-[11px] font-extrabold uppercase tracking-wider flex items-center hover:bg-muted/70 transition-colors"
            >
              Profile
            </Link>
          </section>
        )}

        {/* Games */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold uppercase tracking-widest">
                Live & Upcoming
              </h2>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-3 font-medium">
                Loading today’s schedule…
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6 text-center">
              <p className="text-sm text-destructive font-bold">
                Could not reach the MLB feed.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs font-bold underline mt-2 text-destructive"
              >
                Try again
              </button>
            </div>
          ) : sortedGames.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground font-medium">
                No MLB games on the schedule today. Check back tomorrow!
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {sortedGames.map((g) => {
                const live = g.abstractGameState === "Live";
                const final = g.abstractGameState === "Final";
                const showScore =
                  (live || final) &&
                  g.awayScore !== null &&
                  g.homeScore !== null;
                const isJoining = joiningPk === g.gamePk;
                return (
                  <button
                    key={g.gamePk}
                    type="button"
                    disabled={isJoining || joinMlb.isPending}
                    onClick={() => handleJoin(g)}
                    className={`group text-left w-full rounded-2xl border bg-card transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden ${
                      live
                        ? "border-destructive/30"
                        : "border-border"
                    }`}
                  >
                    <div className="p-4 flex items-center gap-4">
                      {/* Teams */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <TeamLogo name={g.awayTeam} size={22} />
                            <span className="font-bold text-sm truncate">
                              {g.awayTeam}
                            </span>
                          </div>
                          {showScore && (
                            <span className="ml-auto font-mono font-extrabold text-lg tabular-nums">
                              {g.awayScore}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <TeamLogo name={g.homeTeam} size={22} />
                            <span className="font-bold text-sm truncate">
                              {g.homeTeam}
                            </span>
                          </div>
                          {showScore && (
                            <span className="ml-auto font-mono font-extrabold text-lg tabular-nums">
                              {g.homeScore}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <GameCardStatus g={g} />
                          {g.venue && (
                            <span className="text-[11px] text-muted-foreground truncate">
                              · {g.venue}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="shrink-0">
                        {isJoining ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <div className="px-3 h-9 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground text-primary font-extrabold text-xs uppercase tracking-wider flex items-center transition-colors">
                            {final ? "Recap" : live ? "Join" : "Play"}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-center text-[11px] text-muted-foreground mt-6 font-medium">
            Anyone tapping the same game lands in the same room.
          </p>
        </section>

        {/* Join with code */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-extrabold uppercase tracking-widest">
              Have a Code?
            </h2>
          </div>
          <form
            onSubmit={handleJoinByCode}
            className="rounded-2xl bg-card border border-border p-3 flex items-center gap-2"
          >
            <input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase().slice(0, 4))
              }
              placeholder="ABCD"
              maxLength={4}
              className="flex-1 h-12 px-4 rounded-xl bg-muted/60 border border-border text-center text-2xl font-mono font-extrabold tracking-[0.4em] uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={joinCode.length < 4 || joiningCode}
              className="h-12 px-5 rounded-xl bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {joiningCode ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Join"
              )}
            </button>
          </form>
          <p className="text-center text-[11px] text-muted-foreground mt-2 font-medium">
            Got a code or QR from a friend? Drop it in.
          </p>
        </section>
      </main>
    </div>
  );
}
