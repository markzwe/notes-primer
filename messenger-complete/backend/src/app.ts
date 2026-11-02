import express from "express";
import mongoose from "mongoose";
import type { ErrorRequestHandler } from "express";
import authRouter from "./routes/auth.routes.js";
import conversationRouter from "./routes/conversation.routes.js";
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/api/ready", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res
    .status(ready ? 200 : 503)
    .json({ status: ready ? "ready" : "unavailable" });
});
app.use("/api", (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "Database unavailable." });
    return;
  }
  next();
});
app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON." });
    return;
  }
  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: "Request is too large." });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error." });
};
app.use(errorHandler);
export default app;
