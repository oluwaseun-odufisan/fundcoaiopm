// RBAC Middleware
// Role hierarchy: super-admin > executive > team-lead
// Higher roles inherit all permissions of lower roles.

const ROLE_HIERARCHY = {
    'team-lead':  1,
    'executive':  2,
    'super-admin': 3,
};

/**
 * requireRole(...roles)
 * Allows access if the authenticated admin's role is in the list
 * OR has a higher rank in the hierarchy.
 *
 * Usage:
 *   router.get('/something', adminAuthMiddleware, requireRole('super-admin'), handler)
 *   router.get('/something', adminAuthMiddleware, requireRole('team-lead', 'executive'), handler)
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const adminLevel = ROLE_HIERARCHY[req.admin.role] || 0;
        const requiredLevel = Math.min(...allowedRoles.map(r => ROLE_HIERARCHY[r] || 99));

        if (adminLevel >= requiredLevel) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        });
    };
};

/**
 * requireMinRole(role)
 * Allows access if the admin's role is AT LEAST the specified role in hierarchy.
 *
 * Usage:
 *   requireMinRole('executive')  → allows executive and super-admin
 *   requireMinRole('team-lead')  → allows all three roles
 */
export const requireMinRole = (minRole) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const adminLevel = ROLE_HIERARCHY[req.admin.role] || 0;
        const minLevel = ROLE_HIERARCHY[minRole] || 99;

        if (adminLevel >= minLevel) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access denied. Minimum required role: ${minRole}`,
        });
    };
};

/**
 * isSuperAdmin - shorthand for requireMinRole('super-admin')
 */
export const isSuperAdmin = requireMinRole('super-admin');

/**
 * isExecutiveOrAbove - shorthand for requireMinRole('executive')
 */
export const isExecutiveOrAbove = requireMinRole('executive');

/**
 * isTeamLeadOrAbove - shorthand for requireMinRole('team-lead') - all admin roles
 */
export const isTeamLeadOrAbove = requireMinRole('team-lead');