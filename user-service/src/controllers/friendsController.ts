import { Request, Response } from 'express';
import prisma from '../config/database.js';

export const sendFriendRequest = async (req: Request, res: Response) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user?.userId;
        
        if (!senderId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        if (!recipientId) {
            return res.status(400).json({ 
                message: 'Recipient ID is required' 
            });
        }

        if (senderId === recipientId) {
            return res.status(400).json({ 
                message: 'Cannot send friend request to yourself' 
            });
        }

        // Check if users exist
        const recipient = await prisma.user.findUnique({ where: { id: recipientId } });

        if (!recipient) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Check if friendship already exists (in either direction)
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: senderId, friendId: recipientId },
                    { userId: recipientId, friendId: senderId }
                ]
            }
        });

        if (existingFriendship) {
            return res.status(400).json({ 
                message: existingFriendship.status === 'PENDING' 
                    ? 'Friend request already sent' 
                    : 'Already friends'
            });
        }

        // Create friend request
        const friendship = await prisma.friendship.create({
            data: {
                userId: senderId,
                friendId: recipientId,
                status: 'PENDING'
            },
            include: {
                friend: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Friend request sent successfully',
            data: friendship
        });
    } catch (error: any) {
        console.error('Send friend request error:', error);
        return res.status(500).json({ 
            message: 'Failed to send friend request',
            error: error.message 
        });
    }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }
        
        if (!requestId) {
            return res.status(400).json({ 
                message: 'Request ID is required' 
            });
        }

        // Find the friendship request
        const friendship = await prisma.friendship.findUnique({
            where: { id: requestId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        if (!friendship || friendship.friendId !== userId) {
            return res.status(404).json({ 
                message: 'Friend request not found' 
            });
        }

        if (friendship.status !== 'PENDING') {
            return res.status(400).json({ 
                message: 'Friend request is not pending' 
            });
        }

        // Update the friendship status to accepted
        const updatedFriendship = await prisma.friendship.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Friend request accepted successfully',
            data: updatedFriendship
        });
    } catch (error: any) {
        console.error('Accept friend request error:', error);
        return res.status(500).json({ 
            message: 'Failed to accept friend request',
            error: error.message 
        });
    }  
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }
        
        if (!requestId) {
            return res.status(400).json({ 
                message: 'Request ID is required' 
            });
        }

        // Find the friendship request
        const friendship = await prisma.friendship.findUnique({
            where: { id: requestId }
        });

        if (!friendship || friendship.friendId !== userId) {
            return res.status(404).json({ 
                message: 'Friend request not found' 
            });
        }

        if (friendship.status !== 'PENDING') {
            return res.status(400).json({ 
                message: 'Friend request is not pending' 
            });
        }

        // Delete the friendship request instead of updating status
        await prisma.friendship.delete({
            where: { id: requestId }
        });

        return res.status(200).json({
            success: true,
            message: 'Friend request rejected successfully'
        });
    } catch (error: any) {
        console.error('Reject friend request error:', error);
        return res.status(500).json({ 
            message: 'Failed to reject friend request',
            error: error.message 
        });
    }  
};

export const removeFriend = async (req: Request, res: Response) => {
    try {
        const { friendId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        if (!friendId) {
            return res.status(400).json({ 
                message: 'Friend ID is required' 
            });
        }

        // Delete friendship (check both directions)
        const deleted = await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { userId: userId, friendId: friendId, status: 'ACCEPTED' },
                    { userId: friendId, friendId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        if (deleted.count === 0) {
            return res.status(404).json({ 
                message: 'Friendship not found' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Friend removed successfully'
        });
    } catch (error: any) {
        console.error('Remove friend error:', error);
        return res.status(500).json({ 
            message: 'Failed to remove friend',
            error: error.message 
        });
    }
};

export const listFriends = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Fetch accepted friendships (check both directions)
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                },
                friend: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        // Extract friend data (the user who is not the current user)
        const friends = friendships.map(f => 
            f.userId === userId ? f.friend : f.user
        );

        return res.status(200).json({
            success: true,
            data: friends
        });
    } catch (error: any) {
        console.error('List friends error:', error);
        return res.status(500).json({ 
            message: 'Failed to list friends',
            error: error.message 
        });
    }
};

export const listFriendRequests = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Fetch pending friend requests where user is the recipient
        const friendRequests = await prisma.friendship.findMany({
            where: {
                friendId: userId,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: friendRequests
        });

    } catch (error: any) {
        console.error('List friend requests error:', error);
        return res.status(500).json({ 
            message: 'Failed to list friend requests',
            error: error.message 
        });
    }
};
