import fs from "fs";
import path from "path";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

const dir = process.cwd();

async function pushToGitHub() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  console.log("=== PUSHING TO GITHUB ===");
  console.log("Remote: https://github.com/sundhip/OmniPresence.git");
  console.log("Branch: main");

  if (!token) {
    console.log("\nNote: GITHUB_TOKEN environment variable not detected.");
    console.log("To push via token, run with: $env:GITHUB_TOKEN='your_token'; npx tsx scripts/git-push.ts");
    console.log("Attempting push...");
  }

  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: "origin",
      ref: "main",
      onAuth: () => ({
        username: token || "sundhip",
        password: token || "",
      }),
    });

    console.log("Push Result:", pushResult);
    console.log("\n✓ PUSH TO https://github.com/sundhip/OmniPresence SUCCESSFUL!");
  } catch (error: any) {
    console.error("\nPush failed:", error.message || error);
    if (error.data) console.error("Error data:", error.data);
    if (!token) {
      console.log("\nAuthentication required: Please provide a GitHub Personal Access Token (PAT) with 'repo' scope.");
    }
  }
}

pushToGitHub().catch((e) => {
  console.error("Push script exception:", e);
});
