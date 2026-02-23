import "dotenv/config";
import express from "express";
import cors from "cors";
import type { Request } from "express";
import { registerRoutes } from "./routes";
import path from "path";

/* ------------------ Logger ------------------ */
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/* ------------------ App ------------------ */
const app = express();

/* ------------------ Raw body support ------------------ */
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

app.use(
  express.json({
    verify: (req: Request, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(cors());

/* ------------------ Serve UI ------------------ */
app.use(express.static(path.join(__dirname, "../client/dist")));

/* ------------------ API Routes ------------------ */

/* ------------------ SPA Fallback ------------------ */
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

/* ------------------ Start Server ------------------ */
const PORT = Number(process.env.PORT) || 10000;

/* ------------------ API Routes + WebSocket Server ------------------ */
// registerRoutes returns an http.Server with WebSocket handling attached.

const PORT = Number(process.env.PORT) || 10000;

async function start() {
  try {
    const httpServer = await registerRoutes(app);
    httpServer.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
