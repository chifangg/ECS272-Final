import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Starter.css";

type Step = 0 | 1 | 2 | 3 | 4;

export default function Starter() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const timers: number[] = [];


    timers.push(window.setTimeout(() => setStep(1), 1500)); // Budget
    timers.push(window.setTimeout(() => setStep(2), 3000)); // Duration
    timers.push(window.setTimeout(() => setStep(3), 4500)); // Weather
    timers.push(window.setTimeout(() => setStep(4), 6000)); // Attractiveness

    timers.push(window.setTimeout(() => setHint(true), 7000));

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

    useEffect(() => {
    if (!hint) return;

    let done = false;
    const go = () => {
        if (done) return;
        done = true;
        navigate("/tutorial", { replace: true });
    };

    const onKeyDown = () => go();
    const onPointerDown = () => go();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("pointerdown", onPointerDown);
    };
    }, [hint, navigate]);

  return (
    <div className="st-full">
      <div className="st-question st-fade-in">
        What comes first when it comes to choosing which city to travel to..?
      </div>


      <Factor show={step >= 1} label="Budget?" pos="tl" stick="st-stick-budget" />
      <Factor show={step >= 2} label="Duration?" pos="tr" stick="st-stick-duration" />
      <Factor show={step >= 3} label="Weather?" pos="bc" stick="st-stick-weather" />
      <Factor show={step >= 4} label="Attractiveness?" pos="rm" stick="st-stick-attract" />

      <div className={`st-hint ${hint ? "is-show st-blink" : ""}`}>
        Press any key to continue <span className="st-chev">&gt;&gt;</span>
      </div>
    </div>
  );
}

function Factor({
  show,
  label,
  pos,
  stick,
}: {
  show: boolean;
  label: string;
  pos: "tl" | "tr" | "bc" | "rm";
  stick: string;
}) {
  return (
    <div className={`st-factor st-${pos} ${show ? "is-show" : ""}`}>
      <div className="st-bubble">{label}</div>
      <Stick className={stick} />
    </div>
  );
}

function Stick({ className }: { className: string }) {
  return <span className={`st-stick ${className}`} aria-hidden="true" />;
}