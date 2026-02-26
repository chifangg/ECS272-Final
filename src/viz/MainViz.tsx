import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { loadCities } from "../data/loadData";
import type { CityRow } from "../data/loadData";
import { Link } from "react-router-dom";

export function MainViz() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<CityRow[] | null>(null);

  useEffect(() => {
    loadCities().then(setData).catch(console.error);
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const w = 1100, h = 640;

    svg.attr("viewBox", `0 0 ${w} ${h}`);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const innerW = w - margin.left - margin.right;
    const innerH = h - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xDomain = d3.extent(data, d => d.budget) as [number, number];
    const yDomain = d3.extent(data, d => d.popularity) as [number, number];

    const x = d3.scaleLinear().domain(xDomain).nice().range([0, innerW]);
    const y = d3.scaleLinear().domain(yDomain).nice().range([innerH, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6));

    g.append("g").call(d3.axisLeft(y).ticks(6));

    // labels
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 45)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("opacity", 0.9)
      .text("BudgetLevel");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -55)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("opacity", 0.9)
      .text("PopularityScore");

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => x(d.budget))
      .attr("cy", d => y(d.popularity))
      .attr("r", 4)
      .attr("fill", "rgba(255,255,255,.9)")
      .attr("stroke", "rgba(0,0,0,.25)");

    const tip = d3.select(svgRef.current.parentElement!)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "rgba(255,255,255,.95)")
      .style("padding", "6px 8px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("opacity", 0);

    g.selectAll("circle")
      .on("mouseenter", (e, d) => {
        tip
          .style("opacity", 1)
          .html(
            `<b>${d.city}</b>, ${d.country}<br/>budget: ${d.budget}<br/>popularity: ${d.popularity}<br/>temp: ${d.temp}`
          );
      })
      .on("mousemove", (e) => {
        tip.style("left", `${e.offsetX + 12}px`).style("top", `${e.offsetY + 12}px`);
      })
      .on("mouseleave", () => tip.style("opacity", 0));

    return () => { tip.remove(); };
  }, [data]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", right: 10, top: 10, display: "flex", gap: 10, fontSize: 12 }}>
        <Link to="/gallery" style={{ color: "white" }}>Viz Gallery</Link>
        <Link to="/explore" style={{ color: "white" }}>Explore</Link>
        <Link to="/home" style={{ color: "white" }}>Back</Link>
      </div>

      <svg ref={svgRef} width="100%" height="100%" />
      {!data && <div style={{ position: "absolute", left: 16, top: 16, color: "white" }}>Loading data…</div>}
    </div>
  );
}