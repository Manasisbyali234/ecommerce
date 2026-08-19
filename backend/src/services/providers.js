import crypto from "crypto";
import { env } from "../config/env.js";
import { fail } from "../utils/api.js";

export async function sendOtp(phone, code) {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioFrom) {
    if (env.otpDebug) return { provider: "development" };
    throw fail(503, "SMS OTP is not configured");
  }
  const auth = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`, { method: "POST", headers: { authorization: `Basic ${auth}`, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ to: `+91${phone}`, from: env.twilioFrom, body: `Your Metromindz login code is ${code}. It expires in 5 minutes.` }) });
  if (!response.ok) throw fail(502, "Unable to send OTP through SMS provider");
  return { provider: "twilio" };
}

export async function sendEmail({ to, subject, html }) {
  if (!env.resendApiKey || !env.emailFrom) return { sent: false, reason: "Email provider is not configured" };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${env.resendApiKey}`, "content-type": "application/json" }, body: JSON.stringify({ from: env.emailFrom, to: [to], subject, html }) });
  if (!response.ok) throw fail(502, "Unable to send email through provider");
  return { sent: true };
}

export async function createRazorpayOrder(order) {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) throw fail(503, "Razorpay is not configured");
  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { authorization: `Basic ${auth}`, "content-type": "application/json" }, body: JSON.stringify({ amount: Math.round(order.total * 100), currency: "INR", receipt: order.orderNumber, notes: { internalOrderId: order.id } }) });
  if (!response.ok) throw fail(502, "Unable to create payment order");
  const payment = await response.json();
  return { provider: "razorpay", keyId: env.razorpayKeyId, orderId: payment.id, amount: payment.amount, currency: payment.currency };
}

export function verifyRazorpayWebhook(rawBody, signature) {
  if (!env.razorpayWebhookSecret) throw fail(503, "Razorpay webhook secret is not configured");
  const expected = crypto.createHmac("sha256", env.razorpayWebhookSecret).update(rawBody).digest("hex");
  return Boolean(signature && signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)));
}
