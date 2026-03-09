import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Explore.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const FACTOR_IMAGES = [
  "https://api.builder.io/api/v1/image/assets/TEMP/3b7cb134a942f0a13ecaca74a46b7a0db5af57af?width=3042",
  "https://api.builder.io/api/v1/image/assets/TEMP/27587b782cdd2f909d05a577d31c41143ca58552?width=3042",
  "https://api.builder.io/api/v1/image/assets/TEMP/9c9b0d2b0d036eea9587e7b15c90ce95c0dd7866?width=3042",
  "https://api.builder.io/api/v1/image/assets/TEMP/c73eb4858de4ea341399a604e3f0b8fa10b79ecf?width=3042",
  "https://api.builder.io/api/v1/image/assets/TEMP/3b7cb134a942f0a13ecaca74a46b7a0db5af57af?width=3042",
];

type Factor = {
  id: number;
  title: string;
  left: string;
  bg: string;
};

const FACTORS: Factor[] = [
  { id: 1, title: "travel duration filter", left: "205px", bg: "rgba(144,176,215,0.20)" },
  { id: 2, title: "weather filter", left: "480px", bg: "rgba(64,85,125,0.20)" },
  { id: 3, title: "attractiveness filter", left: "759px", bg: "rgba(35,39,102,0.20)" },
  { id: 4, title: "budget filter", left: "1038px", bg: "rgba(26,11,70,0.20)" },
  { id: 5, title: "safety filter", left: "1317px", bg: "rgba(29,3,23,0.20)" },
];

