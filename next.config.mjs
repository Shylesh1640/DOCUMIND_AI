/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'pdf-parse',
      'mammoth',
      'chromadb',
      'chromadb-default-embed',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Treat these as external so webpack doesn't try to bundle native modules
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('chromadb-default-embed');
      }
    }
    // Silence critical dependency warnings from chromadb
    config.ignoreWarnings = [
      { module: /chromadb/ },
      { module: /onnxruntime/ },
    ];
    return config;
  },
};

export default nextConfig;
