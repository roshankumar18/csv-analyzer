import { CsvValidator } from "@services/csv-validator";
import { ImageProcessor } from "@services/image-processor";
import { StoreService } from "@services/store-service";
import { NextFunction, Request, Response } from "express"; // Added Request and Response imports
import { ImageQueue } from "@services/image-queue";

export async function uploadController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }
    const results = await CsvValidator.validateFile(req.file.buffer);
    const requestId = await StoreService.getRequestId(req.body.webhookUrl);

    await StoreService.storeParsedData(requestId._id.toString(), results);
    await ImageProcessor.processRequest(requestId._id.toString());

    res.status(200).json({
      success: true,
      requestId,
      message:
        "CSV file submitted successfully. Use the requestId to check processing status.",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    next(error);
  }
}
