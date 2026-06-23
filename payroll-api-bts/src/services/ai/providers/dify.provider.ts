import type { IAiAgent } from "../../../model/aiAgent";

type DifyAppMode = "workflow";
type DifyResponseMode = "blocking";

interface RunDifyWorkflowParams {
  agent: IAiAgent | any;
  inputs: Record<string, any>;
  userId: string;
}

interface DifyConfig {
  appMode: DifyAppMode;
  baseUrl: string;
  apiKey: string;
  responseMode: DifyResponseMode;
  outputPath: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function getEnvValue(envName?: string): string | undefined {
  if (!envName) return undefined;
  return process.env[envName];
}

function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  return path.split(".").reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[key];
  }, obj);
}

function removeJsonMarkdownFence(value: string): string {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function tryParseJson(value: any): any {
  if (value === null || value === undefined) return value;

  if (typeof value !== "string") {
    return value;
  }

  const cleaned = removeJsonMarkdownFence(value);

  if (!cleaned) return value;

  try {
    return JSON.parse(cleaned);
  } catch {
    return value;
  }
}

function getDifyConfig(agent: IAiAgent | any): DifyConfig {
  const difyConfig = agent.config?.dify || {};

  const baseUrl =
    difyConfig.baseUrl || process.env.DIFY_BASE_URL || "https://api.dify.ai/v1";

  const apiKey =
    difyConfig.apiKey ||
    getEnvValue(difyConfig.apiKeyEnv) ||
    process.env.DIFY_RECRUITMENT_WORKFLOW_API_KEY ||
    process.env.DIFY_API_KEY;

  if (!apiKey) {
    throw new Error(
      `No se encontró API Key de Dify para el agente ${agent.code}. Define config.dify.apiKeyEnv o DIFY_API_KEY.`,
    );
  }

  return {
    appMode: "workflow",
    baseUrl: normalizeBaseUrl(baseUrl),
    apiKey,
    responseMode: "blocking",
    outputPath: difyConfig.outputPath || "data.outputs.result",
  };
}

async function postToDify({
  url,
  apiKey,
  body,
}: {
  url: string;
  apiKey: string;
  body: Record<string, any>;
}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Dify error ${response.status}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`,
    );
  }

  return data;
}

export async function runDifyWorkflow({
  agent,
  inputs,
  userId,
}: RunDifyWorkflowParams) {
  const dify = getDifyConfig(agent);

  const url = `${dify.baseUrl}/workflows/run`;

  const body = {
    inputs,
    response_mode: dify.responseMode,
    user: userId,
  };

  const rawResponse = await postToDify({
    url,
    apiKey: dify.apiKey,
    body,
  });

  if (rawResponse?.data?.status === "failed") {
    throw new Error(rawResponse?.data?.error || "El workflow de Dify falló.");
  }

  const outputFromPath = getValueByPath(rawResponse, dify.outputPath);

  const output =
    outputFromPath !== undefined
      ? outputFromPath
      : (rawResponse?.data?.outputs?.result ?? rawResponse?.data?.outputs);

console.log(output);

  const parsedOutput = tryParseJson(output);

  return {
    output: parsedOutput,
    rawResponse,
    providerMeta: {
      provider: "dify",
      appMode: dify.appMode,
      taskId: rawResponse?.task_id,
      workflowRunId: rawResponse?.workflow_run_id,
      status: rawResponse?.data?.status,
      elapsedTime: rawResponse?.data?.elapsed_time,
      totalTokens: rawResponse?.data?.total_tokens,
      totalSteps: rawResponse?.data?.total_steps,
    },
  };
}
