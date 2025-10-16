import jwt from 'jsonwebtoken';

export const checkAuth = (req, res, next) => {
    const token = req.cookies.authToken;

    if (token) {
         jwt.verify(token, 'secreto', (err, decodedToken) => {
            if (err) {
                res.locals.isLoggedIn = false;
                next();
            } else {
                res.locals.isLoggedIn = true;
                next(); 
            }
        });
    } else {
        res.locals.isLoggedIn = false;
        next(); 
    }
};
