import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const fail = (status, message, details) => Object.assign(new Error(message), { status, details });
export const tokenFor = (user) => jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, { expiresIn: "7d" });
export const publicUser = (user) => ({ id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, profile: user.profile, addresses: user.addresses });
