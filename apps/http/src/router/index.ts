import { router } from "../utils/trpc";
import { authRouter } from "./auth";
import { caseRouter } from "./case";
import { chatRouter } from "./chat";
import { runRouter } from "./run";

export const appRouter = router({
  authRouter,
  caseRouter,
  chatRouter,
  runRouter,
});

export type AppRouter = typeof appRouter;
