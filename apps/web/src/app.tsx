import { Suspense } from "react";
import { type RouteObject, useRoutes } from "react-router-dom";
import authenticatedRoutes from "~authenticated-pages";
import publicRoutes from "~public-pages";
import { PublicLayout } from "./layouts/public-layout";
import { AuthenticatedLayout } from "./layouts/authenticated-layout";

const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: publicRoutes,
  },

  {
    element: <AuthenticatedLayout />,
    children: authenticatedRoutes,
  },
];

export function App() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      {useRoutes(routes)}
    </Suspense>
  );
}
