// MLB team abbreviations, primary brand colors, and ESPN logo CDN URLs.
// Logos are public CDN PNGs, no auth needed.

export interface TeamInfo {
  abbr: string;     // ESPN-style 3-letter abbreviation
  primary: string;  // hex color
  secondary: string;// hex color
  logo: string;     // CDN logo URL (PNG with transparent bg)
}

// Map any team name fragment -> TeamInfo. Lookup is case-insensitive substring.
const TEAMS: Array<[string[], TeamInfo]> = [
  [["diamondbacks", "arizona"], { abbr: "ARI", primary: "#A71930", secondary: "#E3D4AD", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/ari.png" }],
  [["braves", "atlanta"],       { abbr: "ATL", primary: "#13274F", secondary: "#CE1141", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/atl.png" }],
  [["orioles", "baltimore"],    { abbr: "BAL", primary: "#DF4601", secondary: "#000000", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/bal.png" }],
  [["red sox", "boston"],       { abbr: "BOS", primary: "#BD3039", secondary: "#0C2340", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/bos.png" }],
  [["cubs", "chicago cubs"],    { abbr: "CHC", primary: "#0E3386", secondary: "#CC3433", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/chc.png" }],
  [["white sox"],               { abbr: "CHW", primary: "#27251F", secondary: "#C4CED4", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/chw.png" }],
  [["reds", "cincinnati"],      { abbr: "CIN", primary: "#C6011F", secondary: "#000000", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/cin.png" }],
  [["guardians", "cleveland"],  { abbr: "CLE", primary: "#0C2340", secondary: "#E31937", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/cle.png" }],
  [["rockies", "colorado"],     { abbr: "COL", primary: "#33006F", secondary: "#C4CED4", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/col.png" }],
  [["tigers", "detroit"],       { abbr: "DET", primary: "#0C2340", secondary: "#FA4616", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png" }],
  [["astros", "houston"],       { abbr: "HOU", primary: "#002D62", secondary: "#EB6E1F", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/hou.png" }],
  [["royals", "kansas"],        { abbr: "KC",  primary: "#004687", secondary: "#BD9B60", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/kc.png"  }],
  [["angels", "los angeles angels", "anaheim"], { abbr: "LAA", primary: "#BA0021", secondary: "#003263", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/laa.png" }],
  [["dodgers", "los angeles dodgers"],          { abbr: "LAD", primary: "#005A9C", secondary: "#EF3E42", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png" }],
  [["marlins", "miami"],        { abbr: "MIA", primary: "#00A3E0", secondary: "#EF3340", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/mia.png" }],
  [["brewers", "milwaukee"],    { abbr: "MIL", primary: "#12284B", secondary: "#FFC52F", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/mil.png" }],
  [["twins", "minnesota"],      { abbr: "MIN", primary: "#002B5C", secondary: "#D31145", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/min.png" }],
  [["mets", "new york mets"],   { abbr: "NYM", primary: "#002D72", secondary: "#FF5910", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nym.png" }],
  [["yankees", "new york yankees"], { abbr: "NYY", primary: "#0C2340", secondary: "#C4CED3", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png" }],
  [["athletics", "oakland"],    { abbr: "OAK", primary: "#003831", secondary: "#EFB21E", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/oak.png" }],
  [["phillies", "philadelphia"],{ abbr: "PHI", primary: "#E81828", secondary: "#002D72", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/phi.png" }],
  [["pirates", "pittsburgh"],   { abbr: "PIT", primary: "#27251F", secondary: "#FDB827", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/pit.png" }],
  [["padres", "san diego"],     { abbr: "SD",  primary: "#2F241D", secondary: "#FFC425", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sd.png"  }],
  [["giants", "san francisco"], { abbr: "SF",  primary: "#FD5A1E", secondary: "#27251F", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sf.png"  }],
  [["mariners", "seattle"],     { abbr: "SEA", primary: "#0C2C56", secondary: "#005C5C", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sea.png" }],
  [["cardinals", "st. louis", "st louis"], { abbr: "STL", primary: "#C41E3A", secondary: "#0C2340", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/stl.png" }],
  [["rays", "tampa"],           { abbr: "TB",  primary: "#092C5C", secondary: "#8FBCE6", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tb.png"  }],
  [["rangers", "texas"],        { abbr: "TEX", primary: "#003278", secondary: "#C0111F", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tex.png" }],
  [["blue jays", "toronto"],    { abbr: "TOR", primary: "#134A8E", secondary: "#1D2D5C", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tor.png" }],
  [["nationals", "washington"], { abbr: "WSH", primary: "#AB0003", secondary: "#14225A", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png" }],
];

const FALLBACK: TeamInfo = {
  abbr: "MLB",
  primary: "#1E293B",
  secondary: "#94A3B8",
  logo: "https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png",
};

export function getTeam(name: string | undefined | null): TeamInfo {
  if (!name) return FALLBACK;
  const lower = name.toLowerCase();
  for (const [keys, info] of TEAMS) {
    if (keys.some((k) => lower.includes(k))) return info;
  }
  return FALLBACK;
}
