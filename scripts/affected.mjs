import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deploymentKeys = ["http", "ws", "web", "outbox", "worker", "migrate"];
const typeScriptDeploymentKeys = ["http", "ws", "web", "outbox"];
const directApplicationPaths = new Map([
  ["apps/http/", "http"],
  ["apps/ws/", "ws"],
  ["apps/web/", "web"],
  ["apps/outbox-dispatcher/", "outbox"],
  ["apps/ai-worker/", "worker"],
]);
const deploymentKeyByPackageName = new Map([
  ["@case-intelligence/http", "http"],
  ["@case-intelligence/ws", "ws"],
  ["@case-intelligence/web", "web"],
  ["@case-intelligence/outbox-dispatcher", "outbox"],
]);

function parseArguments(argumentsList) {
  const options = { base: undefined, head: undefined, files: [], forceAll: false };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--base") options.base = argumentsList[++index];
    else if (argument === "--head") options.head = argumentsList[++index];
    else if (argument === "--file") options.files.push(argumentsList[++index]);
    else if (argument === "--force-all") options.forceAll = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function workspacePatterns(workspaces) {
  return Array.isArray(workspaces) ? workspaces : workspaces?.packages ?? [];
}

function discoverWorkspacePackages(rootPackage) {
  const packages = [];

  for (const pattern of workspacePatterns(rootPackage.workspaces)) {
    if (!pattern.endsWith("/*")) continue;
    const workspaceDirectory = resolve(rootDirectory, pattern.slice(0, -2));
    if (!existsSync(workspaceDirectory)) continue;

    for (const entry of readdirSync(workspaceDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const packagePath = resolve(workspaceDirectory, entry.name, "package.json");
      if (!existsSync(packagePath)) continue;
      const packageDirectory = dirname(packagePath);
      const packageJson = readJson(packagePath);
      packages.push({
        directory: relative(rootDirectory, packageDirectory).replaceAll("\\", "/"),
        name: packageJson.name,
        packageJson,
      });
    }
  }

  return packages.filter((workspacePackage) => workspacePackage.name);
}

function buildReverseDependencyGraph(workspacePackages) {
  const packageNames = new Set(workspacePackages.map((workspacePackage) => workspacePackage.name));
  const reverseDependencies = new Map();
  const dependencySections = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ];

  for (const workspacePackage of workspacePackages) {
    for (const section of dependencySections) {
      for (const dependencyName of Object.keys(workspacePackage.packageJson[section] ?? {})) {
        if (!packageNames.has(dependencyName)) continue;
        const dependents = reverseDependencies.get(dependencyName) ?? new Set();
        dependents.add(workspacePackage.name);
        reverseDependencies.set(dependencyName, dependents);
      }
    }
  }

  return reverseDependencies;
}

function gitCommitExists(revision) {
  if (!revision || /^0+$/.test(revision)) return false;
  try {
    execFileSync("git", ["cat-file", "-e", `${revision}^{commit}`], {
      cwd: rootDirectory,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function changedFilesFromGit(base, head) {
  if (!gitCommitExists(base) || !gitCommitExists(head)) return null;
  const output = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMRD", base, head],
    { cwd: rootDirectory, encoding: "utf8" },
  );
  return output.split("\n").filter(Boolean);
}

function markWorkspaceDependents(packageName, reverseDependencies, flags) {
  const pending = [packageName];
  const visited = new Set();

  while (pending.length > 0) {
    const currentPackage = pending.shift();
    if (!currentPackage || visited.has(currentPackage)) continue;
    visited.add(currentPackage);

    const deploymentKey = deploymentKeyByPackageName.get(currentPackage);
    if (deploymentKey) flags[deploymentKey] = true;

    for (const dependent of reverseDependencies.get(currentPackage) ?? []) {
      pending.push(dependent);
    }
  }
}

function detectAffectedProjects(files, workspacePackages, reverseDependencies, forceAll) {
  const flags = Object.fromEntries(deploymentKeys.map((key) => [key, forceAll]));
  if (forceAll) return flags;

  const workspacePackageByDirectory = [...workspacePackages]
    .filter((workspacePackage) => workspacePackage.directory.startsWith("packages/"))
    .sort((left, right) => right.directory.length - left.directory.length);

  for (const file of files) {
    if (file === "package.json" || file === "bun.lock") {
      for (const key of typeScriptDeploymentKeys) flags[key] = true;
      continue;
    }

    if (file === "Dockerfile") {
      flags.http = true;
      flags.ws = true;
      flags.outbox = true;
      continue;
    }

    if (file === "Dockerfile.ai-worker") {
      flags.worker = true;
      continue;
    }

    if (file === "apps/ai-worker/pyproject.toml" || file === "apps/ai-worker/uv.lock") {
      flags.worker = true;
      continue;
    }

    const directApplication = [...directApplicationPaths].find(([path]) => file.startsWith(path));
    if (directApplication) {
      flags[directApplication[1]] = true;
      continue;
    }

    const workspacePackage = workspacePackageByDirectory.find(
      ({ directory }) => file === directory || file.startsWith(`${directory}/`),
    );
    if (!workspacePackage) continue;

    markWorkspaceDependents(workspacePackage.name, reverseDependencies, flags);

    if (
      file === "packages/db/prisma/schema.prisma" ||
      file.startsWith("packages/db/prisma/models/")
    ) {
      flags.worker = true;
    }

    if (file.startsWith("packages/db/prisma/migrations/")) {
      flags.migrate = true;
      flags.worker = true;
    }
  }

  return flags;
}

function writeGithubOutput(flags) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = deploymentKeys.map((key) => `${key}=${flags[key]}`).join("\n");
  appendFileSync(process.env.GITHUB_OUTPUT, `${lines}\n`);
}

try {
  const options = parseArguments(process.argv.slice(2));
  const rootPackage = readJson(resolve(rootDirectory, "package.json"));
  const workspacePackages = discoverWorkspacePackages(rootPackage);
  const reverseDependencies = buildReverseDependencyGraph(workspacePackages);
  const changedFiles = options.files.length > 0
    ? options.files
    : changedFilesFromGit(options.base, options.head);
  const forceAll = options.forceAll || changedFiles === null;
  const files = changedFiles ?? [];
  const flags = detectAffectedProjects(files, workspacePackages, reverseDependencies, forceAll);

  console.log("Changed files:");
  if (forceAll && !options.forceAll) console.log("No valid base commit was available; selecting all deployments.");
  for (const file of files) console.log(file);
  console.log("Affected:");
  for (const key of deploymentKeys) {
    const label = new Map([
      ["http", "HTTP"],
      ["ws", "WS"],
      ["web", "Web"],
      ["outbox", "Outbox"],
      ["worker", "Worker"],
      ["migrate", "Migrate"],
    ]).get(key);
    console.log(`${label}=${flags[key]}`);
  }

  writeGithubOutput(flags);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
