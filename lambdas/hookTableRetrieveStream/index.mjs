import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand
} from "@aws-sdk/lib-dynamodb";
import { verifyTableId, decryptArmoredPrivateKey, decryptMessage, verifyHCaptchaToken } from "./lib/utils.mjs";
import { DBError, InvalidTableIdError, MissingFieldError, CaptchaError, InvalidCredentialsError } from "./lib/errors.mjs";

// Initialize the DynamoDB client
const client = new DynamoDBClient({});

// Initialize the DynamoDB Document client
const dynamo = DynamoDBDocumentClient.from(client);

/**
 * Lambda handler function to return decrypted 'tableId' table data using the user's password. Sends a stream of data to the client with the format:
 * columns: [column1, column2, ...]
 * rows: number of rows
 * row0: {column1: value1, column2: value2, ...}
 * row1: {column1: value1, column2: value2, ...}
 * ...
 *
 * @param {Object} event - The Lambda event object containing the password and tableId.
 * @param {Object} context - The Lambda context object.
 * @returns {String} - A stream of decrypted table data.
 */
export const handler = awslambda.streamifyResponse(async (event, responseStream, _context) => {
    responseStream.setContentType("text/event-stream");
    // Set the headers to allow cross-origin requests
    responseStream.setHeaders({
        "Access-Control-Allow-Origin": "https://table.dcastillogi.com",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    try {
        const body = JSON.parse(event.body);
        const password = body.password;
        const tableId = body.tableId;
        const hCaptchaToken = body.hCaptchaToken;

        // Check if required fields are provided in the event
        if (!password || !tableId || !hCaptchaToken) {
            throw new MissingFieldError("password, tableId and hCaptchaToken are required");
        }

        try {
            // Validate the hCaptcha token
            await verifyHCaptchaToken(event.hCaptchaToken);
        } catch (error) {
            throw CaptchaError(error.message);
        }

        try {
            // Validate the tableId
            verifyTableId(tableId);
        } catch (error) {
            throw InvalidTableIdError(error.message);
        }

        let document;
        try {
            // Fetch the document from DynamoDB based on the provided tableId
            document = await dynamo.send(
                new GetCommand({
                    TableName: process.env.DYNAMODB_TABLE,
                    Key: {
                        tableId: tableId,
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
            privateKey = (await decryptArmoredPrivateKey(document.Item.keys.privateKey, password));
        } catch (error) {
            throw new InvalidCredentialsError("Invalid tableId or password");
        }

        // Start decrypting columns and stream them to the client
        const columns = []
        for (let column of document.Item.columns) {
            columns.push(await decryptMessage(privateKey, column, password));
        }

        // Stream the columns to the client
        responseStream.write("columns: " + JSON.stringify(columns) + "\nrows: " + document.Item.rows.length);


        // Start decrypting rows and stream them to the client, row by row
        let i = 0;
        for (let row of document.Item.rows) {
            const decryptedRow = {};
            for (let column of Object.keys(row)) {
                decryptedRow[await decryptMessage(privateKey, column, password)] = await decryptMessage(privateKey, row[column], password);
            }
            responseStream.write(`\nrow${i}: ` + JSON.stringify(decryptedRow));
            i++;
        }

    } catch (err) {
        // In case of an error, return an error message
        responseStream.write(`${err.name || "UnknowError"}: ` + err.message);
    }

    responseStream.end();

});