import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { registerSchema, loginSchema } from '../utils/validation.js';
import prisma from '../config/database.js';
import { generateTokens, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/tokenUtils.js';

export const registerUser = async (req: Request, res: Response) => {
    try {
        // Validate request body with Joi
        const { error, value } = registerSchema.validate(req.body, {
            abortEarly: false  // Return all errors
        });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({ 
                message: 'Validation failed',
                errors 
            });
        }

        const { name, email, password } = value;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({ 
                message: 'User with this email already exists' 
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                profileImage: null
            },  
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                profileImage: true
            }
        });

        // Generate access token and refresh token
        const { accessToken, refreshToken } = await generateTokens({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name
        });

        res.status(201).json({ 
            message: 'User registered successfully',
            user: newUser,
            accessToken,
            refreshToken
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Error registering user',
            error: error.message 
        });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        // Validate request body with Joi
        const { error, value } = loginSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({ 
                message: 'Validation failed',
                errors 
            });
        }

        const { email, password } = value;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Generate access token and refresh token
        const { accessToken, refreshToken } = await generateTokens({
            id: user.id,
            email: user.email,
            name: user.name
        });

        res.status(200).json({ 
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage
            },
            accessToken,
            refreshToken
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Error logging in',
            error: error.message 
        });
    }
};

/**
 * Refresh access token using refresh token
 * POST /auth/refresh
 * Body: { refreshToken: string }
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ 
                message: 'Refresh token is required' 
            });
        }

        // Verify refresh token and get user
        const user = await verifyRefreshToken(refreshToken);

        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid or expired refresh token' 
            });
        }

        // Delete old refresh token (token rotation)
        await revokeRefreshToken(refreshToken);

        // Generate new tokens
        const tokens = await generateTokens(user);

        res.status(200).json({ 
            message: 'Token refreshed successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error: any) {
        console.error('Token refresh error:', error);
        res.status(500).json({ 
            message: 'Error refreshing token',
            error: error.message 
        });
    }
};

/**
 * Logout user (revoke refresh token)
 * POST /auth/logout
 * Body: { refreshToken: string }
 */
export const logoutUser = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ 
                message: 'Refresh token is required' 
            });
        }

        // Revoke the refresh token
        const revoked = await revokeRefreshToken(refreshToken);

        if (!revoked) {
            return res.status(404).json({ 
                message: 'Refresh token not found' 
            });
        }

        res.status(200).json({ 
            message: 'Logged out successfully' 
        });
    } catch (error: any) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            message: 'Error logging out',
            error: error.message 
        });
    }
};

/**
 * Logout from all devices (revoke all refresh tokens)
 * POST /auth/logout-all
 * Requires authentication (get userId from JWT token in Authorization header)
 */
export const logoutAllDevices = async (req: Request, res: Response) => {
    try {
        // Get userId from authenticated request (you'll need auth middleware for this)
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'Authentication required' 
            });
        }

        // Revoke all refresh tokens for this user
        await revokeAllUserTokens(userId);

        res.status(200).json({ 
            message: 'Logged out from all devices successfully' 
        });
    } catch (error: any) {
        console.error('Logout all error:', error);
        res.status(500).json({ 
            message: 'Error logging out from all devices',
            error: error.message 
        });
    }
};