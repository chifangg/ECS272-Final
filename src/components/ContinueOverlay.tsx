import {TopBar} from "./TopBar";
import {BottomBar} from "./BottomBar";

import "../styles/ContinueOverlay.css";

import worldMap from "../assets/world_map.svg";
import globeIcon from "../assets/globe_icon.png";

type Props = {
  open: boolean;
  title: string;
  buttonText: string;
  onContinue: () => void;
};

export function ContinueOverlay({ open, title, buttonText, onContinue }: Props) {
  return (
    <div className="co-root" aria-label="intro overlay page">
      <TopBar />

      <div className="co-stage">
        <img className="co-map" src={worldMap} alt="" draggable={false} />

        <img className="co-globe co-tl" src={globeIcon} alt="" draggable={false} />
        <img className="co-globe co-tr" src={globeIcon} alt="" draggable={false} />
        <img className="co-globe co-bl" src={globeIcon} alt="" draggable={false} />
        <img className="co-globe co-br" src={globeIcon} alt="" draggable={false} />

        <div className={`co-modal ${open ? "is-open" : ""}`} role="dialog" aria-modal="true">
          <div className="co-modalTitle">{title}</div>
          <button className="co-btn" onClick={onContinue}>
            {buttonText}
          </button>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}