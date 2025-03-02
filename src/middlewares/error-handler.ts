import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(500).json({
    error: (err as Error).message || "An unknown error occurred.",
  });
};
