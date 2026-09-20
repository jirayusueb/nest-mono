export const BUCKET_STORE = "BUCKET_STORE";

export interface BucketObjectHead {
  bytes: number;
  contentType: string;
}

export interface IBucketStore {
  presignPut(
    key: string,
    contentType: string,
    expiresSeconds: number,
  ): Promise<string>;
  head(key: string): Promise<BucketObjectHead | null>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}
