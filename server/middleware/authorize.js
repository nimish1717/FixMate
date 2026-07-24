/* 
    Worker JWT
        ↓
    authMiddleware
        ↓
    role = worker
        ↓
    authorize(worker)
        ↓
    Allowed
        ↓
    Dashboard returned 
*/

/*
    Let's say:
    roles = ["admin"]
    and
    req.user.role = "worker"
    Check:
    roles.includes("worker")
    Result:
    false
*/

//authorize("admin", "shopkeeper") -> roles = ["admin", "shopkeeper"]

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        next();
    };
};

module.exports = authorize;