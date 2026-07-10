import { Octokit } from "@octokit/rest";

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

async function main() {
  console.log("mergebot sync started");
  console.log("Username:", username);
  console.log("POW folder:", powDir);
  console.log("Octokit ready:", !!octokit);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
