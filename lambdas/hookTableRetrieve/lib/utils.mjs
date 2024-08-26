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
 * @param {string} privateKeyArmored - The armored private key to unarmor.
 * @param {string} password - The password to unarmor the private key.
 * @returns {Promise<string>} - The privateKey.
 */
export async function decryptArmoredPrivateKey(privateKeyArmored, password) {
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase: password
    });

    return privateKey;
}

/**
 * Decrypts a message using a private key.
 * @param {string} privateKeyUnarmored - The unarmored private key to decrypt the message.
 * @param {string} encryptedMessage - The encrypted message to decrypt.
 * @param {string} password - The password to decrypt the message.
 * @returns {Promise<string>} - The decrypted message.
 */
export async function decryptMessage(privateKeyUnarmored, encryptedMessage, password) {
    const message = await openpgp.readMessage({
        armoredMessage: encryptedMessage
    });

    const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKeyUnarmored
    });

    return decrypted;
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