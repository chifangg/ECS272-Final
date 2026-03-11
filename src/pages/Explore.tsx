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
type ExperienceKey =
  | "culture"
  | "adventure"
  | "nature"
  | "beaches"
  | "nightlife"
  | "cuisine"
  | "wellness"
  | "urban"
  | "seclusion";

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
  monthlyTemps: Record<string, { avg: number; max: number; min: number }>;
  mapX: number;
  mapY: number;
};

const EXPERIENCE_OPTIONS: Array<{ key: ExperienceKey; label: string }> = [
  { key: "culture",   label: "Culture"   },
  { key: "adventure", label: "Adventure" },
  { key: "nature",    label: "Nature"    },
  { key: "beaches",   label: "Beaches"   },
  { key: "nightlife", label: "Nightlife" },
  { key: "cuisine",   label: "Cuisine"   },
  { key: "wellness",  label: "Wellness"  },
  { key: "urban",     label: "Urban"     },
  { key: "seclusion", label: "Seclusion" },
];

const EXPERIENCE_LABELS: Record<ExperienceKey, string> = {
  culture:   "Culture",
  adventure: "Adventure",
  nature:    "Nature",
  beaches:   "Beaches",
  nightlife: "Nightlife",
  cuisine:   "Cuisine",
  wellness:  "Wellness",
  urban:     "Urban",
  seclusion: "Seclusion",
};

const DURATION_OPTIONS = ["Short trip", "One week", "Long trip"];
const MAP_BASE_WIDTH  = 612;
const MAP_BASE_HEIGHT = 250;

const MONTH_OPTIONS = [
  { key: "1",  label: "Jan" },
  { key: "2",  label: "Feb" },
  { key: "3",  label: "Mar" },
  { key: "4",  label: "Apr" },
  { key: "5",  label: "May" },
  { key: "6",  label: "Jun" },
  { key: "7",  label: "Jul" },
  { key: "8",  label: "Aug" },
  { key: "9",  label: "Sep" },
  { key: "10", label: "Oct" },
  { key: "11", label: "Nov" },
  { key: "12", label: "Dec" },
] as const;

const MONTHLY_TEMPS: Record<string, { avg: number; max: number; min: number }> = {
  "1":  { avg: 3.7,  max: 7.8,  min: 0.4  },
  "2":  { avg: 7.1,  max: 12,   min: 2.8  },
  "3":  { avg: 10.5, max: 15.5, min: 5.5  },
  "4":  { avg: 13.8, max: 18.9, min: 8.7  },
  "5":  { avg: 17.9, max: 22.5, min: 13.4 },
  "6":  { avg: 23.5, max: 28.5, min: 18.1 },
  "7":  { avg: 25.8, max: 30.8, min: 20.5 },
  "8":  { avg: 25.2, max: 30.4, min: 20.2 },
  "9":  { avg: 20.8, max: 26,   min: 16.1 },
  "10": { avg: 15.2, max: 19.6, min: 11.5 },
  "11": { avg: 8.8,  max: 12.5, min: 5.6  },
  "12": { avg: 4.7,  max: 8.2,  min: 1.9  },
};

const MIN_ZOOM  = 1;
const MAX_ZOOM  = 6;
const ZOOM_STEP = 0.5;


function coarseProjectToBase(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * MAP_BASE_WIDTH;
  const y = ((90 - lat) / 180) * MAP_BASE_HEIGHT + 15;
  return { x, y };
}

