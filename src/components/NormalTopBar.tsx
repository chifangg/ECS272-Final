import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NormalTopBar.css";

type MenuKey = "gallery" | "tutorial" | "explore" | "main";

type Props = {
  title?: string;
};

export function NormalTopBar({ title = "This is your Travel City Choices Tool" }: Props) {
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
      navigate("/tutorial");
      closeMenu();
      return;
    }
    if (item === "main") {
      closeMenu();
      return;
    }
  }

  return (
    <>
      <div className="ntb-root" aria-label="normal top bar">
        <div className="ntb-title">{title}</div>

        <div className="ntb-right">
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
        </div>
      </div>
    </>
  );
}
