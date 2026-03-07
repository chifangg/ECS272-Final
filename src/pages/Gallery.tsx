import { useMemo, useState } from "react";
import { NormalTopBar } from "../components/NormalTopBar";
import { BottomBar } from "../components/BottomBar";
import "../styles/Gallery.css";

import pinIcon from "../assets/pin.png";

type VizItem = {
  id: string;
  title: string;
  src: string;    
  description: string;
};

export default function Gallery() {
  const items = useMemo<VizItem[]>(
    () => [
      {
        id: "v1",
        title: "Global City Distribution",
        src: "/../../public/viz/city_world_map.html",
        description: "Cities plotted by lat/lng, colored by region",
      },
      {
        id: "v2",
        title: "City Profile — Taipei",
        src: "/../../public/viz/city_radar.html",
        description: "Radar chart of 9 category scores for a single city",
      },
      {
        id: "v3",
        title: "Budget Level Distribution",
        src: "/../../public/viz/budget_donut.html",
        description: "Proportion of Budget / Mid-range / Luxury cities",
      },
      {
        id: "v4",
        title: "City Profiles Heatmap",
        src: "/../../public/viz/city_heatmap.html",
        description: "Top 2 cities per region × 9 category scores",
      },
      {
        id: "v5",
        title: "Monthly Temperature Trends",
        src: "/../../public/viz/temp_linechart.html",
        description: "Seasonal temperature patterns across 5 contrasting cities",
      },
      {
        id: "v6",
        title: "Category Scores by Region",
        src: "/../../public/viz/region_grouped_bar.html",
        description: "Average scores per region across all 9 dimensions",
      },
      {
        id: "v7",
        title: "Score Distribution",
        src: "/../../public/viz/score_histogram.html",
        description: "How cities are distributed across 1–5 scores in each category",
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);

  return (
    <div className="ga-root" aria-label="gallery page">
      <NormalTopBar />

      <div className="ga-stage">
        <div className="ga-canvas">

          <img className="ga-pin ga-pin-tl" src={pinIcon} alt="" draggable={false} />
          <img className="ga-pin ga-pin-tr" src={pinIcon} alt="" draggable={false} />


          <div className="ga-header">
            <div className="ga-title">Welcome to Viz Gallery!</div>
            <div className="ga-sub">
              Here are different visualizations based on different factor selections.
              <br />
              Hover (i) for more explanation!
              <br />
              Feel free to explore or use the factor filter for more details.
            </div>
          </div>


          <div className="ga-scrollHint" aria-hidden="true">
            <div className="ga-scrollIcon">
              <span />
              <span />
              <span />
            </div>
            <div className="ga-scrollText">scroll</div>
          </div>


          <div className="ga-marquee" aria-label="auto scrolling gallery">
            <div className="ga-track">
              {items.concat(items).map((it, i) => (
                <div
                  key={`${it.id}-${i}`}
                  className={`ga-card ${i % items.length === idx ? "is-main" : "is-side"}`}
                  onMouseEnter={() => setIdx(i % items.length)}
                >

                  <div className="ga-iframeWrap">
                    <iframe
                      src={it.src}
                      title={it.title}
                      scrolling="no"
                      className="ga-iframe"
                    />
                  </div>

                  <div className="ga-cap">{it.title}</div>
                  <div className="ga-miniIcons">
                    <span className="ga-i" title={it.description}>i</span>
                    <a className="ga-openLink" href={it.src} target="_blank" rel="noreferrer" title="Open in new tab">⤢</a>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="ga-bottomRow">
            <div className="ga-filterBox">
              <div className="ga-filterText">
                factor selection
                <br />
                banner...
                <br />
                not yet designed
              </div>
            </div>

            <div className="ga-related">

              <div className="ga-relatedCol">
                <div className="ga-relatedLabel">Top1 related viz</div>
                <div className="ga-relatedCard">
                  <div className="ga-iframeWrap ga-iframeWrap--small">
                    <iframe
                      src={items[idx].src}
                      title={items[idx].title}
                      scrolling="no"
                      className="ga-iframe"
                    />
                  </div>
                  <div className="ga-cap">{items[idx].title}</div>
                  <div className="ga-miniIcons">
                    <span className="ga-i" title={items[idx].description}>i</span>
                    <a className="ga-openLink" href={items[idx].src} target="_blank" rel="noreferrer" title="Open in new tab">⤢</a>
                  </div>
                </div>
              </div>


              <div className="ga-relatedCol">
                <div className="ga-relatedLabel">Top2 related viz</div>
                <div className="ga-relatedCard">
                  <div className="ga-iframeWrap ga-iframeWrap--small">
                    <iframe
                      src={items[(idx + 1) % items.length].src}
                      title={items[(idx + 1) % items.length].title}
                      scrolling="no"
                      className="ga-iframe"
                    />
                  </div>
                  <div className="ga-cap">{items[(idx + 1) % items.length].title}</div>
                  <div className="ga-miniIcons">
                    <span className="ga-i" title={items[(idx + 1) % items.length].description}>i</span>
                    <a className="ga-openLink" href={items[(idx + 1) % items.length].src} target="_blank" rel="noreferrer" title="Open in new tab">⤢</a>
                  </div>
                </div>
              </div>

              <div className="ga-moreHint" aria-hidden="true">
                <span>››</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <BottomBar />
    </div>
  );
}