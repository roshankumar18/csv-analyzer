import { ObjectId } from "mongodb";
import path from "path";
import { Product } from "src/models/product";
import { Request } from "src/models/request";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { BlobService } from "./blob-service";
import { ImageQueue } from "./image-queue";

export class ImageProcessor {
  static async processRequest(requestId: string) {
    const cursor = Product.find({ requestId }).cursor();
    let totalImages = 0;

    for (
      let product = await cursor.next();
      product != null;
      product = await cursor.next()
    ) {
      totalImages += product.inputImageUrls.length;
      for (const imageUrl of product.inputImageUrls) {
        await ImageQueue.addImageJob(
          imageUrl,
          product._id.toString(),
          requestId,
          totalImages
        );
      }
    }
    await Request.findOneAndUpdate(
      { _id: requestId },
      {
        status: "processing",
        totalImages,
        processedImages: 0,
      }
    );
  }

  static async processImage(imageUrl: string): Promise<string> {
    try {
      const uploadsDir = path.join(__dirname, "../../public/uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const response = await fetch(imageUrl).then((res) => res.blob());
      const buffer = Buffer.from(await response.arrayBuffer());

      const filename = `${uuidv4()}.jpg`;
      const outputPath = path.join(uploadsDir, filename);

      await sharp(buffer).jpeg({ quality: 50 }).toFile(outputPath);

      await BlobService.uploadFile(outputPath, filename);
      return `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.BUCKET_NAME}//${filename}`;
    } catch (error: any) {
      console.error("Error processing image:", error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  static async updateProductImage(productId: string, outputImageUrl: string) {
    await Product.findByIdAndUpdate(productId, {
      $push: { outputImageUrls: outputImageUrl },
      $set: { processed: true },
    });
  }

  static async updateRequestProgress(requestId: string, totalImages: number) {
    const request = await Request.findOneAndUpdate(
      { _id: requestId },
      { $inc: { totalProcessedImages: 1 } },
      { new: true }
    );
    console.log({ updated: request, totalImages });
    if (request?.totalProcessedImages === totalImages) {
      const outputCsvUrl = await this.generateOutputCsv(requestId);
      await Request.findByIdAndUpdate(requestId, {
        $set: {
          outputCsvUrl,
          status: "completed",
        },
      });

      if (request?.webhookUrl) {
        await this.requestWebhook(request.webhookUrl, requestId, outputCsvUrl);
      }
    }
  }

  static async generateOutputCsv(requestId: string) {
    try {
      const products = await Product.find({ requestId });
      const csvDir = path.join(__dirname, "../../public/csv");
      if (!fs.existsSync(csvDir)) {
        fs.mkdirSync(csvDir, { recursive: true });
      }
      const fileName = `${requestId}.csv`;
      const outputPath = path.join(csvDir, fileName);

      const csvData = products.map((product) => {
        return {
          "S. No": product.serialNumber,
          "Product Name": product.productName,
          "Input Image Urls": product.inputImageUrls.join(","),
          "Output Image Urls": product.outputImageUrls.join(","),
        };
      });

      const headers = [
        "S. No",
        "Product Name",
        "Input Image Urls",
        "Output Image Urls",
      ];

      const csv = [headers, ...csvData.map((row) => Object.values(row))]
        .map((row) => row.join(","))
        .join("\n");

      await fs.promises.writeFile(outputPath, csv);
      await BlobService.uploadFile(outputPath, fileName);
      return `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.BUCKET_NAME}//${fileName}`;
    } catch (error) {
      console.error("Error generating output csv:", error);
      throw new Error("Error generating output csv");
    }
  }

  static async requestWebhook(
    webhookUrl: string,
    requestId: string,
    outputCsvUrl: string
  ) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          outputCsvUrl,
        }),
      });
    } catch (error) {
      console.error("Error requesting webhook:", error);
    }
  }
}

export interface Product {
  _id: ObjectId;
  requestId: string;
  serialNumber: number;
  productName: string;
  inputImageUrls: string[];
  outputImageUrls: string[];
  processed: boolean;
  createdAt: Date;
}
