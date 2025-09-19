#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MigrationMonitor } from "../lib/migration-monitor";
import { Aspects } from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";

const app = new cdk.App();
new MigrationMonitor(app, "MigrationMonitor");
Aspects.of(app).add(new AwsSolutionsChecks());
