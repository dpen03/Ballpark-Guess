import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  gamesTable,
  playersTable,
  activityEventsTable,
} from "@workspace/db";
import {
  GetLeaderboardParams,
  GetRecentActivityParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/games/:code/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.code, parsed.data.code.toUpperCase()))
    .limit(1);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.gameId, game.id))
    .orderBy(desc(playersTable.totalScore), playersTable.joinedAt);

  res.json(
    players.map((p) => ({
      playerId: p.id,
      name: p.name,
      avatar: p.avatar,
      totalScore: p.totalScore,
      correctPicks: p.correctPicks,
      totalPicks: p.totalPicks,
      isHost: p.isHost,
    })),
  );
});

router.get("/games/:code/recent-activity", async (req, res): Promise<void> => {
  const parsed = GetRecentActivityParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.code, parsed.data.code.toUpperCase()))
    .limit(1);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  const events = await db
    .select()
    .from(activityEventsTable)
    .where(eq(activityEventsTable.gameId, game.id))
    .orderBy(desc(activityEventsTable.createdAt))
    .limit(20);

  res.json(
    events.map((e) => ({
      id: e.id,
      atBatId: e.atBatId,
      batterName: e.batterName,
      inning: e.inning,
      half: e.half as "top" | "bottom",
      outcome: e.outcome as
        | "single"
        | "double"
        | "triple"
        | "home_run"
        | "out"
        | "walk"
        | "strikeout",
      awardedCount: e.awardedCount,
      topScorer: e.topScorerId
        ? {
            playerId: e.topScorerId,
            name: e.topScorerName ?? "",
            points: e.topScorerPoints ?? 0,
          }
        : null,
      createdAt: e.createdAt.toISOString(),
    })),
  );
});

export default router;
