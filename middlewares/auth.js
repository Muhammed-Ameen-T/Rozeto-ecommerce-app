import User from '../model/userSchema.js'


export const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if (data && !data.isBlocked) {
                next()
            }else{
                res.redirect('/login')
            }
        })
        .catch(error=>{
            console.log('Error in User Auth Middleware',error);
            res.status(500).send("Internal Server Error");
        })
    }else{
        res.redirect('/login')
    }
}


export const adminAuth = (req, res, next) => {
    if (req.session.admin) {
        User.findOne({ isAdmin: true })
        .then(data => {
            if (data) {
                next();
            } else {
                res.redirect('/admin/login');
            }
        })
        .catch(error => {
            console.log('Error in Admin Auth Middleware:', error);
            res.status(500).send('Internal Server Error');
        });
    } else {
        res.redirect('/admin/login');
    }
};
