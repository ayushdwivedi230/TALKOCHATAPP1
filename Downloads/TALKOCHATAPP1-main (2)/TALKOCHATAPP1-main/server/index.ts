import express from "express";
import cors from "cors";
import type { Request } from "express";
import { registerRoutes } from "./routes";

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

/* ------------------ Routes ------------------ */
registerRoutes(app);

/* ------------------ Start Server ------------------ */
const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, "0.0.0.0", () => {
  log(`Server running on port ${PORT}`);
});
