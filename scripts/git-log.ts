import fs from "fs";
import git from "isomorphic-git";

async function showLog() {
  const dir = process.cwd();
  const commits = await git.log({ fs, dir });
  console.log("=== LOCAL COMMITS READY TO PUSH ===");
  commits.forEach((c, idx) => {
    console.log(`[Commit #${idx + 1}] SHA: ${c.oid}`);
    console.log(`Author: ${c.commit.author.name} <${c.commit.author.email}>`);
    console.log(`Date: ${new Date(c.commit.author.timestamp * 1000).toLocaleString()}`);
    console.log(`Message: ${c.commit.message}`);
    console.log("-----------------------------------------");
  });
}

showLog().catch(console.error);
