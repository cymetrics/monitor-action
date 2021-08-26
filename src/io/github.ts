import * as core from "@actions/core";
import * as github from "@actions/github";
import { safeDump } from "js-yaml";
import { MetricsContext, Release, ReleaseYear } from "../types";
import { fromBase64, toBase64 } from "./encoding";

// Read file from repository
export async function getContent(
  context: MetricsContext,
  path: string
): Promise<{ serializedData: string | null; existingSha: string | null }> {
  const { token, owner, repo, branch } = context;
  // Dev
  if (process.env.NODE_ENV==="development") {
    return {
      serializedData: null,
      existingSha: '18b922e39df00044498bd0105c3feb0a54d2d0df',
    }
  }

  try {
    const octokit = github.getOctokit(token);
    const res = await octokit.repos.getContent({
      owner,
      repo,
      ref: branch,
      branch,
      path,
    });
    if (res?.status == 200) {
      return {
        serializedData: fromBase64(res.data.content),
        existingSha: res.data.sha,
      };
    } else {
      core.warning(`Unexpected response code ${res?.status} for ${path}`);
    }
  } catch (err) {
    core.error(
      `Reading from ${path} on ${context.branch} failed: ${err.message}`
    );
  }
  return { existingSha: null, serializedData: null };
}

export async function createOrUpdateContent(
  context: MetricsContext,
  path: string,
  content: string,
  existingSha: string | null
) {
  const { token, owner, repo, branch } = context;
  if (process.env.NODE_ENV !== 'development') {
    const octokit = github.getOctokit(token || process.env.GITHUB_TOKEN);
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      branch,
      path,
      content: toBase64(content),
      sha: existingSha || undefined,
      message: existingSha ? "Updated metrics" : "Created metrics",
    });
  }
  console.log(`not create ${path} in local mode`);
}

export function getContext() {
  if (process.env.NODE_ENV === 'development') {
    const context: MetricsContext = {
      releaseId: '',
      token: process.env.GITHUB_TOKEN,
      owner: "cymetrics",
      repo: "monitor-action",
      branch: "gh-pages",
    };
    return context;
  }
  const token = core.getInput("token");
  const { owner, repo } = github.context.repo;
  const { sha: releaseId } = github.context;
  const context: MetricsContext = {
    releaseId,
    token,
    owner,
    repo,
    branch: "gh-pages",
  };
  return context;
}

export async function createOrUpdateRelease(context: MetricsContext) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const path = `data/releases/${year}/releases.json`;
  const { existingSha, serializedData } = await getContent(context, path);
  let releaseYear: ReleaseYear;
  if (!serializedData) {
    core.info(`Creating year ${year} for new release`);
    releaseYear = { releases: [], year };
  } else {
    releaseYear = JSON.parse(serializedData);
    core.info(
      `Extending year ${year} with ${releaseYear.releases.length} existing releases`
    );
  }

  let usedRelease: Release | undefined = releaseYear.releases.find(
    (n) => n.id === context.releaseId
  );
  if (!usedRelease) {
    usedRelease = {
      id: context.releaseId,
      timestamp: now.getTime(),
    };
    releaseYear.releases.push(usedRelease);

    await createOrUpdateContent(
      context,
      path,
      JSON.stringify(releaseYear),
      existingSha
    );

    core.info(`Saved release ${usedRelease.id}`);
  } else {
    core.info(`Using existing release ${usedRelease.id}`);
  }

  return { releaseYear, releaseId: usedRelease.id };
}
