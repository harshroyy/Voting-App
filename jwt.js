const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {

    // first check request headers has authorization or not
    const authorization = req.headers.authorization
    if(!authorization) return res.status(401).json({error : "no token"})

     // extract the jwt token from the header
     const token = req.headers.authorization.split(' ')[1];
     if(!token) return res.status(401).json({error : "Unauthorized"});

     try{
        // verify the jwt token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user information to the request object
        req.user = decoded;
        next();
     }
     catch(err) {
         console.error(err);
         res.status(402).json({error: "Invalid Token"});
     }
}


// funtion to generate jwt
const generateToken = (userData) => {
    // generate a new jwt token
    return jwt.sign(userData, process.env.JWT_SECRET, {expiresIn: 300000});
}


module.exports = {jwtAuthMiddleware, generateToken}