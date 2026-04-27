import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useSession } from "@/lib/session";
import {
  useGetPlayerPicks,
  useSavePlayerPicks,
  getGetPlayerPicksQueryKey,
  useGetGameByCode,
  getGetGameByCodeQueryKey,
  useGetMlbRoster,
  getGetMlbRosterQueryKey,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Loader2, Check } from "lucide-react";

const MAX_HR = 6;

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 30,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-9 w-9 rounded-lg bg-background hover:bg-muted flex items-center justify-center disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex-1 text-center font-mono font-extrabold text-2xl tabular-nums">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-9 w-9 rounded-lg bg-background hover:bg-muted flex items-center justify-center disabled:opacity-40"
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function PicksScreen() {
  const { code } = useParams<{ code: string }>();
  const { session } = useSession(code || "");
  const queryClient = useQueryClient();

  const { data: gameData } = useGetGameByCode(code!, {
    query: {
      enabled: !!code,
      queryKey: getGetGameByCodeQueryKey(code!),
    },
  });
  const game = gameData?.game;
  const gamePk = game?.mlbGamePk ?? null;

  const { data: picks } = useGetPlayerPicks(code!, session?.playerId || "", {
    query: {
      enabled: !!code && !!session?.playerId,
      queryKey: getGetPlayerPicksQueryKey(code!, session?.playerId || ""),
    },
  });

  const { data: roster, isLoading: rosterLoading } = useGetMlbRoster(
    gamePk ?? 0,
    {
      query: {
        enabled: !!gamePk,
        queryKey: getGetMlbRosterQueryKey(gamePk ?? 0),
        staleTime: 5 * 60_000,
      },
    },
  );

  const savePicks = useSavePlayerPicks();

  const [winnerTeam, setWinnerTeam] = useState<string>("");
  const [awayFinalScore, setAwayFinalScore] = useState(0);
  const [homeFinalScore, setHomeFinalScore] = useState(0);
  const [hrHitters, setHrHitters] = useState<string[]>([]);
  const [totalWalks, setTotalWalks] = useState(0);
  const [totalStrikeouts, setTotalStrikeouts] = useState(0);
  const [activeSide, setActiveSide] = useState<"away" | "home">("away");

  const initializedFor = useRef<string | null>(null);
  useEffect(() => {
    if (
      picks &&
      session?.playerId &&
      initializedFor.current !== session.playerId
    ) {
      initializedFor.current = session.playerId;
      setWinnerTeam(picks.winnerTeam || "");
      setAwayFinalScore(picks.awayFinalScore || 0);
      setHomeFinalScore(picks.homeFinalScore || 0);
      setHrHitters(picks.hrHitters || []);
      setTotalWalks(picks.totalWalks || 0);
      setTotalStrikeouts(picks.totalStrikeouts || 0);
    }
  }, [picks, session?.playerId]);

  const handleSave = async () => {
    if (!session) return;
    try {
      await savePicks.mutateAsync({
        code: code!,
        playerId: session.playerId,
        data: {
          winnerTeam: winnerTeam || null,
          awayFinalScore,
          homeFinalScore,
          hrHitters,
          totalWalks,
          totalStrikeouts,
        },
      });
      toast.success("Picks locked in");
      queryClient.invalidateQueries({
        queryKey: getGetPlayerPicksQueryKey(code!, session.playerId),
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save picks");
    }
  };

  const toggleHitter = (name: string) => {
    setHrHitters((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= MAX_HR) {
        toast.error(`Max ${MAX_HR} HR picks`);
        return prev;
      }
      return [...prev, name];
    });
  };

  if (!code || !session) return null;

  const sideRoster =
    activeSide === "away" ? roster?.away ?? [] : roster?.home ?? [];

  return (
    <Layout code={code}>
      {/* HR Hitters */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
          <h3 className="text-xs font-extrabold tracking-widest uppercase">
            HR Hitters
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider tabular-nums">
            {hrHitters.length} / {MAX_HR}
          </span>
        </div>

        {/* Selected chips */}
        {hrHitters.length > 0 && (
          <div className="px-4 pt-3 flex flex-wrap gap-1.5">
            {hrHitters.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => toggleHitter(name)}
                className="px-2.5 h-7 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 hover:bg-primary/20"
              >
                <Check className="h-3 w-3" />
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Roster picker */}
        {gamePk ? (
          <>
            {game && (
              <div className="px-4 pt-3 grid grid-cols-2 gap-1 bg-card">
                <button
                  type="button"
                  onClick={() => setActiveSide("away")}
                  className={`h-9 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    activeSide === "away"
                      ? "bg-foreground text-background"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {game.awayTeam}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSide("home")}
                  className={`h-9 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    activeSide === "home"
                      ? "bg-foreground text-background"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {game.homeTeam}
                </button>
              </div>
            )}

            <div className="p-3 max-h-72 overflow-y-auto">
              {rosterLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sideRoster.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-4 font-medium">
                  No roster info yet for this team.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {sideRoster.map((p) => {
                    const selected = hrHitters.includes(p.name);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleHitter(p.name)}
                        className={`text-left rounded-lg border px-2.5 py-2 transition-all ${
                          selected
                            ? "bg-primary/10 border-primary/40"
                            : "bg-background border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground w-6">
                            {p.position}
                          </span>
                          <span className="text-xs font-bold leading-tight truncate flex-1">
                            {p.name}
                          </span>
                          {selected && (
                            <Check className="h-3 w-3 text-primary shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 text-xs text-muted-foreground font-medium text-center">
            Roster not available for this game.
          </div>
        )}
      </section>

      {/* Winner */}
      <section className="rounded-2xl bg-card border border-border p-4">
        <div className="text-xs font-extrabold tracking-widest uppercase text-muted-foreground mb-3">
          Who Wins
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWinnerTeam("AWAY")}
            className={`h-12 rounded-xl font-extrabold text-sm transition-colors ${
              winnerTeam === "AWAY"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-foreground hover:bg-muted"
            }`}
          >
            {game?.awayTeam ?? "AWAY"}
          </button>
          <button
            type="button"
            onClick={() => setWinnerTeam("HOME")}
            className={`h-12 rounded-xl font-extrabold text-sm transition-colors ${
              winnerTeam === "HOME"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-foreground hover:bg-muted"
            }`}
          >
            {game?.homeTeam ?? "HOME"}
          </button>
        </div>
      </section>

      {/* Final score */}
      <section className="rounded-2xl bg-card border border-border p-4">
        <div className="text-xs font-extrabold tracking-widest uppercase text-muted-foreground mb-3">
          Final Score
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-1.5">
              {game?.awayTeam ?? "Away"}
            </div>
            <NumberStepper
              value={awayFinalScore}
              onChange={setAwayFinalScore}
            />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-1.5">
              {game?.homeTeam ?? "Home"}
            </div>
            <NumberStepper
              value={homeFinalScore}
              onChange={setHomeFinalScore}
            />
          </div>
        </div>
      </section>

      {/* Walks / Ks */}
      <section className="rounded-2xl bg-card border border-border p-4">
        <div className="text-xs font-extrabold tracking-widest uppercase text-muted-foreground mb-3">
          Game Totals
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-1.5">
              Walks
            </div>
            <NumberStepper value={totalWalks} onChange={setTotalWalks} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-1.5">
              Ks
            </div>
            <NumberStepper
              value={totalStrikeouts}
              onChange={setTotalStrikeouts}
            />
          </div>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={savePicks.isPending}
        className="w-full h-13 py-3 rounded-xl bg-primary text-primary-foreground font-extrabold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {savePicks.isPending ? "Saving…" : "Lock In Picks"}
      </button>
    </Layout>
  );
}
