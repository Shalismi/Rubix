import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { environment } from "./config/environment.js";
import { authRouter } from "./features/auth/authRoutes.js";
import { taskRouter } from "./features/tasks/taskRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(
  cors({
    origin: environment.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    message: "Rubix API is running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", taskRouter);
app.use(errorHandler);
