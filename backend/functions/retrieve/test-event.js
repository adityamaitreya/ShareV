/**
 * Local test script — simulates an API Gateway event for GET /retrieve/{code}
 * Run with: node test-event.js YOUR_ACCESS_CODE
 *
 * Requires env vars:
 *   S3_BUCKET=sharev-files-764988199438
 *   DYNAMO_TABLE=sharev-files
 *   AWS_REGION=ap-south-1
 *
 * Example:
 *   S3_BUCKET=sharev-files-764988199438 DYNAMO_TABLE=sharev-files AWS_REGION=ap-south-1 node test-event.js 5XKHRD
 */

import { handler } from "./handler.js";

const code = process.argv[2];

if (!code) {
  console.error("Usage: node test-event.js ACCESS_CODE");
  process.exit(1);
}

const mockEvent = {
  requestContext: { http: { method: "GET" } },
  pathParameters: { code },
};

const result = await handler(mockEvent);
console.log("Status:", result.statusCode);
console.log("Body:", JSON.parse(result.body));
