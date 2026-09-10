/**
 * Local test script — simulates an API Gateway event with a small text file.
 * Run with: node test-event.js
 *
 * Requires env vars to be set:
 *   S3_BUCKET=sharev-files-764988199438
 *   DYNAMO_TABLE=sharev-files
 *   AWS_REGION=ap-south-1
 */

import { handler } from "./handler.js";

// Build a minimal multipart/form-data body with a tiny text file
const boundary = "----TestBoundary123";
const fileContent = "hello from ShareV test";
const body = [
  `--${boundary}`,
  `Content-Disposition: form-data; name="file"; filename="test-upload.txt"`,
  `Content-Type: text/plain`,
  ``,
  fileContent,
  `--${boundary}--`,
].join("\r\n");

const mockEvent = {
  httpMethod: "POST",
  isBase64Encoded: false,
  headers: {
    "content-type": `multipart/form-data; boundary=${boundary}`,
  },
  body,
};

const result = await handler(mockEvent);
console.log("Status:", result.statusCode);
console.log("Body:", JSON.parse(result.body));
