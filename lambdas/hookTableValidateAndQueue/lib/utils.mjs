/**
 * Validates the tableId.
 * @param {string} tableId - The tableId to validate.
 * @throws {Error} - If the tableId is invalid.
 */
export function verifyTableId(tableId) {
    if (typeof tableId !== 'string') {
        throw new Error('tableId must be a string');
    }

    // Check if the tableId only contains alphanumeric characters, hyphens, and underscores
    if (!/^[a-z0-9-_]+$/.test(tableId)) {
        throw new Error('tableId can only contain alphanumeric characters, hyphens, and underscores');
    }

    // Check the length of the tableId
    if (tableId.length < 3 || tableId.length > 50) {
        throw new Error('tableId must be between 3 and 50 characters long');
    }
}
