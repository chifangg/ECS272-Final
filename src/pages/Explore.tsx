import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as d3 from "d3";
import { TutorialTopBar } from "../components/TutorialTopBar";
import { BottomBar } from "../components/BottomBar";

import "../styles/Tutorial.css";
import "../styles/Explore.css";
import "../styles/Gallery.css";

import worldMap from "../assets/world_map.svg";
import pinIcon from "../assets/pin.png";

const TOUR_KEY = "explore-toured";

const EXPLORE_TOUR_STEPS = [
  {
    id: "welcome",
    title: "Explore Your Own",
    body: "This is your personal exploration tool. All 560 cities are shown on the map, filter by budget, travel duration, and the experiences you care about most.",
  },
  {
    id: "filter",
    title: "Use the filters",
    body: "Select your budget level, ideal trip duration, and the experiences you want from the filter bar below. Hit Apply Filter to update the map.",
  },
  {
    id: "map",
    title: "Read the map",
    body: "Hover any city to see details and compare it against the last city you hovered.",
  },
  {
    id: "LLM_planning",
    title: "LLM-based travel plan generation",
    body: "After clicking create your plan, the system will generate a personalized travel plan for your selected city. This may take up a little while, please be patient!",
  },
  {
    id: "done",
    title: "That's it! you're ready!",
    body: "The tutorial ends here. Feel free to explore freely, filter cities, and find your perfect travel destination. Have fun!",
  },

];
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
const MONTH_OPTIONS = [
  { key: "1", label: "Jan" },
  { key: "2", label: "Feb" },
  { key: "3", label: "Mar" },
  { key: "4", label: "Apr" },
  { key: "5", label: "May" },
  { key: "6", label: "Jun" },
  { key: "7", label: "Jul" },
  { key: "8", label: "Aug" },
  { key: "9", label: "Sep" },
  { key: "10", label: "Oct" },
  { key: "11", label: "Nov" },
  { key: "12", label: "Dec" },
] as const;
const MONTHLY_TEMPS: Record<string, { avg: number; max: number; min: number }> = {
  "1": { avg: 3.7, max: 7.8, min: 0.4 },
  "2": { avg: 7.1, max: 12, min: 2.8 },
  "3": { avg: 10.5, max: 15.5, min: 5.5 },
  "4": { avg: 13.8, max: 18.9, min: 8.7 },
  "5": { avg: 17.9, max: 22.5, min: 13.4 },
  "6": { avg: 23.5, max: 28.5, min: 18.1 },
  "7": { avg: 25.8, max: 30.8, min: 20.5 },
  "8": { avg: 25.2, max: 30.4, min: 20.2 },
  "9": { avg: 20.8, max: 26, min: 16.1 },
  "10": { avg: 15.2, max: 19.6, min: 11.5 },
  "11": { avg: 8.8, max: 12.5, min: 5.6 },
  "12": { avg: 4.7, max: 8.2, min: 1.9 },
};

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

