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
// client that sends authenticated requests to GitHub
const octokit = new Octokit({ auth: token });

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

async function main() {
  const repos = loadRepos();
  const state = loadState();

  //for testing
  console.log("Repos to monitor:", repos.length);
  console.log("Already processed PRs:", state.processed.length);
  console.log("Stored entries:", state.entries.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
