/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'api.dicebear.com',
      'avatars.githubusercontent.com',
      'hlcetvfxaucatbvtqrui.supabase.co',
    ],
  },
  // Required for Supabase Realtime WebSocket in some environments
  webpack: (config) => {
    config.externals.push({
      bufferutil:       'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    });
    return config;
  },
};

module.exports = nextConfig;
