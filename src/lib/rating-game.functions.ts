/**
 * Rating Game — COMPETITIVE. The only endpoints that read or write the
 * leaderboard. All logic lives in rating-game.server.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { deviceKeyInput, scanFramesInput, tzOffsetInput } from "./scan-schema";

/** Today's Rating Game leaderboard (also feeds the home page Top 3). */
export const getDailyLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ tzOffset: tzOffsetInput }).parse(data))
  .handler(async ({ data }) => {
    const { readDailyLeaderboard } = await import("./rating-game.server");
    return { entries: await readDailyLeaderboard(data.tzOffset) };
  });

/** Analyse a scan, save the score under the player's name, return result + rank. */
export const playRatingGame = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        frames: scanFramesInput,
        deviceKey: deviceKeyInput,
        displayName: z.string().trim().min(2, "Enter your name (2+ characters).").max(40),
        username: z
          .string()
          .trim()
          .transform((u) => u.replace(/^@/, ""))
          .pipe(
            z
              .string()
              .min(2)
              .max(24)
              .regex(/^[a-zA-Z0-9._-]+$/, "Username can only use letters, numbers, . _ -"),
          ),
        tzOffset: tzOffsetInput,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { playRatingGame: play } = await import("./rating-game.server");
    return play(data);
  });
