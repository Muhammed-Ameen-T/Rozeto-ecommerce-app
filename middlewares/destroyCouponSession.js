import Coupon from '../model/couponSchema.js';

export const destroyCouponSession = async (req, res, next) => {
    const allowedPaths = {
        GET: ['/checkout', '/orderSuccess'],
        POST: ['/checkout', '/coupon', '/removeCoupon', '/placeOrder','/create-razorpay-order','/payment-success']
    };

    const currentPath = req.path; 
    const currentMethod = req.method;

    const isAllowedPath = allowedPaths[currentMethod] && allowedPaths[currentMethod].includes(currentPath);

    if (!isAllowedPath && req.session.coupon) {
        const couponCode = req.session.coupon.code;

        try {
            await Coupon.updateOne({ code: couponCode }, { $pull: { usedBy: req.session.user } });
            console.log('User removed from usedBy and coupon session destroyed due to redirection');
        } catch (error) {
            console.error('Error updating coupon usedBy field:', error);
        }

        delete req.session.coupon;
    }
    next();
};
