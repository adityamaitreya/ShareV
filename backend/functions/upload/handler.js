import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomBytes } from "crypto";

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.S3_BUCKET;
const TABLE = process.env.DYNAMO_TABLE;
const EXPIRY_HOURS = 24;

// ── Structured logger ─────────────────────────────────────────────────────────
// Outputs JSON so CloudWatch Insights can query individual fields.
const log = {
  info:  (message, data = {}) => console.log(JSON.stringify({ level: "INFO",  message, ...data })),
  warn:  (message, data = {}) => console.warn(JSON.stringify({ level: "WARN",  message, ...data })),
  error: (message, data = {}) => console.error(JSON.stringify({ level: "ERROR", message, ...data })),
}

const s3 = new S3Client({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random 6-character alphanumeric access code.
 * Uses only uppercase letters + digits to keep codes easy to read and type.
 */
function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I (ambiguous)
  let code = "";
  const bytes = randomBytes(6);
  for (const byte of bytes) {
    code += chars[byte % chars.length];
  }
  return code;
}

/**
 * Parse a multipart/form-data body coming from API Gateway.
 * API Gateway can be configured to base64-encode binary payloads, so we
 * handle both the raw and base64 cases.
 *
 * Returns { fileBuffer, fileName, contentType } or throws on parse failure.
 */
function parseMultipart(event) {
  const contentTypeHeader = event.headers?.["content-type"] || event.headers?.["Content-Type"] || "";
  const boundaryMatch = contentTypeHeader.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) throw new Error("Missing multipart boundary in Content-Type header");

  const boundary = boundaryMatch[1];
  const bodyBuffer = event.isBase64Encoded
    ? Buffer.from(event.body, "base64")
    : Buffer.from(event.body, "binary");

  // Split body on the boundary delimiter
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = bodyBuffer.indexOf(delimiter) + delimiter.length + 2; // skip \r\n

  while (start < bodyBuffer.length) {
    const end = bodyBuffer.indexOf(delimiter, start);
    if (end === -1) break;
    parts.push(bodyBuffer.slice(start, end - 2)); // trim trailing \r\n
    start = end + delimiter.length + 2;
  }

  // Find the part that has a filename (the file field)
  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const headerSection = part.slice(0, headerEnd).toString();
    const fileNameMatch = headerSection.match(/filename="([^"]+)"/);
    if (!fileNameMatch) continue;

    const ctMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);
    const fileName = fileNameMatch[1];
    const contentType = ctMatch ? ctMatch[1].trim() : "application/octet-stream";
    const fileBuffer = part.slice(headerEnd + 4); // skip \r\n\r\n

    return { fileBuffer, fileName, contentType };
  }

  throw new Error("No file part found in multipart body");
}

// ── CORS headers returned on every response ───────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify(body),
  };
}

// ── handler ───────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  // Preflight OPTIONS request from browser
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  try {
    // 1. Parse the uploaded file from the multipart body
    const { fileBuffer, fileName, contentType } = parseMultipart(event);

    // 2. Validate size (25 MB hard limit — matches frontend)
    const MAX_BYTES = 25 * 1024 * 1024;
    if (fileBuffer.length > MAX_BYTES) {
      log.warn("File too large", { fileName, fileSize: fileBuffer.length });
      return respond(413, { error: "File exceeds the 25 MB limit." });
    }

    // 3. Generate a unique access code
    const accessCode = generateAccessCode();
    const s3Key = `uploads/${accessCode}/${fileName}`;

    log.info("Upload started", { accessCode, fileName, contentType, fileSize: fileBuffer.length });

    // 4. Store file in S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    // 5. Write metadata to DynamoDB
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + EXPIRY_HOURS * 60 * 60;

    await dynamo.send(
      new PutItemCommand({
        TableName: TABLE,
        Item: {
          accessCode: { S: accessCode },
          s3Key:       { S: s3Key },
          fileName:    { S: fileName },
          contentType: { S: contentType },
          fileSize:    { N: String(fileBuffer.length) },
          expiresAt:   { N: String(expiresAt) },
          createdAt:   { S: new Date().toISOString() },
        },
        ConditionExpression: "attribute_not_exists(accessCode)",
      })
    );

    log.info("Upload complete", { accessCode, s3Key, expiresAt });

    // 6. Return the access code and expiry to the browser
    return respond(200, {
      accessCode,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      fileName,
      fileSize: fileBuffer.length,
    });

  } catch (err) {
    log.error("Upload failed", { error: err.message, stack: err.stack });
    return respond(500, { error: "Upload failed. Please try again." });
  }
};
