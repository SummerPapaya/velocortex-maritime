import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization for GoogleGenAI
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// API Routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint for Predictive Analytics & ETA Optimization
app.post("/api/ai/predict", async (req, res) => {
  try {
    const { containerId, poNumber, currentStatus, origin, destination, currentCoordinates, telemetry, routeBottlenecks } = req.body;
    
    const genAI = getGenAI();
    if (!genAI) {
      // Return high-fidelity fallback if API key is not configured
      return res.json({
        success: true,
        source: "simulated_intelligence",
        prediction: {
          revisedEtaDeltaHours: telemetry?.temp > -18 ? 14 : -6,
          confidenceScore: 92,
          riskLevel: telemetry?.temp > -18 || routeBottlenecks?.length > 0 ? "HIGH" : "LOW",
          demurrageRiskUsd: telemetry?.temp > -18 ? 4850 : 0,
          summary: `Analysis for Container ${containerId || poNumber}: Vessel is currently navigating near ${currentCoordinates || 'transit waypoint'}. ${routeBottlenecks?.length ? 'Detected port congestion / canal delay contributing to potential ETA slippage.' : 'Vessel maintaining optimal transit speed.'}`,
          actionableRecommendations: [
            "Initiate priority customs pre-clearance at destination port to offset terminal congestion delay.",
            "Instruct vessel reefer technician to inspect compressor unit #2 and verify airflow defrost cycle.",
            "Switch final leg from standard road freight to express intermodal rail service to save 36 hours."
          ],
          costOptimizationImpact: "Estimated savings of $3,400 in demurrage and cargo spoilage avoidance by executing priority drayage dispatch."
        }
      });
    }

    const prompt = `You are VeloCortex AI, a Senior Global Supply Chain & Maritime IoT Analytics Engine.
Analyze the following real-time telemetry and shipping container data to generate predictive ETA optimization and cost mitigation advice.

Container Information:
- ID / Number: ${containerId || 'Unknown'}
- PO Number: ${poNumber || 'N/A'}
- Origin: ${origin} -> Destination: ${destination}
- Current Coordinates: ${currentCoordinates}
- Status: ${currentStatus}
- Live Telemetry: ${JSON.stringify(telemetry || {})}
- Known Route Bottlenecks / Risks: ${JSON.stringify(routeBottlenecks || [])}

Provide a structured JSON response WITHOUT markdown formatting containing:
{
  "revisedEtaDeltaHours": (number, e.g. 12 for 12 hours late, -4 for 4 hours early),
  "confidenceScore": (number between 70 and 99),
  "riskLevel": ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL"),
  "demurrageRiskUsd": (number, estimated financial risk in USD from delay or spoilage),
  "summary": (string, 2-3 concise professional sentences analyzing status and root cause),
  "actionableRecommendations": (array of 3 strings with specific operational actions for stakeholders),
  "costOptimizationImpact": (string describing exact financial/time savings achievable)
}`;

    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const text = response.text || "{}";
    const prediction = JSON.parse(text);

    return res.json({
      success: true,
      source: "gemini_ai",
      prediction
    });
  } catch (error: any) {
    console.error("AI Prediction Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI analytics."
    });
  }
});

// Endpoint for Route Bottleneck & Supply Chain Advisory
app.post("/api/ai/analyze-route", async (req, res) => {
  try {
    const { routeName, originPort, destPort, activeVessels, reportedDelays } = req.body;
    const genAI = getGenAI();
    
    if (!genAI) {
      return res.json({
        success: true,
        source: "simulated_intelligence",
        analysis: {
          routeHealthScore: reportedDelays > 2 ? 64 : 88,
          dominantBottleneck: reportedDelays > 2 ? "Terminal Berth Congestion & Pilotage Backlog" : "Minor seasonal crosswind swells",
          averageDelayHours: reportedDelays > 2 ? 38 : 6,
          recommendedAction: "Reroute transshipment cargo via secondary regional hub (e.g., Busan or Tanjung Pelepas) to avoid 48-hour anchor dwell time.",
          keyInsight: `Traffic density on ${routeName} is currently ${activeVessels || 'high'} vessels. Automated berth scheduling algorithm projects clearance velocity improving over the next 72 hours.`
        }
      });
    }

    const prompt = `You are a Global Maritime Logistics Expert AI. Analyze the current conditions for shipping route: ${routeName} (${originPort} to ${destPort}).
Active Vessels: ${activeVessels || '40+'}, Reported Delay Incidents: ${reportedDelays || 'Multiple'}.

Provide JSON output WITHOUT markdown code blocks:
{
  "routeHealthScore": (number 1-100 where 100 is smooth flow),
  "dominantBottleneck": (string, primary cause of friction),
  "averageDelayHours": (number),
  "recommendedAction": (string, operational instruction for logistics dispatchers),
  "keyInsight": (string, strategic overview of route trend over next 14 days)
}`;

    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const text = response.text || "{}";
    const analysis = JSON.parse(text);

    return res.json({
      success: true,
      source: "gemini_ai",
      analysis
    });
  } catch (error: any) {
    console.error("Route Analysis Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze route."
    });
  }
});

// Vite middleware setup for development vs static production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModule = await import("vite");
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VeloCortex Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
