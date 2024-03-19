import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Role } from "aws-cdk-lib/aws-iam";

type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
  tableName: Table;
};

export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

    const appApi = new apig.RestApi(this, "AppApi", {
      description: "Assignment 1 RestApi App",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };

    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: "./lambdas/auth/authorizer.ts",
    });

    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );

    // Functions
    const addMovieReviewFn = new lambdanode.NodejsFunction(this, "AddMovieReviewFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/addMovieReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.tableName.tableName,
        REGION: "eu-west-1",
      },
    });

    const getMovieReviewsFn = new lambdanode.NodejsFunction(this, "GetMovieReviewsFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/getMovieReviews.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.tableName.tableName,
        REGION: "eu-west-1",
      },
    });

    const getMovieReviewByReviewerNameAndYearFn = new lambdanode.NodejsFunction(this, "GetMovieReviewByReviewerNameAndYearFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/getAllReviewsForReviewerNameAndYear.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.tableName.tableName,
        REGION: "eu-west-1",
      },
    });

    const getAllMovieReviewsForReviewerNameFn = new lambdanode.NodejsFunction(this, "GetAllMovieReviewsForReviewerNameFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/getAllReviewsForReviewerName.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.tableName.tableName,
        REGION: "eu-west-1",
      },
    });

    const updateMovieReviewFn = new lambdanode.NodejsFunction(this, "UpdateMovieReviewFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/updateMovieReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.tableName.tableName,
        REGION: "eu-west-1",
      },
    });

    const translateRole = cdk.aws_iam.Role.fromRoleArn(
      this,
      "translate",
      "arn:aws:iam::533267074955:role/translate",
      {
        mutable: true,
      }
    );

    const getTranslatedMovieReviewFn = new lambdanode.NodejsFunction(
      this,
      "GetTranslatedMovieReviewFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getTranslatedMovieReview.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName.tableName,
          REGION: "eu-west-1",
        },
        role: translateRole,
      }
    );

    // Permissions 
    props.tableName.grantReadData(getMovieReviewsFn);
    props.tableName.grantReadWriteData(addMovieReviewFn);
    props.tableName.grantReadData(getMovieReviewByReviewerNameAndYearFn);
    props.tableName.grantReadData(getAllMovieReviewsForReviewerNameFn);
    props.tableName.grantReadWriteData(updateMovieReviewFn);
    props.tableName.grantReadData(getTranslatedMovieReviewFn);

    // Endpoints
    const moviesEndpoint2 = appApi.root.addResource("reviews");
    const movieReviewsByReviewerNameEndpoint = moviesEndpoint2.addResource("{reviewerName}");

    // GET /reviews/{reviewerName} endpoint
    movieReviewsByReviewerNameEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllMovieReviewsForReviewerNameFn, { proxy: true })
    );

    const reviewsNameMovieEndpoint = movieReviewsByReviewerNameEndpoint.addResource("{movieId}");
    const reviewsNameMovieTranslateEndpoint = reviewsNameMovieEndpoint.addResource("translation");

    // GET reviews/John/1234/translation?language=code endpoint
    reviewsNameMovieTranslateEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getTranslatedMovieReviewFn, { proxy: true })
    );

    const moviesEndpoint = appApi.root.addResource("movies");
    const movieReviewsEndpointAdd = moviesEndpoint.addResource("reviews");

    // POST /movies/reviews endpoint
    movieReviewsEndpointAdd.addMethod(
      "POST",
      new apig.LambdaIntegration(addMovieReviewFn, { proxy: true }),
      {
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      }
    );

    // GET reviewerName & year endpoints
    movieReviewsEndpointAdd.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieReviewByReviewerNameAndYearFn, { proxy: true })
    );

    const movieEndpoint = moviesEndpoint.addResource("{movieId}");
    const movieReviewsEndpoint = movieEndpoint.addResource("reviews");

    // GET /movies/{movieId}/reviews & GET /movies/{movieId}/reviews?minRating=n endpoints
    movieReviewsEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true })
    );

    const movieReviewUpdateEndpoint = movieReviewsEndpoint.addResource("{reviewerName}");
    
    // PUT /movies/{movieId}/reviews/{reviewerName}
    movieReviewUpdateEndpoint.addMethod(
      "PUT",
      new apig.LambdaIntegration(updateMovieReviewFn, { proxy: true }),
      {
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      }
    );

  }
}
