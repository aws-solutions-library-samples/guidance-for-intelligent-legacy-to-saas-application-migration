#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MigrationMonitor } from "../lib/migration-monitor";
import { Aspects } from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";

const app = new cdk.App();
new MigrationMonitor(app, "MigrationMonitor", {
  description:
    "Guidance for Intelligent Legacy to SaaS Application Migration (SO9640)",
});
Aspects.of(app).add(new AwsSolutionsChecks());
