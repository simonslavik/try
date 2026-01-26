import { Request, Response } from 'express';
import prisma from '../config/database.js';

/**
 * Get direct message conversation between two users
 */
export const getDirectMessages = async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { otherUserId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        if (!otherUserId) {
            return res.status(400).json({ 
                message: 'Other user ID is required' 
            });
        }

        // Get messages between the two users
        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: currentUserId }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            }
        });

        // Mark messages as read
        await prisma.directMessage.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: currentUserId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        // Get other user info
        const otherUser = await prisma.user.findUnique({
            where: { id: otherUserId },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                messages,
                otherUser
            }
        });
    } catch (error: any) {
        console.error('Get direct messages error:', error);
        return res.status(500).json({ 
            message: 'Failed to fetch messages',
            error: error.message 
        });
    }
};

/**
 * Send a direct message
 */
export const sendDirectMessage = async (req: Request, res: Response) => {
    try {
        // Support both authenticated requests and internal service calls
        const currentUserId = req.user?.userId || req.headers['x-user-id'] as string;
        const { receiverId, content, attachments = [] } = req.body;

        if (!currentUserId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        if (!receiverId) {
            return res.status(400).json({ 
                message: 'Receiver ID is required' 
            });
        }

        // Validate that either content or attachments exist
        if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
            return res.status(400).json({ 
                message: 'Message content or attachments are required' 
            });
        }

        const message = await prisma.directMessage.create({
            data: {
                senderId: currentUserId,
                receiverId: receiverId,
                content: content?.trim() || '',
                attachments: attachments,
                isRead: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            data: message
        });
    } catch (error: any) {
        console.error('Send direct message error:', error);
        return res.status(500).json({ 
            message: 'Failed to send message',
            error: error.message 
        });
    }
};

/**
 * Get all DM conversations for current user
 */
export const getConversations = async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Get all unique users who have exchanged messages with current user
        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ]
            },
            select: {
                senderId: true,
                receiverId: true
            }
        });

        // Extract unique user IDs
        const userIds = new Set<string>();
        messages.forEach(msg => {
            if (msg.senderId !== currentUserId) userIds.add(msg.senderId);
            if (msg.receiverId !== currentUserId) userIds.add(msg.receiverId);
        });

        // Get user details and conversation info for each user
        const conversations = await Promise.all(
            Array.from(userIds).map(async (otherUserId) => {
                const otherUser = await prisma.user.findUnique({
                    where: { id: otherUserId },
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                });

                const lastMessage = await prisma.directMessage.findFirst({
                    where: {
                        OR: [
                            { senderId: currentUserId, receiverId: otherUserId },
                            { senderId: otherUserId, receiverId: currentUserId }
                        ]
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                const unreadCount = await prisma.directMessage.count({
                    where: {
                        senderId: otherUserId,
                        receiverId: currentUserId,
                        isRead: false
                    }
                });

                return {
                    friend: otherUser,
                    lastMessage,
                    unreadCount
                };
            })
        );

        // Sort by last message time
        conversations.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt).getTime() - 
                   new Date(a.lastMessage.createdAt).getTime();
        });

        return res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error: any) {
        console.error('Get conversations error:', error);
        return res.status(500).json({ 
            message: 'Failed to fetch conversations',
            error: error.message 
        });
    }
};
