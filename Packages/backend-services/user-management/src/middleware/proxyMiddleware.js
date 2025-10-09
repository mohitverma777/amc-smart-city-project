// Packages/backend-services/user-management/src/middleware/proxyMiddleware.js
// Ensure proper path rewriting
const proxyOptions = {
  target: serviceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/user-management`]: '/api', // Update this line
  },
};