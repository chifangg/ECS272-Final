import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { NormalTopBar } from "../components/NormalTopBar";
import { BottomBar } from "../components/BottomBar";
import "../styles/Gallery.css";

import pinIcon from "../assets/pin.png";

const TOUR_KEY = "gallery-toured";

const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Viz Gallery!",
    body: "This page shows 7 built-in visualizations based on our dataset of 560 cities worldwide. Each chart reveals a different angle of the travel decision space.",
    highlight: "marquee",
  },
  {
    id: "marquee",
    title: "Browse the charts",
    body: "Scroll through the marquee at the top to see all visualizations. Hover to pause, click the open icon to view full screen, or click the i button to learn more about each chart.",
    highlight: "marquee",
  },
  {
    id: "filter",
    title: "Find the most relevant chart for you",
    body: "Tell us what you're curious about by selecting one or more questions below, then hit Apply. We'll rank and recommend the two most relevant visualizations for your interests.",
    highlight: "filter",
  },
];


type VizItem = {
  id: string;
  title: string;
  src: string;
  description: string;
  tooltip: string;
  tradeoff: string;
  tags: string[];
};

const FACTORS = [
  "Where are cities located?",
  "How do cities compare?",
  "Deep dive one city",
  "What's the weather like?",
  "What's my budget?",
  "Which region is best?",
  "How are scores spread?",
];


function IframeShimmer() {
  return (
    <div className="ga-shimmer" aria-hidden="true">
      <div className="ga-shimmerBar" style={{ width: "60%", height: 10, marginBottom: 8 }} />
      <div className="ga-shimmerBar" style={{ width: "90%", height: 80, marginBottom: 8 }} />
      <div className="ga-shimmerBar" style={{ width: "75%", height: 10 }} />
    </div>
  );
}


function LoadingIframe({ src, title, onLoaded }: { src: string; title: string; onLoaded?: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="ga-iframeWrap">
      {!loaded && <IframeShimmer />}
      <iframe
        src={src}
        title={title}
        scrolling="no"
        className="ga-iframe"
        onLoad={() => { setLoaded(true); onLoaded?.(); }}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 400ms ease" }}
      />
    </div>
  );
}


const IFRAME_W = 700;
const IFRAME_H = 480;

function ScaledIframe({ src, title, onLoaded }: { src: string; title: string; onLoaded?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const scale = Math.min(width / IFRAME_W, height / IFRAME_H);
      if (iframeRef.current) iframeRef.current.style.transform = `scale(${scale})`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit", pointerEvents: "none" }}>
      {!loaded && <IframeShimmer />}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        scrolling="no"
        onLoad={() => { setLoaded(true); onLoaded?.(); }}
        style={{
          width: IFRAME_W, height: IFRAME_H, border: "none", pointerEvents: "none",
          position: "absolute", top: 0, left: 0, transformOrigin: "top left",
          opacity: loaded ? 1 : 0, transition: "opacity 400ms ease",
        }}
      />
    </div>
  );
}


function InfoButton({ item, onOpen }: { item: VizItem; onOpen: (item: VizItem) => void }) {
  return (
    <div className="ga-infoWrap">
      <button className="ga-i" onClick={() => onOpen(item)} aria-label={`Info about ${item.title}`}>
        i
      </button>
    </div>
  );
}


function VizModal({ item, onClose }: { item: VizItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="ga-modalOverlay" onClick={onClose}>
      <div className="ga-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ga-modalClose" onClick={onClose}>✕</button>
        <div className="ga-modalTitle">{item.title}</div>
        <div className="ga-modalSection">
          <div className="ga-modalLabel">About this chart</div>
          <div className="ga-modalBody">{item.tooltip}</div>
        </div>
        <div className="ga-modalSection">
          <div className="ga-modalLabel">Factors & trade-offs</div>
          <div className="ga-modalBody">{item.tradeoff}</div>
        </div>
        <div className="ga-modalTags">
          {item.tags.map(t => <span key={t} className="ga-modalTag">{t}</span>)}
        </div>
      </div>
    </div>
  );
}


