/** @type {import('next').NextConfig} */
module.exports = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: 
          process.env.NODE_ENV === "production"
            ? "https://lingoscribe.fly.dev/:path*"
            : "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};