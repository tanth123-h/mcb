/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'api.dicebear.com',
      'avatars.githubusercontent.com',
      // Add your Supabase storage domain here once you have a project:
      // 'xxxxxxxxxxxx.supabase.co',
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
