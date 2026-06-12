import * as vscode from "vscode";
import { log } from "./logger";
import { client, updateActivity, setVslsApi } from "./activity";

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
    }),
    vscode.debug.onDidChangeActiveDebugSession(() => {
      updateActivity();
    })
  );

  const vslsExtension = vscode.extensions.getExtension("ms-vsls.vsls");
  if (vslsExtension) {
    vslsExtension.activate().then(() => {
      if (vslsExtension.exports && typeof vslsExtension.exports.getApi === "function") {
        vslsExtension.exports.getApi().then((api: any) => {
          if (api) {
            setVslsApi(api);
            api.onDidChangeSession(() => updateActivity());
            updateActivity();
          }
        });
      }
    });
  }

  // Check for idle every minute
  idleCheckInterval = setInterval(() => {
    updateActivity();
  }, 60000);
};

export const deactivate = async () => {
  clearInterval(idleCheckInterval);
  await client.clearActivity();
};
