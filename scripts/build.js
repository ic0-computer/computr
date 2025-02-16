const { build } = require("esbuild");
const sveltePlugin = require("esbuild-svelte");
const sveltePreprocess = require("svelte-preprocess");

// Custom plugin for raw file imports (e.g., "?raw")
const rawPlugin = {
  name: "raw",
  setup(build) {
    build.onResolve({ filter: /\.js\?raw$/ }, (args) => ({
      path: args.path,
      namespace: "raw",
    }));

    build.onLoad({ filter: /.*/, namespace: "raw" }, async (args) => {
      const fs = require("fs");
      const path = require("path");
      const filePath = args.path.replace(/\?raw$/, "");
      const content = await fs.promises.readFile(
        path.resolve(__dirname, filePath),
        "utf8"
      );
      return {
        contents: content,
        loader: "text",
      };
    });
  },
};

const isProdBuild = process.argv.includes("--prod");

main();

async function main() {
  const commonConfig = {
    platform: "browser",
    bundle: true,
    sourcemap: !isProdBuild,
    minify: isProdBuild,
    tsconfig: "./tsconfig.json",
    drop: isProdBuild ? ["console"] : undefined,
    define: {
      global: "window",
    },
  };

  try {
    const contentJob = build({
      ...commonConfig,
      entryPoints: ["./src/bridge/content.ts"],
      outfile: "./dist/content.js",
      plugins: [rawPlugin],
    });

    const backgroundJob = build({
      ...commonConfig,
      entryPoints: ["./src/background/background.ts"],
      outfile: "./dist/background.js",
    });

    const popupJob = build({
      ...commonConfig,
      entryPoints: ["./src/popup/popup.ts"],
      outdir: "./dist",
      mainFields: ["svelte", "module", "main", "browser"],
      plugins: [
        sveltePlugin({
          preprocess: sveltePreprocess(),
        }),
      ],
    });

    const settingsJob = build({
      ...commonConfig,
      entryPoints: ["./src/settings/settings.ts"],
      outdir: "./dist",
      mainFields: ["svelte", "module", "main", "browser"],
      plugins: [
        sveltePlugin({
          preprocess: sveltePreprocess(),
        }),
      ],
    });

    const inpageJob = build({
      ...commonConfig,
      entryPoints: ["./src/bridge/inpage.ts"],
      outfile: "./dist/inpage.js",
    });

    await Promise.all([contentJob, backgroundJob, popupJob, settingsJob, inpageJob]);
    console.log("⚡ Compiled");
  } catch (e) {
    console.error("Build failed:", e);
    process.exit(1);
  }
}
