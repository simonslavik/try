import { Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '../config/cloudinary.js';

// Upload chat file
export const uploadChatFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine resource type based on mimetype
    const isImage = /^image\//.test(req.file.mimetype);
    const resourceType = isImage ? 'image' as const : 'auto' as const;

    // Upload to Cloudinary
    const { url: fileUrl, publicId } = await uploadToCloudinary(
      req.file.buffer,
      'bookclub/chat-files',
      resourceType
    );
    
    // Save file metadata to database
    const chatFile = await prisma.chatFile.create({
      data: {
        filename: publicId.split('/').pop() || req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        uploadedBy: req.user!.userId
      }
    });

    logger.info('FILE_UPLOADED', { originalName: req.file.originalname, userId: req.user!.userId });
    res.json({ 
      success: true, 
      data: {
        id: chatFile.id,
        url: fileUrl,
        filename: chatFile.originalName,
        mimetype: chatFile.mimetype,
        size: chatFile.size
      }
    });
  } catch (error) {
    logger.error('ERROR_UPLOAD_FILE', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

// Delete chat file
export const deleteChatFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.userId;
    
    const file = await prisma.chatFile.findUnique({
      where: { id: fileId }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if user owns the file
    if (file.uploadedBy !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Delete from Cloudinary
    const publicId = extractPublicId(file.url);
    if (publicId) {
      const isImage = /^image\//.test(file.mimetype);
      await deleteFromCloudinary(publicId, isImage ? 'image' : 'raw').catch(() => {});
    }
    
    // Delete from database
    await prisma.chatFile.delete({
      where: { id: fileId }
    });
    
    logger.info('FILE_DELETED', { originalName: file.originalName });
    res.json({ success: true });
  } catch (error) {
    logger.error('ERROR_DELETE_FILE', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
