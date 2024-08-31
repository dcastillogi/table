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
 * event: columns
 * data: ['column1', 'column2', ...]
 * 
 * event: rows
 * data: 2
 * 
 * event: row0
 * data: {column1: 'value1', column2: 'value2', ...}
 *
 * @param {Object} event - The Lambda event object containing the password and tableId.
 * @param {Object} context - The Lambda context object.
 * @returns {String} - A stream of decrypted table data.
 */
export const handler = awslambda.streamifyResponse(async (event, responseStream, _context) => {
    const httpResponseMetadata = {
        statusCode: 200,
        headers: {
            "Content-Type": "text/event-stream"
        }
    };
    responseStream = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata);
    try {
        const body = JSON.parse(event.body);
        const password = body.password;
        const tableId = body.tableId;
        const hCaptchaToken = body.hCaptchaToken;

        // Check if required fields are provided in the event
        if (!password || !tableId || !hCaptchaToken) {
            throw new MissingFieldError("password, tableId and hCaptchaToken are required");
        }

        if (!(await verifyHCaptchaToken(hCaptchaToken))) {
            throw new CaptchaError("Invalid hCaptcha token");
        }

        try {
            // Validate the tableId
            verifyTableId(tableId);
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
        responseStream.write("event: columns\ndata: " + JSON.stringify(columns) + "\n\n");
        responseStream.write("event: rows\ndata: " + document.Item.rows.length + "\n\n");


        // Start decrypting rows and stream them to the client, row by row
        let i = 0;
        for (let row of document.Item.rows) {
            const decryptedRow = {};
            for (let column of Object.keys(row)) {
                decryptedRow[await decryptMessage(privateKey, column, password)] = await decryptMessage(privateKey, row[column], password);
            }
            responseStream.write(`event: row${i}\ndata: ` + JSON.stringify(decryptedRow) + "\n\n");
            i++;
        }

    } catch (err) {
        // In case of an error, return an error message
        responseStream.write(`event: error\ndata: ${err.name || "UnknowError"}: ` + err.message);
    }

    responseStream.end();

});