import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured for this storage driver.`);
  }
  return value;
}

function encodedPath(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

const localDriver: StorageDriver = {
  async put(key, data) {
    if (!/^gallery\/[0-9a-f-]+\.webp$/.test(key)) {
      throw new Error("Invalid local media storage key.");
    }
    const root = resolve(process.cwd(), "public", "uploads");
    const path = resolve(root, key);
    const rel = relative(root, path);
    if (rel.startsWith(`..${sep}`) || rel === "..") {
      throw new Error("Media storage key escapes the upload directory.");
    }
    await mkdir(join(root, "gallery"), { recursive: true });
    await writeFile(path, data, { flag: "wx" });
    return key;
  },
  async delete(key) {
    if (!/^gallery\/[0-9a-f-]+\.webp$/.test(key)) {
      throw new Error("Invalid local media storage key.");
    }
    const root = resolve(process.cwd(), "public", "uploads");
    const path = resolve(root, key);
    const rel = relative(root, path);
    if (rel.startsWith(`..${sep}`) || rel === "..") {
      throw new Error("Media storage key escapes the upload directory.");
    }
    await unlink(path);
  },
  publicUrl(key) {
    return `/uploads/${encodedPath(key)}`;
  },
};

const vercelBlobDriver: StorageDriver = {
  async put(key, data, contentType) {
    const result = await put(key, data, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      token: requireEnvironment("BLOB_READ_WRITE_TOKEN"),
    });
    return result.url;
  },
  async delete(key) {
    await del(key, { token: requireEnvironment("BLOB_READ_WRITE_TOKEN") });
  },
  publicUrl(key) {
    return key;
  },
};

let r2Client: S3Client | undefined;
let r2Bucket: string | undefined;

function getR2Client() {
  if (r2Client && r2Bucket) {
    return { client: r2Client, bucket: r2Bucket };
  }

  const accountId = requireEnvironment("R2_ACCOUNT_ID");
  r2Bucket = requireEnvironment("R2_BUCKET");
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: requireEnvironment("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnvironment("R2_SECRET_ACCESS_KEY"),
    },
  });
  return { client: r2Client, bucket: r2Bucket };
}

const r2Driver: StorageDriver = {
  async put(key, data, contentType) {
    const { client, bucket } = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return key;
  },
  async delete(key) {
    const { client, bucket } = getR2Client();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
  publicUrl(key) {
    const baseUrl = requireEnvironment("R2_PUBLIC_URL").replace(/\/+$/, "");
    return `${baseUrl}/${encodedPath(key)}`;
  },
};

export function getStorageDriver(): StorageDriver {
  const driver =
    process.env.STORAGE_DRIVER?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "local");
  if (!driver) {
    throw new Error(
      "STORAGE_DRIVER must be configured before production media uploads.",
    );
  }
  if (driver === "local") return localDriver;
  if (driver === "vercel-blob") {
    requireEnvironment("BLOB_READ_WRITE_TOKEN");
    return vercelBlobDriver;
  }
  if (driver === "r2") {
    getR2Client();
    requireEnvironment("R2_PUBLIC_URL");
    return r2Driver;
  }
  throw new Error(`Unsupported STORAGE_DRIVER "${driver}".`);
}
