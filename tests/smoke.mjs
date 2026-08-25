import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const host = await readFile(join(root, "src", "index.js"), "utf8");
const patch = await readFile(join(root, "cordis.patch.yml"), "utf8");
const client = await readFile(join(root, "lib", "client.js"), "utf8");

assert.equal(manifest.dsh.bundle.patch, "./cordis.patch.yml");
assert.equal(manifest.dsh.client.platform, "web");
assert.match(host, /settingsNamespace\("web-tools"\)/);
assert.match(host, /applyWebFetchTool/);
assert.match(host, /expose: "web"/);
assert.match(patch, /@deepseek-ai\/dsh-web-fetch-http/);
assert.match(patch, /dsh-web-tools-settings/);
assert.match(client, /window\.__ModuleLoader__\.load/);
assert.match(client, /settings\.plugin\.item/);
console.log("dsh-web-tools-settings smoke test passed");
