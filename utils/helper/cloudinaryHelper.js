import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary using the environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a single image file to Cloudinary and cleans up the local file.
 * @param {string} filePath - The temporary path of the file saved by multer.
 * @returns {Promise<string>} The secure URL of the uploaded image.
 */
export async function uploadImage(filePath) {
    let secureUrl = null;
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'ecom-products', // A good practice to organize your uploads
            resource_type: 'image',
        });
        secureUrl = result.secure_url;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Image upload failed.');
    } finally {
        // IMPORTANT: Clean up the local file after uploading to Cloudinary
        // Cloudinary only needs the file temporarily.
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting local file:', err);
        });
    }
    return secureUrl;
}

/**
 * Deletes a single image from Cloudinary using its public ID.
 * @param {string} imageUrl - The full URL of the image.
 * @returns {Promise<void>}
 */
export async function deleteImage(imageUrl) {
    if (!imageUrl) return;

    // Extract public ID from the secure URL
    // e.g., 'https://res.cloudinary.com/djqsehax7/image/upload/v1600000000/ecom-products/my_public_id.jpg'
    const parts = imageUrl.split('/');
    const publicIdWithExtension = parts.slice(-2).join('/').split('.')[0];
    const publicId = publicIdWithExtension; // In this simple case, the public ID is often the full path after the folder.

    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
        // We might choose to ignore delete failures to not block the main operation,
        // but it's good practice to log them.
    }
}