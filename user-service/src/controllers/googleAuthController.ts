import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database.js';
import { generateTokens } from '../utils/tokenUtils.js';

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Verify Google OAuth token and create/login user
 */
export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ 
                message: 'Google credential is required' 
            });
        }

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        if (!payload) {
            return res.status(401).json({ 
                message: 'Invalid Google token' 
            });
        }

        const { sub: googleId, email, name, picture } = payload;

        if (!email || !name) {
            return res.status(400).json({ 
                message: 'Email and name are required from Google' 
            });
        }

        // Check if user exists with this Google ID or email
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId },
                    { email }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                googleId: true,
                authProvider: true,
                profileImage: true,
                createdAt: true
            }
        });

        // If user exists but doesn't have Google ID, link the account
        if (user && !user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId,
                    authProvider: 'google',
                    profileImage: picture || user.profileImage
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    googleId: true,
                    authProvider: true,
                    profileImage: true,
                    createdAt: true
                }
            });
        }

        // If user doesn't exist, create new user
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    googleId,
                    authProvider: 'google',
                    profileImage: picture || null,
                    password: null // OAuth users don't need password
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    googleId: true,
                    authProvider: true,
                    profileImage: true,
                    createdAt: true
                }
            });
        }

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = await generateTokens({
            id: user.id,
            email: user.email,
            name: user.name
        });

        res.status(200).json({
            message: 'Google authentication successful',
            user,
            accessToken,
            refreshToken
        });

    } catch (error: any) {
        console.error('Google auth error:', error);
        res.status(500).json({ 
            message: 'Error authenticating with Google',
            error: error.message 
        });
    }
};
