import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**": ["./prisma/dev.db"],
    "/dashboard/**": ["./prisma/dev.db"],
    "/workspace/**": ["./prisma/dev.db"],
    "/login": ["./prisma/dev.db"],
  },
};

export default nextConfig;
