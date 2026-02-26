import { TopBar } from "../components/TopBar";
import { BottomBar } from "../components/BottomBar";
import { Link } from "react-router-dom";

export default function Explore() {
  return (
    <div className="shell">
      <TopBar />
      <div className="stage">
        <div className="stage-inner" style={{ color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Explore</h3>
            <Link to="/" style={{ color: "white" }}>Back</Link>
          </div>
          {/* 之後這裡做 filters（budget slider / weather range / popularity） */}
          <p style={{ opacity: 0.85 }}>Put interactive filters + linked charts here.</p>
        </div>
      </div>
      <BottomBar />
    </div>
  );
}