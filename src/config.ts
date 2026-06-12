import * as vscode from 'vscode';

export interface ExtensionConfig {
  showFileName: boolean;
  showLineNumbers: boolean;
  showTotalLines: boolean;
  showWorkspace: boolean;
  showGitBranch: boolean;
  showDiagnostics: boolean;
  idleTimeout: number;
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
  };
};
