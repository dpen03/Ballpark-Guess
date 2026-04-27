import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import gamesRouter from "./games";
import atBatsRouter from "./atbats";
import picksRouter from "./picks";
import leaderboardRouter from "./leaderboard";
import mlbRouter from "./mlb";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(gamesRouter);
router.use(atBatsRouter);
router.use(picksRouter);
router.use(leaderboardRouter);
router.use(mlbRouter);

export default router;
