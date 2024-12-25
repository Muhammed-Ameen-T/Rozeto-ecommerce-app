import crypto from 'crypto';

const generateReferralCode = (userName) => {
    const prefix = userName.substring(0, 2).toUpperCase(); 
    const uniqueId = crypto.randomBytes(3).toString('hex'); 
    return `${prefix}${uniqueId}`;
}

export default generateReferralCode;
