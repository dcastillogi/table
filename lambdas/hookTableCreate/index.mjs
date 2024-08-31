import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand
} from "@aws-sdk/lib-dynamodb";
import { verifyTableId, generateKeys, verifyHCaptchaToken } from "./lib/utils.mjs";
import { DBError, InvalidTableIdError, CaptchaError, KeyGenerationError, MissingFieldError, TableAlreadyExistsError } from "./lib/errors.mjs";

// Initialize the DynamoDB client
const client = new DynamoDBClient({});

// Initialize the DynamoDB Document client
const dynamo = DynamoDBDocumentClient.from(client);

/**
 * Lambda handler function to create new user's table, assign PGP keys, and insert the info in DynamoDB.
 *
 * @param {Object} event - The Lambda event object containing the password and tableId.
 * @param {Object} context - The Lambda context object.
 * @returns {Object} - A response object indicating the status of the operation.
 */
export const handler = async (event, context) => {
    let body;

    try {
        // Validate that required fields are present
        if (!event.password || !event.tableId || !event.hCaptchaToken) {
            throw new MissingFieldError("password, tableId and hCaptchaToken are required");
        }

        if (!(await verifyHCaptchaToken(hCaptchaToken))) {
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
            // Check if a document with the given tableId already exists in DynamoDB
            document = await dynamo.send(
                new GetCommand({
                    TableName: process.env.DYNAMODB_TABLE,
                    Key: {
                        tableId: event.tableId,
                    },
                    ProjectionExpression: 'tableId', // Only fetch the tableId attribute
                })
            );
        } catch (error) {
            throw new DBError("Error executing verification query");
        }


        // If the document exists, throw an error indicating the tableId is already in use
        if (document.Item) {
            throw new TableAlreadyExistsError("tableId already exists");
        }

        let privateKey, publicKey;
        try {
            // Generate a new pair of PGP keys based on user's password
            ({ privateKey, publicKey } = (await generateKeys(event.password, event.tableId)))
        } catch (error) {
            throw new KeyGenerationError("Error generating PGP keys");
        }

        // ======= NOTE password is NEVER stored in the database =======
        try {
            // Insert the new document into the DynamoDB table
            await dynamo.send(
                new PutCommand({
                    TableName: process.env.DYNAMODB_TABLE,
                    Item: {
                        tableId: event.tableId,
                        keys: {
                            privateKey,     // Store the armored private key in the document
                            publicKey,      // Store the armored public key in the document
                        },
                        columns: [],    // Initialize columns as an empty array
                        rows: [],       // Initialize rows as an empty array
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                })
            );
        } catch (error) {
            throw new DBError("Error executing insert query");
        }


        // If successful, return a success status
        body = {
            status: "success"
        };

    } catch (err) {
        // In case of an error, return the error details
        body = {
            status: "error",
            errorName: err.name || "UnknownError",
            errorMessage: err.message || err.msg || "An unknown error occurred",
        };
    }

    // Return the response body
    return body;
};