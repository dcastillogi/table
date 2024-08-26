import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    UpdateCommand,
    GetCommand
} from "@aws-sdk/lib-dynamodb";
import { encryptMessage } from "./lib/utils.mjs";
import { EncryptionError, DBError, TableNotFoundError } from "./lib/errors.mjs";

// Initialize the DynamoDB client
const client = new DynamoDBClient({});

// Initialize the DynamoDB Document client
const dynamo = DynamoDBDocumentClient.from(client);

/**
 * Lambda handler function to encrypt data, and update the DynamoDB table. Event comes from ab SQS queue.
 *
 * @param {Object} event - The Lambda event object containing a list of records to be processed.
 * @param {Object} context - The Lambda context object.
 * @returns {Object} - A response object indicating the status of the operation and any failed records.
 */
export const handler = async (event, context) => {
    let body;

    try {
        body = {
            status: "success",
            failed: [] // Array to hold records that fail to process
        };

        // Iterate through each record in the event
        for (let record of event.Records) {
            try {
                // Parse the body of the record to JSON
                const jsonBody = JSON.parse(record.body);

                let document;
                try {
                    // Fetch the existing document from DynamoDB using the provided tableId
                    document = await dynamo.send(
                        new GetCommand({
                            TableName: process.env.DYNAMODB_TABLE,
                            Key: {
                                tableId: jsonBody.tableId,
                            },
                            ProjectionExpression: 'tableId, #c, #k',
                            ExpressionAttributeNames: { '#c': 'columns', "#k": "keys" } // 'columns' is a reserved word in DynamoDB
                        })
                    );
                } catch (error) {
                    throw new DBError("Error querying the table");
                }

                // If the document does not exist, skip this record
                if (!document.Item) {
                    throw new TableNotFoundError("tableId not found");
                }

                // Prepare a row object to hold the encrypted column names and values
                const row = {};

                try {
                    // Encrypt each column name and value in the JSON body
                    for (let row_column of Object.keys(jsonBody.body)) {
                        row[await encryptMessage(document.Item.keys.publicKey, row_column)] = await encryptMessage(document.Item.keys.publicKey, jsonBody.body[row_column]);
                    }
                } catch (error) {
                    throw new EncryptionError("Error encrypting the data");
                }

                // Determine which columns are new and need to be added to the document
                let newColumns = Object.keys(row).filter(column => !document.Item.columns.includes(column));

                try {
                    // Update the document in DynamoDB by appending the new row and columns
                    await dynamo.send(
                        new UpdateCommand({
                            TableName: process.env.DYNAMODB_TABLE,
                            Key: {
                                tableId: jsonBody.tableId,
                            },
                            UpdateExpression: `SET #r = list_append(#r, :r), #c = list_append(#c, :c)`,
                            ExpressionAttributeNames: {
                                '#r': 'rows',
                                '#c': 'columns'
                            },
                            ExpressionAttributeValues: {
                                ":r": [row],
                                ":c": newColumns
                            }
                        })
                    );
                } catch (error) {
                    throw new DBError("Error updating the document");
                }

            } catch (error) {
                // If an error occurs while processing a record, add it to the list of failed records
                body.failed.push({
                    errorName: error.name || "UnknownError",
                    errorMessage: error.message || error.msg || "An unknown error occurred",
                    record: record
                });
            }
        }
    } catch (err) {
        // In case of an error, return an error message
        throw new Error(err.message || "An unknown error occurred");
    }

    // Return the response body indicating success and any failed records
    return body;
};