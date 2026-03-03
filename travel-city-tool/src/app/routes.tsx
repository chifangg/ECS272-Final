import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Gallery from "../pages/Gallery";
import Explore from "../pages/Explore";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/gallery", element: <Gallery /> },
  { path: "/explore", element: <Explore /> },
]);