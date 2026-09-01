import fs from "fs";
import path from "path";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

const dir = process.cwd();

async function initAndCommit() {
  console.log("=== OMNIPRESENCE GIT SYNC ===");
  console.log(`Working Directory: ${dir}`);

  // 1. Init git if not exists
  const gitDir = path.join(dir, ".git");
  if (!fs.existsSync(gitDir)) {
    console.log("Initializing Git repository...");
    await git.init({ fs, dir, defaultBranch: "main" });
    console.log("✓ Initialized git repository with default branch 'main'");
  } else {
    console.log("✓ Git repository already initialized");
  }

  // 2. Set remote origin
  const remoteUrl = "https://github.com/sundhip/OmniPresence.git";
  const remotes = await git.listRemotes({ fs, dir });
  const origin = remotes.find((r) => r.remote === "origin");
  if (!origin) {
    console.log(`Setting remote origin: ${remoteUrl}`);
    await git.addRemote({ fs, dir, remote: "origin", url: remoteUrl });
  } else {
    console.log(`Remote origin already configured: ${origin.url}`);
    if (origin.url !== remoteUrl) {
      await git.deleteRemote({ fs, dir, remote: "origin" });
      await git.addRemote({ fs, dir, remote: "origin", url: remoteUrl });
      console.log(`Updated remote origin to: ${remoteUrl}`);
    }
  }

  // 3. Stage all files respecting .gitignore
  console.log("Staging project files...");
  const statusMatrix = await git.statusMatrix({
    fs,
    dir,
    filter: (f) =>
      !f.startsWith("node_modules") &&
      !f.startsWith(".next") &&
      !f.startsWith(".git") &&
      !f.includes("venv") &&
      !f.includes("__pycache__"),
  });

  let stagedCount = 0;
  for (const [filepath, headStatus, workdirStatus, stageStatus] of statusMatrix) {
    // If deleted in workdir
    if (workdirStatus === 0) {
      await git.remove({ fs, dir, filepath });
      stagedCount++;
    }
    // If modified or untracked
    else if (headStatus !== workdirStatus || workdirStatus !== stageStatus) {
      await git.add({ fs, dir, filepath });
      stagedCount++;
    }
  }
  console.log(`✓ Staged ${stagedCount} files/changes.`);

  // 4. Commit
  const author = {
    name: "sundhip",
    email: "sundhip@users.noreply.github.com",
  };

  try {
    const commitSha = await git.commit({
      fs,
      dir,
      author,
      message: "feat: OmniPresence - Full Platform with 4-Layer OP AI Assistant, FashionCLIP Vision, Marketplace Live Providers, Calendar & Transit, Multi-Category Finance, and Direct Grooming QA",
    });
    console.log(`✓ Committed all changes: ${commitSha}`);
  } catch (err: any) {
    if (err.message?.includes("no changes to commit")) {
      console.log("No new changes to commit.");
    } else {
      console.log(`Commit note: ${err.message}`);
    }
  }

  // 5. Check branches
  const branches = await git.listBranches({ fs, dir });
  console.log(`Current branches: ${branches.join(", ")}`);

  // Ensure current branch is main
  const currentBranch = await git.currentBranch({ fs, dir });
  console.log(`Active branch: ${currentBranch}`);

  console.log("\n=================================================");
  console.log("✓ LOCAL GIT REPOSITORY IS READY AND STAGED!");
  console.log(`Repository: https://github.com/sundhip/OmniPresence`);
  console.log("=================================================");
}

initAndCommit().catch((e) => {
  console.error("Git sync error:", e);
  process.exit(1);
});
