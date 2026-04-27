import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AVATARS } from "@/lib/identity";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("⚾️");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const u = username.trim().toLowerCase();
    const p = password;
    if (!u || u.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(u)) {
      toast.error("Letters, numbers and underscores only");
      return;
    }
    if (p.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup({
          username: u,
          password: p,
          displayName: displayName.trim() || u,
          avatar,
        });
        toast.success(`Welcome, ${displayName.trim() || u}!`);
      } else {
        await login({ username: u, password: p });
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-stretch">
      <div className="w-full max-w-md mx-auto flex flex-col">
        {/* Brand */}
        <div className="bg-foreground text-background px-6 pt-10 pb-12 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 20%, white 1px, transparent 1px), radial-gradient(circle at 75% 60%, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-lg">
                ⚾️
              </div>
              <span className="text-xs font-extrabold tracking-[0.2em] text-primary uppercase">
                Ballpark Predict
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              {mode === "signin" ? "Welcome back." : "Make your account."}
            </h1>
            <p className="mt-2 text-sm text-background/70">
              {mode === "signin"
                ? "Sign in to keep your scores and stats."
                : "Pick a username, save your stats forever."}
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 px-6 py-6 space-y-4"
        >
          <div>
            <label className="block text-[11px] font-extrabold tracking-widest uppercase text-muted-foreground mb-1.5">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="batter_up_42"
              autoComplete="username"
              maxLength={20}
              className="w-full h-12 px-4 rounded-xl bg-muted/60 border border-border text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 lowercase"
            />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold tracking-widest uppercase text-muted-foreground mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className="w-full h-12 px-4 rounded-xl bg-muted/60 border border-border text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {mode === "signup" && (
              <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                At least 6 characters.
              </p>
            )}
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label className="block text-[11px] font-extrabold tracking-widest uppercase text-muted-foreground mb-1.5">
                  Display Name <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What friends see"
                  maxLength={30}
                  className="w-full h-12 px-4 rounded-xl bg-muted/60 border border-border text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <div className="block text-[11px] font-extrabold tracking-widest uppercase text-muted-foreground mb-1.5">
                  Pick an Avatar
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                        avatar === emoji
                          ? "bg-primary/15 ring-2 ring-primary"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "signup" ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-sm text-muted-foreground hover:text-foreground font-bold"
            >
              {mode === "signin" ? (
                <>
                  New here?{" "}
                  <span className="text-primary underline">Make an account</span>
                </>
              ) : (
                <>
                  Already have one?{" "}
                  <span className="text-primary underline">Sign in</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
