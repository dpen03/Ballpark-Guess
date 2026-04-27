import { Link, useRoute } from "wouter";
import { useSession } from "@/lib/session";
import { useGetGameByCode } from "@workspace/api-client-react";
import { Activity, Target, BarChart3, ChevronLeft } from "lucide-react";
import { InviteDialog } from "@/components/invite-dialog";

export function Layout({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  const { session } = useSession(code);
  const [isHome] = useRoute("/game/:code");
  const [isPicks] = useRoute("/game/:code/picks");
  const [isInnings] = useRoute("/game/:code/innings");

  const { data: gameState } = useGetGameByCode(code, {
    query: {
      enabled: !!code,
      queryKey: ["/api/games", code] as any,
    },
  });

  const game = gameState?.game;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background max-w-2xl mx-auto relative">
      <header className="sticky top-0 z-20 bg-foreground text-background">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-background/60 hover:text-background text-xs font-bold uppercase tracking-wider"
            >
              <ChevronLeft className="h-4 w-4" />
              Games
            </Link>
            <div className="flex items-center gap-2">
              <InviteDialog code={code} />
              {session && (
                <div className="flex items-center gap-1.5 bg-background/10 px-2.5 py-1 rounded-full">
                  <span className="text-base leading-none">
                    {session.avatar}
                  </span>
                  <span className="text-xs font-bold truncate max-w-[10ch]">
                    {session.name}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-lg font-extrabold tracking-tight truncate">
            {game ? (
              <>
                {game.awayTeam}{" "}
                <span className="text-background/40 font-medium mx-1">@</span>{" "}
                {game.homeTeam}
              </>
            ) : (
              "Loading…"
            )}
          </div>
          {game?.venue && (
            <div className="text-xs text-background/50 truncate">
              {game.venue}
            </div>
          )}
        </div>

        <nav className="px-2 pb-1 flex gap-1">
          <NavTab
            active={!!isHome}
            href={`/game/${code}`}
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Live"
          />
          <NavTab
            active={!!isPicks}
            href={`/game/${code}/picks`}
            icon={<Target className="h-3.5 w-3.5" />}
            label="Picks"
          />
          <NavTab
            active={!!isInnings}
            href={`/game/${code}/innings`}
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            label="Innings"
          />
        </nav>
      </header>

      <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

function NavTab({
  active,
  href,
  icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-t-lg font-extrabold text-xs uppercase tracking-wider transition-colors ${
        active
          ? "bg-background text-foreground"
          : "text-background/60 hover:text-background hover:bg-background/5"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
