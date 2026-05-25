import { defineConfig } from "vite";
import pug from "pug";
import pugPlugin from "vite-plugin-pug";
import path from "node:path";
import fs from "node:fs";

// ======================================
// 共通: 画像ルート & 正規化ヘルパ
const IMAGES_ROOT = path.resolve(__dirname, "src", "images");

function toImagesRel(nameRaw) {
  if (!nameRaw) return null;
  let s = String(nameRaw).trim();
  s = s.replace(/^(\.?\/)+/, "");
  s = s.replace(/^src[\\/]+images[\\/]+/i, "");
  s = s.replace(/\\/g, "/");
  if (s.includes("..")) return null;
  return s;
}

// ======================================
// ダミーHTMLファイルの生成・削除プラグイン
//   serve/dev 時にもダミーを出す
// ======================================
function manageDummyFilesPlugin() {
  const dummyFiles = [];
  const dummyTemplate = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dummy</title>
</head>
<body></body>
</html>`;

  // 共通ロジック
  function cleanup() {
    // PAGES に列挙されたダミーを一括削除
    let count = 0;
    if (Array.isArray(PAGES)) {
      for (const { html } of PAGES) {
        const abs = path.resolve(__dirname, html);
        if (fs.existsSync(abs)) {
          try {
            fs.unlinkSync(abs);
            count++;
          } catch (e) {
            // 削除失敗は無視して先へ
          }
        }
      }
    }
    if (count) {
      console.log(`[manage-dummy-files] Cleaned up ${count} dummy HTML files`);
    }
    dummyFiles.length = 0;
  }

  function generate() {
    // 既存の残留ダミーを削除してから再生成
    cleanup();
    if (Array.isArray(PAGES)) {
      for (const { html } of PAGES) {
        const abs = path.resolve(__dirname, html);
        if (!fs.existsSync(abs)) {
          fs.writeFileSync(abs, dummyTemplate);
          dummyFiles.push(abs);
        }
      }
    }
    console.log(`[manage-dummy-files] Generated ${dummyFiles.length} dummy HTML files`);
  }

  return {
    name: "manage-dummy-files",
    // serve と build の両方で動作
    buildStart() {
      generate();
    },
    configureServer(server) {
      // 開発サーバ起動時にダミーHTMLが存在することを確認
      generate();
      // サーバ終了時に削除
      if (server.httpServer) {
        server.httpServer.once("close", cleanup);
      }
      // 念のためプロセス終了シグナルでもクリーンアップ
      const exitHandler = () => {
        cleanup();
        process.exit();
      };
      process.once("exit", cleanup);
      process.once("SIGINT", exitHandler);
      process.once("SIGTERM", exitHandler);
    },
    buildEnd() {
      cleanup();
    },
  };
}

// ======================================
// 0) 複数ページ定義
//    今はトップページ(index.pug)のみを扱うため、データファイルや
//   事例ページ生成ロジックは削除しました。

const PAGES = [{ html: "index.html", pug: "index.pug" }];

// 1) Pug HMR
// ======================================
function pugHmrPlugin() {
  return {
    name: "pug-hmr",
    apply: "serve",
    handleHotUpdate({ file, server }) {
      if (file.endsWith(".pug")) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  };
}

// ======================================
// 2) html を pug に差し替えるプラグイン（serve/build兼用）
//    transformIndexHtml の handler をページごとに用意
// ======================================
function indexFromPugPluginFor(htmlEntry, pugEntry, locals = {}) {
  const handler = (html, ctxOrCfg) => {
    const rootDir = ctxOrCfg?.server?.config?.root ?? ctxOrCfg?.root ?? process.cwd();
    const requestedFile = ctxOrCfg?.filename ? path.resolve(ctxOrCfg.filename) : path.resolve(rootDir, htmlEntry);
    const htmlPath = path.resolve(rootDir, htmlEntry);
    if (requestedFile !== htmlPath) return html;

    const pugPath = path.resolve(rootDir, pugEntry);
    if (!fs.existsSync(pugPath)) return html;

    return pug.compileFile(pugPath, { basedir: rootDir, pretty: true })(locals);
  };

  const base = {
    name: `index-from-pug:${htmlEntry}`,
    enforce: "pre",
    transformIndexHtml: { order: "pre", handler },
  };
  return {
    serve: { ...base, apply: "serve" },
    build: { ...base, apply: "build" },
  };
}

// ======================================
// 3) dev: <img/source data-asset="..."> を /src/images/** に置換
// ======================================
function devDataAssetToSrcPlugin() {
  return {
    name: "dev-data-asset-to-src",
    apply: "serve",
    enforce: "post",
    transformIndexHtml(html) {
      const r1 = html.replace(/(<img\b[^>]*?)\sdata-asset="([^"]+)"([^>]*?>)/g, (m, pre, name, post) => {
        const rel = toImagesRel(name);
        if (!rel) return m;
        const preNoData = pre.replace(/\sdata-asset="[^"]*"/, "");
        const url = `/src/images/${rel}`;
        if (/\ssrc="/.test(preNoData)) {
          return preNoData.replace(/\ssrc="[^"]*"/, ` src="${url}"`) + post;
        }
        return `${preNoData} src="${url}"${post}`;
      });

      const r2 = r1.replace(/(<source\b[^>]*?)\sdata-asset="([^"]+)"([^>]*?>)/g, (m, pre, name, post) => {
        const rel = toImagesRel(name);
        if (!rel) return m;
        const preNoData = pre.replace(/\sdata-asset="[^"]*"/, "");
        const url = `/src/images/${rel}`;
        if (/\ssrcset="/.test(preNoData)) {
          return preNoData.replace(/\ssrcset="[^"]*"/, ` srcset="${url}"`) + post;
        }
        return `${preNoData} srcset="${url}"${post}`;
      });

      return r2;
    },
  };
}

// ======================================
// 4) build: <img/source data-asset="..."> → ./assets/**-hash
// ======================================
function dataAssetToSrcPlugin() {
  return {
    name: "data-asset-to-src",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!fileName.endsWith(".html") || typeof chunk.source !== "string") continue;
        let html = chunk.source;

        html = html.replace(/(<img\b[^>]*?)\sdata-asset="([^"]+)"([^>]*?>)/g, (m, pre, name, post) => {
          const rel = toImagesRel(name);
          if (!rel) {
            this.warn(`[data-asset-to-src] Invalid path: ${name}`);
            return m;
          }
          const abs = path.resolve(IMAGES_ROOT, rel);
          if (!fs.existsSync(abs)) {
            this.warn(`[data-asset-to-src] Not found: ${abs}`);
            return m;
          }
          const refId = this.emitFile({
            type: "asset",
            name: rel,
            source: fs.readFileSync(abs),
          });
          const finalName = this.getFileName(refId);
          const preNoData = pre.replace(/\sdata-asset="[^"]*"/, "");
          if (/\ssrc="/.test(preNoData)) {
            return preNoData.replace(/\ssrc="[^"]*"/, ` src="./${finalName}"`) + post;
          }
          return `${preNoData} src="./${finalName}"${post}`;
        });

        html = html.replace(/(<source\b[^>]*?)\sdata-asset="([^"]+)"([^>]*?>)/g, (m, pre, name, post) => {
          const rel = toImagesRel(name);
          if (!rel) {
            this.warn(`[data-asset-to-src] Invalid path: ${name}`);
            return m;
          }
          const abs = path.resolve(IMAGES_ROOT, rel);
          if (!fs.existsSync(abs)) {
            this.warn(`[data-asset-to-src] Not found: ${abs}`);
            return m;
          }
          const refId = this.emitFile({
            type: "asset",
            name: rel,
            source: fs.readFileSync(abs),
          });
          const finalName = this.getFileName(refId);
          const preNoData = pre.replace(/\sdata-asset="[^"]*"/, "");
          if (/\ssrcset="/.test(preNoData)) {
            return preNoData.replace(/\ssrcset="[^"]*"/, ` srcset="./${finalName}"`) + post;
          }
          return `${preNoData} srcset="./${finalName}"${post}`;
        });

        chunk.source = html;
      }
    },
  };
}

// ======================================
// 5) OGP 出力/配信・URL正規化（既存）
// ======================================
function emitOgpAssetPlugin() {
  return {
    name: "emit-ogp-asset",
    apply: "build",
    generateBundle() {
      const src = path.resolve(__dirname, "src/images/ogp.jpg");
      if (!fs.existsSync(src)) {
        this.warn(`[emit-ogp-asset] Not found: ${src}`);
        return;
      }
      this.emitFile({
        type: "asset",
        name: "ogp.jpg",
        fileName: "assets/images/ogp.jpg",
        source: fs.readFileSync(src),
      });
    },
  };
}

function devServeOgpPlugin() {
  return {
    name: "dev-serve-ogp",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/assets/images/ogp.jpg") {
          const file = path.resolve(__dirname, "src/images/ogp.jpg");
          if (fs.existsSync(file)) {
            res.setHeader("Content-Type", "image/jpeg");
            fs.createReadStream(file).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

function normalizeAssetUrlsPlugin() {
  return {
    name: "normalize-asset-urls",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!fileName.endsWith(".html") || typeof chunk.source !== "string") continue;

        chunk.source = chunk.source.replace(/(\b(?:href|src|srcset|content)\s*=\s*")\/assets\//g, "$1./assets/").replace(/(\b(?:href|src|srcset|content)\s*=\s*")(?!\.\/)assets\//g, "$1./assets/");
      }
    },
  };
}

// ======================================
// Vite 設定本体
// ======================================
export default defineConfig({
  root: ".",
  base: "./",
  publicDir: false,
  plugins: [
    pugPlugin(),
    // ▼ 複数ページ分の Pug 差し替えを登録
    ...PAGES.flatMap(({ html, pug, locals = {} }) => {
      const p = indexFromPugPluginFor(html, pug, locals);
      return [p.serve, p.build];
    }),
    pugHmrPlugin(),
    devDataAssetToSrcPlugin(),
    dataAssetToSrcPlugin(),
    emitOgpAssetPlugin(),
    devServeOgpPlugin(),
    normalizeAssetUrlsPlugin(),
    manageDummyFilesPlugin(),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  css: { devSourcemap: true },
  server: {
    watch: {
      usePolling: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 10 },
    },
  },
  //ハッシュ付ける場合
  // build: {
  //   outDir: "dist",
  //   emptyOutDir: true,
  //   cssCodeSplit: false,
  //   rollupOptions: {
  //     input: Object.fromEntries(
  //       PAGES.map(({ html }) => [
  //         path.parse(html).name,
  //         path.resolve(__dirname, html),
  //       ])
  //     ),
  //     output: {
  //       entryFileNames: "assets/js/[name]-[hash].js",
  //       chunkFileNames: "assets/js/[name]-[hash].js",
  //       assetFileNames: (assetInfo) => {
  //         const baseName = path.basename(assetInfo.name || "").toLowerCase();
  //         const ext = path.extname(assetInfo.name || "").toLowerCase();
  //         if (baseName === "ogp.jpg") return "assets/images/ogp[extname]";
  //         if (ext === ".css") return "assets/css/[name]-[hash][extname]";
  //         if (
  //           [
  //             ".png",
  //             ".jpg",
  //             ".jpeg",
  //             ".gif",
  //             ".svg",
  //             ".webp",
  //             ".avif",
  //           ].includes(ext)
  //         ) {
  //           return "assets/images/[name]-[hash][extname]";
  //         }
  //         return "assets/[ext]/[name]-[hash][extname]";
  //       },
  //     },
  //   },
  // },
  //ハッシュなしの場合
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: Object.fromEntries(PAGES.map(({ html }) => [path.parse(html).name, path.resolve(__dirname, html)])),
      output: {
        entryFileNames: "assets/js/script.js",
        chunkFileNames: "assets/js/[name].js",
        assetFileNames: (assetInfo) => {
          const baseName = path.basename(assetInfo.name || "").toLowerCase();
          const ext = path.extname(assetInfo.name || "").toLowerCase();
          if (baseName === "ogp.jpg") return "assets/images/ogp[extname]";
          if (ext === ".css") return "assets/css/[name][extname]";
          if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"].includes(ext)) {
            return "assets/images/[name][extname]";
          }
          return "assets/[ext]/[name][extname]";
        },
      },
    },
  },
});
