import { Request } from "@models/request";
import { Result } from "./type";
import { Product } from "@models/product";
import { v4 } from "uuid";

export class StoreService {
  static async getRequestId(webhookUrl?: string) {
    try {
      const requestId = v4();
      const request = new Request({
        requestId,
        webhookUrl,
        status: "pending",
      });
      const data = await request.save();
      console.log({ data });
      return data._id;
    } catch (error) {
      console.error("Error getting request id:", error);
      throw new Error("Error getting request id");
    }
  }
  static async storeParsedData(requestId: string, result: Result[]) {
    const products = result.map((data) => ({
      requestId,
      serialNumber: data.serialNumber,
      productName: data.productName,
      inputImageUrls: data.inputImageUrls,
      status: "pending",
    }));

    const insertedProducts = await Product.insertMany(products);
    const productIds = insertedProducts.map((product) => product._id);
    await Request.updateOne(
      { _id: requestId },
      { $push: { products: { $each: productIds } } }
    );
  }
  static async getStatus(requestId: string) {
    if (!/^[0-9a-fA-F]{24}$/.test(requestId)) {
      throw new Error("Invalid requestId");
    }
    const request = await Request.findOne({ _id: requestId });
    if (!request) throw new Error("Request not found");
    return {
      requestId: request._id,
      status: request.status,
      totalProcessedImages: request.totalProcessedImages,
      totalImages: request.totalImages,
      outputCsvUrl: request.outputCsvUrl,
    };
  }
}
