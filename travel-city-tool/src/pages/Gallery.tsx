import { TopBar } from "../components/TopBar";
import { BottomBar } from "../components/BottomBar";
import { Link } from "react-router-dom";

export default function Gallery() {
  return (
    <div className="shell">
      <TopBar />
      <div className="stage">
        <div className="stage-inner" style={{ color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Viz Gallery</h3>
            <Link to="/" style={{ color: "white" }}>Back</Link>
          </div>
          {/* 之後這裡放多個小圖（small multiples / thumbnails） */}
          <p style={{ opacity: 0.85 }}>Put multiple visualization thumbnails here.</p>
        </div>
      </div>
      <BottomBar />
    </div>
  );
}