import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  gamesTable,
  playersTable,
} from "@workspace/db";
import {
  CreateGameBody,
  GetGameByCodeParams,
  JoinGameParams,
  JoinGameBody,
} from "@workspace/api-zod";
import { generateRoomCode } from "../lib/scoring";
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

router.post("/games", requireUser, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = req.user!;

  const code = await makeUniqueCode();

  const [game] = await db
    .insert(gamesTable)
    .values({
      code,
      awayTeam: parsed.data.awayTeam,
      homeTeam: parsed.data.homeTeam,
      venue: parsed.data.venue ?? null,
      status: "lobby",
      mlbGamePk: parsed.data.mlbGamePk ?? null,
    })
    .returning();

  if (!game) {
    res.status(500).json({ error: "Failed to create game" });
    return;
  }

  const [host] = await db
    .insert(playersTable)
    .values({
      gameId: game.id,
      userId: user.id,
      name: user.displayName,
      avatar: user.avatar,
      isHost: true,
    })
    .returning();

  if (!host) {
    res.status(500).json({ error: "Failed to create host" });
    return;
  }

  await db
    .update(gamesTable)
    .set({ hostPlayerId: host.id })
    .where(eq(gamesTable.id, game.id));

  res.status(201).json(serializeGame({ ...game, hostPlayerId: host.id }));
});

router.get("/games/:code", async (req, res): Promise<void> => {
  const parsed = GetGameByCodeParams.safeParse(req.params);
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

  res.json({
    game: serializeGame(game),
    players: players.map(serializePlayer),
  });
});

router.post(
  "/games/:code/join",
  requireUser,
  async (req: AuthedRequest, res): Promise<void> => {
    const params = JoinGameParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    // Body is accepted but ignored; identity comes from the session.
    JoinGameBody.safeParse(req.body);
    const user = req.user!;
    const name = user.displayName;
    const avatar = user.avatar;

    const [game] = await db
      .select()
      .from(gamesTable)
      .where(eq(gamesTable.code, params.data.code.toUpperCase()))
      .limit(1);
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

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

    if (existing[0]) {
      const updated = await db
        .update(playersTable)
        .set({ name, avatar })
        .where(eq(playersTable.id, existing[0].id))
        .returning();
      const updatedPlayer = updated[0];
      if (!updatedPlayer) {
        res.status(500).json({ error: "Failed to update player" });
        return;
      }
      res.json(serializePlayer(updatedPlayer));
      return;
    }

    const [player] = await db
      .insert(playersTable)
      .values({
        gameId: game.id,
        userId: user.id,
        name,
        avatar,
        isHost: false,
      })
      .returning();

    if (!player) {
      res.status(500).json({ error: "Failed to join game" });
      return;
    }

    res.json(serializePlayer(player));
  },
);

export default router;
