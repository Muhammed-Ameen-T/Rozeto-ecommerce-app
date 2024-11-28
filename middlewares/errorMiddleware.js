// Middleware for handling 404 errors
export const handle404 = (req, res, next) => {
    const error = new Error('Page Not Found');
    error.status = 404;
    error.isAdmin = req.originalUrl.startsWith('/admin');
    next(error);
};

// Middleware for handling errors
export const handleErrors = (error, req, res, next) => {
    const status = error.status || 500;
    res.status(status);

    if (status === 404) {
        // Render separate 404 pages for admin and user routes
        if (error.isAdmin) {
            return res.render('adminPagenotfound')
        }
        return res.render('pagenotfound')
    }

    // Generic error handling
    console.error('Server error:', error.message);
    res.render('error', { errorMessage: 'An unexpected error occurred.' });
};
