import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { generateTokens, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/tokenUtils.js';
import logger, { logError } from '../utils/logger.js';
import { sendVerificationEmail } from './authController.js';

export const registerUser = async (req: Request, res: Response) => {
    try {
        // Request body is already validated by middleware
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            logger.warn({
                type: 'REGISTRATION_FAILED',
                reason: 'EMAIL_EXISTS',
                email
            });
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

        // Send verification email (don't block response)
        sendVerificationEmail(newUser.id, newUser.email).catch(err => {
            logError(err, 'Failed to send verification email', { userId: newUser.id });
        });

        logger.info({
            type: 'USER_REGISTERED',
            userId: newUser.id,
            email: newUser.email,
            name: newUser.name,
            emailVerified: false
        });

        res.status(201).json({ 
            message: 'User registered successfully. Please check your email to verify your account.',
            user: {
                ...newUser,
                emailVerified: false
            },
            accessToken,
            refreshToken
        });
    } catch (error: any) {
        logError(error, 'Registration error', {
            type: 'REGISTRATION_ERROR',
            email: req.body.email
        });
        res.status(500).json({ 
            message: 'Error registering user',
            error: error.message 
        });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        // Request body is already validated by middleware
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            logger.warn({
                type: 'LOGIN_FAILED',
                reason: 'USER_NOT_FOUND',
                email
            });
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.warn({
                type: 'LOGIN_FAILED',
                reason: 'INVALID_PASSWORD',
                userId: user.id,
                email
            });
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

        logger.info({
            type: 'USER_LOGIN',
            userId: user.id,
            email: user.email
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
        logError(error, 'Login error', {
            type: 'LOGIN_ERROR',
            email: req.body.email
        });
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
        // Request body is already validated by middleware
        const { refreshToken } = req.body;

        // Verify refresh token and get user
        const user = await verifyRefreshToken(refreshToken);

        if (!user) {
            logger.warn({
                type: 'REFRESH_TOKEN_INVALID',
                action: 'REFRESH_TOKEN'
            });
            return res.status(401).json({ 
                message: 'Invalid or expired refresh token' 
            });
        }

        // Delete old refresh token (token rotation)
        await revokeRefreshToken(refreshToken);

        // Generate new tokens
        const tokens = await generateTokens(user);

        logger.info({
            type: 'TOKEN_REFRESHED',
            userId: user.id,
            email: user.email
        });

        res.status(200).json({ 
            message: 'Token refreshed successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error: any) {
        logError(error, 'Token refresh error');
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
        // Request body is already validated by middleware
        const { refreshToken } = req.body;

        // Revoke the refresh token
        const revoked = await revokeRefreshToken(refreshToken);

        if (!revoked) {
            logger.warn({
                type: 'LOGOUT_FAILED',
                action: 'LOGOUT',
                error: 'Refresh token not found'
            });
            return res.status(404).json({ 
                message: 'Refresh token not found' 
            });
        }

        res.status(200).json({ 
            message: 'Logged out successfully' 
        });

        logger.info({
            type: 'USER_LOGOUT',
            action: 'LOGOUT'
        });
    } catch (error: any) {
        logError(error, 'Logout error');
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
            logger.warn({
                type: 'VALIDATION_ERROR',
                action: 'LOGOUT_ALL_DEVICES',
                error: 'Authentication required'
            });
            return res.status(401).json({ 
                message: 'Authentication required' 
            });
        }

        // Revoke all refresh tokens for this user
        await revokeAllUserTokens(userId);

        logger.info({
            type: 'USER_LOGOUT_ALL_DEVICES',
            userId
        });

        res.status(200).json({ 
            message: 'Logged out from all devices successfully' 
        });
    } catch (error: any) {
        logError(error, 'Logout all error');
        res.status(500).json({ 
            message: 'Error logging out from all devices',
            error: error.message 
        });
    }
};