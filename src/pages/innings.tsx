import { useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useSession } from "@/lib/session";
import {
  useGetInningGuesses,
  useSaveInningGuess,
  getGetInningGuessesQueryKey,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Minus } from "lucide-react";

export default function InningsScreen() {
  const { code } = useParams<{ code: string }>();
  const { session } = useSession(code || "");
  const queryClient = useQueryClient();

  const { data: guesses } = useGetInningGuesses(
    code!,
    session?.playerId || "",
    {
      query: {
        enabled: !!code && !!session?.playerId,
        queryKey: getGetInningGuessesQueryKey(code!, session?.playerId || ""),
      },
    },
  );

  const saveGuess = useSaveInningGuess();

  const guessesMap = new Map<string, number>();
  guesses?.forEach((g) => {
    guessesMap.set(`${g.inning}-${g.half}`, g.runs);
  });

  const handleUpdate = async (
    inning: number,
    half: "top" | "bottom",
    newRuns: number,
  ) => {
    if (!session || newRuns < 0 || newRuns > 15) return;

    queryClient.setQueryData(
      getGetInningGuessesQueryKey(code!, session.playerId),
      (old: any) => {
        const copy = old ? [...old] : [];
        const existingIdx = copy.findIndex(
          (g: any) => g.inning === inning && g.half === half,
        );
        if (existingIdx >= 0) {
          copy[existingIdx] = { ...copy[existingIdx], runs: newRuns };
        } else {
          copy.push({
            playerId: session.playerId,
            gameId: code!,
            inning,
            half,
            runs: newRuns,
          });
        }
        return copy;
      },
    );

    try {
      await saveGuess.mutateAsync({
        code: code!,
        playerId: session.playerId,
        data: { inning, half, runs: newRuns },
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save inning guess");
      queryClient.invalidateQueries({
        queryKey: getGetInningGuessesQueryKey(code!, session.playerId),
      });
    }
  };

  const HalfRow = ({
    inning,
    half,
    runs,
  }: {
    inning: number;
    half: "top" | "bottom";
    runs: number;
  }) => (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] font-bold text-muted-foreground tracking-wider uppercase w-8">
        {half === "top" ? "TOP" : "BOT"}
      </span>
      <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => handleUpdate(inning, half, runs - 1)}
          disabled={runs <= 0}
          className="h-7 w-7 rounded-md bg-background hover:bg-muted flex items-center justify-center disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="w-7 text-center font-mono font-extrabold text-base tabular-nums">
          {runs}
        </div>
        <button
          type="button"
          onClick={() => handleUpdate(inning, half, runs + 1)}
          disabled={runs >= 15}
          className="h-7 w-7 rounded-md bg-background hover:bg-muted flex items-center justify-center disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  if (!code || !session) return null;

  return (
    <Layout code={code}>
      <section className="rounded-2xl bg-card border border-border p-4">
        <div className="text-xs font-extrabold tracking-widest uppercase text-muted-foreground">
          Guess The Runs
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Predict how many runs each half-inning will score.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((inning) => {
          const top = guessesMap.get(`${inning}-top`) ?? 0;
          const bot = guessesMap.get(`${inning}-bottom`) ?? 0;
          return (
            <div
              key={inning}
              className="rounded-xl bg-card border border-border p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center font-mono font-extrabold text-base shrink-0">
                {inning}
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <HalfRow inning={inning} half="top" runs={top} />
                <HalfRow inning={inning} half="bottom" runs={bot} />
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
