import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    // Allow CORS preflight requests to pass through without authentication
    if (req.method === "OPTIONS") {
      return next();
    }

    let token;

    // 1) Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2) Fallback to cookie (if present)
    if (!token) {
      token = req.cookies?.token;
    }

    // 3) If no token -> same behavior as before (401)
    if (!token) {
      return res.status(401).json({
        message: "User not authenticated. Missing token.",
        success: false,
      });
    }

    // 4) Verify token
    let decode;
    try {
      decode = jwt.verify(token, process.env.SECRET_KEY);
    } catch (verifyError) {
      console.error("JWT verification failed:", verifyError);
      return res.status(401).json({
        message: "Invalid token.",
        success: false,
      });
    }

    if (!decode) {
      return res.status(401).json({
        message: "Invalid token.",
        success: false,
      });
    }

    // 5) Attach user info (same shape as before)
    req.id = decode.userId;
    req.user = {
      _id: decode.userId || decode.id,
    };

    return next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(401).json({
      message: "Authentication verification failed.",
      success: false,
    });
  }
};

export default isAuthenticated;