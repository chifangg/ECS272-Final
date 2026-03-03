import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { BottomBar } from "../components/BottomBar";
import { LoadingIntro } from "../components/LoadingIntro";
import { MainViz } from "../viz/MainViz";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2200); // intro 持續 2.2 秒

    return () => clearTimeout(timer);
  }, []);

  if (showIntro) {
    return <LoadingIntro />;
  }

  return (
    <div className="shell">
      <TopBar />
      <div className="stage">
        <div className="stage-inner">
          <MainViz />
        </div>
      </div>
      <BottomBar />
    </div>
  );
}