const ALGORITHM = "AWS4-HMAC-SHA256";

const encoder = new TextEncoder();

export interface PresignPutOptions {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  key: string;
  expiresSeconds: number;
}

/** RFC 3986 — encodeURIComponent minus its unreserved leaks (!'()*). */
function uriEncode(value: string): string {
  return encodeURIComponent(value).replaceAll(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

async function hmac(
  key: Uint8Array<ArrayBuffer>,
  data: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data)),
  );
}

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(data));

  return hex(new Uint8Array(digest));
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function signingKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const kDate = await hmac(
    new Uint8Array(encoder.encode(`AWS4${secretAccessKey}`)),
    dateStamp,
  );

  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, "s3");

  return hmac(kService, "aws4_request");
}

/**
 * Hand-rolled SigV4 query-string presign for a browser PUT. Host-only signed
 * headers: any Content-Type the client sends is accepted.
 */
export async function presignPutUrl(
  options: PresignPutOptions,
): Promise<string> {
  const endpointUrl = new URL(options.endpoint);

  const canonicalUri = `/${options.bucket}/${options.key
    .split("/")
    .map(uriEncode)
    .join("/")}`;

  const now = new Date();

  const amzDate = `${now
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .slice(0, 15)}Z`;

  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${options.region}/s3/aws4_request`;

  const query: [string, string][] = [
    ["X-Amz-Algorithm", ALGORITHM],
    ["X-Amz-Credential", `${options.accessKeyId}/${credentialScope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(options.expiresSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ];

  const canonicalQuery = query
    .map(([name, value]) => `${uriEncode(name)}=${uriEncode(value)}`)
    .join("&");

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    `host:${endpointUrl.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    ALGORITHM,
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = hex(
    await hmac(
      await signingKey(options.secretAccessKey, dateStamp, options.region),
      stringToSign,
    ),
  );

  return `${options.endpoint}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
