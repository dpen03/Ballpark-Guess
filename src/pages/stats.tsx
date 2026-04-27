import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Trophy,
  Target,
  Hash,
  Crown,
  ChevronLeft,
  Volume2,
  VolumeX,
  LogOut,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  loadHistory,
  aggregateStats,
  type PastGame,
} from "@/lib/history";
import { useAuth } from "@/lib/auth";
import { AVATARS } from "@/lib/identity";
import { TeamLogo } from "@/components/team-badge";
import { isMuted, setMuted } from "@/lib/sounds";
import { toast } from "sonner";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default function StatsScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [games, setGames] = useState<PastGame[]>([]);
  const [muted, setMutedState] = useState<boolean>(isMuted());
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName ?? "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar ?? "⚾️");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setGames(loadHistory());
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.displayName);
      setEditAvatar(user.avatar);
    }
  }, [user]);

  const stats = useMemo(() => aggregateStats(games), [games]);
  const accuracy = Math.round(stats.accuracy * 100);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // AuthGate will catch this and show the auth screen.
    } catch (err: any) {
      toast.error(err?.message || "Could not sign out");
    }
  };

  const handleSaveProfile = async () => {
    const name = editName.trim();
    if (!name) {
      toast.error("Display name can't be empty");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ displayName: name, avatar: editAvatar });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-2xl mx-auto">
      <header className="sticky top-0 z-10 bg-foreground text-background px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-background/60 hover:text-background text-xs font-bold uppercase tracking-wider"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-background/10 hover:bg-background/20 text-background text-[11px] font-extrabold uppercase tracking-wider transition-colors"
            >
              {muted ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
              {muted ? "Sound Off" : "Sound On"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-background/10 hover:bg-destructive/40 text-background text-[11px] font-extrabold uppercase tracking-wider transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{user?.avatar ?? "⚾️"}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-background/50">
              Your Stats
            </div>
            <div className="text-2xl font-extrabold truncate">
              {user?.displayName ?? "Anonymous"}
            </div>
            {user && (
              <div className="text-[11px] text-background/50 font-bold truncate">
                @{user.username}
              </div>
            )}
          </div>
          {user && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 h-8 w-8 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center"
              aria-label="Edit profile"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <main className="px-4 pt-5 pb-12 space-y-6">
        {/* Edit profile inline */}
        {editing && user && (
          <section className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <div className="text-[11px] font-extrabold tracking-widest uppercase text-muted-foreground">
              Edit Profile
            </div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={30}
              placeholder="Display name"
              className="w-full h-11 px-4 rounded-xl bg-muted/60 border border-border text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setEditAvatar(emoji)}
                  className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all ${
                    editAvatar === emoji
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm uppercase tracking-wider disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditName(user.displayName);
                  setEditAvatar(user.avatar);
                }}
                className="h-10 px-4 rounded-xl bg-muted text-foreground font-bold text-sm uppercase tracking-wider"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Stat tiles */}
        <section className="grid grid-cols-2 gap-3">
          <StatTile
            icon={<Trophy className="h-4 w-4" />}
            label="Best Score"
            value={stats.bestScore.toLocaleString()}
            tone="bg-accent/15 text-accent-foreground border-accent/30"
          />
          <StatTile
            icon={<Hash className="h-4 w-4" />}
            label="Games"
            value={stats.gamesPlayed.toString()}
          />
          <StatTile
            icon={<Target className="h-4 w-4" />}
            label="Accuracy"
            value={`${accuracy}%`}
            sub={`${stats.totalCorrect} / ${stats.totalPicks} picks`}
          />
          <StatTile
            icon={<Crown className="h-4 w-4" />}
            label="Best Rank"
            value={stats.bestRank ? `#${stats.bestRank}` : "—"}
          />
        </section>

        <section className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <h3 className="text-xs font-extrabold tracking-widest uppercase">
              Past Scores
            </h3>
            {games.length > 0 && (
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {games.length} game{games.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
          {games.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No games yet. Pick one from the home screen to get started.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {games.map((g) => (
                <li key={g.code}>
                  <Link
                    href={`/game/${g.code}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center -space-x-2">
                      <TeamLogo
                        name={g.awayTeam}
                        size={28}
                        className="rounded-full bg-white border border-border p-0.5"
                      />
                      <TeamLogo
                        name={g.homeTeam}
                        size={28}
                        className="rounded-full bg-white border border-border p-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">
                        {g.awayTeam} @ {g.homeTeam}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {g.status === "final" ? "Final" : "In Progress"} ·{" "}
                        {timeAgo(g.lastPlayed)}
                        {g.rank && ` · #${g.rank} of ${g.totalPlayers}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-lg tabular-nums">
                        {g.myScore}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {g.totalPicks > 0
                          ? `${Math.round((g.correctPicks / g.totalPicks) * 100)}% acc`
                          : "no picks"}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  tone = "bg-card border-border",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest opacity-70">
        {icon}
        {label}
      </div>
      <div className="font-mono font-extrabold text-3xl tabular-nums mt-1">
        {value}
      </div>
      {sub && (
        <div className="text-[11px] font-bold text-muted-foreground mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
