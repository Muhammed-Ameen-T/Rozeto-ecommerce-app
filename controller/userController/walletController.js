import User from '../../model/userSchema.js'
import Order from '../../model/orderSchema.js'
import Wallet from '../../model/walletSchema.js'

export const loadWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.session.user });
        if (!wallet) {
            wallet = new Wallet({
                userId: req.session.user,
                balance: 0,
                transactions: []
            });
            await wallet.save();
        } else {
            wallet.transactions.sort((a, b) => a.createdAt - b.createdAt);
        }

        // Store the wallet balance in res.locals for global access
        res.locals.walletBalance = wallet.balance;

        res.render('wallet', {
            wallet,
            transactions: wallet.transactions
        });
    } catch (error) {
        console.log('Error while loading wallet page', error);
        res.redirect("/pageNotfound");
    }
};
