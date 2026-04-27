import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

function buildShareUrl(code: string): string {
  if (typeof window === "undefined") return "";
  const base = (
    (import.meta.env.BASE_URL as string) || "/"
  ).replace(/\/$/, "");
  return `${window.location.origin}${base}/game/${code}`;
}

export function InviteDialog({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const url = useMemo(() => buildShareUrl(code), [code]);

  const copy = async (
    value: string,
    setter: (b: boolean) => void,
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setter(true);
      toast.success(`${label} copied`);
      setTimeout(() => setter(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ballpark Predict",
          text: `Join my Ballpark Predict game! Code: ${code}`,
          url,
        });
      } catch {
        /* user dismissed */
      }
    } else {
      await copy(url, setCopiedLink, "Link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-background/10 hover:bg-background/20 text-background text-[11px] font-extrabold uppercase tracking-wider transition-colors"
        >
          <Share2 className="h-3 w-3" />
          Invite
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
            <QrCode className="h-4 w-4 text-primary" />
            Invite friends
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-2xl bg-white p-4 border border-border">
            <QRCodeSVG
              value={url || code}
              size={200}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="M"
              includeMargin={false}
            />
          </div>

          <button
            type="button"
            onClick={() => copy(code, setCopiedCode, "Code")}
            className="w-full rounded-xl border border-border bg-muted/50 hover:bg-muted px-4 py-3 flex items-center justify-between gap-3 transition-colors"
          >
            <div className="text-left">
              <div className="text-[10px] font-extrabold tracking-widest uppercase text-muted-foreground">
                Game Code
              </div>
              <div className="font-mono font-extrabold text-2xl tracking-widest tabular-nums">
                {code}
              </div>
            </div>
            <div className="text-muted-foreground">
              {copiedCode ? (
                <Check className="h-5 w-5 text-primary" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => copy(url, setCopiedLink, "Link")}
            className="w-full rounded-xl border border-border bg-background hover:bg-muted/40 px-4 py-2.5 flex items-center justify-between gap-3 transition-colors"
          >
            <div className="text-left min-w-0 flex-1">
              <div className="text-[10px] font-extrabold tracking-widest uppercase text-muted-foreground">
                Share Link
              </div>
              <div className="font-mono text-xs truncate">{url}</div>
            </div>
            <div className="text-muted-foreground shrink-0">
              {copiedLink ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={nativeShare}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm hover:bg-primary/90"
          >
            <Share2 className="h-4 w-4 inline-block mr-2" />
            Share
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
