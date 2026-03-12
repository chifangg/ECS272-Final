import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as d3 from "d3";
import { TutorialTopBar } from "../components/TutorialTopBar";
import { BottomBar } from "../components/BottomBar";

import "../styles/Tutorial.css";
import "../styles/Home.css";
import "../styles/Gallery.css";

import worldMap from "../assets/world_map.svg";
import pinIcon from "../assets/pin.png";

const TOUR_KEY = "home-toured";

const HOME_TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Main Viz!",
    body: "This is the full interactive world map. 560 cities are plotted and ranked by weighted travel style scores. Each colored dot represents a city's top category.",
  },
  {
    id: "factors",
    title: "Choose your travel style",
    body: "Click the factor cards below the map to toggle which travel styles are shown. You can select multiple at once. Each style has its own scoring formula.",
  },
  {
    id: "dots",
    title: "Explore cities",
    body: "Hover over any dot to see the city's name, description, and scores across all 9 categories. Scroll to zoom in, and drag to pan around the map.",
  },
];

type ExperienceKey =
  | "culture" | "adventure" | "nature" | "beaches"
  | "nightlife" | "cuisine" | "wellness" | "urban" | "seclusion";

type FactorKey = "escape" | "buzz" | "unwind" | "enrich" | "thrill";

type MainCity = {
  id: string;
  city: string;
  country: string;
  shortDescription: string;
  lat: number;
  lng: number;
  budgetLevel: string;
  idealDurations: string[];
  scores: Record<ExperienceKey, number>;
  mapX: number;
  mapY: number;
};

const MAP_BASE_WIDTH = 612;
const MAP_BASE_HEIGHT = 250;
const MAP_LAT_MAX = 75.21;
const MAP_LAT_MIN = -53.44;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;
const TOP_N = 10;

const FACTORS: Record<FactorKey, {
  label: string;
  tagline: string;
  color: string;
  glowColor: string;
  weights: Partial<Record<ExperienceKey, number>>;
}> = {
  escape: {
    label: "Escape",
    tagline: "Disconnect & breathe",
    color: "#4ade80",
    glowColor: "rgba(74,222,128,0.45)",
    weights: { nature: 2, seclusion: 2.5, wellness: 1.5 },
  },
  buzz: {
    label: "Buzz",
    tagline: "City energy & flavor",
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.45)",
    weights: { nightlife: 2.5, urban: 2, cuisine: 1.5 },
  },
  unwind: {
    label: "Unwind",
    tagline: "Sun, sea & serenity",
    color: "#38bdf8",
    glowColor: "rgba(56,189,248,0.45)",
    weights: { beaches: 3, wellness: 2, nature: 1 },
  },
  enrich: {
    label: "Enrich",
    tagline: "Deepen your perspective",
    color: "#c084fc",
    glowColor: "rgba(192,132,252,0.45)",
    weights: { culture: 3, cuisine: 1.5, adventure: 1 },
  },
  thrill: {
    label: "Thrill",
    tagline: "Push your limits",
    color: "#fbbf24",
    glowColor: "rgba(251,191,36,0.45)",
    weights: { adventure: 3, nature: 1.5, urban: 0.5 },
  },
};

const FACTOR_KEYS = Object.keys(FACTORS) as FactorKey[];

function coarseProjectToBase(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * MAP_BASE_WIDTH;
  const y = ((MAP_LAT_MAX - lat) / (MAP_LAT_MAX - MAP_LAT_MIN)) * MAP_BASE_HEIGHT;
  return { x, y };
}

function parseDurations(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => String(v));
  } catch {
    return [];
  }
}

function getFactorScore(city: MainCity, factor: FactorKey): number {
  const weights = FACTORS[factor].weights;
  return Object.entries(weights).reduce((sum, [key, w]) => {
    return sum + (city.scores[key as ExperienceKey] ?? 0) * (w ?? 0);
  }, 0);
}

