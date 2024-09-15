import openpgp from "openpgp";

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

/**
 * Generates a PGP key pair (private and public keys) using a password and a user identifier.
 *
 * @param {string} password - The password to protect the private key.
 * @param {string} user - The user identifier for which the keys are generated.
 * @returns {Promise<Object>} - An object containing the privateKey and publicKey.
 */
export async function generateKeys(password, user) {
    const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ name: user, email: `${user}@hooktable.dcastillogi.com` }],
        passphrase: password,
        format: 'armored'
    });

    return { privateKey, publicKey };
}

/**
 * Check if hCaptcha token is valid.
 * @param {string} token - The hCaptcha token to validate.
 * @returns {Promise<boolean>} - A boolean indicating if the token is valid.
 */
export async function verifyHCaptchaToken(token) {
    const secret = process.env.HCAPTCHA_SECRET;
    const response = await fetch(`https://hcaptcha.com/siteverify?secret=${secret}&response=${token}`, {
        method: 'POST'
    });

    const data = await response.json();
    return data.success;
}