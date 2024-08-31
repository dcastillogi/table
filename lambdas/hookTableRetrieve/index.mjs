import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand
} from "@aws-sdk/lib-dynamodb";
import { verifyTableId, decryptArmoredPrivateKey, decryptMessage, verifyHCaptchaToken } from "./lib/utils.mjs";
import { DBError, InvalidTableIdError, CaptchaError, MissingFieldError, InvalidCredentialsError } from "./lib/errors.mjs";

// Initialize the DynamoDB client
const client = new DynamoDBClient({});

// Initialize the DynamoDB Document client
const dynamo = DynamoDBDocumentClient.from(client);

/**
 * Lambda handler function to return decrypted 'tableId' table data using the user's password.
 *
 * @param {Object} event - The Lambda event object containing the password and tableId.
 * @param {Object} context - The Lambda context object.
 * @returns {Object} - A response object indicating the status of the operation, if success returns table.rows table.columns.
 */
export const handler = async (event, context) => {
    let body;

    try {
        // Check if required fields are provided in the event
        if (!event.password || !event.tableId || !event.hCaptchaToken) {
            throw new MissingFieldError("password, tableId and hCaptchaToken are required");
        }

        if (!(await verifyHCaptchaToken(event.hCaptchaToken))) {
            throw new CaptchaError("Invalid hCaptcha token");
        }

        try {
            // Validate the tableId
            verifyTableId(event.tableId);
        } catch (error) {
            throw new InvalidTableIdError(error.message);
        }

        let document;
        try {
            // Fetch the document from DynamoDB based on the provided tableId
            document = await dynamo.send(
                new GetCommand({
                    TableName: process.env.DYNAMODB_TABLE,
                    Key: {
                        tableId: event.tableId,
                    }
                })
            );
        } catch (error) {
            throw new DBError("Error executing verification query");
        }


        // If no document is found, throw an error
        if (!document.Item) {
            throw new InvalidCredentialsError("Invalid tableId or password");
        }

        let privateKey;
        try {
            // Unarmor the private key using the provided password
            privateKey = (await decryptArmoredPrivateKey(document.Item.keys.privateKey, event.password));
        } catch (error) {
            throw new InvalidCredentialsError("Invalid tableId or password");
        }

        // Start decrypting columns and stream them to the client
        const columns = []
        for (let column of document.Item.columns) {
            columns.push(await decryptMessage(privateKey, column, event.password));
        }

        // Start decrypting rows and stream them to the client, row by row
        const rows = [];
        for (let row of document.Item.rows) {
            const decryptedRow = {};
            for (let column of Object.keys(row)) {
                decryptedRow[await decryptMessage(privateKey, column, event.password)] = await decryptMessage(privateKey, row[column], event.password);
            }
            rows.push(decryptedRow);
        }

        // Return the decrypted table data
        body = {
            status: "success",
            table: {
                columns: columns,
                rowsLength: document.Item.rows.length,
                rows: rows
            }
        }

    } catch (err) {
        // In case of an error, return an error message
        body = {
            status: "error",
            errorName: err.name || "UnknownError",
            errorMessage: err.message || err.msg || "An unknown error occurred",
        };
    }

    return body

}