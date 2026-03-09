import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TutorialTopBar } from "../components/TutorialTopBar";
import { BottomBar } from "../components/BottomBar";

import "../styles/Tutorial.css";
import "../styles/Explore.css";

import worldMap from "../assets/world_map.svg";
import pinIcon from "../assets/pin.png";

type MenuKey = "gallery" | "tutorial" | "explore" | "main";

type FactorKey = "duration" | "weather" | "attractiveness";

const FACTOR_TABS: Array<{ key: FactorKey; label: string }> = [
  { key: "duration", label: "interaction factor1" },
  { key: "weather", label: "interaction factor2" },
  { key: "attractiveness", label: "interaction factor3" },
];

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

export default function Explore() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFactor, setActiveFactor] = useState<FactorKey>("duration");
  const [modalOpen, setModalOpen] = useState(false);
  const [monthIndex, setMonthIndex] = useState(0);
  const [minDays, setMinDays] = useState(3);
  const [maxDays, setMaxDays] = useState(10);
  const [checkedOnly, setCheckedOnly] = useState(true);

  const navigate = useNavigate();

  const menuItems = useMemo(
    () =>
      [
        { key: "gallery" as MenuKey, label: "Viz gallery", pos: "tl" },
        { key: "tutorial" as MenuKey, label: "Tutorial", pos: "tr" },
        { key: "explore" as MenuKey, label: "Explore\nyour own", pos: "bl" },
        { key: "main" as MenuKey, label: "Main Viz", pos: "br" },
      ] as const,
    []
  );

  function toggleMenu() {
    setMenuOpen((v) => !v);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function onPick(item: MenuKey) {
    if (item === "gallery") {
      navigate("/gallery");
      return;
    }
    if (item === "explore") {
      navigate("/explore");
      return;
    }
    if (item === "tutorial") {
      navigate("/tutorial");
      return;
    }
    if (item === "main") {
      navigate("/home");
      return;
    }
  }

  function onTabClick(key: FactorKey) {
    setActiveFactor(key);
    setModalOpen(true);
  }

  function changeSpinner(type: "min" | "max", delta: number) {
    if (type === "min") {
      setMinDays((prev) => Math.max(1, Math.min(maxDays - 1, prev + delta)));
      return;
    }
    setMaxDays((prev) => Math.max(minDays + 1, Math.min(60, prev + delta)));
  }

  return (
    <div className="tu-root ex-page" aria-label="explore page">
      <TutorialTopBar menuEnabled={true} onMenuClick={toggleMenu} showMenuHint={false} />

      <div className="tu-stage">
        <div className="tu-canvas">
          <img className="tu-map" src={worldMap} alt="" draggable={false} />

          <img className="tu-pin tu-pin-tl" src={pinIcon} alt="" draggable={false} />
          <img className="tu-pin tu-pin-tr" src={pinIcon} alt="" draggable={false} />

          <div className="tu-legend" aria-label="legend placeholder">
            <div className="tu-legendTitle">legend details</div>
            <div className="tu-legendSub">eg. weather or smth</div>
            <div className="tu-legendDivider" />
            <div className="tu-legendRow">
              <span className="tu-dot" /> <span>factor 1</span>
            </div>
            <div className="tu-legendRow">
              <span className="tu-dot is-hollow" /> <span>factor 2</span>
            </div>
            <div className="tu-legendRow">
              <span className="tu-tri" /> <span>factor 3</span>
            </div>
            <div className="tu-legendEtc">…</div>
          </div>

          <div className="tu-zoom" aria-label="zoom hint">
            Zoom in for more details
          </div>

          <div className="ex-tabbar" aria-label="interaction factors">
            {FACTOR_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`ex-tab ${activeFactor === tab.key ? "is-active" : ""}`}
                onClick={() => onTabClick(tab.key)}
              >
                {tab.label.split(" ")[0]}
                <br />
                {tab.label.split(" ")[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`ex-modal-overlay ${modalOpen ? "is-open" : ""}`}
        onClick={(event) => {
          if (event.target instanceof HTMLElement && event.target.classList.contains("ex-modal-overlay")) {
            setModalOpen(false);
          }
        }}
      >
        <div className="ex-modal">
          <div className="ex-modal-header">
            <span className="ex-modal-title">{FACTOR_TABS.find((v) => v.key === activeFactor)?.label}</span>
            <button type="button" className="ex-modal-close" onClick={() => setModalOpen(false)}>
              X
            </button>
          </div>
          <div className="ex-modal-body">
            <div className="ex-row">
              <span className="ex-label">Ideal traveling days</span>
              <div className="ex-spinner">
                <button type="button" className="ex-arrow" onClick={() => changeSpinner("min", -1)}>
                  -
                </button>
                <span className="ex-value">{String(minDays).padStart(2, "0")}</span>
                <button type="button" className="ex-arrow" onClick={() => changeSpinner("min", 1)}>
                  +
                </button>
              </div>
              <span className="ex-inline">days to</span>
              <div className="ex-spinner">
                <button type="button" className="ex-arrow" onClick={() => changeSpinner("max", -1)}>
                  -
                </button>
                <span className="ex-value">{String(maxDays).padStart(2, "0")}</span>
                <button type="button" className="ex-arrow" onClick={() => changeSpinner("max", 1)}>
                  +
                </button>
              </div>
              <span className="ex-inline">days</span>
            </div>

            <div className="ex-row">
              <span className="ex-label">Ideal traveling month</span>
              <div className="ex-spinner ex-spinner-month">
                <button type="button" className="ex-arrow" onClick={() => setMonthIndex((prev) => (prev - 1 + 12) % 12)}>
                  -
                </button>
                <span className="ex-value ex-month">{MONTHS[monthIndex]}</span>
                <button type="button" className="ex-arrow" onClick={() => setMonthIndex((prev) => (prev + 1) % 12)}>
                  +
                </button>
              </div>
            </div>

            <button type="button" className="ex-checkrow" onClick={() => setCheckedOnly((v) => !v)}>
              <span className="ex-checkbox">{checkedOnly ? "V" : ""}</span>
              <span className="ex-checklabel">Specify one month only</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`tu-menuOverlay ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="tu-menuScrim" onClick={closeMenu} />

        <div className="tu-menuArc">
          {menuItems.map((it) => (
            <button key={it.key} className={`tu-menuItem tu-${it.pos}`} onClick={() => onPick(it.key)} type="button">
              {it.label}
            </button>
          ))}
        </div>
      </div>

      <BottomBar />
    </div>
  );
}
