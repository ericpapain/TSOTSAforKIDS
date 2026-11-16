import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routesConfig";

export { routes };

export const router = createBrowserRouter(routes);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
