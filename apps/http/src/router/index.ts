import { router } from "../utils/trpc";
import { authRouter } from "./auth";
import { caseRouter } from "./case";
import { chatRouter } from "./chat";
import { documentRouter } from "./document";
import { runRouter } from "./run";

export const appRouter = router({
  authRouter,
  caseRouter,
  chatRouter,
  documentRouter,
  runRouter,
});

export type AppRouter = typeof appRouter;
