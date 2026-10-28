import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/**
 * Réduit les images uploadées (max 1600px, JPEG ~80 %) pour alléger le mobile.
 * Les PDF / vidéos sont laissés intacts.
 */
export async function optimizeUploadedImage(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return filePath;
  }

  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ext);
  const outPath = path.join(dir, `${base}-opt.jpg`);

  await sharp(filePath)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(outPath);

  await fs.unlink(filePath).catch(() => undefined);
  return outPath;
}
