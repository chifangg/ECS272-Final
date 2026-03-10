import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NormalTopBar.css";

type MenuKey = "gallery" | "tutorial" | "explore" | "main";

type Props = {
  title?: string;
  showMenuHint?: boolean;
};

export function NormalTopBar({ title = "This is your Travel City Choices Tool", showMenuHint = false }: Props) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
      closeMenu();
      return;
    }
    if (item === "explore") {
      navigate("/explore");
      closeMenu();
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
      closeMenu();
      return;
    }
  }

  return (
    <>
      <div className="ntb-root" aria-label="normal top bar">
        <div className="ntb-title">{title}</div>

        <div className="ntb-right">
          {showMenuHint && !menuOpen && (
            <div className="ntb-hint" aria-live="polite">
              <div className="ntb-hintBubble">
                <span className="ntb-hand" aria-hidden="true">☞</span>
                <span className="ntb-hintText">click here!</span>
              </div>
              <div className="ntb-hintArrow" />
            </div>
          )}
          <button className="ntb-menuBtn" onClick={toggleMenu} aria-label="menu" type="button">
            <span className="ntb-burger" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <div className={`ntb-menuOverlay ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="ntb-menuScrim" onClick={closeMenu} />

        <div className="ntb-menuArc">
          {menuItems.map((it) => (
            <button
              key={it.key}
              className={`ntb-menuItem ntb-${it.pos}`}
              onClick={() => onPick(it.key)}
              type="button"
            >
              {it.label}
            </button>
          ))}
          {showMenuHint && (
            <div className="ntb-arcHint">
              <div className="ntb-hintBubble">
                <span className="ntb-hand" aria-hidden="true">☞</span>
                <span className="ntb-hintText">click here!</span>
              </div>
              <div className="ntb-hintArrow ntb-hintArrow--down" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}