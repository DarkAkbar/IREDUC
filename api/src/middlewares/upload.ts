import fs from "fs";
import multer from "multer";
import path from "path";
import { badRequest } from "../utils/errors";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

export const documentUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(badRequest("Format de fichier non autorisé. Utilisez jpg, png ou pdf."));
      return;
    }
    cb(null, true);
  },
});

const listingMediaMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
]);

export const listingMediaUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!listingMediaMimeTypes.has(file.mimetype)) {
      cb(
        badRequest(
          "Format non autorisé. Photos : jpg, png, webp. Vidéo : mp4."
        )
      );
      return;
    }
    cb(null, true);
  },
});

export { uploadsRoot };
