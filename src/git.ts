import * as vscode from 'vscode';

export const getGitBranch = (): string | undefined => {
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (!gitExtension) {
    return undefined;
  }
  
  const api = gitExtension.exports?.getAPI(1);
  if (!api || !api.repositories || api.repositories.length === 0) {
    return undefined;
  }

  // Get the first repository or try to find the one matching the active editor
  let repo = api.repositories[0];
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const activeRepo = api.repositories.find((r: any) => 
      activeEditor.document.uri.fsPath.startsWith(r.rootUri.fsPath)
    );
    if (activeRepo) {
      repo = activeRepo;
    }
  }

  return repo.state?.HEAD?.name;
};

export const getGitOrigin = (): string | undefined => {
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (!gitExtension) {
    return undefined;
  }
  
  const api = gitExtension.exports?.getAPI(1);
  if (!api || !api.repositories || api.repositories.length === 0) {
    return undefined;
  }

  let repo = api.repositories[0];
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const activeRepo = api.repositories.find((r: any) => 
      activeEditor.document.uri.fsPath.startsWith(r.rootUri.fsPath)
    );
    if (activeRepo) {
      repo = activeRepo;
    }
  }

  const remotes = repo.state?.remotes;
  if (!remotes || remotes.length === 0) {
    return undefined;
  }

  const origin = remotes.find((r: any) => r.name === 'origin') || remotes[0];
  let url = origin.fetchUrl || origin.pushUrl;
  
  if (!url) { return undefined; }

  // Convert SSH to HTTPS
  if (url.startsWith('git@')) {
    url = url.replace(':', '/').replace('git@', 'https://');
  }
  // Remove .git suffix
  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }

  return url;
};
