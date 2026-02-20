import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(express.json());

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function validateTurnstile(token, remoteip) {
  if (!token || typeof token !== "string") {
    return { success: false, error: "invalid_token_format" };
  }

  if (token.length > 2048) {
    return { success: false, error: "token_too_long" };
  }

  const formData = new URLSearchParams();
  formData.append("secret", process.env.TURNSTILE_SECRET);
  formData.append("response", token);
  formData.append("remoteip", remoteip);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    const result = await response.json();
    return result;
  } catch (err) {
    return { success: false, error: "internal_error" };
  } finally {
    clearTimeout(timeout);
  }
}

app.post("/submit-form", async (req, res) => {
  const token = req.body["cf-turnstile-response"];

  const remoteip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const result = await validateTurnstile(token, remoteip);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      errors: result["error-codes"] || result.error,
    });
  }

  // Optional security checks
  if (result.action && result.action !== "login") {
    return res.status(400).json({
      success: false,
      error: "action_mismatch",
    });
  }

  if (result.hostname && result.hostname !== "yourdomain.com") {
    return res.status(400).json({
      success: false,
      error: "hostname_mismatch",
    });
  }

  // ✅ Token valid – proceed
  return res.json({ success: true, message: "Form submitted successfully" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
