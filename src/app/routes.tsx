import { createBrowserRouter } from "react-router-dom";
import Intro from "../pages/Intro";
import Home from "../pages/Home";
import Gallery from "../pages/Gallery";
import Explore from "../pages/Explore";
import IntroAfterLoad from "../pages/IntroAfterLoad";
import Starter from "../pages/Starter";
import Tutorial from "../pages/Tutorial";


export const router = createBrowserRouter([
  { path: "/", element: <Intro /> },
  { path: "/home", element: <Home /> },
  { path: "/gallery", element: <Gallery /> },
  { path: "/explore", element: <Explore /> },
  { path: "/intro_after_load", element: <IntroAfterLoad /> },
  { path: "/starter", element: <Starter /> },
  { path: "/tutorial", element: <Tutorial /> },
]);