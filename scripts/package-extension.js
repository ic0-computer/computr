const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

async function main() {
  // Use a temporary folder to assemble the extension files.
  const tempDir = path.resolve('packaged-extension-temp');
  const zipFile = 'packaged-extension.zip';
  const filesToInclude = [
    '_locales',
    'dist',
    'images',
    'public',
    'manifest.json'
  ];

  // Clean up any previous temporary folder
  await fs.remove(tempDir);
  await fs.mkdir(tempDir);

  // Copy each required file/folder directly into the temp folder
  for (const item of filesToInclude) {
    const src = path.resolve(item);
    const dest = path.join(tempDir, path.basename(item));
    if (await fs.pathExists(src)) {
      await fs.copy(src, dest);
    } else {
      console.warn(`Warning: ${item} not found.`);
    }
  }

  // Verify that manifest.json is at the root of tempDir
  const manifestPath = path.join(tempDir, 'manifest.json');
  if (!(await fs.pathExists(manifestPath))) {
    console.error('Error: manifest.json is missing in the package directory.');
    process.exit(1);
  }

  // Create the ZIP archive with the contents of the temp folder at the root
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`Extension packaged successfully: ${archive.pointer()} total bytes`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  // The second argument "false" ensures that the contents of tempDir are added at the root
  archive.directory(tempDir, false);
  await archive.finalize();

  // Clean up the temporary package directory
  await fs.remove(tempDir);
}

main().catch((err) => {
  console.error('Packaging error:', err);
  process.exit(1);
});
