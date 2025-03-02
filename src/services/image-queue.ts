import { Queue, Worker, QueueOptions, WorkerOptions } from "bullmq";
import { ImageProcessor } from "./image-processor";
import { cpus } from "os";
import { Product } from "../models/product";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

const CONCURRENT_JOBS = cpus().length * 2;

export class ImageQueue {
  static queue = new Queue("image-processing", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
    },
  });

  static worker = new Worker(
    "image-processing",
    async (job) => {
      const { imageUrl, productId, requestId, totalImages } = job.data;
      const outputImageUrl = await ImageProcessor.processImage(imageUrl);

      await Product.findByIdAndUpdate(productId, {
        $push: { outputImageUrls: outputImageUrl },
      });
      await ImageProcessor.updateRequestProgress(requestId, totalImages);
    },
    {
      connection,
      concurrency: CONCURRENT_JOBS,
      limiter: {
        max: CONCURRENT_JOBS,
        duration: 1000,
      },
    }
  );

  static async addImageJob(
    imageUrl: string,
    productId: string,
    requestId: string,
    totalImages: number
  ) {
    await this.queue.add("process-image", {
      imageUrl,
      productId,
      requestId,
      totalImages,
    });
  }

  static {
    ImageQueue.worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    ImageQueue.worker.on("failed", (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
  }
}
