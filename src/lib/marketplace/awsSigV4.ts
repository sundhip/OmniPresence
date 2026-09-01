import crypto from "crypto";

export interface AwsSigV4Params {
  accessKey: string;
  secretKey: string;
  region: string;
  service: string;
  host: string;
  path: string;
  payloadString: string;
  targetHeader: string;
}

export interface AwsSigV4Result {
  headers: Record<string, string>;
  amzDate: string;
  authHeader: string;
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Generates official AWS Signature Version 4 (SigV4) headers for Amazon PA-API 5.0 requests
 */
export function generateAwsSigV4Headers(params: AwsSigV4Params): AwsSigV4Result {
  const {
    accessKey,
    secretKey,
    region,
    service,
    host,
    path,
    payloadString,
    targetHeader,
  } = params;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8); // YYYYMMDD

  const contentEncoding = "amz-1.0";
  const contentType = "application/json; charset=utf-8";

  // 1. Canonical Headers & Signed Headers
  const canonicalHeaders =
    `content-encoding:${contentEncoding}\n` +
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${targetHeader}\n`;

  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const payloadHash = sha256Hex(payloadString);

  // 2. Canonical Request
  const canonicalRequest =
    `POST\n` +
    `${path}\n` +
    `\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${payloadHash}`;

  const canonicalRequestHash = sha256Hex(canonicalRequest);

  // 3. String to Sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    `${canonicalRequestHash}`;

  // 4. Calculate Signature
  const kDate = hmacSha256("AWS4" + secretKey, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  // 5. Build Authorization Header
  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    amzDate,
    authHeader,
    headers: {
      "content-encoding": contentEncoding,
      "content-type": contentType,
      host,
      "x-amz-date": amzDate,
      "x-amz-target": targetHeader,
      Authorization: authHeader,
    },
  };
}
