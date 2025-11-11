const User = require('../models/User');
const LegalDocument = require('../models/LegalDocument');

/**
 * Middleware to check if user has accepted the current EULA
 * Only enforces EULA for critical actions (bidding, listing, transactions)
 */
const requireEulaAcceptance = async (req, res, next) => {
    try {
        // Skip EULA check if not authenticated
        if (!req.user || !req.user._id) {
            return next();
        }

        // Get current active EULA
        const currentEula = await LegalDocument.findOne({
            type: 'eula',
            isActive: true
        }).select('version');

        // If no EULA is configured, skip check
        if (!currentEula) {
            return next();
        }

        // Get user's EULA acceptance status
        const user = await User.findById(req.user._id).select('eulaAccepted eulaVersion');

        // Check if user has accepted the current version
        if (!user.eulaAccepted || user.eulaVersion !== currentEula.version) {
            return res.status(403).json({
                error: 'EULA_NOT_ACCEPTED',
                message: 'Та үйлчилгээний нөхцлийг зөвшөөрөх шаардлагатай',
                eulaVersion: currentEula.version,
                requiresAcceptance: true
            });
        }

        next();
    } catch (error) {
        console.error('EULA middleware error:', error);
        // Don't block request on error, just log it
        next();
    }
};

/**
 * Optional EULA check - warns but doesn't block
 */
const checkEulaAcceptance = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return next();
        }

        const currentEula = await LegalDocument.findOne({
            type: 'eula',
            isActive: true
        }).select('version');

        if (!currentEula) {
            return next();
        }

        const user = await User.findById(req.user._id).select('eulaAccepted eulaVersion');

        if (!user.eulaAccepted || user.eulaVersion !== currentEula.version) {
            // Add warning to response headers
            res.setHeader('X-EULA-Required', 'true');
            res.setHeader('X-EULA-Version', currentEula.version);
        }

        next();
    } catch (error) {
        console.error('EULA check error:', error);
        next();
    }
};

module.exports = {
    requireEulaAcceptance,
    checkEulaAcceptance
};