export default function Explore() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("travel duration filter");
  const [activeFactor, setActiveFactor] = useState(0);
  const [mapImg, setMapImg] = useState(FACTOR_IMAGES[1]);
  const [monthIndex, setMonthIndex] = useState(0);
  const [minDays, setMinDays] = useState(3);
  const [maxDays, setMaxDays] = useState(10);
  const [checkedOnly, setCheckedOnly] = useState(true);
  const [hideCallout, setHideCallout] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 1728;
    const height = 1117;
    const applyScale = () => {
      const scale = Math.min(window.innerWidth / width, window.innerHeight / height);
      canvas.style.transform = `scale(${scale})`;
      canvas.style.left = `${(window.innerWidth - width * scale) / 2}px`;
      canvas.style.top = `${(window.innerHeight - height * scale) / 2}px`;
    };

    applyScale();
    window.addEventListener("resize", applyScale);
    return () => window.removeEventListener("resize", applyScale);
  }, []);

  const openFilter = (factor: Factor) => {
    setTitle(factor.title);
    setActiveFactor(factor.id);
    setMapImg(FACTOR_IMAGES[factor.id - 1] ?? FACTOR_IMAGES[0]);
    setHideCallout(true);
    setModalOpen(true);
  };

  const closeBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.classList.contains("nav-overlay") || event.target.classList.contains("nav-circle-bg")) {
      setNavOpen(false);
    }
  };

  const changeSpinner = (type: "min" | "max", delta: number) => {
    if (type === "min") {
      setMinDays((prev) => Math.max(1, Math.min(maxDays - 1, prev + delta)));
      return;
    }
    setMaxDays((prev) => Math.max(minDays + 1, Math.min(60, prev + delta)));
  };

  return (
    <div className="canvas" id="canvas" ref={canvasRef}>
      <div className="top-bar">
        <span className="top-bar-title">This is your Travel City Choices Tool</span>

        <button className="hamburger-btn" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
          <div className="hamburger-lines">
            <div className="hamburger-line" />
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>
        </button>
      </div>

      <div className="map-content-area" />
      <div className="map-image">
        <img src={mapImg} alt="World map visualization" id="mapImg" />
      </div>

      <svg className="scatter-dots" viewBox="0 0 1521 621" fill="none">
        <circle cx="1310" cy="387" r="6" fill="#C9F9B4" />
        <circle cx="1097" cy="320" r="5.5" fill="#83A9EB" />
        <circle cx="920" cy="611" r="3.5" fill="#FFA3A3" />
        <circle cx="565" cy="584" r="6" fill="#F4E195" />
        <circle cx="354" cy="352" r="4.5" fill="#C9F9B4" />
        <circle cx="323" cy="335" r="4.5" fill="#C9F9B4" />
        <circle cx="362" cy="384" r="3" fill="#83A9EB" />
        <circle cx="1420" cy="642" r="5.5" fill="#FFA3A3" />
        <circle cx="1364" cy="281" r="7.5" fill="#F4E195" />
      </svg>

      <div className="legend-panel" />
      <span className="legend-title">legend details</span>
      <span className="legend-subtitle">eg. weather or smth</span>
      <span className="legend-temp-max">50℃</span>
      <span className="legend-temp-min">0℃</span>
      <img
        className="legend-gradient-img"
        src="https://api.builder.io/api/v1/image/assets/TEMP/c3f2e7af26c99b6a798cac19f6dd51f1c2fda801?width=356"
        alt=""
      />
      <div className="legend-inner-divider" style={{ top: "638px" }} />
      <div className="legend-inner-divider" style={{ top: "730px" }} />
      <div
        style={{
          position: "absolute",
          left: "132px",
          top: "657px",
          width: "12px",
          height: "12px",
          background: "#D9D9D9",
          border: "0.5px solid #000",
        }}
      />
      <svg style={{ position: "absolute", left: "132px", top: "678px" }} width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="6.25" fill="#D9D9D9" stroke="black" strokeWidth="0.5" />
      </svg>
      <svg style={{ position: "absolute", left: "130px", top: "699px" }} width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M15.43 12.5H1.57L8.5 0.5L15.43 12.5Z" fill="#D9D9D9" stroke="black" strokeWidth="0.5" />
      </svg>
      <span className="legend-shape-item" style={{ top: "654px" }}>
        factor 1
      </span>
      <span className="legend-shape-item" style={{ top: "676px" }}>
        factor 2
      </span>
      <span className="legend-shape-item" style={{ top: "699px" }}>
        factor 3
      </span>
      <span className="legend-shape-item" style={{ top: "736px" }}>
        ...
      </span>

      <span className="zoom-hint">Zoom in for more details</span>

      <div className="factors-strip" />
      {FACTORS.map((factor, idx) => (
        <div key={factor.id}>
          <button
            className={`factor-btn ${activeFactor === factor.id ? "active" : ""}`}
            style={{ left: factor.left, background: factor.bg, boxShadow: "0 4px 4px rgba(0,0,0,0.25) inset" }}
            onClick={() => openFilter(factor)}
          />
          <span className="factor-label" style={{ left: `${261 + idx * 278}px` }}>
            interaction
            <br />
            factor{factor.id}
          </span>
        </div>
      ))}

      <div className={`factor-callout ${hideCallout ? "hidden" : ""}`}>
        <span className="factor-callout-text">click here!</span>
        <img
          className="factor-callout-plane"
          src="https://api.builder.io/api/v1/image/assets/TEMP/3ad8608e97e23b0579f472fd671aced9d1ae9288?width=119"
          alt=""
        />
      </div>

      <div className={`nav-overlay ${navOpen ? "open" : ""}`} onClick={closeBackdrop}>
        <div className="nav-circle-bg" />
        <div className="nav-highlight" style={{ left: "1204px", top: "376px", width: "158px", height: "58px" }} />

        <Link className="nav-bubble" to="/gallery" style={{ left: "1097px", top: "27px" }}>
          <span className="nav-bubble-label">Viz gallery</span>
        </Link>
        <Link className="nav-bubble" to="/explore" style={{ left: "1189px", top: "296px", background: "rgba(255,255,255,0.85)" }}>
          <span className="nav-bubble-label">Explore your own</span>
        </Link>
        <Link className="nav-bubble" to="/" style={{ left: "1458px", top: "409px" }}>
          <span className="nav-bubble-label">Main Viz</span>
        </Link>
        <Link className="nav-bubble" to="/" style={{ left: "1431px", top: "122px" }}>
          <span className="nav-bubble-label">Tutorial</span>
        </Link>

        <button className="hamburger-btn-close" aria-label="Close navigation" onClick={() => setNavOpen(false)}>
          <div className="hamburger-lines" style={{ left: "8px", top: "14px" }}>
            <div className="hamburger-line" />
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>
        </button>
      </div>

      <div
        className={`filter-modal-overlay ${modalOpen ? "open" : ""}`}
        onClick={(event) => {
          if (event.target instanceof HTMLElement && event.target.classList.contains("filter-modal-overlay")) {
            setModalOpen(false);
          }
        }}
      >
        <div className="filter-modal">
          <div className="filter-modal-header">
            <span className="filter-modal-title">{title}</span>
            <button className="filter-modal-close" onClick={() => setModalOpen(false)}>
              X
            </button>
          </div>

          <span className="filter-section-label" style={{ left: "45px", top: "133px" }}>
            Ideal traveling days
          </span>

          <div className="filter-spinner" style={{ left: "420px", top: "108px" }}>
            <div className="spinner-arrow" onClick={() => changeSpinner("min", -1)}>
              ▲
            </div>
            <span className="spinner-value">{String(minDays).padStart(2, "0")}</span>
            <div className="spinner-arrow" onClick={() => changeSpinner("min", 1)}>
              ▼
            </div>
          </div>

          <span className="filter-to-label">days to</span>

          <div className="filter-spinner" style={{ left: "863px", top: "108px" }}>
            <div className="spinner-arrow" onClick={() => changeSpinner("max", -1)}>
              ▲
            </div>
            <span className="spinner-value">{String(maxDays).padStart(2, "0")}</span>
            <div className="spinner-arrow" onClick={() => changeSpinner("max", 1)}>
              ▼
            </div>
          </div>

          <span className="filter-days-label">days</span>

          <span className="filter-section-label" style={{ left: "45px", top: "284px" }}>
            Ideal traveling month
          </span>

          <div className="filter-spinner" style={{ left: "420px", top: "259px" }}>
            <div className="spinner-arrow" onClick={() => setMonthIndex((prev) => (prev - 1 + 12) % 12)}>
              ▲
            </div>
            <span className="spinner-value" style={{ minWidth: "80px" }}>
              {MONTHS[monthIndex]}
            </span>
            <div className="spinner-arrow" onClick={() => setMonthIndex((prev) => (prev + 1) % 12)}>
              ▼
            </div>
          </div>

          <div className="filter-checkbox" style={{ left: "29px", top: "450px" }} onClick={() => setCheckedOnly((v) => !v)}>
            <span
              style={{
                display: checkedOnly ? "block" : "none",
                color: "#000",
                fontFamily: "'Spline Sans Mono', monospace",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              V
            </span>
          </div>
          <span className="filter-checkbox-label" style={{ left: "70px", top: "450px" }}>
            Specify one month only
          </span>
        </div>
      </div>

      <div className="bottom-bar">
        <span className="bottom-bar-text">ECS 272 final project dev. by group 7</span>
      </div>
    </div>
  );
}
