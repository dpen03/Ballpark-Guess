import { Router, type IRouter } from "express";
import { eq, and, desc, sql, isNotNull } from "drizzle-orm";
import {
  db,
  gamesTable,
  atBatsTable,
  atBatPredictionsTable,
  playersTable,
  activityEventsTable,
} from "@workspace/db";
import {
  fetchSchedule,
  fetchLiveFeed,
  fetchScheduleEntry,
  fetchRoster,
  type MlbOutcome,
} from "../lib/mlb";
import { pointsForCorrect, generateRoomCode } from "../lib/scoring";
import { serializeGame, serializePlayer } from "../lib/serializers";
import { requireUser, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

async function makeUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode();
    const existing = await db
      .select({ id: gamesTable.id })
      .from(gamesTable)
      .where(eq(gamesTable.code, code))
      .limit(1);
    if (existing.length === 0) return code;
  }
  throw new Error("Could not generate unique code");
}

router.get("/mlb/games/:gamePk/roster", async (req, res): Promise<void> => {
  const gamePk = Number(req.params.gamePk);
  if (!Number.isFinite(gamePk)) {
    res.status(400).json({ error: "Invalid gamePk" });
    return;
  }
  try {
    const roster = await fetchRoster(gamePk);
    res.json(roster);
  } catch (err) {
    req.log.error({ err, gamePk }, "Failed to fetch roster");
    res.status(502).json({ error: "Failed to fetch roster" });
  }
});

router.post(
  "/mlb/games/:gamePk/join",
  requireUser,
  async (req: AuthedRequest, res): Promise<void> => {
    const gamePk = Number(req.params.gamePk);
    if (!Number.isFinite(gamePk)) {
      res.status(400).json({ error: "Invalid gamePk" });
      return;
    }
    const user = req.user!;
    const name = user.displayName;
    const avatar = user.avatar;

    // Find-or-create the shared room for this MLB gamePk.
    let [game] = await db
      .select()
      .from(gamesTable)
      .where(eq(gamesTable.mlbGamePk, gamePk))
      .limit(1);

    if (!game) {
      const entry = await fetchScheduleEntry(gamePk);
      if (!entry) {
        res.status(404).json({ error: "MLB game not found" });
        return;
      }
      const code = await makeUniqueCode();
      const inserted = await db
        .insert(gamesTable)
        .values({
          code,
          awayTeam: entry.awayTeam.slice(0, 30),
          homeTeam: entry.homeTeam.slice(0, 30),
          venue: entry.venue?.slice(0, 60) || null,
          status: "lobby",
          mlbGamePk: gamePk,
        })
        .returning();
      game = inserted[0];
      if (!game) {
        res.status(500).json({ error: "Failed to create game" });
        return;
      }
    }

    // Find-or-create player for this user in this game.
    const existing = await db
      .select()
      .from(playersTable)
      .where(
        and(
          eq(playersTable.gameId, game.id),
          eq(playersTable.userId, user.id),
        ),
      )
      .limit(1);

    let player;
    if (existing[0]) {
      const updated = await db
        .update(playersTable)
        .set({ name, avatar })
        .where(eq(playersTable.id, existing[0].id))
        .returning();
      player = updated[0];
    } else {
      const inserted = await db
        .insert(playersTable)
        .values({
          gameId: game.id,
          userId: user.id,
          name,
          avatar,
          isHost: false,
        })
        .returning();
      player = inserted[0];
    }

    if (!player) {
      res.status(500).json({ error: "Failed to join game" });
      return;
    }

    res.json({
      game: serializeGame(game),
      player: serializePlayer(player),
    });
  },
);

router.get("/mlb/schedule", async (req, res): Promise<void> => {
  try {
    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;
    const games = await fetchSchedule(date);
    res.json(games);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch MLB schedule");
    res.status(502).json({ error: "Failed to fetch MLB schedule" });
  }
});

async function resolveAtBat(
  atBatId: string,
  gameId: string,
  outcome: MlbOutcome,
): Promise<void> {
  const points = pointsForCorrect(outcome);

  const predictions = await db
    .select({
      pred: atBatPredictionsTable,
      player: playersTable,
    })
    .from(atBatPredictionsTable)
    .innerJoin(
      playersTable,
      eq(atBatPredictionsTable.playerId, playersTable.id),
    )
    .where(eq(atBatPredictionsTable.atBatId, atBatId));

  let topScorer: { id: string; name: string; points: number } | null = null;
  let awardedCount = 0;

  for (const row of predictions) {
    const correct = row.pred.prediction === outcome;
    const earned = correct ? points : 0;

    await db
      .update(atBatPredictionsTable)
      .set({ pointsAwarded: earned })
      .where(eq(atBatPredictionsTable.id, row.pred.id));

    await db
      .update(playersTable)
      .set({
        totalScore: sql`${playersTable.totalScore} + ${earned}`,
        totalPicks: sql`${playersTable.totalPicks} + 1`,
        correctPicks: sql`${playersTable.correctPicks} + ${correct ? 1 : 0}`,
      })
      .where(eq(playersTable.id, row.player.id));

    if (correct) {
      awardedCount += 1;
      if (!topScorer || earned > topScorer.points) {
        topScorer = { id: row.player.id, name: row.player.name, points: earned };
      }
    }
  }

  const [updated] = await db
    .update(atBatsTable)
    .set({
      status: "resolved",
      actualOutcome: outcome,
      resolvedAt: new Date(),
    })
    .where(eq(atBatsTable.id, atBatId))
    .returning();

  if (updated) {
    await db.insert(activityEventsTable).values({
      gameId,
      atBatId,
      batterName: updated.batterName,
      inning: updated.inning,
      half: updated.half,
      outcome,
      awardedCount,
      topScorerId: topScorer?.id ?? null,
      topScorerName: topScorer?.name ?? null,
      topScorerPoints: topScorer?.points ?? null,
    });
  }
}

