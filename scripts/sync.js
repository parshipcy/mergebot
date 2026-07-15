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
  const raw = readFileSync(filePath, "utf8"); // Read file as text string
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
  const results = [];
  let page = 1;

  while (true) {
    // optimized version - switch from pulls.list to the Search API
    const { data } = await octokit.request("GET /search/issues", {
      q: `is:pr author:${username} is:merged repo:${repo}`,
      advanced_search: true, // Use GitHub's newer search engine
      per_page: 100,
      page,
    });

    if (data.items.length === 0) break;

    for (const item of data.items) {
      results.push({
        key: makeKey(repo, item.number),
        repo,
        number: item.number,
        title: item.title,
        url: item.html_url, // Full GitHub PR link
        mergedAt: item.pull_request.merged_at, // ISO date string
      });
    }

    // as GitHub returns at most 100 PRs per page
    if (page * 100 >= data.total_count) break;
    page++;
  }

  return results;
}

async function main() {
  const repos = loadRepos();
  const state = loadState();
  const known = new Set(state.processed);
  let newCount = 0;

  console.log(`Checking ${repos.length} repos for @${username}...\n`);

  for (const repo of repos) {
    console.log(`-> ${repo}`);

    const merged = await fetchMergedPRs(repo);

    console.log(`  Found ${merged.length} merged PR(s) by you`);

    for (const pr of merged) {
      if (known.has(pr.key)) {
        console.log(`    [skip] ${pr.key}`);
        continue;
      }

      console.log(`    [NEW]  ${pr.key} - ${pr.title}`);

      // Add key like "twentyhq/twenty#18345" to the list
      state.processed.push(pr.key);
      // Add full PR object (title, url, etc.) for README later
      state.entries.push(pr);
      // Mark as known so the same PR isn't added twice in one run
      known.add(pr.key);

      newCount++;
    }

    console.log("");
  }

  console.log(`\nSummary: ${newCount} new PR(s) found.`);

  if (newCount === 0) {
    console.log("Nothing to update.");
    return;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
