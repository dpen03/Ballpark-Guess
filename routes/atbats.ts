import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  db,
  gamesTable,
  atBatsTable,
  atBatPredictionsTable,
  playersTable,
  activityEventsTable,
} from "@workspace/db";
import {
  ListAtBatsParams,
  CreateAtBatParams,
  CreateAtBatBody,
  GetCurrentAtBatParams,
  ResolveAtBatParams,
  ResolveAtBatBody,
  PredictAtBatParams,
  PredictAtBatBody,
  GetAtBatPredictionSummaryParams,
} from "@workspace/api-zod";
import { pointsForCorrect } from "../lib/scoring";
import { serializeAtBat } from "../lib/serializers";

const router: IRouter = Router();

router.get("/games/:code/atbats", async (req, res): Promise<void> => {
  const parsed = ListAtBatsParams.safeParse(req.params);
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
  const rows = await db
    .select()
    .from(atBatsTable)
    .where(eq(atBatsTable.gameId, game.id))
    .orderBy(desc(atBatsTable.createdAt));
  res.json(rows.map(serializeAtBat));
});

router.post("/games/:code/atbats", async (req, res): Promise<void> => {
  const params = CreateAtBatParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateAtBatBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.code, params.data.code.toUpperCase()))
    .limit(1);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  // Close any other open at-bats by leaving them as-is (only one "current").
  // If there is an existing open at-bat, return it.
  const [existingOpen] = await db
    .select()
    .from(atBatsTable)
    .where(
      and(eq(atBatsTable.gameId, game.id), eq(atBatsTable.status, "open")),
    )
    .orderBy(desc(atBatsTable.createdAt))
    .limit(1);

  if (existingOpen) {
    res.status(201).json(serializeAtBat(existingOpen));
    return;
  }

  const [atBat] = await db
    .insert(atBatsTable)
    .values({
      gameId: game.id,
      batterName: body.data.batterName,
      team: body.data.team,
      inning: body.data.inning,
      half: body.data.half,
      status: "open",
    })
    .returning();
  if (!atBat) {
    res.status(500).json({ error: "Failed to create at-bat" });
    return;
  }

  if (game.status === "lobby") {
    await db
      .update(gamesTable)
      .set({ status: "live" })
      .where(eq(gamesTable.id, game.id));
  }

  res.status(201).json(serializeAtBat(atBat));
});

router.get(
  "/games/:code/atbats/current",
  async (req, res): Promise<void> => {
    const parsed = GetCurrentAtBatParams.safeParse(req.params);
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
    const [atBat] = await db
      .select()
      .from(atBatsTable)
      .where(
        and(eq(atBatsTable.gameId, game.id), eq(atBatsTable.status, "open")),
      )
      .orderBy(desc(atBatsTable.createdAt))
      .limit(1);
    res.json({ atBat: atBat ? serializeAtBat(atBat) : null });
  },
);

router.post("/atbats/:atBatId/resolve", async (req, res): Promise<void> => {
  const params = ResolveAtBatParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ResolveAtBatBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [atBat] = await db
    .select()
    .from(atBatsTable)
    .where(eq(atBatsTable.id, params.data.atBatId))
    .limit(1);
  if (!atBat) {
    res.status(404).json({ error: "At-bat not found" });
    return;
  }
  if (atBat.status === "resolved") {
    res.status(400).json({ error: "At-bat already resolved" });
    return;
  }

  const outcome = body.data.outcome;
  const points = pointsForCorrect(outcome, atBat.inning);

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
    .where(eq(atBatPredictionsTable.atBatId, atBat.id));

  const awarded: {
    playerId: string;
    playerName: string;
    points: number;
    correct: boolean;
  }[] = [];
  let topScorer: { id: string; name: string; points: number } | null = null;
  let awardedCount = 0;

  for (const row of predictions) {
    const correct = row.pred.prediction === outcome;
    const earned = correct ? points : 0;
    awarded.push({
      playerId: row.player.id,
      playerName: row.player.name,
      points: earned,
      correct,
    });

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

  const [updatedAtBat] = await db
    .update(atBatsTable)
    .set({
      status: "resolved",
      actualOutcome: outcome,
      resolvedAt: new Date(),
    })
    .where(eq(atBatsTable.id, atBat.id))
    .returning();

  await db.insert(activityEventsTable).values({
    gameId: atBat.gameId,
    atBatId: atBat.id,
    batterName: atBat.batterName,
    inning: atBat.inning,
    half: atBat.half,
    outcome,
    awardedCount,
    topScorerId: topScorer?.id ?? null,
    topScorerName: topScorer?.name ?? null,
    topScorerPoints: topScorer?.points ?? null,
  });

  res.json({
    atBat: serializeAtBat(updatedAtBat ?? atBat),
    awarded,
  });
});

router.post(
  "/atbats/:atBatId/predictions",
  async (req, res): Promise<void> => {
    const params = PredictAtBatParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = PredictAtBatBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [atBat] = await db
      .select()
      .from(atBatsTable)
      .where(eq(atBatsTable.id, params.data.atBatId))
      .limit(1);
    if (!atBat) {
      res.status(404).json({ error: "At-bat not found" });
      return;
    }
    if (atBat.status !== "open") {
      res.status(400).json({ error: "At-bat is not accepting picks" });
      return;
    }

    const [existing] = await db
      .select()
      .from(atBatPredictionsTable)
      .where(
        and(
          eq(atBatPredictionsTable.atBatId, atBat.id),
          eq(atBatPredictionsTable.playerId, body.data.playerId),
        ),
      )
      .limit(1);

    let pred;
    if (existing) {
      const updated = await db
        .update(atBatPredictionsTable)
        .set({ prediction: body.data.prediction })
        .where(eq(atBatPredictionsTable.id, existing.id))
        .returning();
      pred = updated[0];
    } else {
      const inserted = await db
        .insert(atBatPredictionsTable)
        .values({
          atBatId: atBat.id,
          playerId: body.data.playerId,
          prediction: body.data.prediction,
        })
        .returning();
      pred = inserted[0];
    }

    if (!pred) {
      res.status(500).json({ error: "Failed to save prediction" });
      return;
    }

    res.json({
      id: pred.id,
      atBatId: pred.atBatId,
      playerId: pred.playerId,
      prediction: pred.prediction as
        | "single"
        | "double"
        | "triple"
        | "home_run"
        | "out"
        | "walk"
        | "strikeout",
      createdAt: pred.createdAt.toISOString(),
    });
  },
);

router.get(
  "/atbats/:atBatId/predictions/summary",
  async (req, res): Promise<void> => {
    const parsed = GetAtBatPredictionSummaryParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const rows = await db
      .select({
        outcome: atBatPredictionsTable.prediction,
        count: sql<number>`count(*)::int`,
      })
      .from(atBatPredictionsTable)
      .where(eq(atBatPredictionsTable.atBatId, parsed.data.atBatId))
      .groupBy(atBatPredictionsTable.prediction);

    const allOutcomes = [
      "single",
      "double",
      "triple",
      "home_run",
      "out",
      "walk",
      "strikeout",
    ] as const;

    const tally = allOutcomes.map((o) => ({
      outcome: o,
      count: rows.find((r) => r.outcome === o)?.count ?? 0,
    }));

    res.json(tally);
  },
);

export default router;
