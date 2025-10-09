import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      return cb(new Error("Only JPEG and PNG images are allowed."));
    }
    cb(null, true);
  },
});
