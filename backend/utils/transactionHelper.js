/**
 * MongoDB Transaction Helper
 * Provides utilities for handling database transactions with retry logic
 */

const mongoose = require('mongoose');
const logger = require('./logger');
const { TransactionError } = require('./errors');

/**
 * Execute a function within a MongoDB transaction with automatic retry
 * @param {Function} operation - Async function that receives session parameter
 * @param {Object} options - Transaction options
 * @returns {Promise<any>} - Result of the operation
 */
async function withTransaction(operation, options = {}) {
    const {
        maxRetries = 3,
        retryDelay = 100, // Initial delay in ms
        sessionOptions = {}
    } = options;

    let lastError;

    // Check if transactions are supported (replica set/sharded cluster)
    const transactionsSupported = await areTransactionsSupported();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let session = null;

        try {
            if (transactionsSupported) {
                session = await mongoose.startSession();
                // Start transaction
                session.startTransaction(sessionOptions);
            }

            // Execute the operation with session (or null if no transactions)
            const result = await operation(session);

            if (transactionsSupported && session) {
                // Commit transaction
                await session.commitTransaction();
            }

            // Log successful transaction
            if (attempt > 1) {
                logger.info('Transaction succeeded after retry', {
                    attempt,
                    maxRetries,
                    transactionsSupported
                });
            }

            return result;

        } catch (error) {
            if (transactionsSupported && session) {
                // Abort transaction on error
                await session.abortTransaction();
            }

            lastError = error;

            // Check if error is retryable
            const isRetryable = isRetryableError(error);

            // Log the error
            logger.warn('Transaction failed', {
                attempt,
                maxRetries,
                isRetryable,
                transactionsSupported,
                errorMessage: error.message,
                errorCode: error.code
            });

            // If not retryable or last attempt, throw immediately
            if (!isRetryable || attempt === maxRetries) {
                throw new TransactionError(
                    `Transaction failed after ${attempt} attempt(s): ${error.message}`,
                    error
                );
            }

            // Wait before retry with exponential backoff
            const delay = retryDelay * Math.pow(2, attempt - 1);
            await sleep(delay);

        } finally {
            // Always end the session
            if (session) {
                await session.endSession();
            }
        }
    }

    // This should never be reached, but just in case
    throw new TransactionError(
        `Transaction failed after ${maxRetries} retries`,
        lastError
    );
}

/**
 * Check if MongoDB transactions are supported
 * Transactions require replica set or sharded cluster
 * @returns {Promise<boolean>}
 */
async function areTransactionsSupported() {
    try {
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();

        // Check if running as replica set or sharded cluster
        const isReplicaSet = serverStatus.repl && serverStatus.repl.setName;
        const isSharded = serverStatus.process === 'mongos';

        const supported = isReplicaSet || isSharded;

        if (!supported) {
            logger.warn('MongoDB transactions not supported - running on standalone instance');
        }

        return supported;
    } catch (error) {
        logger.warn('Could not determine transaction support, assuming not supported', {
            error: error.message
        });
        return false;
    }
}

/**
 * Determine if an error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} - True if error is retryable
 */
function isRetryableError(error) {
    // MongoDB error codes that indicate retryable errors
    const retryableErrorCodes = [
        'WriteConflict', // Write conflict
        'LockTimeout', // Lock acquisition timeout
        'SnapshotUnavailable', // Snapshot unavailable
        'NoSuchTransaction', // Transaction not found
        112, // WriteConflict numeric code
        // Add more retryable codes as needed
    ];

    // Check if error code matches
    if (error.code && retryableErrorCodes.includes(error.code)) {
        return true;
    }

    if (error.codeName && retryableErrorCodes.includes(error.codeName)) {
        return true;
    }

    // Check error message for specific patterns
    const retryablePatterns = [
        /write conflict/i,
        /transient transaction error/i,
        /lock.*timeout/i,
        /snapshot unavailable/i
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute multiple operations in a single transaction
 * @param {Array<Function>} operations - Array of async functions
 * @param {Object} options - Transaction options
 * @returns {Promise<Array>} - Array of results
 */
async function withTransactionBatch(operations, options = {}) {
    return withTransaction(async (session) => {
        const results = [];

        for (const operation of operations) {
            const result = await operation(session);
            results.push(result);
        }

        return results;
    }, options);
}

/**
 * Wrapper for atomic update operations with optimistic locking
 * Uses MongoDB's findAndModify with version field
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Query filter (must include version)
 * @param {Object} update - Update operations
 * @param {Object} options - Additional options
 * @returns {Promise<Document>} - Updated document
 */
async function atomicUpdate(Model, filter, update, options = {}) {
    const {
        session = null,
        incrementVersion = true
    } = options;

    // If using optimistic locking, increment version
    if (incrementVersion) {
        if (!update.$inc) {
            update.$inc = {};
        }
        update.$inc.__v = 1;
    }

    const result = await Model.findOneAndUpdate(
        filter,
        update,
        {
            new: true, // Return updated document
            session,
            runValidators: true
        }
    );

    if (!result) {
        throw new TransactionError(
            'Document not found or version mismatch - possible concurrent modification'
        );
    }

    return result;
}

module.exports = {
    withTransaction,
    withTransactionBatch,
    atomicUpdate,
    isRetryableError,
    areTransactionsSupported,
    sleep
};
