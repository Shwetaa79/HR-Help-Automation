// backend/server.js
import express from "express";
import cors from "cors";
import hrCasesRouter from "./routes/hrCases.js";
import { initModel } from "./ai/similarity.js";

const app = express();
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

await initModel();

app.use("/api/hr-cases", hrCasesRouter);

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Backend listening on http://localhost:${PORT}`)
);
