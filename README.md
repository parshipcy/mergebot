## Mergebot

A small GitHub Action that watches your open-source repos for merged PRs and opens update PRs on [merge-log](https://github.com/parshipcy/merge-log).

![Architecture](./assets/Untitled-2026-07-12-2319.png)

### How to use it

You need **two repos**:

| Repo | Purpose |
|------|---------|
| **mergebot** (this one) | Bot code + GitHub Action |
| **merge-log** (yours) | Public README + `processed.json` |

**Setup**

1. Fork or clone this repo, and create a second repo for your portfolio (e.g. `your-username/merge-log`).
2. Create a [fine-grained PAT](https://github.com/settings/tokens) with **Contents** and **Pull requests** access to both repos.
3. Add the PAT as `POW_REPO_TOKEN` in **mergebot → Settings → Secrets → Actions**.
4. Edit `config/repos.json` with the repos you want to watch.
5. In `.github/workflows/sync.yml`, replace `parshipcy/merge-log` and `GITHUB_USERNAME` with yours.
6. Seed your merge-log repo on `main` with `processed.json` (`{ "processed": [], "entries": [] }`) and a `README.md` that includes `<!-- mergebot:start -->` and `<!-- mergebot:end -->`.
7. Push mergebot to GitHub, then run the workflow from **Actions -> Run workflow**.

The action syncs merged PRs and opens a PR on your merge-log repo. Review and merge it to update your portfolio.

**Local test**

```bash
npm install
git clone https://github.com/YOUR_USERNAME/merge-log.git pow
# create .env with POW_REPO_TOKEN, GITHUB_USERNAME, POW_DIR=pow
npm run sync:local
```

### Contributing

1. Fork the repo and create a branch.
2. Edit `config/repos.json` or `scripts/sync.js` as needed.
3. Test locally with `npm run sync:local` (requires a `.env` with `POW_REPO_TOKEN`, `GITHUB_USERNAME`, and `POW_DIR`).
4. Open a pull request with a short description of what changed.

Bug reports and ideas are welcome in [Issues](https://github.com/parshipcy/mergebot/issues).

---

Made with ❤️ by Parship
