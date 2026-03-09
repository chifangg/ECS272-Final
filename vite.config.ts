import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts: string[] = [];
  for (const item of data.output ?? []) {
    for (const chunk of item.content ?? []) {
      if (typeof chunk.text === "string" && chunk.text.trim()) {
        parts.push(chunk.text.trim());
      }
    }
  }
  return parts.join("\n\n").trim();
}

function travelPlanApiPlugin() {
  return {
    name: "travel-plan-api",
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (
            req: import("http").IncomingMessage,
            res: import("http").ServerResponse,
            next: () => void
          ) => void
        ) => void;
      };
    }) {
      server.middlewares.use("/api/travel-plan", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const body = await new Promise<string>((resolve, reject) => {
            let data = "";
            req.on("data", (chunk) => {
              data += chunk;
            });
            req.on("end", () => resolve(data));
            req.on("error", reject);
          });

          const parsed = JSON.parse(body || "{}") as {
            city?: { city?: string; country?: string; shortDescription?: string; budgetLevel?: string; idealDurations?: string[] };
            durationDays?: number;
            selectedExperiences?: string[];
          };

          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing OPENAI_API_KEY in environment." }));
            return;
          }

          if (!parsed.city?.city || !parsed.city?.country) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing city info." }));
            return;
          }

          const prompt = [
            "You are a professional travel planner.",
            `Create a practical ${parsed.durationDays ?? 5}-day itinerary for ${parsed.city.city}, ${parsed.city.country}.`,
            `Budget level: ${parsed.city.budgetLevel ?? "Unknown"}.`,
            `Preferred experiences: ${(parsed.selectedExperiences ?? []).join(", ") || "General sightseeing"}.`,
            `City description: ${parsed.city.shortDescription ?? ""}`,
            `Known suitable durations: ${(parsed.city.idealDurations ?? []).join(", ") || "N/A"}.`,
            "Output format:",
            "1) Trip overview (4-6 bullet points)",
            "2) Day-by-day plan",
            "3) Food recommendations (local dishes)",
            "4) Estimated daily budget range",
            "5) Practical tips and safety notes",
          ].join("\n");

          const apiRes = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4.1-mini",
              input: prompt,
            }),
          });

          const data = (await apiRes.json()) as {
            output_text?: string;
            output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
            error?: { message?: string };
          };

          if (!apiRes.ok) {
            throw new Error(data.error?.message || "OpenAI API request failed");
          }

          const plan = extractResponseText(data);
          if (!plan) {
            throw new Error("Model returned empty content. Please try regenerate.");
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ plan }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to generate travel plan",
            })
          );
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), travelPlanApiPlugin()],
});
