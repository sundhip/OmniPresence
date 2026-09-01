import fs from "fs";
import path from "path";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

const dir = process.cwd();

async function pushToGitHub() {
  const argToken = process.argv[2];
  const token = argToken || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  console.log("=========================================");
  console.log("      OMNIPRESENCE GITHUB PUSH           ");
  console.log("=========================================");
  console.log(`Target Repository : https://github.com/sundhip/OmniPresence.git`);
  console.log(`Branch            : main`);
  console.log(`Directory         : ${dir}`);

  if (!token) {
    console.error("\n❌ ERROR: No GitHub authentication token provided.");
    console.log("\nGitHub requires an authentication token to push files to https://github.com/sundhip/OmniPresence.");
    console.log("\nUsage:");
    console.log("  npx tsx scripts/git-push.ts <YOUR_GITHUB_TOKEN>");
    console.log("  OR");
    console.log("  $env:GITHUB_TOKEN=\"<YOUR_GITHUB_TOKEN>\"; npx tsx scripts/git-push.ts");
    process.exit(1);
  }

  console.log(`\n🔑 Authentication token detected (${token.substring(0, 4)}...${token.substring(token.length - 4)})`);
  console.log("🚀 Initiating push to GitHub...");

  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: "origin",
      ref: "main",
      remoteRef: "refs/heads/main",
      force: true,
      onAuth: () => ({
        username: token,
        password: "",
      }),
      onProgress: (progress) => {
        if (progress.total) {
          console.log(`Uploading: ${progress.phase} (${progress.loaded}/${progress.total})`);
        } else {
          console.log(`Progress: ${progress.phase}...`);
        }
      },
    });

    console.log("\n=========================================");
    console.log("✅ PUSH SUCCESSFUL!");
    console.log("=========================================");
    console.log("All 98 project files are now live on GitHub:");
    console.log("👉 https://github.com/sundhip/OmniPresence");
    console.log("=========================================\n");
  } catch (error: any) {
    console.error("\n❌ Push Failed:", error.message || error);
    if (error.data) {
      console.error("Details:", JSON.stringify(error.data, null, 2));
    }
    if (error.message?.includes("401") || error.data?.statusCode === 401) {
      console.error("\nReason: The token provided was rejected by GitHub (HTTP 401).");
      console.error("Please verify that the Personal Access Token is valid and has the 'repo' (Full control of private repositories) scope enabled.");
    }
  }
}

pushToGitHub().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
