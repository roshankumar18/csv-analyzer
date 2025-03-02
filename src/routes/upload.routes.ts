import express, { Request, Response, NextFunction } from "express";
import { uploadController } from "@controllers/upload.controller";
import { upload } from "@config/multer";
const router = express.Router();

router.post(
  "/",
  upload.single("csv"),
  (req: Request, res: Response, next: NextFunction) => {
    uploadController(req, res, next);
  }
);

export default router;