router.post("/games/:code/sync-mlb", async (req, res): Promise<void> => {
  const code = String(req.params.code ?? "").toUpperCase();
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.code, code))
    .limit(1);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (!game.mlbGamePk) {
    res.json({
      linked: false,
      message: "Game is not linked to an MLB gamePk",
      resolvedCount: 0,
      openedCurrent: false,
      gameStatus: game.status as "lobby" | "live" | "final",
    });
    return;
  }

  let live;
  try {
    live = await fetchLiveFeed(game.mlbGamePk);
  } catch (err) {
    req.log.error({ err, gamePk: game.mlbGamePk }, "MLB live feed failed");
    res.status(502).json({ error: "Failed to fetch MLB live feed" });
    return;
  }

  // Update game-level MLB metadata.
  let newStatus: "lobby" | "live" | "final" =
    game.status as "lobby" | "live" | "final";
  if (live.isFinal) newStatus = "final";
  else if (
    live.abstractGameState === "Live" ||
    live.plays.some((p) => p.isComplete)
  )
    newStatus = "live";

  await db
    .update(gamesTable)
    .set({
      status: newStatus,
      mlbDetailedState: live.detailedState,
      mlbAwayScore: live.awayScore,
      mlbHomeScore: live.homeScore,
      mlbCurrentInning: live.currentInning,
      mlbCurrentHalf: live.currentHalf,
    })
    .where(eq(gamesTable.id, game.id));

  // Find the highest atBatIndex we've already created.
  const [{ maxIndex }] = (await db
    .select({
      maxIndex: sql<number | null>`max(${atBatsTable.mlbAtBatIndex})`,
    })
    .from(atBatsTable)
    .where(
      and(eq(atBatsTable.gameId, game.id), isNotNull(atBatsTable.mlbAtBatIndex)),
    )) as Array<{ maxIndex: number | null }>;
  const lastIdx = maxIndex ?? -1;

  let resolvedCount = 0;

  // Mark currently-open at-bats with mlbAtBatIndex but not yet completed in MLB
  // — leave them as is; we only resolve once MLB marks them complete.

  // Process all completed plays beyond what we've seen.
  const teamForHalf = (half: "top" | "bottom") =>
    half === "top" ? live.awayTeam : live.homeTeam;

  for (const play of live.plays) {
    if (play.atBatIndex <= lastIdx) {
      // Already created. Check if we still need to resolve.
      const [existing] = await db
        .select()
        .from(atBatsTable)
        .where(
          and(
            eq(atBatsTable.gameId, game.id),
            eq(atBatsTable.mlbAtBatIndex, play.atBatIndex),
          ),
        )
        .limit(1);
      if (
        existing &&
        existing.status === "open" &&
        play.isComplete &&
        play.outcome
      ) {
        await resolveAtBat(existing.id, game.id, play.outcome);
        resolvedCount += 1;
      }
      continue;
    }

    // New play we haven't seen yet — create it.
    const [created] = await db
      .insert(atBatsTable)
      .values({
        gameId: game.id,
        batterName: play.batterName,
        team: teamForHalf(play.half),
        inning: play.inning,
        half: play.half,
        status: play.isComplete ? "open" : "open",
        mlbAtBatIndex: play.atBatIndex,
      })
      .returning();

    if (created && play.isComplete && play.outcome) {
      await resolveAtBat(created.id, game.id, play.outcome);
      resolvedCount += 1;
    }
  }

  // Handle the in-progress current play if it hasn't been added yet.
  let openedCurrent = false;
  const cp = live.currentPlay;
  if (cp && !cp.isComplete) {
    const [existing] = await db
      .select()
      .from(atBatsTable)
      .where(
        and(
          eq(atBatsTable.gameId, game.id),
          eq(atBatsTable.mlbAtBatIndex, cp.atBatIndex),
        ),
      )
      .limit(1);
    if (!existing) {
      await db.insert(atBatsTable).values({
        gameId: game.id,
        batterName: cp.batterName,
        team: teamForHalf(cp.half),
        inning: cp.inning,
        half: cp.half,
        status: "open",
        mlbAtBatIndex: cp.atBatIndex,
      });
      openedCurrent = true;
    }
  }

  // Re-fetch the game to serialize fresh metadata.
  const [refreshed] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, game.id))
    .limit(1);

  res.json({
    linked: true,
    resolvedCount,
    openedCurrent,
    gameStatus: (refreshed?.status ?? newStatus) as "lobby" | "live" | "final",
    game: refreshed ? serializeGame(refreshed) : undefined,
  });
});

export default router;
