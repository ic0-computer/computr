const { build } = require('esbuild');
const sveltePlugin = require('esbuild-svelte');
const sveltePreprocess = require('svelte-preprocess');

const isProdBuild = process.argv.includes('--prod');

main();

async function main() {
  const commonConfig = {
    platform: 'browser',
    bundle: true,
    sourcemap: !isProdBuild,
    minify: isProdBuild,
    tsconfig: './tsconfig.json',
    drop: isProdBuild ? ['console'] : undefined
  };

  try {
    const contentJob = build({
      ...commonConfig,
      entryPoints: ['./src/content.ts'],
      outfile: './dist/content.js'
    });

    const backgroundJob = build({
      ...commonConfig,
      entryPoints: ['./src/background.ts'],
      outfile: './dist/background.js'
    });

    const popupJob = build({
      ...commonConfig,
      entryPoints: ['./src/popup/popup.ts'],
      outdir: './dist',
      mainFields: ['svelte', 'module', 'main', 'browser'],
      plugins: [
        sveltePlugin({
          preprocess: sveltePreprocess()
        })
      ]
    });

    const settingsJob = build({
      ...commonConfig,
      entryPoints: ['./src/settings/settings.ts'],
      outdir: './dist',
      mainFields: ['svelte', 'module', 'main', 'browser'],
      plugins: [
        sveltePlugin({
          preprocess: sveltePreprocess()
        })
      ]
    });

    await Promise.all([contentJob, backgroundJob, popupJob, settingsJob]);
    console.log('⚡ Compiled');
  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
}
