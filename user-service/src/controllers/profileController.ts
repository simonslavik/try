import { Request, Response } from 'express';
import prisma from '../config/database.js';

/**
 * Get current user's profile
 * Requires authentication
 */
export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error('Get profile error:', error);
        return res.status(500).json({ 
            message: 'Failed to fetch profile',
            error: error.message 
        });
    }
};

/**
 * Update current user's profile
 * Requires authentication
 */
export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name } = req.body;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Validate input
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ 
                message: 'Name is required' 
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name: name.trim() },
            select: {
                id: true,
                name: true,
                email: true,
                updatedAt: true
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error: any) {
        console.error('Update profile error:', error);
        return res.status(500).json({ 
            message: 'Failed to update profile',
            error: error.message 
        });
    }
};

/**
 * Get any user's profile by ID (admin only)
 * Requires authentication and ADMIN role
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        return res.status(500).json({ 
            message: 'Failed to fetch user',
            error: error.message 
        });
    }
};

/**
 * List all users (admin only)
 * Requires authentication and ADMIN role
 */
export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error: any) {
        console.error('List users error:', error);
        return res.status(500).json({ 
            message: 'Failed to fetch users',
            error: error.message 
        });
    }
};
