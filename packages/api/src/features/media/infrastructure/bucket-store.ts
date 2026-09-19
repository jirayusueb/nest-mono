import { Injectable } from "@nestjs/common";
import { AwsClient } from "aws4fetch";
import type {
  BucketObjectHead,
  IBucketStore,
} from "../application/ports/i-bucket-store";
import { presignPutUrl } from "./presign";

function s3Config() {
  return {
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    bucket: process.env.S3_BUCKET ?? "media",
    region: process.env.S3_REGION ?? "us-east-1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  };
}

function newS3Client(): AwsClient {
  const config = s3Config();

  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: config.region,
  });
}

@Injectable()
export class RustFsBucketStore implements IBucketStore {
  private readonly client = newS3Client();

  async presignPut(
    key: string,
    _contentType: string,
    expiresSeconds: number,
  ): Promise<string> {
    const config = s3Config();

    return presignPutUrl({
      endpoint: config.endpoint,
      region: config.region,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      key,
      expiresSeconds,
    });
  }

  async head(key: string): Promise<BucketObjectHead | null> {
    const config = s3Config();

    const res = await this.client.fetch(
      `${config.endpoint}/${config.bucket}/${key}`,
      { method: "HEAD" },
    );

    if (!res.ok) {
      return null;
    }

    return {
      bytes: Number(res.headers.get("content-length") ?? "0"),
      contentType:
        res.headers.get("content-type") ?? "application/octet-stream",
    };
  }

  async delete(key: string): Promise<void> {
    const config = s3Config();

    const res = await this.client.fetch(
      `${config.endpoint}/${config.bucket}/${key}`,
      { method: "DELETE" },
    );

    if (!res.ok && res.status !== 404) {
      throw new Error(`S3 delete failed: ${res.status}`);
    }
  }

  publicUrl(key: string): string {
    const config = s3Config();

    return `${config.endpoint}/${config.bucket}/${key}`;
  }
}

export { newS3Client, s3Config };
