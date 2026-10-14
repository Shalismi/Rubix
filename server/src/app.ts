import express from "express";
import cors from "cors";
import { taskRouter } from "./features/tasks/taskRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Rubix API is running",
  });
});

app.use("/api/tasks", taskRouter);
app.use(errorHandler);
