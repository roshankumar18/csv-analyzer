import csvParser from "csv-parser";
import fs from "fs";
import { Result } from "./type";
import { Readable } from "stream";

export class CsvValidator {
  static validateFile(csvBuffer: Buffer): Promise<Result[]> {
    return new Promise((resolve, reject) => {
      const results: Result[] = [];

      const errors: string[] = [];
      let rowCount = 0;
      const stream = new Readable();
      stream.push(csvBuffer);
      stream.push(null);
      stream
        .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }))
        .on("data", (data) => {
          rowCount++;
          const rowError = this.validateRow(data, rowCount);
          if (rowError) {
            errors.push(rowError);
          } else {
            results.push({
              serialNumber: parseInt(data["S. No."] || data["Serial Number"]),
              productName: data["Product Name"],
              inputImageUrls: this.parseImageUrls(data["Input Image Urls"]),
            });
          }
        })
        .on("end", () => {
          if (errors.length > 0) {
            reject(new Error(`CSV validation failed: ${errors.join(", ")}`));
          } else if (results.length === 0) {
            reject(new Error("CSV file is empty or headers are incorrect"));
          } else {
            resolve(results);
          }
        })
        .on("error", (err) => {
          reject(new Error(`Error parsing CSV: ${err.message}`));
        });
    });
  }
  static validateRow(data: Record<string, any>, rowNumber: number) {
    const serialNumber = data["S. No."];
    const productName = data["Product Name"];
    const inputImageUrls = data["Input Image Urls"];

    if (!serialNumber) {
      return `Row ${rowNumber}: Missing Serial Number`;
    }
    if (isNaN(parseInt(serialNumber))) {
      return `Row ${rowNumber}: Serial Number must be a number`;
    }
    if (!productName) {
      return `Row ${rowNumber}: Missing Product Name`;
    }
    if (!inputImageUrls) {
      return `Row ${rowNumber}: Missing Input Image Urls`;
    }
    const urls = this.parseImageUrls(inputImageUrls);
    if (urls.length === 0) {
      return `Row ${rowNumber}: No valid image URLs found`;
    }
    for (const url of urls) {
      try {
        new URL(url);
      } catch (err) {
        return `Row ${rowNumber}: Invalid URL format: ${url}`;
      }
    }

    return null;
  }

  static parseImageUrls(imageUrls: string) {
    return imageUrls.split(",").map((url) => url.trim());
  }
}
