import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import fs from "fs";

const CLIENT_ID = "178c6fc77800e84f0855"; // GitHub CLI official public OAuth Client ID
const dir = process.cwd();

async function authorizeAndPush() {
  console.log("=================================================");
  console.log("    OMNIPRESENCE GITHUB INSTANT AUTHORIZATION    ");
  console.log("=================================================\n");

  console.log("Requesting GitHub device authorization code...");

  const codeRes = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: "repo read:user",
    }),
  });

  if (!codeRes.ok) {
    const text = await codeRes.text();
    console.error("Failed to get device code:", text);
    return;
  }

  const data = await codeRes.json();
  const { device_code, user_code, verification_uri, interval = 5, expires_in } = data;

  console.log("\n=================================================");
  console.log(`👉 Step 1: Open this URL in your browser:`);
  console.log(`   ${verification_uri}`);
  console.log(`👉 Step 2: Enter this single authorization code:`);
  console.log(`   ${user_code}`);
  console.log("=================================================\n");
  console.log("Waiting for you to click Authorize on GitHub...");

  // Poll for token
  const startTime = Date.now();
  const timeoutMs = expires_in * 1000;

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, (interval + 1) * 1000));

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        console.log("\n✅ AUTHORIZATION GRANTED!");
        console.log("🚀 Pushing all 98 files to https://github.com/sundhip/OmniPresence...");

        await git.push({
          fs,
          http,
          dir,
          remote: "origin",
          ref: "main",
          remoteRef: "refs/heads/main",
          force: true,
          onAuth: () => ({
            username: tokenData.access_token,
            password: "",
          }),
          onProgress: (p) => {
            if (p.total) {
              console.log(`Uploading: ${p.phase} (${p.loaded}/${p.total})`);
            }
          },
        });

        console.log("\n=================================================");
        console.log("🎉 SUCCESS! All files have been pushed to GitHub!");
        console.log("👉 View repository: https://github.com/sundhip/OmniPresence");
        console.log("=================================================\n");
        return;
      }

      if (tokenData.error === "authorization_pending") {
        process.stdout.write(".");
        continue;
      }

      if (tokenData.error === "slow_down") {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      if (tokenData.error === "expired_token") {
        console.error("\n❌ Authorization timed out. Please try again.");
        return;
      }

      if (tokenData.error === "access_denied") {
        console.error("\n❌ Authorization was cancelled.");
        return;
      }
    }
  }
}

authorizeAndPush().catch((e) => {
  console.error("Auth error:", e);
});
