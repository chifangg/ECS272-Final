import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TradeOff.css";

import walletIcon   from "../assets/wallet.png";
import calendarIcon from "../assets/calendar.png";
import scaleIcon    from "../assets/scale.png";
import mapIcon      from "../assets/map.png";

const TRAVELERS = [
  {
    id: "maya",
    name: "Maya",
    tag: "The Budget Backpacker",
    icon: walletIcon,
    situation: "3 weeks · $40/day · no fixed dates",
    want: "Adventure & nightlife",
    problem: 'Every "top destination" blows her budget by day 5.',
    insight:
      "Budget filters out entire regions but loosening by just $10/day unlocks 40+ new cities.",
    tradeoff: "Cost  vs.  Attractiveness",
    color: "#8fa3b8",
  },
  {
    id: "kenji",
    name: "Kenji",
    tag: "The Seasonal Planner",
    icon: calendarIcon,
    situation: "2 weeks · February · loves warmth",
    want: "Beach + nature",
    problem:
      "His shortlist looks perfect on paper until he checks February temperatures.",
    insight:
      "The same city scores 4.2 in summer and 2.1 in winter. Month changes everything.",
    tradeoff: "Season  vs.  Suitability",
    color: "#8aaba3",
  },
  {
    id: "sara",
    name: "Sara & Tom",
    tag: "The Couple with Opposing Tastes",
    icon: scaleIcon,
    situation: "10 days · flexible budget",
    want: "She wants culture. He wants seclusion.",
    problem: "Every city that scores high on one scores low on the other.",
    insight:
      "Radar charts show how cities balance across all 9 dimensions. The sweet spot exists, it just isn't obvious.",
    tradeoff: "Culture  vs.  Seclusion",
    color: "#b89898",
  },
  {
    id: "ali",
    name: "Ali",
    tag: "The Stability Seeker",
    icon: mapIcon,
    situation: "Already picked Lisbon · planning to book",
    want: "Confirm it's the right call",
    problem:
      "He isn't sure if Lisbon is genuinely great or just what's left after filtering.",
    insight:
      "Comparing two cities side-by-side reveals whether your choice dominates or is just a survivor.",
    tradeoff: "Confidence  vs.  FOMO",
    color: "#9a96b4",
  },
];

type Phase = "intro" | "cards" | "cta";

export default function TradeOff() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [visibleCards, setVisibleCards] = useState(0);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const t0 = window.setTimeout(() => setPhase("cards"), 1000);
    return () => clearTimeout(t0);
  }, []);

  useEffect(() => {
    if (phase !== "cards") return;
    const timers: number[] = [];
    TRAVELERS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setVisibleCards(i + 1), i * 650 + 100));
    });
    timers.push(
      window.setTimeout(() => {
        setPhase("cta");
        setHint(true);
      }, TRAVELERS.length * 650 + 800)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (!hint) return;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate("/tutorial", { replace: true });
    };
    window.addEventListener("keydown", go);
    window.addEventListener("pointerdown", go, { passive: true });
    return () => {
      window.removeEventListener("keydown", go);
      window.removeEventListener("pointerdown", go);
    };
  }, [hint, navigate]);

  return (
    <div className="to-root">
      <div className={`to-header to-fade-in ${phase !== "intro" ? "is-up" : ""}`}>
        <div className="to-eyebrow">Why this system exists? :D</div>
        <div className="to-title">Real travelers: Real trade-offs.</div>
        <div className="to-sub">
          Every travel decision hides a tension nobody warns you about and here are some trade-off examples.
        </div>
      </div>

      <div className={`to-cards ${phase !== "intro" ? "is-show" : ""}`}>
        {TRAVELERS.map((t, i) => (
          <TravelerCard key={t.id} traveler={t} visible={visibleCards > i} />
        ))}
      </div>

      <div className={`to-cta ${phase === "cta" ? "is-show" : ""}`}>
        <div className="to-cta-line">
          This system helps you see <em>why</em> options appear, not just which one wins.
        </div>
        <div className={`to-hint ${hint ? "is-blink" : ""}`}>
          Press any key to continue <span className="to-chev">&gt;&gt;</span>
        </div>
      </div>
    </div>
  );
}

function TravelerCard({
  traveler,
  visible,
}: {
  traveler: (typeof TRAVELERS)[0];
  visible: boolean;
}) {
  const c = traveler.color;
  return (
    <div
      className={`to-card ${visible ? "is-visible" : ""}`}
      style={{
        background: `color-mix(in srgb, ${c} 10%, #4a4b4e)`,
        borderColor: `color-mix(in srgb, ${c} 28%, transparent)`,
      }}
    >
      <div className="to-card-left">
        <img
          src={traveler.icon}
          alt=""
          className="to-card-icon"
          draggable={false}
          style={{ filter: `grayscale(1) sepia(1) saturate(0.6) brightness(1.4) hue-rotate(${hueFor(c)}deg) opacity(0.85)` }}
        />
      </div>
      <div className="to-card-right">
        <div className="to-card-head">
          <span className="to-card-name" style={{ color: `color-mix(in srgb, ${c} 80%, #fff)` }}>
            {traveler.name}
          </span>
          <span className="to-card-tag">{traveler.tag}</span>
        </div>
        <div className="to-card-situation">{traveler.situation}</div>
        <div className="to-card-block">
          <span className="to-label">Wants</span>
          <span className="to-val">{traveler.want}</span>
        </div>
        <div className="to-card-block">
          <span className="to-label">Problem</span>
          <span className="to-val">{traveler.problem}</span>
        </div>
        <div
          className="to-card-insight"
          style={{ borderLeftColor: `color-mix(in srgb, ${c} 55%, transparent)` }}
        >
          {traveler.insight}
        </div>
        <div className="to-card-tradeoff" style={{ color: `color-mix(in srgb, ${c} 75%, #fff)` }}>
          {traveler.tradeoff}
        </div>
      </div>
    </div>
  );
}


function hueFor(hex: string): number {
  const map: Record<string, number> = {
    "#8fa3b8": 190,  
    "#8aaba3": 155,  
    "#b89898": 330,  
    "#9a96b4": 240,  
  };
  return map[hex] ?? 0;
}