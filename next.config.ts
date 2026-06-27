import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const githubRepo = process.env.GITHUB_REPOSITORY; // Format: "owner/repo-name"
const repoName = githubRepo ? `/${githubRepo.split('/')[1]}` : "";

// --- DEBUG LOG BLOCK ---
console.log("========================================");
console.log(`[Next.js Config Build Check]`);
console.log(`- Is Production Build: ${isProd}`);
console.log(`- Raw GITHUB_REPOSITORY: "${githubRepo}"`);
console.log(`- Evaluated repoName (basePath): "${repoName}"`);
console.log("========================================");
// -----------------------

const nextConfig: NextConfig = {
  /**
   * Enable static exports.
   *
   * @see https://nextjs.org/docs/app/building-your-application/deploying/static-exports
   */
  output: "export",

  /**
   * Set base path. This is usually the slug of your repository.
   *
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/basePath
   */
  basePath: isProd ? repoName : "/nextjs-github-pages",
  assetPrefix: isProd ? repoName : "",
  /**
   * Disable server-based image optimization. Next.js does not support
   * dynamic features with static exports.
   *
   * @see https://nextjs.org/docs/pages/api-reference/components/image#unoptimized
   */
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
