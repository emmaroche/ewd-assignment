import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

// Resource used to help with some code used here: https://completecoding.io/typescript-translation-api/

const client = new TranslateClient({ region: "eu-west-1" });

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        console.log("Event: ", event);
        const queryParams = event.queryStringParameters;
        const language = queryParams?.language ? queryParams.language : undefined;
        const parameters = event?.pathParameters;
        const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
        const reviewerName = parameters?.reviewerName;

        if (!movieId) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "Missing movie Id" }),
            };
        }

        if (!reviewerName) {
            return {
              statusCode: 404,
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ Message: "Missing reviewer name" }),
            };
          }

        if (!language) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "Missing language value" }),
            };
        }

        const commandOutput = await ddbDocClient.send(
            new ScanCommand({
                TableName: process.env.TABLE_NAME,
                FilterExpression: "movieId = :m and begins_with(reviewerName, :r)",
                ExpressionAttributeValues: {
                    ":m": movieId,
                    ":r": reviewerName,
                },
            })
        );
        
        if (!commandOutput.Items || commandOutput.Items.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "No reviews found for the specified reviewer and movie ID" }),
            };
        }

        // Reference: https://stackoverflow.com/questions/69734293/aws-sdk-js-for-translate-client-results-an-error-cannot-read-property-byteleng
        const params = {
            Text: commandOutput.Items[0].content || "",
            SourceLanguageCode: "en",
            TargetLanguageCode: language,
        };

        const command = new TranslateTextCommand(params);
        const response = await client.send(command);

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                data: response,
            }),
        };
    } catch (error: any) {
        console.log(JSON.stringify(error));
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error }),
        };
    }
};

function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
        wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}