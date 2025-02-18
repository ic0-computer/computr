const { readdirSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

const distPath = path.resolve(__dirname, '../dist'); // Ensure correct path resolution
const excludePaths = ['esm'];
const basePackage = {
  sideEffects: false,
  types: './index.d.ts',
};

console.log('Ensuring dist directory exists...');

// Create `dist/` if it does not exist
if (!existsSync(distPath)) {
  mkdirSync(distPath, { recursive: true });
  console.log('Created missing dist/ directory.');
}

console.log('Adding package.json to Component directories');

const filterDirs = (dir) => dir.isDirectory() && !excludePaths.includes(dir.name);

const directories = existsSync(distPath) 
  ? readdirSync(distPath, { withFileTypes: true }).filter(filterDirs).map(dir => dir.name)
  : [];

if (directories.length === 0) {
  console.log('No valid component directories found in dist/. Skipping package.json creation.');
} else {
  directories.forEach((dirname) => {
    const data = JSON.stringify(
      {
        ...basePackage,
        module: `../esm/${dirname}/index.js`,
      },
      null,
      2
    );

    const packagePath = path.join(distPath, dirname, 'package.json');
    writeFileSync(packagePath, data);
    console.log(`Created package.json in ${packagePath}`);
  });
}

console.log('♾️  Provider Compiled');
