import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  gamesTable,
  playerPicksTable,
  inningGuessesTable,
  playersTable,
} from "@workspace/db";
import {
  GetPlayerPicksParams,
  SavePlayerPicksParams,
  SavePlayerPicksBody,
  GetInningGuessesParams,
  SaveInningGuessParams,
  SaveInningGuessBody,
} from "@workspace/api-zod";
import {
  serializePicks,
  serializeInningGuess,
} from "../lib/serializers";

const router: IRouter = Router();

async function getGameAndPlayer(code: string, playerId: string) {
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.code, code.toUpperCase()))
    .limit(1);
  if (!game) return { error: "Game not found" as const };
  const [player] = await db
    .select()
    .from(playersTable)
    .where(
      and(eq(playersTable.id, playerId), eq(playersTable.gameId, game.id)),
    )
    .limit(1);
  if (!player) return { error: "Player not found" as const };
  return { game, player };
}

router.get(
  "/games/:code/players/:playerId/picks",
  async (req, res): Promise<void> => {
    const parsed = GetPlayerPicksParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const ctx = await getGameAndPlayer(parsed.data.code, parsed.data.playerId);
    if ("error" in ctx) {
      res.status(404).json({ error: ctx.error });
      return;
    }

    const [picks] = await db
      .select()
      .from(playerPicksTable)
      .where(eq(playerPicksTable.playerId, ctx.player.id))
      .limit(1);

    res.json(serializePicks(picks, ctx.game.id, ctx.player.id));
  },
);

router.put(
  "/games/:code/players/:playerId/picks",
  async (req, res): Promise<void> => {
    const params = SavePlayerPicksParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = SavePlayerPicksBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const ctx = await getGameAndPlayer(params.data.code, params.data.playerId);
    if ("error" in ctx) {
      res.status(404).json({ error: ctx.error });
      return;
    }

    const values = {
      playerId: ctx.player.id,
      gameId: ctx.game.id,
      winnerTeam: body.data.winnerTeam ?? null,
      awayFinalScore: body.data.awayFinalScore ?? null,
      homeFinalScore: body.data.homeFinalScore ?? null,
      hrHitters: body.data.hrHitters ?? [],
      totalWalks: body.data.totalWalks ?? null,
      totalStrikeouts: body.data.totalStrikeouts ?? null,
    };

    const [saved] = await db
      .insert(playerPicksTable)
      .values(values)
      .onConflictDoUpdate({
        target: playerPicksTable.playerId,
        set: {
          winnerTeam: values.winnerTeam,
          awayFinalScore: values.awayFinalScore,
          homeFinalScore: values.homeFinalScore,
          hrHitters: values.hrHitters,
          totalWalks: values.totalWalks,
          totalStrikeouts: values.totalStrikeouts,
        },
      })
      .returning();

    res.json(serializePicks(saved, ctx.game.id, ctx.player.id));
  },
);

router.get(
  "/games/:code/players/:playerId/inning-guesses",
  async (req, res): Promise<void> => {
    const parsed = GetInningGuessesParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const ctx = await getGameAndPlayer(parsed.data.code, parsed.data.playerId);
    if ("error" in ctx) {
      res.status(404).json({ error: ctx.error });
      return;
    }
    const guesses = await db
      .select()
      .from(inningGuessesTable)
      .where(eq(inningGuessesTable.playerId, ctx.player.id));
    res.json(guesses.map(serializeInningGuess));
  },
);

router.put(
  "/games/:code/players/:playerId/inning-guesses",
  async (req, res): Promise<void> => {
    const params = SaveInningGuessParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = SaveInningGuessBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const ctx = await getGameAndPlayer(params.data.code, params.data.playerId);
    if ("error" in ctx) {
      res.status(404).json({ error: ctx.error });
      return;
    }

    const [saved] = await db
      .insert(inningGuessesTable)
      .values({
        playerId: ctx.player.id,
        gameId: ctx.game.id,
        inning: body.data.inning,
        half: body.data.half,
        runs: body.data.runs,
      })
      .onConflictDoUpdate({
        target: [
          inningGuessesTable.playerId,
          inningGuessesTable.inning,
          inningGuessesTable.half,
        ],
        set: { runs: body.data.runs },
      })
      .returning();

    if (!saved) {
      res.status(500).json({ error: "Failed to save inning guess" });
      return;
    }

    res.json(serializeInningGuess(saved));
  },
);

export default router;
