import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { TutorialTopBar } from "../components/TutorialTopBar";
import { BottomBar } from "../components/BottomBar";

import "../styles/Tutorial.css";
import "../styles/Explore.css";

import worldMap from "../assets/world_map.svg";
import pinIcon from "../assets/pin.png";

type MenuKey = "gallery" | "tutorial" | "explore" | "main";
type ExperienceKey = "culture" | "adventure" | "nature" | "beaches" | "nightlife" | "cuisine" | "wellness" | "urban" | "seclusion";

type ExploreCity = {
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

const EXPERIENCE_OPTIONS: Array<{ key: ExperienceKey; label: string }> = [
  { key: "culture", label: "Culture" },
  { key: "adventure", label: "Adventure" },
  { key: "nature", label: "Nature" },
  { key: "beaches", label: "Beaches" },
  { key: "nightlife", label: "Nightlife" },
  { key: "cuisine", label: "Cuisine" },
  { key: "wellness", label: "Wellness" },
  { key: "urban", label: "Urban" },
  { key: "seclusion", label: "Seclusion" },
];

const EXPERIENCE_LABELS: Record<ExperienceKey, string> = {
  culture: "Culture",
  adventure: "Adventure",
  nature: "Nature",
  beaches: "Beaches",
  nightlife: "Nightlife",
  cuisine: "Cuisine",
  wellness: "Wellness",
  urban: "Urban",
  seclusion: "Seclusion",
};

const DURATION_OPTIONS = ["Short trip", "One week", "Long trip"];
const MAP_BASE_WIDTH = 612;
const MAP_BASE_HEIGHT = 250;

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;


function coarseProjectToBase(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * MAP_BASE_WIDTH;
  const y = ((90 - lat) / 180) * MAP_BASE_HEIGHT;
  return { x, y };
}

function buildLandMask(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = MAP_BASE_WIDTH;
  canvas.height = MAP_BASE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, MAP_BASE_WIDTH, MAP_BASE_HEIGHT);
  const data = ctx.getImageData(0, 0, MAP_BASE_WIDTH, MAP_BASE_HEIGHT).data;
  const mask = new Uint8Array(MAP_BASE_WIDTH * MAP_BASE_HEIGHT);

  for (let y = 0; y < MAP_BASE_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_BASE_WIDTH; x += 1) {
      const i = (y * MAP_BASE_WIDTH + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      mask[y * MAP_BASE_WIDTH + x] = luminance < 120 ? 1 : 0;
    }
  }
  return mask;
}


