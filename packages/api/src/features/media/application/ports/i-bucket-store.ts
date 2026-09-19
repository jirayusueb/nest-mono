export interface BucketObjectHead {
  bytes: number;
  contentType: string;
}

/** The object-store seam: RustFS today, any S3-compatible store tomorrow. */
export interface IBucketStore {
  /** Presigned browser-PUT URL (SigV4 query string). */
  presignPut(
    key: string,
    contentType: string,
    expiresSeconds: number,
  ): Promise<string>;
  head(key: string): Promise<BucketObjectHead | null>;
  delete(key: string): Promise<void>;
  /** Public read URL for an object (bucket serves anonymous reads). */
  publicUrl(key: string): string;
}
