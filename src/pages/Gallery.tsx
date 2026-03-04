import { useMemo, useState } from "react";
import { NormalTopBar } from "../components/NormalTopBar";
import { BottomBar } from "../components/BottomBar";
import "../styles/Gallery.css";

import worldMap from "../assets/world_map.svg";
import pinIcon from "../assets/pin.png";

type VizItem = {
  id: string;
  title: string;
  img: string;
};

export default function Gallery() {
  const items = useMemo<VizItem[]>(
    () => [
      { id: "v1", title: "Viz for factor A + B", img: worldMap },
      { id: "v2", title: "Viz for factor A + C", img: worldMap },
      { id: "v3", title: "Viz for factor B + C", img: worldMap },
      { id: "v4", title: "Viz for factor A + D", img: worldMap },
      { id: "v5", title: "Viz for factor C + D", img: worldMap },
    ],
    []
  );

  const [idx, setIdx] = useState(1);

  const cur = items[idx] ?? items[0];
  const prev = items[(idx - 1 + items.length) % items.length];
  const next = items[(idx + 1) % items.length];

  function goPrev() {
    setIdx((v) => (v - 1 + items.length) % items.length);
  }
  function goNext() {
    setIdx((v) => (v + 1) % items.length);
  }

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
                  <img className="ga-img" src={it.img} alt="" draggable={false} />
                  <div className="ga-cap">{it.title}</div>

                  <div className="ga-miniIcons">
                    <span className="ga-i">i</span>
                    <span className="ga-dotIcon">⦿</span>
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
                  <img className="ga-img" src={cur.img} alt="" draggable={false} />
                  <div className="ga-cap">{cur.title}</div>
                  <div className="ga-miniIcons">
                    <span className="ga-i">i</span>
                    <span className="ga-dotIcon">⦿</span>
                  </div>
                </div>
              </div>

              <div className="ga-relatedCol">
                <div className="ga-relatedLabel">Top2 related viz</div>
                <div className="ga-relatedCard">
                  <img className="ga-img" src={next.img} alt="" draggable={false} />
                  <div className="ga-cap">{next.title}</div>
                  <div className="ga-miniIcons">
                    <span className="ga-i">i</span>
                    <span className="ga-dotIcon">⦿</span>
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