function buildLandMask(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width  = MAP_BASE_WIDTH;
  canvas.height = MAP_BASE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, MAP_BASE_WIDTH, MAP_BASE_HEIGHT);
  const data = ctx.getImageData(0, 0, MAP_BASE_WIDTH, MAP_BASE_HEIGHT).data;
  const mask = new Uint8Array(MAP_BASE_WIDTH * MAP_BASE_HEIGHT);
  for (let y = 0; y < MAP_BASE_HEIGHT; y++) {
    for (let x = 0; x < MAP_BASE_WIDTH; x++) {
      const i = (y * MAP_BASE_WIDTH + x) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      mask[y * MAP_BASE_WIDTH + x] = lum < 120 ? 1 : 0;
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

function getTopExperience(city: ExploreCity): ExperienceKey {
  let top: ExperienceKey = "culture";
  let topScore = city.scores[top];
  for (const opt of EXPERIENCE_OPTIONS) {
    if (city.scores[opt.key] > topScore) {
      top = opt.key;
      topScore = city.scores[opt.key];
    }
  }
  return top;
}


export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef       = useRef<HTMLDivElement | null>(null);
  const mapImgRef       = useRef<HTMLImageElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [cities,     setCities]     = useState<ExploreCity[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState<string | null>(null);

  const forceTour = (location.state as any)?.tutorial === true;
  const [tourStep, setTourStep] = useState<number | null>(null);
  useEffect(() => {
    if (forceTour || !localStorage.getItem(TOUR_KEY)) setTourStep(0);
  }, [forceTour]);


  const [draftBudget,      setDraftBudget]      = useState("Any");
  const [draftDuration,    setDraftDuration]    = useState("Any");
  const [draftExperiences, setDraftExperiences] = useState<ExperienceKey[]>([]);
  const [draftMonth,       setDraftMonth]       = useState("Any");
  const [draftTempMin,     setDraftTempMin]     = useState(-25);
  const [draftTempMax,     setDraftTempMax]     = useState(42);

 
  const [budgetLevel,  setBudgetLevel]  = useState("Any");
  const [duration,     setDuration]     = useState("Any");
  const [experiences,  setExperiences]  = useState<ExperienceKey[]>([]);
  const [travelMonth,  setTravelMonth]  = useState("Any");
  const [tempMin,      setTempMin]      = useState(-25);
  const [tempMax,      setTempMax]      = useState(42);

  const [mapBox,          setMapBox]          = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [hoveredCity,     setHoveredCity]     = useState<{ city: ExploreCity; x: number; y: number } | null>(null);
  const [compareCity,     setCompareCity]     = useState<ExploreCity | null>(null);
  const [landMask,        setLandMask]        = useState<Uint8Array | null>(null);
  const [selectedCity,    setSelectedCity]    = useState<ExploreCity | null>(null);
  const [planDurationDays,setPlanDurationDays]= useState(5);
  const [expandedDescCity, setExpandedDescCity] = useState<string | null>(null);
  const lastHoveredCityRef = useRef<ExploreCity | null>(null);
  const isOverCardRef      = useRef(false);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isPanningRef   = useRef(false);
  const lastPanPosRef  = useRef({ x: 0, y: 0 });

  
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await d3.csv("/data/cities.csv");
        const mapped: ExploreCity[] = rows.map((d) => ({
          id:               String(d.id ?? ""),
          city:             String(d.city ?? ""),
          country:          String(d.country ?? ""),
          shortDescription: String(d.short_description ?? ""),
          lat:              Number(d.latitude ?? 0),
          lng:              Number(d.longitude ?? 0),
          budgetLevel:      String(d.budget_level ?? "Unknown"),
          idealDurations:   parseDurations(d.ideal_durations),
          scores: {
            culture:   Number(d.culture   ?? 0),
            adventure: Number(d.adventure ?? 0),
            nature:    Number(d.nature    ?? 0),
            beaches:   Number(d.beaches   ?? 0),
            nightlife: Number(d.nightlife ?? 0),
            cuisine:   Number(d.cuisine   ?? 0),
            wellness:  Number(d.wellness  ?? 0),
            urban:     Number(d.urban     ?? 0),
            seclusion: Number(d.seclusion ?? 0),
          },
          monthlyTemps: (() => {
            try { return JSON.parse(d.avg_temp_monthly ?? "{}"); }
            catch { return {}; }
          })(),
          mapX: 0,
          mapY: 0,
        }));
        if (!cancelled) {
          const withProjected = mapped
            .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))
            .map((city) => {
              const p = coarseProjectToBase(city.lat, city.lng);
              return { ...city, mapX: p.x / MAP_BASE_WIDTH, mapY: p.y / MAP_BASE_HEIGHT };
            });
          setCities(withProjected);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Failed to load cities.csv");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    const img    = mapImgRef.current;
    if (!canvas || !img) return;
    const updateMapBox = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const iw = img.naturalWidth  || 1;
      const ih = img.naturalHeight || 1;
      const scale  = Math.min(cw / iw, ch / ih);
      const width  = iw * scale;
      const height = ih * scale;
      setMapBox({ left: (cw - width) / 2, top: (ch - height) / 2, width, height });
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
      const rect   = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setZoom((prevZoom) => {
        const delta   = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom + delta));
        const ratio   = newZoom / prevZoom;
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
    isPanningRef.current  = true;
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

  const onMouseUp = useCallback(() => { isPanningRef.current = false; }, []);


  const clampedPan = useMemo(() => {
    if (!canvasRef.current) return { x: panX, y: panY };
    const cw   = canvasRef.current.clientWidth;
    const ch   = canvasRef.current.clientHeight;
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
    return cities.filter((city) => {
      if (budgetLevel !== "Any" && city.budgetLevel !== budgetLevel) return false;
      if (duration !== "Any" && !city.idealDurations.includes(duration)) return false;
      if (travelMonth !== "Any") {
        const t = city.monthlyTemps?.[travelMonth];
        if (!t || t.avg < tempMin || t.avg > tempMax) return false;
      }
      if (experiences.length > 0) {
        const hasAll = experiences.every((key) => city.scores[key] >= 3);
        if (!hasAll) return false;
      }
      return true;
    });
  }, [budgetLevel, cities, duration, experiences, travelMonth, tempMin, tempMax]);

  const projectedCities = useMemo(() => {
    if (mapBox.width <= 0 || mapBox.height <= 0) return [];
    return filteredCities.map((city) => {
      const baseX   = city.mapX * MAP_BASE_WIDTH;
      const baseY   = city.mapY * MAP_BASE_HEIGHT;
      const snapped = landMask ? snapToNearestLand(baseX, baseY, landMask) : { x: baseX, y: baseY };
      return {
        city,
        x: mapBox.left + (snapped.x / MAP_BASE_WIDTH)  * mapBox.width,
        y: mapBox.top  + (snapped.y / MAP_BASE_HEIGHT) * mapBox.height,
      };
    });
  }, [filteredCities, landMask, mapBox]);

  const selectedProjected = useMemo(() => {
    if (!selectedCity) return null;
    return projectedCities.find((p) => p.city.id === selectedCity.id) ?? null;
  }, [projectedCities, selectedCity]);

  const menuItems = useMemo(
    () => [
      { key: "gallery"  as MenuKey, label: "Viz gallery",      pos: "tl" },
      { key: "tutorial" as MenuKey, label: "Tutorial",         pos: "tr" },
      { key: "explore"  as MenuKey, label: "Explore\nyour own",pos: "bl" },
      { key: "main"     as MenuKey, label: "Main Viz",         pos: "br" },
    ] as const,
    []
  );

  const selectedExperienceLabels = useMemo(() => {
    if (experiences.length === 0) return "All experiences";
    return experiences.map((k) => EXPERIENCE_LABELS[k]).join(", ");
  }, [experiences]);

  const compareMetrics = useMemo(() => {
    if (!hoveredCity || !compareCity || hoveredCity.city.id === compareCity.id) return null;
    return {
      previous:    compareCity,
      current:     hoveredCity.city,
      previousTop: getTopExperience(compareCity),
      currentTop:  getTopExperience(hoveredCity.city),
    };
  }, [compareCity, hoveredCity]);


  function onPointEnter(city: ExploreCity, x: number, y: number) {
    const previous = lastHoveredCityRef.current;
    if (previous && previous.id !== city.id) setCompareCity(previous);
    setHoveredCity({ city, x, y });
    lastHoveredCityRef.current = city;
  }

  function onPointLeave(cityId: string) {

    setTimeout(() => {
      if (!isOverCardRef.current) {
        setHoveredCity((cur) => (cur?.city.id === cityId ? null : cur));
        setExpandedDescCity((cur) => (cur === cityId ? null : cur));
      }
    }, 80);
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
    setDraftExperiences((prev) =>
      prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]
    );
    setExperiences((prev) =>
      prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]
    );
  }

  function applyFilter() {
    setBudgetLevel(draftBudget);
    setDuration(draftDuration);
    setExperiences(draftExperiences);
    setTravelMonth(draftMonth);
    setTempMin(draftTempMin);
    setTempMax(draftTempMax);
    setHoveredCity(null);
    setCompareCity(null);
    lastHoveredCityRef.current = null;
  }

  function clearFilter() {
    setDraftBudget("Any");
    setDraftDuration("Any");
    setDraftExperiences([]);
    setDraftMonth("Any");
    setDraftTempMin(-25);
    setDraftTempMax(42);
    setBudgetLevel("Any");
    setDuration("Any");
    setExperiences([]);
    setTravelMonth("Any");
    setTempMin(-25);
    setTempMax(42);
    setHoveredCity(null);
    setCompareCity(null);
    lastHoveredCityRef.current = null;
    setSelectedCity(null);
  }

  function zoomIn()    { setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP)); }
  function zoomOut()   {
    setZoom((z) => {
      const nz = Math.max(MIN_ZOOM, z - ZOOM_STEP);
      if (nz === MIN_ZOOM) { setPanX(0); setPanY(0); }
      return nz;
    });
  }
  function resetZoom() { setZoom(1); setPanX(0); setPanY(0); }

  function goToPlanPage() {
    if (!selectedCity) return;
    navigate("/travel-plan", {
      state: {
        city: {
          id:               selectedCity.id,
          city:             selectedCity.city,
          country:          selectedCity.country,
          shortDescription: selectedCity.shortDescription,
          budgetLevel:      selectedCity.budgetLevel,
          idealDurations:   selectedCity.idealDurations,
          scores:           selectedCity.scores,
        },
        durationDays:           planDurationDays,
        selectedExperiences:    experiences.map((k) => EXPERIENCE_LABELS[k]),
        travelMonth:            travelMonth === "Any" ? null : travelMonth,
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
          onContextMenu={(e) => e.preventDefault()}
          style={{ cursor: zoom > 1 ? "grab" : "default" }}
        >
          <div className="ex-top-hint">
            Pick filters below, then click Apply | hover cities to compare | click a dot to select for plan generation
          </div>


          <div
            className="ex-zoom-layer"
            ref={mapContainerRef}
            style={{
              transform:       `translate(${clampedPan.x}px, ${clampedPan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <img className="tu-map"      src={worldMap} alt="world map" draggable={false} ref={mapImgRef} />
            <img className="tu-pin tu-pin-tl" src={pinIcon} alt="" draggable={false} />
            <img className="tu-pin tu-pin-tr" src={pinIcon} alt="" draggable={false} />
          </div>


          <div className="ex-map-points" aria-label="filtered city markers">
            {projectedCities.slice(0, 250).map(({ city, x, y }) => {
              const cw = canvasRef.current?.clientWidth  ?? 0;
              const ch = canvasRef.current?.clientHeight ?? 0;
              const sx = (x - cw / 2) * zoom + cw / 2 + clampedPan.x;
              const sy = (y - ch / 2) * zoom + ch / 2 + clampedPan.y;
              return (
                <button
                  key={city.id}
                  type="button"
                  className={`ex-point ${selectedCity?.id === city.id ? "is-selected" : ""}`}
                  style={{ left: `${sx}px`, top: `${sy}px` }}
                  onMouseEnter={() => onPointEnter(city, sx, sy)}
                  onMouseLeave={() => onPointLeave(city.id)}
                  onClick={() => setSelectedCity(city)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpandedDescCity((cur) => (cur === city.id ? null : city.id));
                  }}
                />
              );
            })}
          </div>

          {hoveredCity && compareMetrics ? (

            <div
              className="ex-hover-card ex-hover-compare"
              style={{
                left: `${Math.min(hoveredCity.x + 14, (canvasRef.current?.clientWidth ?? 600) - 440)}px`,
                top:  `${Math.max(40, hoveredCity.y - 14)}px`,
                pointerEvents: "auto",
              }}
              onMouseEnter={() => { isOverCardRef.current = true; }}
              onMouseLeave={() => {
                isOverCardRef.current = false;
                setHoveredCity(null);
                setExpandedDescCity(null);
              }}
            >
              <div className="ex-hover-title ex-hover-compare-title">Compare Cities</div>
              <div className="ex-hover-compare-grid">
                {([
                  { city: compareMetrics.previous, tag: "Previous" },
                  { city: compareMetrics.current,  tag: "Current"  },
                ] as const).map(({ city, tag }, colIdx) => {
                  const t      = travelMonth !== "Any" ? city.monthlyTemps?.[travelMonth] : null;
                  const mLabel = MONTH_OPTIONS.find((m) => m.key === travelMonth)?.label;
                  const isExpanded = expandedDescCity === city.id;
                  const canvasW = canvasRef.current?.clientWidth ?? 600;
                  const expandDir = hoveredCity.x > canvasW / 2 ? "left" : "right";
                  const popupDir = colIdx === 0
                    ? (expandDir === "left" ? "left" : "right")
                    : (expandDir === "left" ? "left" : "right");
                  return (
                    <div key={tag} className="ex-hover-col">
                      <div className="ex-hover-meta ex-hover-col-tag">{tag}</div>
                      <div className="ex-hover-title">{city.city}, {city.country}</div>
                      <div className="ex-hover-exp-list">
                        <div className="ex-hover-exp-item ex-hover-pill-meta">
                          <span>Budget</span><strong>{city.budgetLevel}</strong>
                        </div>
                        <div className="ex-hover-exp-item ex-hover-pill-meta">
                          <span>Duration</span><strong>{city.idealDurations.join(", ") || "N/A"}</strong>
                        </div>
                        {t && (
                          <div className="ex-hover-exp-item ex-hover-pill-temp">
                            <span>{mLabel} avg</span><strong>{t.avg.toFixed(1)}°C</strong>
                          </div>
                        )}
                        {experiences.map((key) => (
                          <div key={key} className="ex-hover-exp-item is-selected">
                            <span>{EXPERIENCE_LABELS[key]}</span>
                            <strong>{city.scores[key]}/5</strong>
                          </div>
                        ))}
                      </div>
                      {city.shortDescription && (
                        <div className="ex-hover-desc-row">
                          <button
                            type="button"
                            className="ex-desc-toggle"
                            onClick={() => setExpandedDescCity(isExpanded ? null : city.id)}
                          >
                            {isExpanded ? "Less ▴" : "More ▾"}
                          </button>
                          {isExpanded && (
                            <div className={`ex-hover-desc-popup ex-hover-desc-popup--${popupDir}`}>
                              {city.shortDescription}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="ex-hover-cta">Focus: {selectedExperienceLabels}</div>
            </div>
          ) : hoveredCity ? (

            <div
              className="ex-hover-card"
              style={{
                left: `${Math.min(hoveredCity.x + 14, (canvasRef.current?.clientWidth ?? 600) - 290)}px`,
                top:  `${Math.max(40, hoveredCity.y - 14)}px`,
                pointerEvents: "auto",
              }}
              onMouseEnter={() => { isOverCardRef.current = true; }}
              onMouseLeave={() => {
                isOverCardRef.current = false;
                setHoveredCity(null);
                setExpandedDescCity(null);
              }}
            >
              <div className="ex-hover-title">
                {hoveredCity.city.city}, {hoveredCity.city.country}
              </div>
              {(() => {
                const t      = travelMonth !== "Any" ? hoveredCity.city.monthlyTemps?.[travelMonth] : null;
                const mLabel = MONTH_OPTIONS.find((m) => m.key === travelMonth)?.label;
                const isExpanded = expandedDescCity === hoveredCity.city.id;
                const canvasW = canvasRef.current?.clientWidth ?? 600;
                const expandDir = hoveredCity.x > canvasW / 2 ? "left" : "right";
                return (
                  <>
                    <div className="ex-hover-exp-list">
                      <div className="ex-hover-exp-item ex-hover-pill-meta">
                        <span>Budget</span><strong>{hoveredCity.city.budgetLevel}</strong>
                      </div>
                      <div className="ex-hover-exp-item ex-hover-pill-meta">
                        <span>Duration</span><strong>{hoveredCity.city.idealDurations.join(", ") || "N/A"}</strong>
                      </div>
                      {t && (
                        <div className="ex-hover-exp-item ex-hover-pill-temp">
                          <span>{mLabel} avg</span><strong>{t.avg.toFixed(1)}°C</strong>
                        </div>
                      )}
                      {experiences.map((key) => (
                        <div key={key} className="ex-hover-exp-item is-selected">
                          <span>{EXPERIENCE_LABELS[key]}</span>
                          <strong>{hoveredCity.city.scores[key]}/5</strong>
                        </div>
                      ))}
                    </div>
                    {hoveredCity.city.shortDescription && (
                      <div className="ex-hover-desc-row">
                        <button
                          type="button"
                          className="ex-desc-toggle"
                          onClick={() => setExpandedDescCity(isExpanded ? null : hoveredCity.city.id)}
                        >
                          {isExpanded ? "Less ▴" : "More ▾"}
                        </button>
                        {isExpanded && (
                          <div className={`ex-hover-desc-popup ex-hover-desc-popup--${expandDir}`}>
                            {hoveredCity.city.shortDescription}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="ex-hover-cta">Hover another city to compare</div>
                  </>
                );
              })()}
            </div>
          ) : null}


          {selectedCity && selectedProjected ? (() => {
            const cw = canvasRef.current?.clientWidth  ?? 0;
            const ch = canvasRef.current?.clientHeight ?? 0;
            const sx = (selectedProjected.x - cw / 2) * zoom + cw / 2 + clampedPan.x;
            const sy = (selectedProjected.y - ch / 2) * zoom + ch / 2 + clampedPan.y;
            return (
              <div
                className="ex-city-popup"
                style={{
                  left: `${Math.min(sx + 16, Math.max(10, cw - 270))}px`,
                  top:  `${Math.max(10, sy - 10)}px`,
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
                      onChange={(e) =>
                        setPlanDurationDays(Math.max(1, Math.min(21, Number(e.target.value) || 1)))
                      }
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
              <span className="tu-dot" /> <span>Matched city</span>
            </div>
            {experiences.length > 0 && (
              <div className="tu-legendEtc">All selected experiences ≥ 3/5</div>
            )}
            {loadError
              ? <div className="tu-legendEtc">Error: {loadError}</div>
              : !experiences.length && <div className="tu-legendEtc">Top 250 points shown</div>
            }
          </div>


          <div className="ex-zoom-controls" aria-label="zoom controls">
            <button type="button" className="ex-zoom-btn" onClick={zoomIn}    title="Zoom in"    disabled={zoom >= MAX_ZOOM}>+</button>
            <button type="button" className="ex-zoom-btn ex-zoom-reset" onClick={resetZoom} title="Reset zoom" disabled={zoom === 1}>⊙</button>
            <button type="button" className="ex-zoom-btn" onClick={zoomOut}   title="Zoom out"   disabled={zoom <= MIN_ZOOM}>−</button>
          </div>

          <div className="ex-match-count">
            {loading ? "Loading…" : `${filteredCities.length} cities | ${Math.min(filteredCities.length, 250)} shown`}
          </div>
        </div>


        <div className="ex-filterbar" aria-label="interaction filters">


          <div className="ex-control ex-control-budget">
            <label htmlFor="budget-filter">Budget level</label>
            <select id="budget-filter" value={draftBudget} onChange={(e) => setDraftBudget(e.target.value)}>
              {budgetOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="ex-control ex-control-exp">
            <label>Experience</label>
            <div className="ex-multi">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`ex-chip ${draftExperiences.includes(opt.key) ? "is-on" : ""}`}
                  onClick={() => toggleDraftExperience(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ex-control ex-control-duration">
            <label htmlFor="duration-filter">Travel duration</label>
            <select id="duration-filter" value={draftDuration} onChange={(e) => setDraftDuration(e.target.value)}>
              <option value="Any">Any</option>
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <button type="button" className="ex-apply ex-apply-r1" onClick={applyFilter}>Apply Filter</button>


          <div className="ex-control ex-control-month">
            <label>Travel month</label>
            <div className="ex-month-pills">
              <button
                type="button"
                className={`ex-chip ex-chip--month ${draftMonth === "Any" ? "is-on" : ""}`}
                onClick={() => setDraftMonth("Any")}
              >Any</button>
              {MONTH_OPTIONS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`ex-chip ex-chip--month ${draftMonth === m.key ? "is-on" : ""}`}
                  onClick={() => setDraftMonth(m.key)}
                >{m.label}</button>
              ))}
            </div>
          </div>

          <div className="ex-control ex-control-temp">
            <div className="ex-temp-header">
              <label>Avg temperature</label>
              {draftMonth !== "Any" && (
                <span className="ex-temp-hint">
                  global median in {MONTH_OPTIONS.find(m => m.key === draftMonth)?.label}: {MONTHLY_TEMPS[draftMonth].avg.toFixed(1)}°C
                </span>
              )}
            </div>
            {draftMonth !== "Any" ? (
              <div className="ex-temp-slider-row">
                <span className="ex-temp-edge">{draftTempMin}°C</span>
                <div className="ex-dual-slider">
                  <input
                    type="range" min={-25} max={42} step={1}
                    value={draftTempMin}
                    onChange={(e) => setDraftTempMin(Math.min(Number(e.target.value), draftTempMax - 1))}
                    className="ex-slider ex-slider-min"
                  />
                  <input
                    type="range" min={-25} max={42} step={1}
                    value={draftTempMax}
                    onChange={(e) => setDraftTempMax(Math.max(Number(e.target.value), draftTempMin + 1))}
                    className="ex-slider ex-slider-max"
                  />
                  <div className="ex-slider-track">
                    <div
                      className="ex-slider-fill"
                      style={{
                        left:  `${((draftTempMin + 25) / 67) * 100}%`,
                        width: `${((draftTempMax - draftTempMin) / 67) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="ex-temp-edge">{draftTempMax}°C</span>
              </div>
            ) : (
              <span className="ex-temp-placeholder">Select a month first</span>
            )}
          </div>

          <button type="button" className="ex-clear ex-clear-r2" onClick={clearFilter}>Clear Filter</button>

        </div>
      </div>


      <div className={`tu-menuOverlay ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="tu-menuScrim" onClick={() => setMenuOpen(false)} />
        <div className="tu-menuArc">
          {menuItems.map((it) => (
            <button key={it.key} type="button" className={`tu-menuItem tu-${it.pos}`} onClick={() => onPick(it.key)}>
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
}: {
  step: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const s      = EXPLORE_TOUR_STEPS[step];
  const isLast = step === total - 1;
  return (
    <div className="ga-tourOverlay">
      <div className="ga-tourCard" key={step}>
        <div className="ga-tourTop">
          <div className="ga-tourDots">
            {EXPLORE_TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`ga-tourDot ${i === step ? "is-active" : i < step ? "is-done" : ""}`}
              />
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