const LegalDocument = require('../models/LegalDocument');
const User = require('../models/User');

// Get current active EULA
exports.getCurrentEULA = async (req, res) => {
    try {
        const eula = await LegalDocument.findOne({
            type: 'eula',
            isActive: true
        }).select('version title titleMn content contentMn effectiveDate');

        if (!eula) {
            return res.status(404).json({
                error: 'EULA олдсонгүй'
            });
        }

        res.json({
            success: true,
            eula
        });

    } catch (error) {
        console.error('Get EULA error:', error);
        res.status(500).json({
            error: 'EULA татахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Get legal document by type
exports.getLegalDocument = async (req, res) => {
    try {
        const { type } = req.params; // 'eula', 'privacy', 'terms'

        const document = await LegalDocument.findOne({
            type,
            isActive: true
        });

        if (!document) {
            return res.status(404).json({
                error: 'Баримт олдсонгүй'
            });
        }

        res.json({
            success: true,
            document
        });

    } catch (error) {
        console.error('Get legal document error:', error);
        res.status(500).json({
            error: 'Баримт татахад алдаа гарлаа',
            details: error.message
        });
    }
};

// Accept EULA
exports.acceptEULA = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get current active EULA
        const eula = await LegalDocument.findOne({
            type: 'eula',
            isActive: true
        });

        if (!eula) {
            return res.status(404).json({
                error: 'EULA олдсонгүй'
            });
        }

        // Update user's EULA acceptance
        await User.findByIdAndUpdate(userId, {
            eulaAccepted: true,
            eulaAcceptedAt: new Date(),
            eulaVersion: eula.version
        });

        res.json({
            success: true,
            message: 'EULA зөвшөөрөгдлөө',
            version: eula.version
        });

    } catch (error) {
        console.error('Accept EULA error:', error);
        res.status(500).json({
            error: 'EULA зөвшөөрөхөд алдаа гарлаа',
            details: error.message
        });
    }
};

// Check user's EULA acceptance status
exports.checkEULAStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('eulaAccepted eulaVersion eulaAcceptedAt');
        const currentEula = await LegalDocument.findOne({
            type: 'eula',
            isActive: true
        }).select('version');

        const accepted = user.eulaAccepted && user.eulaVersion === currentEula?.version;

        res.json({
            success: true,
            accepted,
            userVersion: user.eulaVersion,
            currentVersion: currentEula?.version,
            acceptedAt: user.eulaAcceptedAt
        });

    } catch (error) {
        console.error('Check EULA status error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};

// Admin: Create or update legal document
exports.createLegalDocument = async (req, res) => {
    try {
        const { type, version, title, titleMn, content, contentMn, effectiveDate } = req.body;

        // Deactivate previous documents of this type
        await LegalDocument.updateMany(
            { type, isActive: true },
            { isActive: false }
        );

        // Create new document
        const document = await LegalDocument.create({
            type,
            version,
            title,
            titleMn,
            content,
            contentMn,
            effectiveDate: effectiveDate || new Date(),
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Баримт үүсгэгдлээ',
            document
        });

    } catch (error) {
        console.error('Create legal document error:', error);
        res.status(500).json({
            error: 'Баримт үүсгэхэд алдаа гарлаа',
            details: error.message
        });
    }
};

// Admin: Get all legal documents
exports.getAllLegalDocuments = async (req, res) => {
    try {
        const { type } = req.query;

        const query = {};
        if (type) {
            query.type = type;
        }

        const documents = await LegalDocument.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            documents
        });

    } catch (error) {
        console.error('Get all legal documents error:', error);
        res.status(500).json({
            error: 'Алдаа гарлаа',
            details: error.message
        });
    }
};
