import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Job } from "./pages/Job/Job";
import { App } from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: "/job/:jobId",
        element: <Job />,
      },
    ],
  },
]);
