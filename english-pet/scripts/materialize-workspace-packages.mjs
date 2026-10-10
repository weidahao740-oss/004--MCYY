import { cp, lstat, mkdir, readFile, rename, rm, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scopeDirectory = path.join(projectRoot, "node_modules", "@english-pet");
const workspacePackages = ["contracts", "domain", "ai", "database"];

async function removePath(targetPath) {
  try {
    const entry = await lstat(targetPath);
    if (entry.isSymbolicLink()) {
      await unlink(targetPath);
      return;
    }
    await rm(targetPath, { recursive: true, force: true });
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

await mkdir(scopeDirectory, { recursive: true });

for (const packageDirectoryName of workspacePackages) {
  const sourceDirectory = path.join(projectRoot, "packages", packageDirectoryName);
  const packageJsonPath = path.join(sourceDirectory, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const expectedPackageName = `@english-pet/${packageDirectoryName}`;

  if (packageJson.name !== expectedPackageName) {
    throw new Error(
      `Workspace package mismatch: expected ${expectedPackageName}, got ${packageJson.name ?? "<missing>"}`,
    );
  }

  const destinationDirectory = path.join(scopeDirectory, packageDirectoryName);
  const stagingDirectory = path.join(
    scopeDirectory,
    `.materializing-${packageDirectoryName}-${process.pid}`,
  );

  await removePath(stagingDirectory);
  await cp(sourceDirectory, stagingDirectory, {
    recursive: true,
    filter(sourcePath) {
      const relativePath = path.relative(sourceDirectory, sourcePath);
      if (!relativePath) {
        return true;
      }
      const firstSegment = relativePath.split(path.sep)[0];
      return !["node_modules", "dist", "coverage"].includes(firstSegment);
    },
  });
  await removePath(destinationDirectory);
  await rename(stagingDirectory, destinationDirectory);
  console.log(`Materialized ${expectedPackageName} from packages/${packageDirectoryName}`);
}
