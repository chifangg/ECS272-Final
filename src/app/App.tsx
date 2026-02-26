import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

import "../styles/theme.css";
import "../styles/layout.css";

export default function App() {
  return <RouterProvider router={router} />;
}