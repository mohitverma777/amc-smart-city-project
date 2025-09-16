// Ensure proper path rewriting
const proxyOptions = {
  target: serviceUrl,
  changeOrigin: true,
  pathRewrite: {
    [`^/api/user-management`]: '', // Remove the prefix when forwarding
  },
};