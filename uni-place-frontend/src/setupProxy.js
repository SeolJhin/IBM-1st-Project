const { createProxyMiddleware } = require("http-proxy-middleware");
const proxyTarget = process.env.FRONTEND_PROXY_TARGET || "http://localhost:8080";

module.exports = function (app) {
    app.use(
        "/api",
        createProxyMiddleware({
            target: proxyTarget,
            changeOrigin: true,
            ws: true,
        })
    );
};