function getTopExperience(city: ExploreCity): ExperienceKey {
  let top: ExperienceKey = "culture";
  let topScore = city.scores[top];
  for (const option of EXPERIENCE_OPTIONS) {
    if (city.scores[option.key] > topScore) {
      top = option.key;
      topScore = city.scores[option.key];
    }
  }
  return top;
}

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const mapImgRef = useRef<HTMLImageElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [cities, setCities] = useState<ExploreCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);


  const forceTour = (location.state as any)?.tutorial === true;
  const [tourStep, setTourStep] = useState<number | null>(null);
  useEffect(() => {
    if (forceTour || !localStorage.getItem(TOUR_KEY)) {
      setTourStep(0);
    }
  }, [forceTour]);

  const [draftBudget, setDraftBudget] = useState("Any");
  const [draftDuration, setDraftDuration] = useState("Any");
  const [draftExperiences, setDraftExperiences] = useState<ExperienceKey[]>([]);
  const [draftMonth, setDraftMonth] = useState("Any");

  const [budgetLevel, setBudgetLevel] = useState("Any");
  const [duration, setDuration] = useState("Any");
  const [experiences, setExperiences] = useState<ExperienceKey[]>([]);
  const [travelMonth, setTravelMonth] = useState("Any");

  const [mapBox, setMapBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [hoveredCity, setHoveredCity] = useState<{ city: ExploreCity; x: number; y: number } | null>(null);
  const [compareCity, setCompareCity] = useState<ExploreCity | null>(null);
  const [landMask, setLandMask] = useState<Uint8Array | null>(null);
  const [selectedCity, setSelectedCity] = useState<ExploreCity | null>(null);
  const [planDurationDays, setPlanDurationDays] = useState(5);
  const lastHoveredCityRef = useRef<ExploreCity | null>(null);


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

  const selectedExperienceLabels = useMemo(() => {
    if (experiences.length === 0) return "All experiences";
    return experiences.map((k) => EXPERIENCE_LABELS[k]).join(", ");
  }, [experiences]);
  const selectedMonthInfo = useMemo(() => {
    if (draftMonth === "Any") return null;
    const monthLabel = MONTH_OPTIONS.find((m) => m.key === draftMonth)?.label ?? draftMonth;
    const temp = MONTHLY_TEMPS[draftMonth];
    if (!temp) return null;
    return { monthLabel, temp };
  }, [draftMonth]);

  const compareMetrics = useMemo(() => {
    if (!hoveredCity || !compareCity || hoveredCity.city.id === compareCity.id) return null;
    const current = hoveredCity.city;
    const previousMatch = getMatchScore(compareCity, experiences);
    const currentMatch = getMatchScore(current, experiences);
    return {
      previous: compareCity,
      current,
      previousMatch,
      currentMatch,
      previousTop: getTopExperience(compareCity),
      currentTop: getTopExperience(current),
      previousIsBetter: previousMatch > currentMatch,
      currentIsBetter: currentMatch > previousMatch,
    };
  }, [compareCity, experiences, hoveredCity]);

  function onPointEnter(city: ExploreCity, x: number, y: number) {
    const previous = lastHoveredCityRef.current;
    if (previous && previous.id !== city.id) {
      setCompareCity(previous);
    }
    setHoveredCity({ city, x, y });
    lastHoveredCityRef.current = city;
  }

  function onPointLeave(cityId: string) {
    setHoveredCity((current) => (current?.city.id === cityId ? null : current));
  }

  function onPick(item: MenuKey) {
    if (item === "gallery") return navigate("/gallery");
    if (item === "explore") return navigate("/explore");
    if (item === "tutorial") {
      localStorage.removeItem("gallery-toured");
      localStorage.removeItem("home-toured");
      localStorage.removeItem("explore-toured");
      window.location.href = "/tutorial";
      return;
    }
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
    setTravelMonth(draftMonth);
    setHoveredCity(null);
    setCompareCity(null);
    lastHoveredCityRef.current = null;
  }

  function clearFilter() {
    setDraftBudget("Any");
    setDraftDuration("Any");
    setDraftExperiences([]);
    setDraftMonth("Any");
    setBudgetLevel("Any");
    setDuration("Any");
    setExperiences([]);
    setTravelMonth("Any");
    setHoveredCity(null);
    setCompareCity(null);
    lastHoveredCityRef.current = null;
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
        travelMonth: travelMonth === "Any" ? null : travelMonth,
        travelMonthTemperature: travelMonth !== "Any" ? MONTHLY_TEMPS[travelMonth] : null,
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
            Pick filters below, then click Apply | hover cities to compare | click a dot to select for plan generation
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
              const matchScore = getMatchScore(city, experiences);
              const matchClass =
                experiences.length === 0
                  ? ""
                  : matchScore >= 8
                    ? "is-match-strong"
                    : matchScore >= 6
                      ? "is-match-mid"
                      : "";
              return (
                <button
                  key={city.id}
                  type="button"
                  className={`ex-point ${selectedCity?.id === city.id ? "is-selected" : ""} ${matchClass}`}
                  style={{ left: `${sx}px`, top: `${sy}px` }}
                  onMouseEnter={() => onPointEnter(city, sx, sy)}
                  onMouseLeave={() => onPointLeave(city.id)}
                  onClick={() => setSelectedCity(city)}
                />
              );
            })}
          </div>


          {hoveredCity && compareMetrics ? (
            <div
              className="ex-hover-card ex-hover-compare"
              style={{
                left: `${Math.min(hoveredCity.x + 14, (canvasRef.current?.clientWidth ?? 600) - 440)}px`,
                top: `${Math.max(40, hoveredCity.y - 14)}px`,
              }}
            >
              <div className="ex-hover-title ex-hover-compare-title">
                Compare Cities
              </div>
              <div className="ex-hover-compare-grid">
                <div className={`ex-hover-col ${compareMetrics.previousIsBetter ? "is-better" : ""}`}>
                  <div className="ex-hover-meta ex-hover-col-tag">Previous</div>
                  <div className="ex-hover-title">
                    {compareMetrics.previous.city}, {compareMetrics.previous.country}
                  </div>
                  {selectedMonthInfo ? (
                    <div className="ex-hover-meta">
                      {selectedMonthInfo.monthLabel} Temp: Avg {selectedMonthInfo.temp.avg.toFixed(1)}°C ({selectedMonthInfo.temp.min.toFixed(1)}°C - {selectedMonthInfo.temp.max.toFixed(1)}°C)
                    </div>
                  ) : null}
                  <div className="ex-hover-meta">Budget: {compareMetrics.previous.budgetLevel}</div>
                  <div className="ex-hover-meta">Durations: {compareMetrics.previous.idealDurations.join(", ") || "N/A"}</div>
                  <div className="ex-hover-meta">Best: {EXPERIENCE_LABELS[compareMetrics.previousTop]}</div>
                  <div className="ex-hover-meta">Match: {compareMetrics.previousMatch}/10</div>
                  {experiences.length > 0 ? (
                    <div className="ex-hover-exp-list">
                      {experiences.map((key) => (
                        <div key={`${compareMetrics.previous.id}-${key}`} className="ex-hover-exp-item is-selected">
                          <span>{EXPERIENCE_LABELS[key]}</span>
                          <strong>{compareMetrics.previous.scores[key]}/10</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className={`ex-hover-col ${compareMetrics.currentIsBetter ? "is-better" : ""}`}>
                  <div className="ex-hover-meta ex-hover-col-tag">Current</div>
                  <div className="ex-hover-title">
                    {compareMetrics.current.city}, {compareMetrics.current.country}
                  </div>
                  {selectedMonthInfo ? (
                    <div className="ex-hover-meta">
                      {selectedMonthInfo.monthLabel} Temp: Avg {selectedMonthInfo.temp.avg.toFixed(1)}°C ({selectedMonthInfo.temp.min.toFixed(1)}°C - {selectedMonthInfo.temp.max.toFixed(1)}°C)
                    </div>
                  ) : null}
                  <div className="ex-hover-meta">Budget: {compareMetrics.current.budgetLevel}</div>
                  <div className="ex-hover-meta">Durations: {compareMetrics.current.idealDurations.join(", ") || "N/A"}</div>
                  <div className="ex-hover-meta">Best: {EXPERIENCE_LABELS[compareMetrics.currentTop]}</div>
                  <div className="ex-hover-meta">Match: {compareMetrics.currentMatch}/10</div>
                  {experiences.length > 0 ? (
                    <div className="ex-hover-exp-list">
                      {experiences.map((key) => (
                        <div key={`${compareMetrics.current.id}-${key}`} className="ex-hover-exp-item is-selected">
                          <span>{EXPERIENCE_LABELS[key]}</span>
                          <strong>{compareMetrics.current.scores[key]}/10</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="ex-hover-cta">Focus: {selectedExperienceLabels}</div>
            </div>
          ) : hoveredCity ? (
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
              {selectedMonthInfo ? (
                <div className="ex-hover-meta">
                  {selectedMonthInfo.monthLabel} Temp: Avg {selectedMonthInfo.temp.avg.toFixed(1)}°C ({selectedMonthInfo.temp.min.toFixed(1)}°C - {selectedMonthInfo.temp.max.toFixed(1)}°C)
                </div>
              ) : null}
              <div className="ex-hover-meta">Budget: {hoveredCity.city.budgetLevel}</div>
              <div className="ex-hover-meta">Durations: {hoveredCity.city.idealDurations.join(", ") || "N/A"}</div>
              <div className="ex-hover-meta">Match: {getMatchScore(hoveredCity.city, experiences)}/10</div>
              {experiences.length > 0 ? (
                <div className="ex-hover-exp-list">
                  {experiences.map((key) => (
                    <div key={`${hoveredCity.city.id}-${key}`} className="ex-hover-exp-item is-selected">
                      <span>{EXPERIENCE_LABELS[key]}</span>
                      <strong>{hoveredCity.city.scores[key]}/10</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ex-hover-meta">Experiences: {selectedExperienceLabels}</div>
              )}
              <div className="ex-hover-desc">{hoveredCity.city.shortDescription}</div>
              <div className="ex-hover-cta">Hover another city to compare</div>
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

          <div className="ex-control">
            <label htmlFor="month-filter">Travel month</label>
            <select id="month-filter" value={draftMonth} onChange={(e) => setDraftMonth(e.target.value)}>
              <option value="Any">Any</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month.key} value={month.key}>
                  {month.label}
                </option>
              ))}
            </select>
            <div className="ex-month-hover">
              {draftMonth !== "Any"
                ? `Selected ${MONTH_OPTIONS.find((m) => m.key === draftMonth)?.label} Avg ${MONTHLY_TEMPS[draftMonth].avg.toFixed(1)}°C`
                : "Select a month to preview avg temp"}
            </div>
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

      {tourStep !== null && (
        <ExploreTour
          step={tourStep}
          total={EXPLORE_TOUR_STEPS.length}
          onNext={() => {
            if (tourStep < EXPLORE_TOUR_STEPS.length - 1) {
              setTourStep(tourStep + 1);
            } else {
              localStorage.setItem(TOUR_KEY, "1");
              setTourStep(null);
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

function ExploreTour({
  step, total, onNext, onSkip,
}: { step: number; total: number; onNext: () => void; onSkip: () => void; }) {
  const s = EXPLORE_TOUR_STEPS[step];
  const isLast = step === total - 1;
  return (
    <div className="ga-tourOverlay">
      <div className="ga-tourCard" key={step}>
        <div className="ga-tourTop">
          <div className="ga-tourDots">
            {EXPLORE_TOUR_STEPS.map((_, i) => (
              <span key={i} className={`ga-tourDot ${i === step ? "is-active" : i < step ? "is-done" : ""}`} />
            ))}
          </div>
          {!isLast && <button className="ga-tourSkip" onClick={onSkip}>Skip</button>}
        </div>
        <div className="ga-tourTitle">{s.title}</div>
        <div className="ga-tourBody">{s.body}</div>
        <button className="ga-tourNext" onClick={onNext}>
          {isLast ? "Start exploring! →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
