import { StoreService } from "@services/store-service";
import { NextFunction, Request, Response } from "express"; // Added Request and Response imports

export async function getStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { requestId } = req.params;

  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }
  try {
    const status = await StoreService.getStatus(requestId);
    if (!status) {
      return res.status(404).json({ error: "Request not found" });
    }

    return res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Error getting status:", error);
    next(error);
  }
}
