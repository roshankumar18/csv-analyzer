import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype === "text/csv"
      ? cb(null, true)
      : cb(new Error("Invalid file type, only CSV files are allowed"));
  },
});
