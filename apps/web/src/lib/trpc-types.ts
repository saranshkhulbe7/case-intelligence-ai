import type { AppRouter } from "@case-intelligence/http/router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
