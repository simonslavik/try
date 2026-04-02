import multer from 'multer';
import path from 'path';
import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { logger, logError } from '../utils/logger.js';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '../config/cloudinary.js';

// Configure multer for memory storage (buffer → Cloudinary)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});


// Add or update profile image (requires authentication)
export const addProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Upload to Cloudinary
    const { url: imageUrl } = await uploadToCloudinary(
      req.file.buffer,
      'bookclub/profile-images'
    );
    
    try {
      // Delete old image from Cloudinary if exists
      const currentUser = await UserService.getProfile(userId).catch(() => null);
      if (currentUser?.profileImage) {
        const oldPublicId = extractPublicId(currentUser.profileImage);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId).catch(() => {});
        }
      }

      const updatedUser = await UserService.updateProfileImage(userId, imageUrl);
      
      logger.info({
        type: 'PROFILE_IMAGE_UPLOADED',
        userId,
        imageUrl
      });
      res.json({ message: 'Profile image uploaded successfully', imageUrl: updatedUser.profileImage });
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }
  } catch (error) {
    logError(error, 'Error uploading profile image', { userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
};


export const deleteProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Get current user to find the image URL for Cloudinary cleanup
    const currentUser = await UserService.getProfile(userId).catch(() => null);
    if (currentUser?.profileImage) {
      const publicId = extractPublicId(currentUser.profileImage);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(() => {});
      }
    }

    await UserService.deleteProfileImage(userId);
    
    logger.info({
      type: 'PROFILE_IMAGE_DELETED',
      userId
    });
    res.json({ message: 'Profile image deleted successfully' });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'NO_PROFILE_IMAGE') {
      return res.status(400).json({ error: 'No profile image to delete' });
    }
    
    logError(error, 'Error deleting profile image', { userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
};
