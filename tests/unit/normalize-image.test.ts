import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  InvalidImageError,
  normalizeImage,
} from "../../src/lib/media/normalize-image";

describe("normalizeImage", () => {
  it("strips source metadata, generates WebP, dimensions, and a blur placeholder", async () => {
    const source = await sharp({
      create: {
        width: 48,
        height: 32,
        channels: 3,
        background: "#0f5ca8",
      },
    })
      .jpeg()
      .toBuffer();

    const result = await normalizeImage(source);
    const metadata = await sharp(result.data).metadata();

    expect(metadata.format).toBe("webp");
    expect(result.width).toBe(48);
    expect(result.height).toBe(32);
    expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
  });

  it("rejects executable content even when the file name has an image extension", async () => {
    await expect(
      normalizeImage(Buffer.from("MZ executable payload")),
    ).rejects.toBeInstanceOf(InvalidImageError);
  });

  it("rejects image data whose bytes do not match the detected file type", async () => {
    await expect(
      normalizeImage(Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00, 0x00])),
    ).rejects.toBeInstanceOf(InvalidImageError);
  });
});