export default function Gallery() {
  const items = useMemo<VizItem[]>(
    () => [
      {
        id: "v1",
        title: "Global City Distribution",
        src: "/../../public/viz/city_world_map.html",
        description: "Cities plotted by lat/lng, colored by region",
        tooltip: "Shows where all 560 cities sit geographically. Each dot is color-coded by region, which is great for spotting how our dataset is distributed across the world.",
        tradeoff: "Strong for geographic intuition and regional coverage at a glance. Trade-off: it tells you where cities are, but nothing about their quality scores or budget. You can pair with the Heatmap or Radar chart if you want to go deeper on a specific region.",
        tags: ["Where are cities located?", "Which region is best?"],
      },
      {
        id: "v2",
        title: "City Profile — Taipei",
        src: "/../../public/viz/city_radar.html",
        description: "Radar chart of 9 category scores for a single city",
        tooltip: "A radar chart showing one city's scores across all 9 lifestyle factors: Culture, Adventure, Nature, Beaches, Nightlife, Cuisine, Wellness, Urban, and Seclusion.",
        tradeoff: "Perfect for understanding a single city's strengths and weaknesses holistically. Trade-off: only shows one city at a time, so cross-city comparison is difficult. If you want to compare multiple cities side by side, the Heatmap is a better choice.",
        tags: ["Deep dive one city"],
      },
      {
        id: "v3",
        title: "Budget Level Distribution",
        src: "/../../public/viz/budget_donut.html",
        description: "Proportion of Budget / Mid-range / Luxury cities",
        tooltip: "A donut chart showing what proportion of the 560 cities fall into Budget, Mid-range, and Luxury tiers. Useful for understanding how accessible the dataset skews.",
        tradeoff: "Quick and clear for budget planning. Trade-off: it's an aggregate... it won't tell you which specific cities are budget-friendly in your preferred region. Combine with the World Map or Heatmap to narrow down by location.",
        tags: ["What's my budget?"],
      },
      {
        id: "v4",
        title: "City Profiles Heatmap",
        src: "/../../public/viz/city_heatmap.html",
        description: "Top 2 cities per region × 9 category scores",
        tooltip: "A heatmap comparing the top 2 cities from each region across all 9 category scores. Darker blue = higher score. Great for spotting patterns across regions at once.",
        tradeoff: "Best for multi-city, multi-factor comparison in one view. Trade-off: it's limited to top 2 cities per region, so standout mid-tier cities may be hidden. Also, high scores in one factor (e.g. Culture) don't mean the city is strong in others. Please check the Radar for a full city profile.",
        tags: ["How do cities compare?", "Which region is best?"],
      },
      {
        id: "v5",
        title: "Monthly Temperature Trends",
        src: "/../../public/viz/temp_linechart.html",
        description: "Seasonal temperature patterns across 5 contrasting cities",
        tooltip: "Line chart showing average monthly temperatures for 5 cities with distinct climate profiles: Reykjavik, Bangkok, Sydney, New York, and Nairobi. Useful for trip timing.",
        tradeoff: "Excellent for climate planning and seeing seasonal peaks. Trade-off: only covers 5 curated cities, not all 560. Temperature alone doesn't capture humidity, rainfall, or 'feels like'. Treat this as a directional guide rather than a full climate report.",
        tags: ["What's the weather like?", "How do cities compare?"],
      },
      {
        id: "v6",
        title: "Category Scores by Region",
        src: "/../../public/viz/region_grouped_bar.html",
        description: "Average scores per region across all 9 dimensions",
        tooltip: "Grouped bar chart showing each region's average score across all 9 lifestyle categories. Each cluster = one category, each color = one region.",
        tradeoff: "Great for regional benchmarking e.g. seeing that Asia leads in Cuisine, or Europe in Culture. Trade-off: averages mask outliers; a region's high average might be driven by 1–2 exceptional cities. Use alongside the Heatmap to identify specific standouts.",
        tags: ["Which region is best?", "How do cities compare?"],
      },
      {
        id: "v7",
        title: "Score Distribution",
        src: "/../../public/viz/score_histogram.html",
        description: "How cities are distributed across 1–5 scores in each category",
        tooltip: "A histogram grid showing how all 560 cities are distributed across scores 1–5 for each of the 9 categories. Reveals whether scores are spread evenly or clustered.",
        tradeoff: "Useful for understanding scoring spread and which categories are most competitive (tight distribution) vs. most varied. Trade-off: it's purely statistical and high spread in a category like Beaches means many cities score very differently, which is useful context but doesn't tell you which city to pick.",
        tags: ["How are scores spread?", "How do cities compare?"],
      },
    ],
    []
  );

  const location = useLocation();
  const totalViz = items.length; 
  const [loadedCount, setLoadedCount] = useState(0);
  const [hoverIdx, setHoverIdx] = useState(0);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [appliedFactors, setAppliedFactors] = useState<string[]>([]);
  const [modalItem, setModalItem] = useState<VizItem | null>(null);


  const forceTour = (location.state as any)?.tutorial === true;
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [showMenuHint, setShowMenuHint] = useState(false);

  useEffect(() => {
    if (forceTour || !localStorage.getItem(TOUR_KEY)) {
      setTourStep(0);
    }
  }, [forceTour]);

  const handleLoaded = useCallback(() => {
    setLoadedCount(c => Math.min(c + 1, totalViz));
  }, [totalViz]);

  const rankedViz = useMemo(() => {
    if (appliedFactors.length === 0)
      return items.slice(0, 2).map(item => ({ ...item, score: 0, matchedTags: [] as string[] }));
    return [...items]
      .map((item) => {
        const matchedTags = item.tags.filter((t) => appliedFactors.includes(t));
        return { ...item, score: matchedTags.length, matchedTags };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }, [appliedFactors, items]);

  const toggleFactor = (f: string) => {
    setSelectedFactors((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleApply = () => setAppliedFactors(selectedFactors);

  const top1 = rankedViz[0] ?? { ...items[0], score: 0, matchedTags: [] as string[] };
  const top2 = rankedViz[1] ?? { ...items[1], score: 0, matchedTags: [] as string[] };

  const fullyLoaded = loadedCount >= totalViz;
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    if (fullyLoaded) {
      const t = setTimeout(() => setAllLoaded(true), 1000); 
      return () => clearTimeout(t);
    }
  }, [fullyLoaded]);

  return (
    <div className="ga-root" aria-label="gallery page">
      <NormalTopBar showMenuHint={showMenuHint} />

      <div className="ga-stage">
        <div className="ga-canvas">

          <img className="ga-pin ga-pin-tl" src={pinIcon} alt="" draggable={false} />
          <img className="ga-pin ga-pin-tr" src={pinIcon} alt="" draggable={false} />

          {!allLoaded && (
            <div className="ga-loadingOverlay">
              <div className="ga-loadingModal">
                <div className="ga-loadingTitle">Loading charts…</div>
                <div className="ga-loadingTrack">
                  <div className="ga-loadingFill" style={{ width: `${(loadedCount / totalViz) * 100}%` }} />
                </div>
                <div className="ga-loadingText">{loadedCount} / {totalViz}</div>
              </div>
            </div>
          )}


          <div className="ga-header">
            <div className="ga-title">Welcome to Viz Gallery!</div>
            <div className="ga-sub">
              Here are different visualizations based on different factor selections.
              <br />
              Click <span className="ga-i-inline">i</span> for more explanation!
              &nbsp;·&nbsp;
              Use the factor filter below to find the most relevant charts.
            </div>
          </div>


          <div className={`ga-marquee${modalItem ? " is-paused" : ""}`} aria-label="auto scrolling gallery">
            <div className="ga-track">
              {items.concat(items).map((it, i) => (
                <div
                  key={`${it.id}-${i}`}
                  className={`ga-card ${i % items.length === hoverIdx ? "is-main" : "is-side"}`}
                  onMouseEnter={() => setHoverIdx(i % items.length)}
                >

                  <LoadingIframe
                    src={it.src}
                    title={it.title}
                    onLoaded={i < totalViz ? handleLoaded : undefined}
                  />
                  <div className="ga-cap">{it.title}</div>
                  <div className="ga-miniIcons">
                    <InfoButton item={it} onOpen={setModalItem} />
                    <a className="ga-openLink" href={it.src} target="_blank" rel="noreferrer" title="Open in new tab">⤢</a>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="ga-divider" />


          <div className="ga-bottomRow">


            <div className="ga-filterBox">
              <div className="ga-filterLabel">Filter by factors</div>
              <div className="ga-chips">
                {FACTORS.map((f) => (
                  <button
                    key={f}
                    className={`ga-chip ${selectedFactors.includes(f) ? "is-active" : ""}`}
                    onClick={() => toggleFactor(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button className="ga-applyBtn" onClick={handleApply} disabled={selectedFactors.length === 0}>
                Apply
              </button>
            </div>


            <div className="ga-related">
              {[
                { label: "Top 1 recommended viz", item: top1 },
                { label: "Top 2 recommended viz", item: top2 },
              ].map(({ label, item }) => (
                <div className="ga-relatedCol" key={item.id}>
                  <div className="ga-relatedLabel">{label}</div>
                  <div className="ga-relatedCard">
                    <ScaledIframe src={item.src} title={item.title} />
                    <div className="ga-cap">{item.title}</div>
                    <div className="ga-miniIcons">
                      <InfoButton item={item} onOpen={setModalItem} />
                      <a className="ga-openLink" href={item.src} target="_blank" rel="noreferrer" title="Open in new tab">⤢</a>
                    </div>
                    {appliedFactors.length > 0 && (
                      <div className="ga-reasonOverlay">
                        {item.matchedTags.length > 0
                          ? <><span className="ga-reasonLabel">Matched: </span><strong>{item.matchedTags.join(" · ")}</strong></>
                          : "No direct match — showing next best"
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>


      {modalItem && <VizModal item={modalItem} onClose={() => setModalItem(null)} />}

      {tourStep !== null && (
        <GalleryTour
          step={tourStep}
          total={TOUR_STEPS.length}
          onNext={() => {
            if (tourStep < TOUR_STEPS.length - 1) {
              setTourStep(tourStep + 1);
            } else {
              localStorage.setItem(TOUR_KEY, "1");
              setTourStep(null);
              window.setTimeout(() => setShowMenuHint(true), 5000);
            }
          }}
          onSkip={() => {
            localStorage.setItem(TOUR_KEY, "1");
            setTourStep(null);
          }}
        />
      )}

      <BottomBar />
    </div>
  );
}


function GalleryTour({
  step,
  total,
  onNext,
  onSkip,
}: {
  step: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const s = TOUR_STEPS[step];
  const isLast = step === total - 1;

  return (
    <div className="ga-tourOverlay">
      <div className="ga-tourCard" key={step}>
        <div className="ga-tourTop">
          <div className="ga-tourDots">
            {TOUR_STEPS.map((_, i) => (
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