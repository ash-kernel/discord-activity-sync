import * as vscode from "vscode";
import { log } from "./logger";
import { client, updateActivity } from "./activity";

let idleCheckInterval: NodeJS.Timeout;

export const activate = (context: vscode.ExtensionContext) => {
  log.info("Discord Rich Presence is now active!");

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('discord-activity-sync')) {
        updateActivity();
      }
    }),
    vscode.languages.onDidChangeDiagnostics(() => {
      updateActivity();
    })
  );

  // Check for idle every minute
  idleCheckInterval = setInterval(() => {
    updateActivity();
  }, 60000);
};

export const deactivate = async () => {
  clearInterval(idleCheckInterval);
  await client.clearActivity();
};
