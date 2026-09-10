import type { AppRouter } from "@case-intelligence/http/router";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
