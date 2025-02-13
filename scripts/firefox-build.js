const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const { exec } = require("child_process");

async function main() {
  try {
    console.log("🔨 Building Chrome extension first...");
    await execPromise("bun run build:chrome"); // Ensure Chrome build succeeds

    console.log("📦 Creating Firefox extension package...");

    const packageDir = "firefox-extension";
    const zipPath = "extension-source.zip";
    const zipContents = ["dist", "public", "_locales", "images", "manifest.json"];

    await fs.remove(packageDir);
    await fs.mkdir(packageDir);

    // Copy necessary files
    await Promise.all(
      zipContents.map(async (file) => {
        const src = path.resolve(file);
        const dest = path.join(packageDir, file);
        if (await fs.pathExists(src)) {
          await fs.copy(src, dest);
        } else {
          console.warn(`Warning: ${file} not found, skipping.`);
        }
      })
    );

    // Ensure manifest is at root
    if (!(await fs.pathExists(`${packageDir}/manifest.json`))) {
      console.error("🚨 Error: manifest.json is missing in the Firefox build!");
      process.exit(1);
    }

    // Create a ZIP archive
    await createZip(packageDir, zipPath);

    console.log(`✅ Firefox extension packaged as ${zipPath}`);
  } catch (error) {
    console.error("🚨 Firefox build failed:", error);
    process.exit(1);
  }
}

// Helper function to execute shell commands
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        console.error(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        return reject(error);
      }
      console.log(stdout);
      console.error(stderr);
      resolve();
    });
  });
}

// Helper function to create a ZIP archive
async function createZip(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`📦 Extension packaged successfully: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

main();