function snapToNearestLand(x: number, y: number, _landMask: Uint8Array) {
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

function getMatchScore(city: ExploreCity, exps: ExperienceKey[]) {
  if (exps.length === 0) return 10; // no filter = show all
  return exps.reduce((best, key) => Math.max(best, city.scores[key]), 0);
}

export default function Explore() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const mapImgRef = useRef<HTMLImageElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [cities, setCities] = useState<ExploreCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draftBudget, setDraftBudget] = useState("Any");
  const [draftDuration, setDraftDuration] = useState("Any");
  const [draftExperiences, setDraftExperiences] = useState<ExperienceKey[]>([]);

  const [budgetLevel, setBudgetLevel] = useState("Any");
  const [duration, setDuration] = useState("Any");
  const [experiences, setExperiences] = useState<ExperienceKey[]>([]);

  const [mapBox, setMapBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [hoveredCity, setHoveredCity] = useState<{ city: ExploreCity; x: number; y: number } | null>(null);
  const [landMask, setLandMask] = useState<Uint8Array | null>(null);
  const [selectedCity, setSelectedCity] = useState<ExploreCity | null>(null);
  const [planDurationDays, setPlanDurationDays] = useState(5);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await d3.csv("/data/cities.csv");
        const mapped: ExploreCity[] = rows.map((d) => ({
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
        }));

        if (!cancelled) {
          const withProjected = mapped
            .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))
            .map((city) => {
              const p = coarseProjectToBase(city.lat, city.lng);
              return {
                ...city,
                mapX: p.x / MAP_BASE_WIDTH,
                mapY: p.y / MAP_BASE_HEIGHT,
              };
            });

          setCities(withProjected);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load cities.csv");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = mapImgRef.current;
    if (!canvas || !img) return;

    const updateMapBox = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const iw = img.naturalWidth || 1;
      const ih = img.naturalHeight || 1;

      const scale = Math.min(cw / iw, ch / ih);
      const width = iw * scale;
      const height = ih * scale;
      const left = (cw - width) / 2;
      const top = (ch - height) / 2;

      setMapBox({ left, top, width, height });
    };

    const ro = new ResizeObserver(updateMapBox);
    ro.observe(canvas);
    if (img.complete) updateMapBox();
    else img.addEventListener("load", updateMapBox);
    window.addEventListener("resize", updateMapBox);

    return () => {
      ro.disconnect();
      img.removeEventListener("load", updateMapBox);
      window.removeEventListener("resize", updateMapBox);
    };
  }, []);

  useEffect(() => {
    const img = mapImgRef.current;
    if (!img) return;

    const handleLoad = () => {
      const mask = buildLandMask(img);
      if (mask) setLandMask(mask);
    };

    if (img.complete) handleLoad();
    else img.addEventListener("load", handleLoad);

    return () => img.removeEventListener("load", handleLoad);
  }, []);


  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prevZoom) => {
        const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom + delta));
        const ratio = newZoom / prevZoom;

        setPanX((px) => mouseX - ratio * (mouseX - px));
        setPanY((py) => mouseY - ratio * (mouseY - py));

        return newZoom;
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);


  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    isPanningRef.current = true;
    lastPanPosRef.current = { x: e.clientX, y: e.clientY };
  }, [zoom]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - lastPanPosRef.current.x;
    const dy = e.clientY - lastPanPosRef.current.y;
    lastPanPosRef.current = { x: e.clientX, y: e.clientY };
    setPanX((px) => px + dx);
    setPanY((py) => py + dy);
  }, []);

  const onMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);


  const clampedPan = useMemo(() => {
    if (!canvasRef.current) return { x: panX, y: panY };
    const cw = canvasRef.current.clientWidth;
    const ch = canvasRef.current.clientHeight;
    const maxX = (cw * zoom - cw) / 2 + cw * (zoom - 1) / zoom;
    const maxY = (ch * zoom - ch) / 2 + ch * (zoom - 1) / zoom;
    return {
      x: Math.max(-maxX, Math.min(maxX, panX)),
      y: Math.max(-maxY, Math.min(maxY, panY)),
    };
  }, [panX, panY, zoom]);

  const budgetOptions = useMemo(() => {
    const unique = Array.from(new Set(cities.map((c) => c.budgetLevel))).sort();
    return ["Any", ...unique];
  }, [cities]);

  const filteredCities = useMemo(() => {
    return cities
      .filter((city) => {
        if (budgetLevel !== "Any" && city.budgetLevel !== budgetLevel) return false;
        if (duration !== "Any" && !city.idealDurations.includes(duration)) return false;

        const matchScore = getMatchScore(city, experiences);
        if (matchScore < 4) return false;
        return true;
      })
      .sort((a, b) => getMatchScore(b, experiences) - getMatchScore(a, experiences));
  }, [budgetLevel, cities, duration, experiences]);

  const projectedCities = useMemo(() => {
    if (mapBox.width <= 0 || mapBox.height <= 0) return [];

    return filteredCities.map((city) => {
      const baseX = city.mapX * MAP_BASE_WIDTH;
      const baseY = city.mapY * MAP_BASE_HEIGHT;
      const snapped = landMask ? snapToNearestLand(baseX, baseY, landMask) : { x: baseX, y: baseY };
      return {
        city,
        x: mapBox.left + (snapped.x / MAP_BASE_WIDTH) * mapBox.width,
        y: mapBox.top + (snapped.y / MAP_BASE_HEIGHT) * mapBox.height,
      };
    });
  }, [filteredCities, landMask, mapBox]);

  const selectedProjected = useMemo(() => {
    if (!selectedCity) return null;
    return projectedCities.find((p) => p.city.id === selectedCity.id) ?? null;
  }, [projectedCities, selectedCity]);

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

  function onPick(item: MenuKey) {
    if (item === "gallery") return navigate("/gallery");
    if (item === "explore") return navigate("/explore");
    if (item === "tutorial") return navigate("/tutorial");
    return navigate("/home");
  }

  function toggleDraftExperience(key: ExperienceKey) {
    setDraftExperiences((prev) => {
      if (prev.includes(key)) {
        return prev.filter((v) => v !== key);
      }
      return [...prev, key];
    });
  }

  function applyFilter() {
    setBudgetLevel(draftBudget);
    setDuration(draftDuration);
    setExperiences(draftExperiences);
    setHoveredCity(null);
  }

  function clearFilter() {
    setDraftBudget("Any");
    setDraftDuration("Any");
    setDraftExperiences([]);
    setBudgetLevel("Any");
    setDuration("Any");
    setExperiences([]);
    setHoveredCity(null);
    setSelectedCity(null);
  }

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }

  function zoomOut() {
    setZoom((z) => {
      const newZoom = Math.max(MIN_ZOOM, z - ZOOM_STEP);
      if (newZoom === MIN_ZOOM) {
        setPanX(0);
        setPanY(0);
      }
      return newZoom;
    });
  }

  function resetZoom() {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }

  function goToPlanPage() {
    if (!selectedCity) return;
    navigate("/travel-plan", {
      state: {
        city: {
          id: selectedCity.id,
          city: selectedCity.city,
          country: selectedCity.country,
          shortDescription: selectedCity.shortDescription,
          budgetLevel: selectedCity.budgetLevel,
          idealDurations: selectedCity.idealDurations,
          scores: selectedCity.scores,
        },
        durationDays: planDurationDays,
        selectedExperiences: experiences.map((k) => EXPERIENCE_LABELS[k]),
      },
    });
  }

  return (
    <div className="tu-root ex-page" aria-label="explore page">
      <TutorialTopBar menuEnabled={true} onMenuClick={() => setMenuOpen((v) => !v)} showMenuHint={false} />

      <div className="tu-stage ex-stage">

        <div
          className="tu-canvas ex-canvas"
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: zoom > 1 ? "grab" : "default" }}
        >

          <div className="ex-top-hint">
            Pick filters below, then click Apply | click a dot to select a city for travel plan generation
          </div>


          <div
            className="ex-zoom-layer"
            ref={mapContainerRef}
            style={{
              transform: `translate(${clampedPan.x}px, ${clampedPan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <img className="tu-map" src={worldMap} alt="world map" draggable={false} ref={mapImgRef} />
            <img className="tu-pin tu-pin-tl" src={pinIcon} alt="" draggable={false} />
            <img className="tu-pin tu-pin-tr" src={pinIcon} alt="" draggable={false} />
          </div>


          <div className="ex-map-points" aria-label="filtered city markers">
            {projectedCities.slice(0, 250).map(({ city, x, y }) => {
              const cw = canvasRef.current?.clientWidth ?? 0;
              const ch = canvasRef.current?.clientHeight ?? 0;
              const sx = (x - cw / 2) * zoom + cw / 2 + clampedPan.x;
              const sy = (y - ch / 2) * zoom + ch / 2 + clampedPan.y;
              return (
                <button
                  key={city.id}
                  type="button"
                  className={`ex-point ${selectedCity?.id === city.id ? "is-selected" : ""}`}
                  style={{ left: `${sx}px`, top: `${sy}px` }}
                  onMouseEnter={() => setHoveredCity({ city, x: sx, y: sy })}
                  onMouseLeave={() => setHoveredCity(null)}
                  onClick={() => setSelectedCity(city)}
                />
              );
            })}
          </div>


          {hoveredCity ? (
            <div
              className="ex-hover-card"
              style={{
                left: `${Math.min(hoveredCity.x + 14, (canvasRef.current?.clientWidth ?? 600) - 290)}px`,
                top: `${Math.max(40, hoveredCity.y - 14)}px`,
              }}
            >
              <div className="ex-hover-title">
                {hoveredCity.city.city}, {hoveredCity.city.country}
              </div>
              <div className="ex-hover-meta">Budget: {hoveredCity.city.budgetLevel}</div>
              <div className="ex-hover-meta">Durations: {hoveredCity.city.idealDurations.join(", ") || "N/A"}</div>
              <div className="ex-hover-meta">Experiences: {experiences.map((k) => EXPERIENCE_LABELS[k]).join(", ")}</div>
              <div className="ex-hover-desc">{hoveredCity.city.shortDescription}</div>
              <div className="ex-hover-cta">Click the dot to select this city</div>
            </div>
          ) : null}


          {selectedCity && selectedProjected ? (() => {
            const cw = canvasRef.current?.clientWidth ?? 0;
            const ch = canvasRef.current?.clientHeight ?? 0;
            const sx = (selectedProjected.x - cw / 2) * zoom + cw / 2 + clampedPan.x;
            const sy = (selectedProjected.y - ch / 2) * zoom + ch / 2 + clampedPan.y;
            return (
            <div
              className="ex-city-popup"
              style={{
                left: `${Math.min(sx + 16, Math.max(10, cw - 270))}px`,
                top: `${Math.max(10, sy - 10)}px`,
              }}
            >
              <button type="button" className="ex-city-popup-close" onClick={() => setSelectedCity(null)}>
                ×
              </button>
              <div className="ex-city-popup-title">
                {selectedCity.city}, {selectedCity.country}
              </div>
              <div className="ex-city-popup-row">
                <label className="ex-plan-days">
                  Days
                  <input
                    type="number"
                    min={1}
                    max={21}
                    value={planDurationDays}
                    onChange={(e) => setPlanDurationDays(Math.max(1, Math.min(21, Number(e.target.value) || 1)))}
                  />
                </label>
              </div>
              <button type="button" className="ex-plan-btn" onClick={goToPlanPage}>
                Create Your Plan
              </button>
            </div>
            );
          })() : null}

          <div className="tu-legend" aria-label="legend panel">
            <div className="tu-legendTitle">Filtered results</div>
            <div className="tu-legendSub">{loading ? "Loading..." : `${filteredCities.length} cities`}</div>
            <div className="tu-legendDivider" />
            <div className="tu-legendRow">
              <span className="tu-dot" /> <span>Marker = matched city</span>
            </div>
            <div className="tu-legendRow">
              <span className="tu-dot is-hollow" /> <span>Experience score {"\u003e="} 4</span>
            </div>
            {loadError ? <div className="tu-legendEtc">Error: {loadError}</div> : <div className="tu-legendEtc">Top 250 points shown</div>}
          </div>


          <div className="ex-zoom-controls" aria-label="zoom controls">
            <button type="button" className="ex-zoom-btn" onClick={zoomIn} title="Zoom in" disabled={zoom >= MAX_ZOOM}>+</button>
            <button type="button" className="ex-zoom-btn ex-zoom-reset" onClick={resetZoom} title="Reset zoom" disabled={zoom === 1}>⊙</button>
            <button type="button" className="ex-zoom-btn" onClick={zoomOut} title="Zoom out" disabled={zoom <= MIN_ZOOM}>−</button>
          </div>


          <div className="ex-match-count">
            {loading ? "Loading…" : `${filteredCities.length} matches | ${Math.min(filteredCities.length, 250)} shown`}
          </div>
        </div>


        <div className="ex-filterbar" aria-label="interaction filters">
          <div className="ex-control">
            <label htmlFor="budget-filter">Budget level</label>
            <select id="budget-filter" value={draftBudget} onChange={(e) => setDraftBudget(e.target.value)}>
              {budgetOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="ex-control">
            <label>Experience (multi-select)</label>
            <div className="ex-multi">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const checked = draftExperiences.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={`ex-chip ${checked ? "is-on" : ""}`}
                    onClick={() => toggleDraftExperience(opt.key)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ex-control">
            <label htmlFor="duration-filter">Travel duration</label>
            <select id="duration-filter" value={draftDuration} onChange={(e) => setDraftDuration(e.target.value)}>
              <option value="Any">Any</option>
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="ex-filterbar-actions">
            <button type="button" className="ex-apply" onClick={applyFilter}>
              Apply Filter
            </button>
            <button type="button" className="ex-clear" onClick={clearFilter}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className={`tu-menuOverlay ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="tu-menuScrim" onClick={() => setMenuOpen(false)} />

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