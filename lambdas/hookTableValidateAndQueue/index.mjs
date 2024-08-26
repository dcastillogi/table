import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { verifyTableId } from "./lib/utils.mjs";
import { MissingFieldError, DBError, InvalidTableIdError, TableNotFoundError, DuplicateEntryError } from "./lib/errors.mjs";

// Initialize AWS SDK clients
const sqsClient = new SQSClient({});
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

/**
 * Lambda handler function to validate data before insertion into the user’s database. If the data is valid, enqueue it in SQS for encryption and insertion.
 *
 * @param {Object} event - The input event to the Lambda function.
 * @param {Object} context - The Lambda execution context.
 * @returns {Object} - A response object indicating the status of the operation.
 */

export const handler = async (event, context) => {
    let statusCode = 200;
    let body;
    let headers = {
        "Content-Type": "application/json",
    };

    try {
        // Parse the incoming JSON body
        let jsonBody;
        try {
            jsonBody = JSON.parse(event.body);
        } catch (error) {
            throw new Error("Invalid JSON body");
        }

        // Extract query parameters and path parameters
        const params = event.queryStringParameters;
        const pathParam = event.pathParameters;

        // Validate the presence of tableId in path parameters
        if (!pathParam || !pathParam.tableId) {
            throw new MissingFieldError("tableId is required");
        }


        try {
            // Validate the tableId
            verifyTableId(pathParam.tableId);
        } catch (error) {
            throw new InvalidTableIdError(error.message);
        }

        let document;
        try {
            // Fetch the existing document from DynamoDB using tableId
            document = await dynamo.send(
                new GetCommand({
                    TableName: process.env.DYNAMODB_TABLE,
                    Key: {
                        tableId: pathParam.tableId,
                    },
                    ProjectionExpression: 'tableId',
                })
            );
        } catch (error) {
            throw new DBError("Error executing verification query");
        }


        // Validate that the document exists
        if (!document.Item) {
            throw new TableNotFoundError("tableId not found");
        }

        // Prepare the row object with the initial tableId
        const row = {};

        let flag = false;

        // Process query parameters and ensure no duplicates
        if (params) {
            for (let param of Object.keys(params)) {
                if (row[param]) {
                    throw new DuplicateEntryError(`Column ${param} duplicated`);
                }
                flag = true;
                row[param] = params[param];
            }
        }

        // Process body parameters and ensure no duplicates
        if (jsonBody) {
            for (let param of Object.keys(jsonBody)) {
                if (row[param]) {
                    throw new DuplicateEntryError(`Column ${param} duplicated`);
                }
                flag = true;
                row[param] = jsonBody[param];
            }
        }

        const bodyParsed = {
            tableId: pathParam.tableId,
            body: row,
        }

        // If no data was found in either params or body, throw an error
        if (!flag) {
            throw new MissingFieldError("No data found");
        }

        // Construct success response body
        body = {
            status: "success",
        };

        // Prepare SQS message parameters
        const sqsParams = {
            QueueUrl: process.env.SQS_URL,
            MessageBody: JSON.stringify(bodyParsed),
        };

        // Send the message to the SQS queue
        await sqsClient.send(new SendMessageCommand(sqsParams));

    } catch (err) {
        // In case of an error, return an error message
        statusCode = err.statusCode || 500;
        body = {
            status: "error",
            errorName: err.name || "UnknownError",
            errorMessage: err.message || err.msg || "An unknown error occurred",
        };
    } finally {
        body = JSON.stringify(body);
    }

    // Return the HTTP response object
    return {
        statusCode,
        body,
        headers,
    }
};