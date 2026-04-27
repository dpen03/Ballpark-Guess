import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { ActivityEvent, AtBat, AtBatPrediction, AtBatResolution, CreateAtBatInput, CreateGameInput, CurrentAtBat, Game, GameState, GetMlbScheduleParams, HealthStatus, InningGuess, JoinGameInput, JoinMlbGameInput, JoinMlbGameResult, LeaderboardEntry, MlbRoster, MlbScheduledGame, MlbSyncResult, Player, PlayerPicks, PredictAtBatInput, PredictionTally, ResolveAtBatInput, SaveInningGuessInput, SavePlayerPicksInput } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new game room
 */
export declare const getCreateGameUrl: () => string;
export declare const createGame: (createGameInput: CreateGameInput, options?: RequestInit) => Promise<Game>;
export declare const getCreateGameMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGame>>, TError, {
        data: BodyType<CreateGameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createGame>>, TError, {
    data: BodyType<CreateGameInput>;
}, TContext>;
export type CreateGameMutationResult = NonNullable<Awaited<ReturnType<typeof createGame>>>;
export type CreateGameMutationBody = BodyType<CreateGameInput>;
export type CreateGameMutationError = ErrorType<unknown>;
/**
 * @summary Create a new game room
 */
export declare const useCreateGame: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGame>>, TError, {
        data: BodyType<CreateGameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createGame>>, TError, {
    data: BodyType<CreateGameInput>;
}, TContext>;
/**
 * @summary Get a game by its room code
 */
export declare const getGetGameByCodeUrl: (code: string) => string;
export declare const getGameByCode: (code: string, options?: RequestInit) => Promise<GameState>;
export declare const getGetGameByCodeQueryKey: (code: string) => readonly [`/api/games/${string}`];
export declare const getGetGameByCodeQueryOptions: <TData = Awaited<ReturnType<typeof getGameByCode>>, TError = ErrorType<void>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGameByCode>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGameByCode>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGameByCodeQueryResult = NonNullable<Awaited<ReturnType<typeof getGameByCode>>>;
export type GetGameByCodeQueryError = ErrorType<void>;
/**
 * @summary Get a game by its room code
 */
export declare function useGetGameByCode<TData = Awaited<ReturnType<typeof getGameByCode>>, TError = ErrorType<void>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGameByCode>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Join a game as a player
 */
export declare const getJoinGameUrl: (code: string) => string;
export declare const joinGame: (code: string, joinGameInput: JoinGameInput, options?: RequestInit) => Promise<Player>;
export declare const getJoinGameMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof joinGame>>, TError, {
        code: string;
        data: BodyType<JoinGameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof joinGame>>, TError, {
    code: string;
    data: BodyType<JoinGameInput>;
}, TContext>;
export type JoinGameMutationResult = NonNullable<Awaited<ReturnType<typeof joinGame>>>;
export type JoinGameMutationBody = BodyType<JoinGameInput>;
export type JoinGameMutationError = ErrorType<unknown>;
/**
 * @summary Join a game as a player
 */
export declare const useJoinGame: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof joinGame>>, TError, {
        code: string;
        data: BodyType<JoinGameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof joinGame>>, TError, {
    code: string;
    data: BodyType<JoinGameInput>;
}, TContext>;
/**
 * @summary Get current leaderboard for a game
 */
export declare const getGetLeaderboardUrl: (code: string) => string;
export declare const getLeaderboard: (code: string, options?: RequestInit) => Promise<LeaderboardEntry[]>;
export declare const getGetLeaderboardQueryKey: (code: string) => readonly [`/api/games/${string}/leaderboard`];
export declare const getGetLeaderboardQueryOptions: <TData = Awaited<ReturnType<typeof getLeaderboard>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLeaderboardQueryResult = NonNullable<Awaited<ReturnType<typeof getLeaderboard>>>;
export type GetLeaderboardQueryError = ErrorType<unknown>;
/**
 * @summary Get current leaderboard for a game
 */
export declare function useGetLeaderboard<TData = Awaited<ReturnType<typeof getLeaderboard>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List at-bats for a game (newest first)
 */
export declare const getListAtBatsUrl: (code: string) => string;
export declare const listAtBats: (code: string, options?: RequestInit) => Promise<AtBat[]>;
export declare const getListAtBatsQueryKey: (code: string) => readonly [`/api/games/${string}/atbats`];
export declare const getListAtBatsQueryOptions: <TData = Awaited<ReturnType<typeof listAtBats>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAtBats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAtBats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAtBatsQueryResult = NonNullable<Awaited<ReturnType<typeof listAtBats>>>;
export type ListAtBatsQueryError = ErrorType<unknown>;
/**
 * @summary List at-bats for a game (newest first)
 */
export declare function useListAtBats<TData = Awaited<ReturnType<typeof listAtBats>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAtBats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Host opens a new at-bat for predictions
 */
export declare const getCreateAtBatUrl: (code: string) => string;
export declare const createAtBat: (code: string, createAtBatInput: CreateAtBatInput, options?: RequestInit) => Promise<AtBat>;
export declare const getCreateAtBatMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAtBat>>, TError, {
        code: string;
        data: BodyType<CreateAtBatInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAtBat>>, TError, {
    code: string;
    data: BodyType<CreateAtBatInput>;
}, TContext>;
export type CreateAtBatMutationResult = NonNullable<Awaited<ReturnType<typeof createAtBat>>>;
export type CreateAtBatMutationBody = BodyType<CreateAtBatInput>;
export type CreateAtBatMutationError = ErrorType<unknown>;
/**
 * @summary Host opens a new at-bat for predictions
 */
export declare const useCreateAtBat: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAtBat>>, TError, {
        code: string;
        data: BodyType<CreateAtBatInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAtBat>>, TError, {
    code: string;
    data: BodyType<CreateAtBatInput>;
}, TContext>;
/**
 * @summary Get the active at-bat awaiting an outcome
 */
export declare const getGetCurrentAtBatUrl: (code: string) => string;
export declare const getCurrentAtBat: (code: string, options?: RequestInit) => Promise<CurrentAtBat>;
export declare const getGetCurrentAtBatQueryKey: (code: string) => readonly [`/api/games/${string}/atbats/current`];
export declare const getGetCurrentAtBatQueryOptions: <TData = Awaited<ReturnType<typeof getCurrentAtBat>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentAtBat>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCurrentAtBat>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCurrentAtBatQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentAtBat>>>;
export type GetCurrentAtBatQueryError = ErrorType<unknown>;
/**
 * @summary Get the active at-bat awaiting an outcome
 */
export declare function useGetCurrentAtBat<TData = Awaited<ReturnType<typeof getCurrentAtBat>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentAtBat>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Host records the actual outcome of an at-bat
 */
export declare const getResolveAtBatUrl: (atBatId: string) => string;
export declare const resolveAtBat: (atBatId: string, resolveAtBatInput: ResolveAtBatInput, options?: RequestInit) => Promise<AtBatResolution>;
export declare const getResolveAtBatMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resolveAtBat>>, TError, {
        atBatId: string;
        data: BodyType<ResolveAtBatInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resolveAtBat>>, TError, {
    atBatId: string;
    data: BodyType<ResolveAtBatInput>;
}, TContext>;
export type ResolveAtBatMutationResult = NonNullable<Awaited<ReturnType<typeof resolveAtBat>>>;
export type ResolveAtBatMutationBody = BodyType<ResolveAtBatInput>;
export type ResolveAtBatMutationError = ErrorType<unknown>;
/**
 * @summary Host records the actual outcome of an at-bat
 */
export declare const useResolveAtBat: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resolveAtBat>>, TError, {
        atBatId: string;
        data: BodyType<ResolveAtBatInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resolveAtBat>>, TError, {
    atBatId: string;
    data: BodyType<ResolveAtBatInput>;
}, TContext>;
/**
 * @summary Submit a player's prediction for an at-bat
 */
export declare const getPredictAtBatUrl: (atBatId: string) => string;
export declare const predictAtBat: (atBatId: string, predictAtBatInput: PredictAtBatInput, options?: RequestInit) => Promise<AtBatPrediction>;
export declare const getPredictAtBatMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof predictAtBat>>, TError, {
        atBatId: string;
        data: BodyType<PredictAtBatInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof predictAtBat>>, TError, {
    atBatId: string;
    data: BodyType<PredictAtBatInput>;
}, TContext>;
export type PredictAtBatMutationResult = NonNullable<Awaited<ReturnType<typeof predictAtBat>>>;
export type PredictAtBatMutationBody = BodyType<PredictAtBatInput>;
export type PredictAtBatMutationError = ErrorType<unknown>;
/**
 * @summary Submit a player's prediction for an at-bat
 */
export declare const usePredictAtBat: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof predictAtBat>>, TError, {
        atBatId: string;
        data: BodyType<PredictAtBatInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof predictAtBat>>, TError, {
    atBatId: string;
    data: BodyType<PredictAtBatInput>;
}, TContext>;
/**
 * @summary Get aggregate count of predictions per outcome for an at-bat
 */
export declare const getGetAtBatPredictionSummaryUrl: (atBatId: string) => string;
export declare const getAtBatPredictionSummary: (atBatId: string, options?: RequestInit) => Promise<PredictionTally[]>;
export declare const getGetAtBatPredictionSummaryQueryKey: (atBatId: string) => readonly [`/api/atbats/${string}/predictions/summary`];
export declare const getGetAtBatPredictionSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getAtBatPredictionSummary>>, TError = ErrorType<unknown>>(atBatId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAtBatPredictionSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAtBatPredictionSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAtBatPredictionSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getAtBatPredictionSummary>>>;
export type GetAtBatPredictionSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get aggregate count of predictions per outcome for an at-bat
 */
export declare function useGetAtBatPredictionSummary<TData = Awaited<ReturnType<typeof getAtBatPredictionSummary>>, TError = ErrorType<unknown>>(atBatId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAtBatPredictionSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get a player's pre-game picks (winner, HR hitters, walks, K's)
 */
export declare const getGetPlayerPicksUrl: (code: string, playerId: string) => string;
export declare const getPlayerPicks: (code: string, playerId: string, options?: RequestInit) => Promise<PlayerPicks>;
export declare const getGetPlayerPicksQueryKey: (code: string, playerId: string) => readonly [`/api/games/${string}/players/${string}/picks`];
export declare const getGetPlayerPicksQueryOptions: <TData = Awaited<ReturnType<typeof getPlayerPicks>>, TError = ErrorType<unknown>>(code: string, playerId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlayerPicks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPlayerPicks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPlayerPicksQueryResult = NonNullable<Awaited<ReturnType<typeof getPlayerPicks>>>;
export type GetPlayerPicksQueryError = ErrorType<unknown>;
/**
 * @summary Get a player's pre-game picks (winner, HR hitters, walks, K's)
 */
export declare function useGetPlayerPicks<TData = Awaited<ReturnType<typeof getPlayerPicks>>, TError = ErrorType<unknown>>(code: string, playerId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlayerPicks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Save / update a player's pre-game picks
 */
export declare const getSavePlayerPicksUrl: (code: string, playerId: string) => string;
export declare const savePlayerPicks: (code: string, playerId: string, savePlayerPicksInput: SavePlayerPicksInput, options?: RequestInit) => Promise<PlayerPicks>;
export declare const getSavePlayerPicksMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof savePlayerPicks>>, TError, {
        code: string;
        playerId: string;
        data: BodyType<SavePlayerPicksInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof savePlayerPicks>>, TError, {
    code: string;
    playerId: string;
    data: BodyType<SavePlayerPicksInput>;
}, TContext>;
export type SavePlayerPicksMutationResult = NonNullable<Awaited<ReturnType<typeof savePlayerPicks>>>;
export type SavePlayerPicksMutationBody = BodyType<SavePlayerPicksInput>;
export type SavePlayerPicksMutationError = ErrorType<unknown>;
/**
 * @summary Save / update a player's pre-game picks
 */
export declare const useSavePlayerPicks: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof savePlayerPicks>>, TError, {
        code: string;
        playerId: string;
        data: BodyType<SavePlayerPicksInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof savePlayerPicks>>, TError, {
    code: string;
    playerId: string;
    data: BodyType<SavePlayerPicksInput>;
}, TContext>;
/**
 * @summary Get a player's per-inning run guesses
 */
export declare const getGetInningGuessesUrl: (code: string, playerId: string) => string;
export declare const getInningGuesses: (code: string, playerId: string, options?: RequestInit) => Promise<InningGuess[]>;
export declare const getGetInningGuessesQueryKey: (code: string, playerId: string) => readonly [`/api/games/${string}/players/${string}/inning-guesses`];
export declare const getGetInningGuessesQueryOptions: <TData = Awaited<ReturnType<typeof getInningGuesses>>, TError = ErrorType<unknown>>(code: string, playerId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInningGuesses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInningGuesses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInningGuessesQueryResult = NonNullable<Awaited<ReturnType<typeof getInningGuesses>>>;
export type GetInningGuessesQueryError = ErrorType<unknown>;
/**
 * @summary Get a player's per-inning run guesses
 */
export declare function useGetInningGuesses<TData = Awaited<ReturnType<typeof getInningGuesses>>, TError = ErrorType<unknown>>(code: string, playerId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInningGuesses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Save a single inning run guess
 */
export declare const getSaveInningGuessUrl: (code: string, playerId: string) => string;
export declare const saveInningGuess: (code: string, playerId: string, saveInningGuessInput: SaveInningGuessInput, options?: RequestInit) => Promise<InningGuess>;
export declare const getSaveInningGuessMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveInningGuess>>, TError, {
        code: string;
        playerId: string;
        data: BodyType<SaveInningGuessInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof saveInningGuess>>, TError, {
    code: string;
    playerId: string;
    data: BodyType<SaveInningGuessInput>;
}, TContext>;
export type SaveInningGuessMutationResult = NonNullable<Awaited<ReturnType<typeof saveInningGuess>>>;
export type SaveInningGuessMutationBody = BodyType<SaveInningGuessInput>;
export type SaveInningGuessMutationError = ErrorType<unknown>;
/**
 * @summary Save a single inning run guess
 */
export declare const useSaveInningGuess: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveInningGuess>>, TError, {
        code: string;
        playerId: string;
        data: BodyType<SaveInningGuessInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof saveInningGuess>>, TError, {
    code: string;
    playerId: string;
    data: BodyType<SaveInningGuessInput>;
}, TContext>;
/**
 * @summary List MLB games for a given date (defaults to today)
 */
export declare const getGetMlbScheduleUrl: (params?: GetMlbScheduleParams) => string;
export declare const getMlbSchedule: (params?: GetMlbScheduleParams, options?: RequestInit) => Promise<MlbScheduledGame[]>;
export declare const getGetMlbScheduleQueryKey: (params?: GetMlbScheduleParams) => readonly ["/api/mlb/schedule", ...GetMlbScheduleParams[]];
export declare const getGetMlbScheduleQueryOptions: <TData = Awaited<ReturnType<typeof getMlbSchedule>>, TError = ErrorType<unknown>>(params?: GetMlbScheduleParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMlbSchedule>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMlbSchedule>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMlbScheduleQueryResult = NonNullable<Awaited<ReturnType<typeof getMlbSchedule>>>;
export type GetMlbScheduleQueryError = ErrorType<unknown>;
/**
 * @summary List MLB games for a given date (defaults to today)
 */
export declare function useGetMlbSchedule<TData = Awaited<ReturnType<typeof getMlbSchedule>>, TError = ErrorType<unknown>>(params?: GetMlbScheduleParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMlbSchedule>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Find-or-create the shared room for an MLB game and join it
 */
export declare const getJoinMlbGameUrl: (gamePk: number) => string;
export declare const joinMlbGame: (gamePk: number, joinMlbGameInput: JoinMlbGameInput, options?: RequestInit) => Promise<JoinMlbGameResult>;
export declare const getJoinMlbGameMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof joinMlbGame>>, TError, {
        gamePk: number;
        data: BodyType<JoinMlbGameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof joinMlbGame>>, TError, {
    gamePk: number;
    data: BodyType<JoinMlbGameInput>;
}, TContext>;
export type JoinMlbGameMutationResult = NonNullable<Awaited<ReturnType<typeof joinMlbGame>>>;
export type JoinMlbGameMutationBody = BodyType<JoinMlbGameInput>;
export type JoinMlbGameMutationError = ErrorType<unknown>;
/**
 * @summary Find-or-create the shared room for an MLB game and join it
 */
export declare const useJoinMlbGame: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof joinMlbGame>>, TError, {
        gamePk: number;
        data: BodyType<JoinMlbGameInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof joinMlbGame>>, TError, {
    gamePk: number;
    data: BodyType<JoinMlbGameInput>;
}, TContext>;
/**
 * @summary Roster (batters) for both teams of an MLB game, for HR-pick selection
 */
export declare const getGetMlbRosterUrl: (gamePk: number) => string;
export declare const getMlbRoster: (gamePk: number, options?: RequestInit) => Promise<MlbRoster>;
export declare const getGetMlbRosterQueryKey: (gamePk: number) => readonly [`/api/mlb/games/${number}/roster`];
export declare const getGetMlbRosterQueryOptions: <TData = Awaited<ReturnType<typeof getMlbRoster>>, TError = ErrorType<unknown>>(gamePk: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMlbRoster>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMlbRoster>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMlbRosterQueryResult = NonNullable<Awaited<ReturnType<typeof getMlbRoster>>>;
export type GetMlbRosterQueryError = ErrorType<unknown>;
/**
 * @summary Roster (batters) for both teams of an MLB game, for HR-pick selection
 */
export declare function useGetMlbRoster<TData = Awaited<ReturnType<typeof getMlbRoster>>, TError = ErrorType<unknown>>(gamePk: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMlbRoster>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Sync a linked game with its real MLB live feed
 */
export declare const getSyncGameWithMlbUrl: (code: string) => string;
export declare const syncGameWithMlb: (code: string, options?: RequestInit) => Promise<MlbSyncResult>;
export declare const getSyncGameWithMlbMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof syncGameWithMlb>>, TError, {
        code: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof syncGameWithMlb>>, TError, {
    code: string;
}, TContext>;
export type SyncGameWithMlbMutationResult = NonNullable<Awaited<ReturnType<typeof syncGameWithMlb>>>;
export type SyncGameWithMlbMutationError = ErrorType<unknown>;
/**
 * @summary Sync a linked game with its real MLB live feed
 */
export declare const useSyncGameWithMlb: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof syncGameWithMlb>>, TError, {
        code: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof syncGameWithMlb>>, TError, {
    code: string;
}, TContext>;
/**
 * @summary Recent at-bat outcomes and points awarded
 */
export declare const getGetRecentActivityUrl: (code: string) => string;
export declare const getRecentActivity: (code: string, options?: RequestInit) => Promise<ActivityEvent[]>;
export declare const getGetRecentActivityQueryKey: (code: string) => readonly [`/api/games/${string}/recent-activity`];
export declare const getGetRecentActivityQueryOptions: <TData = Awaited<ReturnType<typeof getRecentActivity>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentActivity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecentActivity>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecentActivityQueryResult = NonNullable<Awaited<ReturnType<typeof getRecentActivity>>>;
export type GetRecentActivityQueryError = ErrorType<unknown>;
/**
 * @summary Recent at-bat outcomes and points awarded
 */
export declare function useGetRecentActivity<TData = Awaited<ReturnType<typeof getRecentActivity>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentActivity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map