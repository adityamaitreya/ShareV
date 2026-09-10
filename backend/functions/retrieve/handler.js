import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.S3_BUCKET;
const TABLE = process.env.DYNAMO_TABLE;
const PRESIGN_TTL_SECONDS = 15 * 60; // 15 minutes

const s3 = new S3Client({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });

// ── Structured logger ─────────────────────────────────────────────────────────
const log = {
  info:  (message, data = {}) => console.log(JSON.stringify({ level: "INFO",  message, ...data })),
  warn:  (message, data = {}) => console.warn(JSON.stringify({ level: "WARN",  message, ...data })),
  error: (message, data = {}) => console.error(JSON.stringify({ level: "ERROR", message, ...data })),
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
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  // Extract access code from path parameter e.g. GET /retrieve/5XKHRD
  const accessCode = event.pathParameters?.code?.toUpperCase().trim();

  if (!accessCode || accessCode.length !== 6) {
    return respond(400, { error: "Invalid access code format." });
  }

  try {
    // 1. Look up the code in DynamoDB
    const { Item } = await dynamo.send(
      new GetItemCommand({
        TableName: TABLE,
        Key: { accessCode: { S: accessCode } },
      })
    );

    // 2. Not found
    if (!Item) {
      log.warn("Access code not found", { accessCode });
      return respond(404, { error: "Access code not found." });
    }

    // 3. Check expiry
    const expiresAt = Number(Item.expiresAt.N);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (nowSeconds > expiresAt) {
      log.warn("Access code expired", { accessCode, expiresAt });
      return respond(410, { error: "This link has expired." });
    }

    // 4. Generate pre-signed URL
    const s3Key = Item.s3Key.S;
    log.info("Retrieve started", { accessCode, s3Key, fileName: Item.fileName.S });

    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        ResponseContentDisposition: `attachment; filename="${Item.fileName.S}"`,
      }),
      { expiresIn: PRESIGN_TTL_SECONDS }
    );

    log.info("Retrieve complete", { accessCode, fileName: Item.fileName.S });

    // 5. Return the URL and file metadata
    return respond(200, {
      url: presignedUrl,
      fileName: Item.fileName.S,
      fileSize: Number(Item.fileSize.N),
      contentType: Item.contentType.S,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    });

  } catch (err) {
    log.error("Retrieve failed", { error: err.message, stack: err.stack });
    return respond(500, { error: "Retrieval failed. Please try again." });
  }
};
