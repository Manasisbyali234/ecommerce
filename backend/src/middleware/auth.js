import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/index.js";
import { fail, asyncHandler } from "../utils/api.js";
export const requireAuth = asyncHandler(async (req, _res, next) => { const header = req.headers.authorization; if (!header?.startsWith("Bearer ")) throw fail(401, "Authentication is required"); const claims = jwt.verify(header.slice(7), env.jwtSecret); const user = await User.findById(claims.sub); if (!user || user.status !== "active") throw fail(401, "Account is unavailable"); req.user = user; next(); });
export const requireRole = (...roles) => (req, _res, next) => roles.includes(req.user.role) ? next() : next(fail(403, "You do not have permission for this action"));
