import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        let token;

       
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
           
            token = authHeader.split(' ')[1];
        }

        
        if (!token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                message: "User not authenticated. Missing token.",
                success: false,
            });
        }

      
        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        
        if (!decode) {
            return res.status(401).json({
                message: "Invalid token.",
                success: false
            });
        }
        
      
        req.id = decode.userId; 
        
       
        req.user = { 
            _id: decode.userId || decode.id || decode.id, 
           
        }; 
        
        next();
        
    } catch (error) {
        
        console.error("Authentication Error:", error);
        
       
        return res.status(401).json({
            message: "Authentication verification failed.",
            success: false,
        });
    }
};

export default isAuthenticated;