import * as vscode from 'vscode';

export interface ExtensionConfig {
  showFileName: boolean;
  showLineNumbers: boolean;
  showTotalLines: boolean;
  showWorkspace: boolean;
  showGitBranch: boolean;
  showDiagnostics: boolean;
  idleTimeout: number;
  timeTracking: "session" | "file" | "none";
  buttonEnabled: boolean;
  buttonLabel: string;
  buttonUrl: string;
  showDebugging: boolean;
  showLiveShare: boolean;
}

export const getConfig = (): ExtensionConfig => {
  const config = vscode.workspace.getConfiguration('discord-activity-sync');
  return {
    showFileName: config.get<boolean>('showFileName', true),
    showLineNumbers: config.get<boolean>('showLineNumbers', true),
    showTotalLines: config.get<boolean>('showTotalLines', true),
    showWorkspace: config.get<boolean>('showWorkspace', true),
    showGitBranch: config.get<boolean>('showGitBranch', true),
    showDiagnostics: config.get<boolean>('showDiagnostics', true),
    idleTimeout: config.get<number>('idleTimeout', 5),
    timeTracking: config.get<"session" | "file" | "none">('timeTracking', "session"),
    buttonEnabled: config.get<boolean>('buttonEnabled', false),
    buttonLabel: config.get<string>('buttonLabel', "View Repository"),
    buttonUrl: config.get<string>('buttonUrl', "{git-origin}"),
    showDebugging: config.get<boolean>('showDebugging', true),
    showLiveShare: config.get<boolean>('showLiveShare', true),
  };
};
