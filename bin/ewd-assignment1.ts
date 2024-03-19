#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { RestAPIStack } from "../lib/app-api";

import { AuthAppStack } from "../lib/auth-app-stack";

const app = new cdk.App();

new AuthAppStack(app, "AuthAPIStack", {
    /* Add AuthAppStack specific configuration here */
  });

new RestAPIStack(app, "RestAPIStack", { env: { region: "eu-west-1" } });
