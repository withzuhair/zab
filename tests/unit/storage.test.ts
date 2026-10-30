import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getStorageDriver } from "../../src/lib/storage";

describe("storage drivers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("writes, resolves, and deletes local gallery media", async () => {
    vi.stubEnv("STORAGE_DRIVER", "local");
    const driver = getStorageDriver();
    const key = `gallery/${randomUUID()}.webp`;
    const filePath = resolve(process.cwd(), "public", "uploads", key);
    const data = Buffer.from("webp test fixture");

    try {
      expect(driver.publicUrl(key)).toBe(`/uploads/${key}`);
      expect(await driver.put(key, data, "image/webp")).toBe(key);
      expect(await readFile(filePath)).toEqual(data);

      await driver.delete(key);
      await expect(readFile(filePath)).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(filePath, { force: true });
    }
  });

  it("rejects invalid local keys without touching the filesystem", async () => {
    vi.stubEnv("STORAGE_DRIVER", "local");
    const driver = getStorageDriver();

    await expect(
      driver.put("../outside.webp", Buffer.from("x"), "image/webp"),
    ).rejects.toThrow("Invalid local media storage key.");
    await expect(driver.delete("gallery/../outside.webp")).rejects.toThrow(
      "Invalid local media storage key.",
    );
  });

  it("requires an explicit production storage driver", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("STORAGE_DRIVER", "");

    expect(() => getStorageDriver()).toThrow(
      "STORAGE_DRIVER must be configured before production media uploads.",
    );
  });

  it("rejects cloud drivers without their required credentials", () => {
    vi.stubEnv("STORAGE_DRIVER", "vercel-blob");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    expect(() => getStorageDriver()).toThrow(
      "BLOB_READ_WRITE_TOKEN must be configured",
    );

    vi.stubEnv("STORAGE_DRIVER", "r2");
    vi.stubEnv("R2_ACCOUNT_ID", "");
    expect(() => getStorageDriver()).toThrow(
      "R2_ACCOUNT_ID must be configured",
    );
  });
});
