/**
 * 开源版占位：不含 OAuth / Supabase 配置。
 * 克隆仓库后复制为 oauth-bootstrap.js：
 *   copy oauth-bootstrap.stub.js oauth-bootstrap.js
 */
(function () {
  // 在主应用加载前标记开源模式，账号功能不等待异步启动完成。
  window.__xxjCloudAuthEnabled = false;
})();
