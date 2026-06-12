import * as vscode from "vscode";
import { ActivityType, Client } from "./rpc/client";
import { getAsset } from "./assets";
import { log } from "./logger";
import { getConfig } from "./config";
import { getGitBranch, getGitOrigin } from "./git";

const sessionStartTime = Date.now();
let lastFilePath = "";
let vslsApi: any = null;

export const setVslsApi = (api: any) => {
  vslsApi = api;
};


interface Activity {
  state?: string;
  details?: string;
  timestamps?: {
    start?: number | Date;
    end?: number | Date;
  };
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  buttons?: { label: string; url: string; }[];
  type?: ActivityType.Playing | ActivityType.Listening | ActivityType.Watching | ActivityType.Competing;
}

const throttleTime = 10000; // 10 seconds
let lastActivityChangeTime = 0;
let setActivityTimer: NodeJS.Timeout;
const throttledSetActivity = () => {
  const now = Date.now();
  if (now - lastActivityChangeTime < throttleTime) {
    clearTimeout(setActivityTimer);
    setActivityTimer = setTimeout(throttledSetActivity, throttleTime + 250 - (now - lastActivityChangeTime));
    return;
  }
  lastActivityChangeTime = now;
  client.setActivity(activityData);
};

export let lastUserActivityTime = Date.now();
export const updateLastUserActivity = () => {
  lastUserActivityTime = Date.now();
};

const getStateString = (config: any): string | undefined => {
  const parts: string[] = [];
  
  if (config.showWorkspace && vscode.workspace.name) {
    parts.push(vscode.workspace.name);
  }
  
  if (config.showGitBranch) {
    const branch = getGitBranch();
    if (branch) {
      parts.push(`[${branch}]`);
    }
  }

  if (config.showDiagnostics) {
    let errors = 0;
    let warnings = 0;
    vscode.languages.getDiagnostics().forEach(([uri, diagnostics]) => {
      diagnostics.forEach(diag => {
        if (diag.severity === vscode.DiagnosticSeverity.Error) {errors++;}
        if (diag.severity === vscode.DiagnosticSeverity.Warning) {warnings++;}
      });
    });
    if (errors > 0 || warnings > 0) {
      const diagStr = `${errors} ❌ ${warnings} ⚠️`;
      if (parts.length > 0) {
        parts.push(`| ${diagStr}`);
      } else {
        parts.push(diagStr);
      }
    }
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
};

const setIdle = () => {
  Object.assign(activityData, {
    state: undefined,
    details: "Idle",
    assets: {
      large_image: getAsset({ name: "vscode" }),
    },
  });
  throttledSetActivity();
};

const setFile = (t: vscode.TextEditor, config: any) => {
  const filePath = t.document.fileName.replaceAll("\\", "/") || "Untitled";
  const fileName = t.document.fileName.split("/").pop()?.split("\\").pop() || "Untitled";
  const line = t.selection.start.line + 1;
  const col = t.selection.start.character + 1;
  const totalLines = t.document.lineCount;

  if (config.timeTracking === "file" && filePath !== lastFilePath) {
    activityData.timestamps = { start: Date.now() };
    lastFilePath = filePath;
  }

  let details = "";
  if (config.showFileName) {
    details += `Editing ${fileName}`;
  } else {
    details += `Editing a file`;
  }

  if (config.showLineNumbers) {
    if (config.showTotalLines) {
      details += `:${line}/${totalLines}`;
    } else {
      details += `:${line}:${col}`;
    }
  }

  Object.assign(activityData, {
    state: getStateString(config),
    details: details,
    assets: {
      large_image: getAsset({ fileName, filePath }),
      small_image: getAsset({ name: "vscode" }),
      small_text: "VS Code"
    },
  });
  throttledSetActivity();
};

const setDebugging = (config: any) => {
  Object.assign(activityData, {
    state: getStateString(config),
    details: "Debugging...",
    assets: {
      large_image: getAsset({ name: "vscode" }),
      small_image: getAsset({ name: "vscode" }),
      small_text: "VS Code"
    },
  });
  throttledSetActivity();
};

const setPairProgramming = (config: any) => {
  Object.assign(activityData, {
    state: getStateString(config),
    details: "Pair Programming",
    assets: {
      large_image: getAsset({ name: "vscode" }),
      small_image: getAsset({ name: "vscode" }),
      small_text: "VS Code"
    },
  });
  throttledSetActivity();
};

const setNotebook = (n: vscode.NotebookEditor, config: any) => {
  const cell = n.selection.start + 1;
  const totalCells = n.notebook.cellCount;

  Object.assign(activityData, {
    state: getStateString(config),
    details: `Cell ${cell} of ${totalCells}`,
    assets: {
      large_image: getAsset({ name: "python" }),
      small_image: getAsset({ name: "vscode" }),
      small_text: "VS Code"
    },
  });
  throttledSetActivity();
};

export const client = new Client({
  clientId: "1514956118391001208",
});
const activityData: Activity = {
  timestamps: {
    start: Date.now(),
  },
  type: ActivityType.Playing,
};

export const updateActivity = () => {
  const config = getConfig();

  if (config.timeTracking === "none") {
    delete activityData.timestamps;
  } else if (config.timeTracking === "session") {
    activityData.timestamps = { start: sessionStartTime };
  }

  if (config.buttonEnabled) {
    let url = config.buttonUrl;
    if (url === "{git-origin}") {
      url = getGitOrigin() || "";
    }
    if (url && url.length > 0) {
      activityData.buttons = [
        {
          label: config.buttonLabel,
          url: url,
        }
      ];
    } else {
      delete activityData.buttons;
    }
  } else {
    delete activityData.buttons;
  }

  if (config.idleTimeout > 0) {
    if (Date.now() - lastUserActivityTime > config.idleTimeout * 60000) {
      return setIdle();
    }
  }

  if (config.showLiveShare && vslsApi && vslsApi.session && vslsApi.session.role !== 0) {
    return setPairProgramming(config);
  }

  if (config.showDebugging && vscode.debug.activeDebugSession) {
    return setDebugging(config);
  }

  const t = vscode.window.activeTextEditor;
  if (t && t.document && t.selection && t.document.uri.scheme !== "vscode-notebook-cell") {
    return setFile(t, config);
  }
  const n = vscode.window.activeNotebookEditor;
  if (n && n.notebook && n.selection) {
    return setNotebook(n, config);
  }
  return setIdle();
};

export const handleUserActivity = () => {
  updateLastUserActivity();
  updateActivity();
};

let reconnectInterval: NodeJS.Timeout;
const reconnectFreq = 10000;
const reconnect = async () => {
  log.info("Reconnecting...");
  try {
    await client.login();
  } catch {}
};
client.on("ready", () => {
  try {
    clearInterval(reconnectInterval);
  } catch {}
  log.info("Connected");
  updateActivity();
});
client.on("close", () => {
  reconnectInterval = setInterval(reconnect, reconnectFreq);
});
(async () => {
  try {
    await client.login();
  } catch {
    reconnectInterval = setInterval(reconnect, reconnectFreq);
  }
})();

vscode.window.onDidChangeActiveTextEditor(handleUserActivity);
vscode.window.onDidChangeTextEditorSelection(handleUserActivity);

vscode.window.onDidChangeActiveNotebookEditor(handleUserActivity);
vscode.window.onDidChangeNotebookEditorSelection(handleUserActivity);
