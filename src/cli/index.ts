#!/usr/bin/env bun

import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

// API routes (placeholder)
app.get("/api/health", (c) => {
  return c.json({ status: "ok", message: "Folder-Site CLI is running" });
});

// Serve static files
app.use("/*", serveStatic({ root: "./dist/client" }));

// SPA fallback
app.get("*", serveStatic({ path: "./dist/client/index.html" }));

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Folder-Site CLI running at http://localhost:${port}`);
console.log(`📁 Serving directory: ${process.cwd()}`);

export default {
  port,
  fetch: app.fetch,
};