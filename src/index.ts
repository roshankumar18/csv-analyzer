import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import uploadRoutes from "@routes/upload.routes";
import statusRoutes from "@routes/status.routes";
import connect from "./db";
import { BlobService } from "@services/blob-service";
import { errorHandler } from "@middlewares/error-handler";

const app = express();
connect();
const port = process.env.PORT || 8000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`/api/v1/upload`, uploadRoutes);
app.use(`/api/v1/status`, statusRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