function getDominantFactor(city: MainCity): { factor: FactorKey; score: number } {
  let best: FactorKey = "escape";
  let bestScore = -Infinity;
  for (const fk of FACTOR_KEYS) {
    const s = getFactorScore(city, fk);
    if (s > bestScore) { bestScore = s; best = fk; }
  }
  return { factor: best, score: bestScore };
}

export default function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const mapImgRef = useRef<HTMLImageElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [cities, setCities] = useState<MainCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapBox, setMapBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [hoveredCity, setHoveredCity] = useState<{
    city: MainCity; x: number; y: number; dominant: FactorKey; rank: number;
  } | null>(null);
  const [activeFactors, setActiveFactors] = useState<Set<FactorKey>>(new Set(FACTOR_KEYS));
  const [expandedFactor, setExpandedFactor] = useState<FactorKey | null>(null);
  const [formulaFactor, setFormulaFactor] = useState<FactorKey | null>(null);

  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });


  const location = useLocation();
  const forceTour = (location.state as any)?.tutorial === true;
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [showMenuHint, setShowMenuHint] = useState(false);

  useEffect(() => {
    if (forceTour || !localStorage.getItem(TOUR_KEY)) {
      setTourStep(0);
    }
  }, [forceTour]);


  useEffect(() => {
    if (tourStep !== null) return; 
    const alreadyToured = localStorage.getItem(TOUR_KEY);
    if (!alreadyToured) return; 

  }, [tourStep]);


  useEffect(() => {
    let cancelled = false;
    d3.csv("/data/cities.csv").then((rows) => {
      if (cancelled) return;
      const mapped: MainCity[] = rows.map((d) => ({
        id: String(d.id ?? ""),
        city: String(d.city ?? ""),
        country: String(d.country ?? ""),
        shortDescription: String(d.short_description ?? ""),
        lat: Number(d.latitude ?? 0),
        lng: Number(d.longitude ?? 0),
        budgetLevel: String(d.budget_level ?? "Unknown"),
        idealDurations: parseDurations(d.ideal_durations),
        scores: {
          culture: Number(d.culture ?? 0),
          adventure: Number(d.adventure ?? 0),
          nature: Number(d.nature ?? 0),
          beaches: Number(d.beaches ?? 0),
          nightlife: Number(d.nightlife ?? 0),
          cuisine: Number(d.cuisine ?? 0),
          wellness: Number(d.wellness ?? 0),
          urban: Number(d.urban ?? 0),
          seclusion: Number(d.seclusion ?? 0),
        },
        mapX: 0,
        mapY: 0,
      })).filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))
        .map((city) => {
          const p = coarseProjectToBase(city.lat, city.lng);
          return { ...city, mapX: p.x / MAP_BASE_WIDTH, mapY: p.y / MAP_BASE_HEIGHT };
        });
      setCities(mapped);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    const img = mapImgRef.current;
    if (!canvas || !img) return;
    const update = () => {
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      const iw = img.naturalWidth || 1, ih = img.naturalHeight || 1;
      const scale = Math.min(cw / iw, ch / ih);
      const width = iw * scale, height = ih * scale;
      setMapBox({ left: (cw - width) / 2, top: (ch - height) / 2, width, height });
      setCanvasSize({ w: cw, h: ch });
    };
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    if (img.complete) update(); else img.addEventListener("load", update);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); img.removeEventListener("load", update); window.removeEventListener("resize", update); };
  }, []);


  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      setZoom((prev) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
        const r = next / prev;
        setPanX((px) => mx - r * (mx - px));
        setPanY((py) => my - r * (my - py));
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    isPanningRef.current = true;
    lastPanPosRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanningRef.current) return;
    setPanX((px) => px + e.clientX - lastPanPosRef.current.x);
    setPanY((py) => py + e.clientY - lastPanPosRef.current.y);
    lastPanPosRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => { isPanningRef.current = false; };

  const clampedPan = useMemo(() => {
    const cw = canvasSize.w, ch = canvasSize.h;
    if (!cw || !ch || zoom <= 1) return { x: 0, y: 0 };
    const mx = cw * (zoom - 1) / 2;
    const my = ch * (zoom - 1) / 2;
    return { x: Math.max(-mx, Math.min(mx, panX)), y: Math.max(-my, Math.min(my, panY)) };
  }, [panX, panY, zoom, canvasSize]);


  const topCitiesByFactor = useMemo(() => {
    const result: Record<FactorKey, MainCity[]> = {} as Record<FactorKey, MainCity[]>;
    for (const fk of FACTOR_KEYS) {
      result[fk] = [...cities]
        .sort((a, b) => getFactorScore(b, fk) - getFactorScore(a, fk) || a.city.localeCompare(b.city))
        .slice(0, TOP_N);
    }
    return result;
  }, [cities]);


  const displayCities = useMemo(() => {
    if (!cities.length) return [];
    const result: Array<{ city: MainCity; x: number; y: number; dominant: FactorKey; score: number; rank: number }> = [];

    for (const fk of FACTOR_KEYS) {
      if (!activeFactors.has(fk)) continue;
      const ranked = [...cities]
        .map((c) => ({ city: c, score: getFactorScore(c, fk) }))
        .sort((a, b) => b.score - a.score || a.city.city.localeCompare(b.city.city))
        .slice(0, TOP_N);

      ranked.forEach(({ city, score }, idx) => {
        const existing = result.find((r) => r.city.id === city.id);
        const rank = idx + 1;
        if (!existing) {
          result.push({
            city,
            x: mapBox.left + city.mapX * mapBox.width,
            y: mapBox.top + city.mapY * mapBox.height,
            dominant: fk,
            score,
            rank,
          });
        } else {
          if (rank < existing.rank) {
            existing.rank = rank;
            existing.dominant = fk;
          }
        }
      });
    }
    return result;
  }, [cities, activeFactors, mapBox]);

  function toggleFactor(fk: FactorKey) {
    setActiveFactors((prev) => {
      const next = new Set(prev);
      if (next.has(fk)) { if (next.size > 1) next.delete(fk); }
      else next.add(fk);
      return next;
    });
  }

  return (
    <div className="tu-root">
      <TutorialTopBar menuEnabled={true} onMenuClick={() => setMenuOpen((v) => !v)} showMenuHint={showMenuHint} />

      <div className="tu-stage mv-stage">
        <div
          className="tu-canvas mv-canvas"
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: zoom > 1 ? "grab" : "default" }}
        >
          <div className="ex-top-hint">
            Top 10 cities per travel style, ranked by weighted score | click cards below to toggle categories
          </div>


          <div
            className="ex-zoom-layer"
            style={{
              transform: `translate(${clampedPan.x}px, ${clampedPan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <img className="tu-map" src={worldMap} alt="world map" draggable={false} ref={mapImgRef} />
            <img className="tu-pin tu-pin-tl" src={pinIcon} alt="" draggable={false} />
            <img className="tu-pin tu-pin-tr" src={pinIcon} alt="" draggable={false} />
          </div>


          <div className="mv-points">
            {displayCities.map(({ city, x, y, dominant, rank }) => {
              const cw = canvasSize.w;
              const ch = canvasSize.h;
              const sx = (x - cw / 2) * zoom + cw / 2 + clampedPan.x;
              const sy = (y - ch / 2) * zoom + ch / 2 + clampedPan.y;
              const col = FACTORS[dominant].color;
              const glow = FACTORS[dominant].glowColor;
              return (
                <button
                  key={city.id}
                  type="button"
                  className="mv-dot"
                  style={{
                    left: `${sx}px`,
                    top: `${sy}px`,
                    background: col,
                    boxShadow: `0 0 0 2px rgba(255,255,255,0.7), 0 1px 4px rgba(0,0,0,0.25)`,
                  }}
                  onMouseEnter={() => setHoveredCity({ city, x: sx, y: sy, dominant, rank })}
                  onMouseLeave={() => setHoveredCity(null)}
                />
              );
            })}
          </div>


          {hoveredCity && (() => {
            const cw = canvasSize.w || 600;
            const ch = canvasSize.h || 400;
            const cardW = 262;
            const cardH = 240;

            const cardLeft = hoveredCity.x + 16 + cardW > cw - 8
              ? Math.max(4, hoveredCity.x - cardW - 8)
              : hoveredCity.x + 16;
            const wantsTop = hoveredCity.y + cardH + 8 > ch - 8;
            const cardTop = wantsTop
              ? Math.max(8, hoveredCity.y - cardH - 8)
              : Math.max(8, hoveredCity.y - 20);
            const col = FACTORS[hoveredCity.dominant].color;
            return (
              <div className="mv-hover-card" style={{ left: cardLeft, top: cardTop }}>
                <div className="mv-hover-factor" style={{ color: col }}>
                  {FACTORS[hoveredCity.dominant].label} #{hoveredCity.rank}
                </div>
                <div className="mv-hover-title">
                  {hoveredCity.city.city}, {hoveredCity.city.country}
                </div>
                <div className="mv-hover-desc">{hoveredCity.city.shortDescription}</div>
                <div className="mv-hover-divider" />
                <div className="mv-hover-scores">
                  {FACTOR_KEYS.map((fk) => {
                    const s = getFactorScore(hoveredCity.city, fk);
                    const maxPossible = Object.values(FACTORS[fk].weights).reduce((a, b) => a + (b ?? 0) * 10, 0);
                    const pct = Math.min(100, (s / maxPossible) * 100);
                    return (
                      <div key={fk} className="mv-score-row">
                        <span className="mv-score-label">{FACTORS[fk].label}</span>
                        <div className="mv-score-bar-bg">
                          <div className="mv-score-bar-fill" style={{ width: `${pct}%`, background: FACTORS[fk].color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="ex-zoom-controls">
            <button type="button" className="ex-zoom-btn" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))} disabled={zoom >= MAX_ZOOM}>+</button>
            <button type="button" className="ex-zoom-btn ex-zoom-reset" onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} disabled={zoom === 1}>⊙</button>
            <button type="button" className="ex-zoom-btn" onClick={() => setZoom((z) => { const n = Math.max(MIN_ZOOM, z - ZOOM_STEP); if (n === 1) { setPanX(0); setPanY(0); } return n; })} disabled={zoom <= MIN_ZOOM}>−</button>
          </div>



          {loading && <div className="mv-loading">Loading cities…</div>}
        </div>


        <div className="mv-factors">
          {FACTOR_KEYS.map((fk) => {
            const f = FACTORS[fk];
            const isActive = activeFactors.has(fk);
            const isExpanded = expandedFactor === fk;
            const topCities = topCitiesByFactor[fk] ?? [];
            return (
              <div
                key={fk}
                className={`mv-factor-card ${isActive ? "is-active" : ""} ${isExpanded ? "is-expanded" : ""}`}
                style={{ "--factor-color": f.color, "--factor-glow": f.glowColor } as React.CSSProperties}
              >

                <div className="mv-card-header" onClick={() => toggleFactor(fk)}>
                  <div className="mv-factor-label">{f.label}</div>
                  <div className="mv-factor-tagline">{f.tagline}</div>
                </div>
                <div className="mv-card-actions">
                  {topCities[0] && (
                    <div className="mv-factor-top">
                      <span className="mv-factor-top-label">#1</span>
                      <span className="mv-factor-top-city">{topCities[0].city}, {topCities[0].country}</span>
                    </div>
                  )}
                  <div className="mv-card-btns">
                    <button
                      type="button"
                      className="mv-card-btn"
                      title="Show top 10"
                      onClick={(e) => { e.stopPropagation(); setExpandedFactor(isExpanded ? null : fk); }}
                    >{isExpanded ? "▲" : "▼"} Top 10</button>
                    <button
                      type="button"
                      className="mv-card-btn mv-card-btn-formula"
                      title="Score formula"
                      onClick={(e) => { e.stopPropagation(); setFormulaFactor(fk); }}
                    >ƒ</button>
                  </div>
                </div>
                {isExpanded && (
                  <ol className="mv-top-list">
                    {topCities.map((c, i) => (
                      <li key={c.id} className="mv-top-item">
                        <span className="mv-top-rank">{i + 1}</span>
                        <span className="mv-top-name">{c.city}, {c.country}</span>
                        <span className="mv-top-score">{getFactorScore(c, fk).toFixed(1)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>


        {formulaFactor && (() => {
          const f = FACTORS[formulaFactor];
          const weightStr = Object.entries(f.weights)
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .map(([k, w]) => `${k} × ${w}`)
            .join(" + ");
          return (
            <div className="mv-modal-scrim" onClick={() => setFormulaFactor(null)}>
              <div className="mv-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="mv-modal-close" onClick={() => setFormulaFactor(null)}>×</button>
                <div className="mv-modal-title" style={{ color: f.color }}>{f.label}</div>
                <div className="mv-modal-tagline">{f.tagline}</div>
                <div className="mv-modal-label">Score formula</div>
                <div className="mv-modal-formula">{weightStr}</div>
                <div className="mv-modal-note">
                  Each component is a score from 0–10 from the dataset.<br />
                  The weighted sum determines a city's rank in this category.
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className={`tu-menuOverlay ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="tu-menuScrim" onClick={() => setMenuOpen(false)} />
        <div className="tu-menuArc">
          {(["gallery", "tutorial", "explore", "main"] as const).map((key) => (
            <button key={key} className={`tu-menuItem tu-${key === "gallery" ? "tl" : key === "tutorial" ? "tr" : key === "explore" ? "bl" : "br"}`}
              onClick={() => {
                if (key === "tutorial") {
                  localStorage.removeItem("gallery-toured");
                  localStorage.removeItem("home-toured");
                  localStorage.removeItem("explore-toured");
                  window.location.href = "/tutorial";
                  return;
                }
                navigate(key === "main" ? "/home" : `/${key}`);
              }} type="button">
              {key === "gallery" ? "Viz gallery" : key === "tutorial" ? "Tutorial" : key === "explore" ? "Explore\nyour own" : "Main Viz"}
            </button>
          ))}
          {showMenuHint && menuOpen && (
            <div className="tu-arcHint tu-arcHint--bl">
              <div className="tu-hintBubble">
                <span className="tu-hand">☞</span>
                <span className="tu-hintText">click here!</span>
              </div>
              <div className="tu-hintArrow tu-hintArrow--down" />
            </div>
          )}
        </div>
      </div>

      <BottomBar />

      {tourStep !== null && (
        <HomeTour
          step={tourStep}
          total={HOME_TOUR_STEPS.length}
          onNext={() => {
            if (tourStep < HOME_TOUR_STEPS.length - 1) {
              setTourStep(tourStep + 1);
            } else {
              localStorage.setItem(TOUR_KEY, "1");
              setTourStep(null);

              window.setTimeout(() => setShowMenuHint(true), 10000);
            }
          }}
          onSkip={() => {
            localStorage.setItem(TOUR_KEY, "1");
            setTourStep(null);
          }}
        />
      )}
    </div>
  );
}

function HomeTour({
  step, total, onNext, onSkip,
}: { step: number; total: number; onNext: () => void; onSkip: () => void; }) {
  const s = HOME_TOUR_STEPS[step];
  const isLast = step === total - 1;
  return (
    <div className="ga-tourOverlay">
      <div className="ga-tourCard" key={step}>
        <div className="ga-tourTop">
          <div className="ga-tourDots">
            {HOME_TOUR_STEPS.map((_, i) => (
              <span key={i} className={`ga-tourDot ${i === step ? "is-active" : i < step ? "is-done" : ""}`} />
            ))}
          </div>
          <button className="ga-tourSkip" onClick={onSkip}>Skip</button>
        </div>
        <div className="ga-tourTitle">{s.title}</div>
        <div className="ga-tourBody">{s.body}</div>
        <button className="ga-tourNext" onClick={onNext}>
          {isLast ? "Got it!" : "Next →"}
        </button>
      </div>
    </div>
  );
}