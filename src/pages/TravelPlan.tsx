import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomBar } from "../components/BottomBar";
import { NormalTopBar } from "../components/NormalTopBar";
import "../styles/TravelPlan.css";

type ExperienceKey = "culture" | "adventure" | "nature" | "beaches" | "nightlife" | "cuisine" | "wellness" | "urban" | "seclusion";

type SelectedCity = {
  id: string;
  city: string;
  country: string;
  shortDescription: string;
  budgetLevel: string;
  idealDurations: string[];
  scores: Record<ExperienceKey, number>;
};

type PlanState = {
  city?: SelectedCity;
  durationDays?: number;
  selectedExperiences?: string[];
};

export default function TravelPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as PlanState;

  const city = state.city;
  const durationDays = state.durationDays ?? 5;
  const selectedExperiences = state.selectedExperiences ?? [];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planText, setPlanText] = useState("");

  useEffect(() => {
    if (!city) {
      setError("No city selected. Please go back to Explore and pick a marker first.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function generate() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/travel-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city,
            durationDays,
            selectedExperiences,
          }),
        });

        const data = (await res.json()) as { plan?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to generate travel plan");
        }

        if (!cancelled) {
          const text = (data.plan ?? "").trim();
          setPlanText(text || "No plan returned. Please click Regenerate.");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to generate travel plan");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [city, durationDays, selectedExperiences]);

  return (
    <div className="tp-root">
      <NormalTopBar title="AI Travel Plan" />

      <div className="tp-stage">
        <div className="tp-card">
          <div className="tp-head">
            <div className="tp-title">{city ? `${city.city}, ${city.country}` : "Travel Plan"}</div>
            <div className="tp-sub">{durationDays} days | {selectedExperiences.join(", ") || "General trip"}</div>
          </div>

          {loading ? <div className="tp-loading">Generating your itinerary...</div> : null}
          {error ? <div className="tp-error">{error}</div> : null}
          {!loading && !error ? <pre className="tp-plan">{planText}</pre> : null}

          <div className="tp-actions">
            <button type="button" onClick={() => navigate("/explore")}>Back To Explore</button>
            <button type="button" onClick={() => window.location.reload()}>Regenerate</button>
          </div>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}
