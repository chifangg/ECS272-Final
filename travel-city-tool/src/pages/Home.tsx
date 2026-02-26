import { TopBar } from "../components/TopBar";
import { BottomBar } from "../components/BottomBar";
import { MainViz } from "../viz/MainViz";

export default function Home() {
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