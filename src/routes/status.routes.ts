import { getStatus } from "@controllers/status.controller";
import express, { Request, Response, NextFunction } from "express";
const router = express.Router();

router.get("/:requestId", (req: Request, res: Response, next: NextFunction) => {
  getStatus(req, res, next);
});

export default router;
