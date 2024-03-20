import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { MovieReviews } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieReviewsQueryParams"] || {}
);

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const queryParams = event.queryStringParameters;
    if (!queryParams) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing query parameters" }),
      };
    }
    if (!isValidQueryParams(queryParams)) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect type. Must match Query parameters schema`,
          schema: schema.definitions["MovieReviewsQueryParams"],
        }),
      };
    }

    const movieId = parseInt(queryParams.movieId);
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };

    const yearRegex = /^\d{4}$/;  // Reference for code: https://stackoverflow.com/questions/4374185/regular-expression-match-to-test-for-a-valid-year

    if ("reviewDate" in queryParams) {

      const reviewDate = queryParams.reviewDate;

      // Validating the reviewYear 
      if (!yearRegex.test(reviewDate)) {
        return {
          statusCode: 400,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ message: "Invalid year format in reviewDate" }),
        };
      }

      commandInput = {
        ...commandInput,
        IndexName: "reviewDateIx",
        KeyConditionExpression: "movieId = :m and begins_with(reviewDate, :y)",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":y": reviewDate,
        },
      };
    } else if ("reviewerName" in queryParams) {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m and reviewerName = :r ",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":r": queryParams.reviewerName,
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m",
        ExpressionAttributeValues: {
          ":m": movieId,
        },
      };
    }

    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
    );

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: commandOutput.Items,
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

function createDocumentClient() {
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