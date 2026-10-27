import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  landingDescription,
  landingFeatures,
  landingTitle,
  seoDescription,
  seoTitle,
} from "./src/content/landing";

const base = process.env.VITE_BASE_PATH || "/";

// SEO_INDEXABLE is opt-in: the public GitHub Pages fork is a demo, not the
// canonical production site. Set SEO_INDEXABLE=true only for the final URL.
const indexable = process.env.SEO_INDEXABLE === "true";
const configuredSiteUrl = process.env.SEO_SITE_URL?.trim();
if (indexable && !configuredSiteUrl) {
  throw new Error("SEO_SITE_URL is required when SEO_INDEXABLE=true");
}
const siteUrl = configuredSiteUrl ? new URL(configuredSiteUrl) : null;
if (siteUrl && siteUrl.protocol !== "https:") {
  throw new Error("SEO_SITE_URL must use HTTPS");
}
if (siteUrl) siteUrl.hash = "";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function curacasaSeo(): Plugin {
  return {
    name: "curacasa-seo",
    transformIndexHtml(html) {
      const iconUrl = siteUrl ? new URL("brand/icon-512.png", siteUrl).href : null;
      const seoHead = [
        indexable && siteUrl
          ? `<link rel="canonical" href="${escapeHtml(siteUrl.href)}" />`
          : '<meta name="robots" content="noindex" />',
        '<meta property="og:type" content="website" />',
        '<meta property="og:locale" content="it_IT" />',
        `<meta property="og:title" content="${escapeHtml(seoTitle)}" />`,
        `<meta property="og:description" content="${escapeHtml(seoDescription)}" />`,
        '<meta name="twitter:card" content="summary" />',
        iconUrl ? `<meta property="og:image" content="${escapeHtml(iconUrl)}" />` : "",
        siteUrl ? `<meta property="og:url" content="${escapeHtml(siteUrl.href)}" />` : "",
        indexable && siteUrl
          ? `<script type="application/ld+json">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "CuraCasa",
            url: siteUrl.href,
            description: seoDescription,
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Web",
            inLanguage: "it-IT",
          }).replace(/</g, "\\u003c")}</script>`
          : "",
      ].filter(Boolean).join("\n    ");

      // The React app replaces the fallback after boot; crawlers and users
      // without JavaScript still receive meaningful HTML, not an empty #root.
      const fallback = `<main class="landing-page">
        <header class="landing-topbar"><span class="landing-logo"><img src="${escapeHtml(base)}brand/mark.svg" width="36" height="36" alt="" /> CuraCasa</span></header>
        <section class="landing-hero">
          <div class="landing-copy">
            <h1>${escapeHtml(landingTitle)}</h1>
            <p class="landing-subtitle">${escapeHtml(landingDescription)}</p>
            <div class="landing-actions">
              <a class="landing-cta landing-cta--primary" href="${escapeHtml(base)}#/app">Apri CuraCasa</a>
            </div>
            <ul class="landing-features">${landingFeatures.map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
          </div>
        </section>
      </main>`;

      return html
        .replace("<!-- curacasa:seo-head -->", seoHead)
        .replace("<!-- curacasa:static-landing -->", fallback);
    },
    generateBundle() {
      if (!indexable || !siteUrl) return;
      const xmlUrl = escapeHtml(siteUrl.href);
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${xmlUrl}</loc></url>
</urlset>
`,
      });
      // robots.txt only works at an origin's root, not inside a Pages subpath.
      if (siteUrl.pathname === "/") {
        this.emitFile({
          type: "asset",
          fileName: "robots.txt",
          source: `User-agent: *
Allow: /

Sitemap: ${new URL("sitemap.xml", siteUrl).href}
`,
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), curacasaSeo()],
  base,
});
