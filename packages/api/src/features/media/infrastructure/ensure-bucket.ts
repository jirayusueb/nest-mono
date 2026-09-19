import { newS3Client, s3Config } from "./bucket-store";

/**
 * Boot-time idempotent setup: create the bucket if missing, then allow
 * anonymous reads.
 */
export async function ensureBucket(): Promise<void> {
  const config = s3Config();
  const client = newS3Client();

  const created = await client.fetch(`${config.endpoint}/${config.bucket}`, {
    method: "PUT",
  });

  if (!created.ok && created.status !== 409) {
    throw new Error(
      `Failed to create bucket ${config.bucket}: ${created.status} ${await created.text()}`,
    );
  }

  const policy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${config.bucket}/*`],
      },
    ],
  });

  const applied = await client.fetch(
    `${config.endpoint}/${config.bucket}?policy=`,
    { method: "PUT", body: policy },
  );

  if (!applied.ok && applied.status !== 204) {
    throw new Error(
      `Failed to set bucket policy: ${applied.status} ${await applied.text()}`,
    );
  }
}
