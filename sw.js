// Service Worker for Claude 4 深度解析
// 版本: 1.0.0
// 更新时间: 2025-05-23

const CACHE_NAME = "claude-introduce-v1.0.0";
const STATIC_CACHE = "claude-static-v1.0.0";
const DYNAMIC_CACHE = "claude-dynamic-v1.0.0";

// 需要缓存的静态资源
const STATIC_ASSETS = [
  "/claude-introduce/",
  "/claude-introduce/index.html",
  "/claude-introduce/manifest.json",
  "/claude-introduce/assets/css/custom.css",
  "/claude-introduce/assets/js/script.js",
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
];

// 需要网络优先的资源
const NETWORK_FIRST = ["/claude-introduce/sitemap.xml", "/claude-introduce/robots.txt"];

// Service Worker 安装事件
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker 安装中...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("💾 缓存静态资源...");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("✅ Service Worker 安装完成");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker 安装失败:", error);
      })
  );
});

// Service Worker 激活事件
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker 激活中...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本缓存
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("🗑️ 删除旧缓存:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker 激活完成");
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求和CDN资源
  if (url.origin === location.origin || isCDNResource(url)) {
    event.respondWith(handleRequest(request));
  }
});

// 处理请求的核心逻辑
async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // 静态资源：缓存优先
    if (isStaticAsset(url)) {
      return await cacheFirst(request);
    }

    // 网络优先资源
    if (isNetworkFirst(url)) {
      return await networkFirst(request);
    }

    // HTML页面：网络优先，缓存备用
    if (request.headers.get("accept")?.includes("text/html")) {
      return await networkFirst(request);
    }

    // 图片资源：缓存优先
    if (request.headers.get("accept")?.includes("image")) {
      return await cacheFirst(request);
    }

    // 默认：网络优先
    return await networkFirst(request);
  } catch (error) {
    console.error("请求处理失败:", error);
    return new Response("网络错误", { status: 503 });
  }
}

// 缓存优先策略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // 后台更新缓存
    updateCache(request);
    return cachedResponse;
  }

  return await fetchAndCache(request);
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // 缓存成功的响应
      await updateCache(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 如果是HTML请求，返回离线页面
    if (request.headers.get("accept")?.includes("text/html")) {
      return await caches.match("/claude-introduce/");
    }

    throw error;
  }
}

// 获取并缓存资源
async function fetchAndCache(request) {
  const response = await fetch(request);

  if (response.ok) {
    await updateCache(request, response.clone());
  }

  return response;
}

// 更新缓存
async function updateCache(request, response = null) {
  const cacheName = isStaticAsset(new URL(request.url)) ? STATIC_CACHE : DYNAMIC_CACHE;
  const cache = await caches.open(cacheName);

  if (response) {
    await cache.put(request, response);
  } else {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
    } catch (error) {
      console.warn("缓存更新失败:", error);
    }
  }
}

// 判断是否为静态资源
function isStaticAsset(url) {
  return (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    STATIC_ASSETS.some((asset) => url.href.includes(asset))
  );
}

// 判断是否为网络优先资源
function isNetworkFirst(url) {
  return NETWORK_FIRST.some((path) => url.pathname.includes(path));
}

// 判断是否为CDN资源
function isCDNResource(url) {
  const cdnHosts = ["cdn.tailwindcss.com", "unpkg.com", "cdn.jsdelivr.net", "api.iconify.design"];

  return cdnHosts.some((host) => url.hostname.includes(host));
}

// 消息处理
self.addEventListener("message", (event) => {
  const { data } = event;

  switch (data.type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;

    case "CLEAN_UP":
      cleanUpCaches();
      break;
  }
});

// 清理缓存
async function cleanUpCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE);

  await Promise.all(oldCaches.map((name) => caches.delete(name)));
  console.log("🧹 缓存清理完成");
}

// 后台同步（如果支持）
if ("sync" in self.registration) {
  self.addEventListener("sync", (event) => {
    if (event.tag === "background-sync") {
      event.waitUntil(doBackgroundSync());
    }
  });
}

// 执行后台同步
async function doBackgroundSync() {
  try {
    // 同步关键数据
    await fetch("/claude-introduce/sitemap.xml");
    console.log("🔄 后台同步完成");
  } catch (error) {
    console.warn("后台同步失败:", error);
  }
}

// 推送通知（如果需要）
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: "/claude-introduce/assets/images/icon-192x192.png",
      badge: "/claude-introduce/assets/images/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
      actions: [
        {
          action: "explore",
          title: "查看详情",
          icon: "/claude-introduce/assets/images/icon-72x72.png",
        },
        {
          action: "close",
          title: "关闭",
          icon: "/claude-introduce/assets/images/icon-72x72.png",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// 通知点击处理
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/claude-introduce/"));
  }
});

console.log("🎯 Service Worker 加载完成");
