import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
}
