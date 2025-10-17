// back/predict.js
const axios = require("axios");

const PYTHON_URL = process.env.PYTHON_URL || "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT = Number(process.env.PREDICT_TIMEOUT_MS || 30_000);
const RETRY_ON_NETWORK = Number(process.env.PREDICT_RETRY_ON_NETWORK || 1);

/**
 * Send a single record (object) or an array of records to the Python prediction service.
 *
 * @param {Object|Object[]} record - single DB row object or array of row objects
 * @param {Object} opts
 * @param {boolean} opts.include_id - whether python service should attach input ids (default true)
 * @param {number} opts.timeout - request timeout ms (default 30000)
 * @returns {Promise<Object>} - parsed JSON response from python service
 */
async function predictRecord(record, { include_id = true, timeout = DEFAULT_TIMEOUT } = {}) {
  const payload = { data: record, include_id };

  // small retry loop for transient network errors
  let attempt = 0;
  let lastErr = null;
  const maxAttempts = 1 + (RETRY_ON_NETWORK || 0);

  while (attempt < maxAttempts) {
    try {
      const resp = await axios.post(`${PYTHON_URL.replace(/\/$/, "")}/predict`, payload, {
        headers: { "Content-Type": "application/json" },
        timeout,
      });
      return resp.data;
    } catch (err) {
      lastErr = err;
      attempt += 1;

      // Only retry on network / connection errors, not on 4xx/5xx from server
      const isNetworkError = !!(err.code && (err.code === "ECONNREFUSED" || err.code === "ECONNRESET" || err.code === "ENOTFOUND" || err.code === "EAI_AGAIN"));
      if (!isNetworkError || attempt >= maxAttempts) break;

      // small backoff before retrying
      await new Promise((r) => setTimeout(r, 200 * attempt));
      continue;
    }
  }

  // Normalize the error for callers
  const errData = {
    message: "Prediction call failed",
    pythonUrl: PYTHON_URL,
  };

  if (lastErr) {
    if (lastErr.response) {
      // server returned a non-2xx
      errData.status = lastErr.response.status;
      errData.detail = lastErr.response.data || lastErr.response.statusText;
    } else if (lastErr.request) {
      // request made but no response
      errData.detail = `No response from Python service: ${lastErr.message}`;
    } else {
      // something else
      errData.detail = lastErr.message;
    }
  }

  const e = new Error(errData.detail || "Prediction failed");
  e.info = errData;
  e.original = lastErr;
  throw e;
}

module.exports = { predictRecord };