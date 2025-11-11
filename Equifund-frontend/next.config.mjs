/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbo: {
      resolveAlias: {
        "pino-pretty": false,
        lokijs: false,
        encoding: false,
      },
    },
  },
  webpack: (config) => {
    const externals = ["pino-pretty", "lokijs", "encoding"];

    if (!config.externals) {
      config.externals = externals;
    } else if (Array.isArray(config.externals)) {
      config.externals.push(...externals);
    } else {
      config.externals = [config.externals, ...externals];
    }

    return config;
  },
};

export default nextConfig;
