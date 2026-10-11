import withPWA from 'next-pwa';

const nextConfig = {
  // your standard next config here
  turbopack: {},
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // disable during local development if needed
})(nextConfig);