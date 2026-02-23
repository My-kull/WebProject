const jwt = require("jsonwebtoken");
const User = require("../2-models/userModel");

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authorization.split(" ")[1]; // Assuming "Bearer <token>"

    try {
        const { _id } = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(_id).select("_id");
        next();
    } catch (error) {
        console.log("Authentication error:", error);
        res.status(401).json({ message: "Request not authorized" });
    }
};

module.exports = requireAuth;