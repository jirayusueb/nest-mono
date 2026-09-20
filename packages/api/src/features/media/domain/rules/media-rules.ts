export const MAX_UPLOAD_BYTES = 10_485_760; // 10 MB

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const EXTENSION_BY_TYPE: Record<AllowedImageType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAllowedImageType(
  contentType: string,
): contentType is AllowedImageType {
  // SAFETY: includes must accept arbitrary strings; the guard itself proves
  // membership.
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType);
}
