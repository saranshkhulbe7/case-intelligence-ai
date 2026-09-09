declare module "~public-pages" {
  import type { RouteObject } from "react-router-dom";

  const routes: RouteObject[];

  export default routes;
}

declare module "~authenticated-pages" {
  import type { RouteObject } from "react-router-dom";

  const routes: RouteObject[];

  export default routes;
}
