import { fileTypeFromBuffer } from "file-type";
import sharp, { type Sharp } from "sharp";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

const acceptedFormats = new Set(["jpg", "png", "webp"]);

export class InvalidImageError extends Error {}

export async function normalizeImage(input: Buffer) {
  const detected = await fileTypeFromBuffer(new Uint8Array(input));
  if (!detected || !acceptedFormats.has(detected.ext)) {
    throw new InvalidImageError(
      "Only JPEG, PNG, and WebP images are accepted.",
    );
  }

  let pipeline: Sharp;
  try {
    pipeline = sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_IMAGE_PIXELS,
      animated: false,
    });
    const metadata = await pipeline.metadata();
    const detectedFormat = detected.ext === "jpg" ? "jpeg" : detected.ext;
    if (
      metadata.format !== detectedFormat ||
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS
    ) {
      throw new InvalidImageError(
        "The uploaded image is invalid or too large.",
      );
    }

    const { data, info } = await pipeline
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    const blur = await sharp(data)
      .resize(10, 10, { fit: "inside" })
      .webp({ quality: 25 })
      .toBuffer();

    return {
      data,
      width: info.width,
      height: info.height,
      blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    };
  } catch (error) {
    if (error instanceof InvalidImageError) throw error;
    throw new InvalidImageError("The uploaded image could not be decoded.");
  }
}
