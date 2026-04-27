import { getTeam } from "@/lib/teams";

export function TeamLogo({
  name,
  size = 32,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const t = getTeam(name);
  return (
    <img
      src={t.logo}
      alt={t.abbr}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  );
}

export function TeamChip({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const t = getTeam(name);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider text-white ${className}`}
      style={{ backgroundColor: t.primary }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: t.secondary }}
      />
      {t.abbr}
    </span>
  );
}
