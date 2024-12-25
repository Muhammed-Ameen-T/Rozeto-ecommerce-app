// middleware/getWalletBalance.js
import Wallet from '../model/walletSchema.js'

export const getWalletBalance = async (req, res, next) => {
    try {
        if (req.session.user) {
            const wallet = await Wallet.findOne({ userId: req.session.user }) || { balance: 0 };
            res.locals.walletBalance = wallet.balance;
        } else {
            res.locals.walletBalance = 0;
        }
        next();
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.locals.walletBalance = 0;
        next();
    }
};
