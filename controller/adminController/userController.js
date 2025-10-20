import User from '../../model/userSchema.js';
import {HttpResCode} from '../../utils/constants/httpResponseCode.utils.js';

export const userTable = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page, 10) || 1;
        const limit = 5;
        
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: 'i' } },
                { email: { $regex: ".*" + search + ".*", $options: 'i' } }
            ],
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: 'i' } },
                { email: { $regex: ".*" + search + ".*", $options: 'i' } }
            ],
        }).countDocuments();
        
        const totalPages = Math.ceil(count / limit);
        res.render('customers-list', { data: userData, totalPages, currentPage: page, limit, search });
    } catch (error) {
        console.log('Error at user table:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const toggleUserBlockStatus = async (req, res) => {
    try {
        const userId = req.query.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(HttpResCode.NOT_FOUND).send('User not found');
        }

        const newStatus = !user.isBlocked;
        await User.findByIdAndUpdate(userId, { isBlocked: newStatus });

        res.redirect('/admin/user-table');
    } catch (error) {
        console.log('Error while toggling user block status', error);
        res.status(500).send('Internal Server Error');
    }
};
