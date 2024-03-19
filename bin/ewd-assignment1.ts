#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AssignmentAppStack } from "../lib/assignment-app-stack";

const app = new cdk.App();

new AssignmentAppStack(app, "AssignmentAppStack", {

});
