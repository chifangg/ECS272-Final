import * as d3 from "d3";

export type CityRow = {
  city: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  temp: number;
  budget: number;
  safety: number;
  popularity: number;
};

export async function loadCities(): Promise<CityRow[]> {
  const rows = await d3.csv("/data/cities.csv");

  return rows.map((d: any) => ({
    city: d.City,
    country: d.Country,
    region: d.Region,
    lat: +d.Latitude,
    lng: +d.Longitude,
    temp: +d.AverageTemperature,
    budget: +d.BudgetLevel,
    safety: +d.SafetyIndex,
    popularity: +d.PopularityScore,
  }));
}