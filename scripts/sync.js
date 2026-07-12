import { Octokit } from "@octokit/rest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const token = process.env.POW_REPO_TOKEN;
const username = process.env.GITHUB_USERNAME;
const powDir = process.env.POW_DIR;

if (!token || !username || !powDir) {
  console.error("Missing required environment variable(s)");
  process.exit(1);
}

// Octokit is the class that talks to GitHub’s API
const octokit = new Octokit({ auth: token });

function makeKey(repo, number) {
  return `${repo}#${number}`;
}

function loadRepos() {
  const filePath = "config/repos.json";
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

// safe loading of processed.json
function loadState() {
  // join picks the right separator, handles slashes cleanly,
  // and keeps our code working on Windows, Linux, and Mac without changes
  const filePath = join(powDir, "processed.json");

  if (!existsSync(filePath)) {
    return { processed: [], entries: [] };
  }

  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

async function fetchMergedPRs(repo) {
  // GitHub’s API needs owner and repo separately, not one combined string
  const [owner, name] = repo.split("/");
  const results = [];
  let page = 1;

  while (true) {
    const { data: pulls } = await octokit.pulls.list({
      owner,
      repo: name,
      state: "closed", // state: merged - not supported by GitHub API
      sort: "updated", // Sort by last update time
      direction: "desc", // Newest updates first
      per_page: 100,
      page,
    });

    if (pulls.length === 0) break;

    for (const pr of pulls) {
      if (!pr.merged_at) continue; // no merge date means -> not merged
      if (pr.user?.login?.toLowerCase() !== username.toLowerCase()) continue;

      results.push({
        key: makeKey(repo, pr.number),
        repo,
        number: pr.number,
        title: pr.title,
        url: pr.html_url, // Full GitHub PR link
        mergedAt: pr.merged_at, // ISO date string
      });
    }

    // as GitHub returns at most 100 PRs per page
    if (pulls.length < 100) break;
    page++;
  }

  return results;
}

async function main() {
  const repos = loadRepos();
  const state = loadState();

  console.log(`Checking ${repos.length} repos for @${username}...\n`);

  for (const repo of repos) {
    console.log(`-> ${repo}`);

    const merged = await fetchMergedPRs(repo);

    console.log(`  Found ${merged.length} merged PR(s) by you`);

    for (const pr of merged) {
      console.log(`    ${pr.key} - ${pr.title}`);
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
