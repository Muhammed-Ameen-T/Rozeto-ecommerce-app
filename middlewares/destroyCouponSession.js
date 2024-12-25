import Coupon from '../model/couponSchema.js';

export const destroyCouponSession = async (req, res, next) => {
    // Define the paths where the coupon should not be destroyed for different request methods
    const allowedPaths = {
        GET: ['/checkout', '/orderSuccess'],
        POST: ['/checkout', '/coupon', '/removeCoupon', '/placeOrder','/create-razorpay-order','/payment-success']
    };

    // Extract the base path and handle routes with query parameters
    const currentPath = req.path; // Use `req.path` for exact route matching
    const currentMethod = req.method;

    // Check if the current path is allowed for the request method
    const isAllowedPath = allowedPaths[currentMethod] && allowedPaths[currentMethod].includes(currentPath);

    // Handle unexpected reloads or navigation away
    if (!isAllowedPath && req.session.coupon) {
        const couponCode = req.session.coupon.code;

        try {
            // Only remove user from usedBy field if necessary
            await Coupon.updateOne({ code: couponCode }, { $pull: { usedBy: req.session.user } });
            console.log('User removed from usedBy and coupon session destroyed due to redirection');
        } catch (error) {
            console.error('Error updating coupon usedBy field:', error);
        }

        delete req.session.coupon;
    }
    next();
};
