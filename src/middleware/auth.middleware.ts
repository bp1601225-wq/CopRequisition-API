
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Get the Authorization header
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2. Extract the token
    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    // 3. Check the JWT secret
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    // 4. Verify the token
    const decoded = jwt.verify(token, secret);



console.log("DECODED TOKEN:", decoded);

    // 5. Ensure the token contains the required user details
    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // 6. Attach the verified user to the request
    res.locals.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // 7. Continue to the controller
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
