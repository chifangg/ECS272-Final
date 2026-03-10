import { useEffect, useMemo, useRef, useState } from "react";
import { TutorialTopBar } from "../components/TutorialTopBar";
import { BottomBar } from "../components/BottomBar";
import { useNavigate } from "react-router-dom";

import "../styles/Tutorial.css";

import worldMap from "../assets/world_map.svg";
import pinIcon from "../assets/pin.png";

type MenuKey = "gallery" | "tutorial" | "explore" | "main";

export default function Tutorial() {
  const isTourMode = !localStorage.getItem("gallery-toured") && !localStorage.getItem("home-toured") && !localStorage.getItem("explore-toured");
  const [menuEnabled, setMenuEnabled] = useState(true);
  const [showHint1, setShowHint1] = useState(isTourMode);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showHint2, setShowHint2] = useState(false);

  const hint2TimerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menuOpen) {
      setShowHint2(false);
      if (hint2TimerRef.current) window.clearTimeout(hint2TimerRef.current);
      hint2TimerRef.current = null;
      return;
    }

    hint2TimerRef.current = window.setTimeout(() => setShowHint2(true), 1000);

    return () => {
      if (hint2TimerRef.current) window.clearTimeout(hint2TimerRef.current);
      hint2TimerRef.current = null;
    };
  }, [menuOpen]);

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
    if (!menuEnabled) return;
    setShowHint1(false);
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
    localStorage.removeItem("gallery-toured");
    localStorage.removeItem("home-toured");
    localStorage.removeItem("explore-toured");
    window.location.href = "/tutorial";
    return;
  }

  if (item === "main") {
    navigate("/Home");
    return;
  }
}

  return (
    <div className="tu-root" aria-label="tutorial page">
      <TutorialTopBar
        menuEnabled={menuEnabled}
        onMenuClick={toggleMenu}
        showMenuHint={showHint1}
      />

      <div className="tu-stage">
        <div className="tu-canvas">
          <img className="tu-map" src={worldMap} alt="" draggable={false} />

          <img className="tu-pin tu-pin-tl" src={pinIcon} alt="" draggable={false} />
          <img className="tu-pin tu-pin-tr" src={pinIcon} alt="" draggable={false} />


          {isTourMode && (
            <div className={`tu-introBubble ${showHint1 ? "is-show" : ""}`}>
              <div className="tu-introText">
                Let's start exploring the system with the tutorial!
              </div>
              <div className="tu-introArrow" aria-hidden="true">
                <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 56 C30 56, 80 10, 116 6" stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="5 4"/>
                  <path d="M108 2 L116 6 L110 13" stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            </div>
          )}

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

        
        </div>
      </div>

      <div className={`tu-menuOverlay ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
            <div className="tu-menuScrim" onClick={closeMenu} />

            <div className="tu-menuArc">
              {menuItems.map((it) => (
                <button
                  key={it.key}
                  className={`tu-menuItem tu-${it.pos}`}
                  onClick={() => onPick(it.key)}
                  type="button"
                >
                  {it.label}
                </button>
              ))}

              <div className={`tu-hint tu-hint-2 ${showHint2 ? "is-on" : ""}`} aria-hidden={!showHint2}>
                <div className="tu-hintBubble">
                  <span className="tu-hand" aria-hidden="true">
                    ☞
                  </span>
                  <span className="tu-hintText">click here!</span>
                </div>
                <div className="tu-hintArrow is-right" />
              </div>
            </div>
          </div>

      <BottomBar />
    </div>
  );
}