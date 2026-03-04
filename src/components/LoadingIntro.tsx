import { useEffect, useMemo, useState } from "react";
import {TopBar} from "./TopBar";
import {BottomBar} from "./BottomBar";
import "../styles/LoadingIntro.css";

import planePng from "../assets/plane_icon.png";

type LoadingIntroProps = {
  durationMs?: number;
  steps?: number;
};

export function LoadingIntro({ durationMs = 2200, steps = 6 }: LoadingIntroProps) {
  const [step, setStep] = useState(1);
  const stepEvery = useMemo(() => Math.max(120, Math.floor(durationMs / steps)), [durationMs, steps]);

  useEffect(() => {
    let cur = 1;
    setStep(cur);

    const id = window.setInterval(() => {
      cur += 1;
      if (cur > steps) {
        window.clearInterval(id);
        return;
      }
      setStep(cur);
    }, stepEvery);

    return () => window.clearInterval(id);
  }, [stepEvery, steps]);

  return (
    <div className="li-root">
      <TopBar />

      <div className="li-stage" aria-label="loading animation">
        <div className="li-row">
          {Array.from({ length: step }).map((_, i) => (
            <div className="li-seg" key={i}>
              <img className="li-plane" src={planePng} alt="" draggable={false} />
              {i < step - 1 ? <Dots /> : null}
            </div>
          ))}
        </div>
      </div>

      <BottomBar />
    </div>
  );
}

function Dots() {
  return (
    <div className="li-dots" aria-hidden="true">
      <span className="li-dot" />
      <span className="li-dot" />
      <span className="li-dot" />
    </div>
  );
}