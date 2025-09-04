import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  const port = parseInt(process.env.PORT || "5000", 10);

  // Su macOS preferiamo 127.0.0.1 per evitare problemi di bind con 0.0.0.0
  const isMac = process.platform === "darwin";
  const defaultHost =
  isMac ? "127.0.0.1" : (process.platform === "win32" ? "127.0.0.1" : "0.0.0.0");
  const host = process.env.HOST || defaultHost;

  // Opzioni per listen: niente reusePort su TCP (può causare ENOTSUP)
  const listenOpts: { port: number; host: string } = { port, host };

  // Gestione errori di bind (porta occupata) e ENOTSUP
  server.on("error", (err: any) => {
  if (err?.code === "EADDRINUSE") {
    log(`❌ Porta ${port} già in uso. Chiudi il processo che la usa:
  lsof -ti :${port} | xargs kill -9
  oppure avvia con un'altra porta:
  PORT=${port + 1} npm run dev`);
  } else if (err?.code === "ENOTSUP") {
    log(`❌ ENOTSUP: operazione non supportata sulla socket.
  Prova a:
  - usare HOST=127.0.0.1 (già default su macOS),
  - cambiare porta: PORT=${port + 1} npm run dev,
  - verificare la versione/architettura di Node.`);
  } else {
    log(`❌ Errore server: ${err?.message || err}`);
  }
  process.exit(1);
  });

  server.listen(listenOpts, () => {
  log(`✅ serving on http://${host}:${port}`);
  });
})();
