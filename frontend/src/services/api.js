/**
 * api.js — all network calls in one place.
 * Components import these functions; they never call fetch() directly.
 *
 * Base URL is read from the Vite environment variable VITE_API_BASE_URL.
 * Set it in frontend/.env.local (never commit that file).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Upload a file to the backend.
 * Sends multipart/form-data — the same format the Lambda expects.
 *
 * @param {File} file — a File object from an <input type="file"> or drag-drop
 * @returns {{ accessCode, expiresAt, fileName, fileSize }}
 * @throws Error with a user-facing message on failure
 */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type manually — the browser sets it automatically
    // with the correct multipart boundary when using FormData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload failed. Please try again.");
  }

  return data; // { accessCode, expiresAt, fileName, fileSize }
}

/**
 * Retrieve file metadata and a pre-signed download URL for an access code.
 *
 * @param {string} code — 6-character access code entered by the user
 * @returns {{ url, fileName, fileSize, contentType, expiresAt }}
 * @throws Error with a user-facing message on failure (404, 410, 500)
 */
export async function retrieveFile(code) {
  const response = await fetch(`${BASE_URL}/retrieve/${code.toUpperCase().trim()}`);
  const data = await response.json();

  if (response.status === 404) {
    throw new Error("Access code not found. Check the code and try again.");
  }

  if (response.status === 410) {
    throw new Error("This link has expired and the file is no longer available.");
  }

  if (!response.ok) {
    throw new Error(data.error || "Retrieval failed. Please try again.");
  }

  return data; // { url, fileName, fileSize, contentType, expiresAt }
}
