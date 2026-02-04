"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBookClubRole = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware to verify user has required role in a bookclub
 * Makes request to collab-editor service to verify membership and role
 */
const requireBookClubRole = (minRole = 'MEMBER') => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const bookClubId = req.params.bookClubId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            if (!bookClubId) {
                return res.status(400).json({ error: 'Book club ID required' });
            }
            // Call collab-editor service to verify membership and role
            const collabEditorUrl = process.env.COLLAB_EDITOR_URL || 'http://collab-editor:4000';
            const verifyUrl = `${collabEditorUrl}/bookclubs/${bookClubId}/members/${userId}/verify-role`;
            logger_1.default.info(`Verifying role at: ${verifyUrl}`);
            const response = await fetch(verifyUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                logger_1.default.error(`Role verification failed: ${response.status} ${response.statusText}`);
                if (response.status === 403) {
                    return res
                        .status(403)
                        .json({ error: 'You must be a member to manage books in this bookclub' });
                }
                if (response.status === 404) {
                    return res.status(404).json({ error: 'Book club not found' });
                }
                throw new Error('Failed to verify bookclub membership');
            }
            const data = await response.json();
            const { role, status } = data;
            if (status !== 'ACTIVE') {
                return res.status(403).json({ error: 'You are not an active member of this bookclub' });
            }
            // Check role hierarchy
            const roleHierarchy = {
                OWNER: 4,
                ADMIN: 3,
                MODERATOR: 2,
                MEMBER: 1,
            };
            const userRoleLevel = roleHierarchy[role] || 0;
            const requiredRoleLevel = roleHierarchy[minRole] || 0;
            if (userRoleLevel < requiredRoleLevel) {
                return res.status(403).json({
                    error: `You need ${minRole} role or higher to perform this action. Your role: ${role}`,
                });
            }
            // Store role in request for use in controllers
            req.bookClubRole = role;
            next();
        }
        catch (error) {
            logger_1.default.error('Error verifying bookclub role:', { error: error.message });
            res.status(500).json({ error: 'Failed to verify permissions' });
        }
    };
};
exports.requireBookClubRole = requireBookClubRole;
