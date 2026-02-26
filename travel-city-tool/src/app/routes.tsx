import { createBrowserRouter } from "react-router-dom";
import Intro from "../pages/Intro";
import Home from "../pages/Home";
import Gallery from "../pages/Gallery";
import Explore from "../pages/Explore";

export const router = createBrowserRouter([
  { path: "/", element: <Intro /> },
  { path: "/home", element: <Home /> },
  { path: "/gallery", element: <Gallery /> },
  { path: "/explore", element: <Explore /> },
]);