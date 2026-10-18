import path from "node:path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { environment } from "./config/environment.js";
import { authRouter } from "./features/auth/authRoutes.js";
import { taskRouter } from "./features/tasks/taskRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
const clientDistPath = path.resolve(import.meta.dirname, "../../client/dist");

app.use(
  cors({
    origin: environment.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    message: "Rubix API is running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", taskRouter);

if (environment.isProduction) {
  app.use(express.static(clientDistPath));
  app.use((request, response, next) => {
    const isApiRequest =
      request.path === "/api" || request.path.startsWith("/api/");

    if (request.method !== "GET" || isApiRequest) {
      next();
      return;
    }

    response.sendFile(path.join(clientDistPath, "index.html"), (error) => {
      if (error) {
        next(error);
      }
    });
  });
}

app.use(errorHandler);
