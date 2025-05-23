// Claude 4 深度解析 - 主要交互脚本
// Spotify 风格的现代 Web 体验

// 全局应用状态
window.ClaudeApp = {
  // 应用配置
  config: {
    animationDuration: 300,
    scrollOffset: 80,
    chartColors: {
      primary: "#1DB954",
      secondary: "#8B5CF6",
      tertiary: "#3B82F6",
      quaternary: "#EC4899",
    },
  },

  // 状态管理
  state: {
    isDarkMode: true,
    isScrolled: false,
    currentSection: "hero",
    mobileMenuOpen: false,
  },

  // 初始化应用
  init() {
    this.setupEventListeners();
    this.initializeAnimations();
    this.setupIntersectionObserver();
    this.initializeTheme();
    console.log("🚀 Claude 4 深度解析应用已初始化");
  },

  // 设置事件监听器
  setupEventListeners() {
    // 滚动事件
    window.addEventListener("scroll", this.throttle(this.handleScroll.bind(this), 16));

    // 窗口大小改变
    window.addEventListener("resize", this.debounce(this.handleResize.bind(this), 250));

    // 键盘导航
    document.addEventListener("keydown", this.handleKeyNavigation.bind(this));

    // 点击事件委托
    document.addEventListener("click", this.handleClick.bind(this));

    // 表单事件
    document.addEventListener("submit", this.handleFormSubmit.bind(this));
  },

  // 处理滚动事件
  handleScroll() {
    const scrollY = window.pageYOffset;
    const isScrolled = scrollY > 100;

    if (isScrolled !== this.state.isScrolled) {
      this.state.isScrolled = isScrolled;
      this.updateScrollState();
    }

    // 更新导航高亮
    this.updateActiveNavigation(scrollY);

    // 视差效果
    this.updateParallaxEffects(scrollY);
  },

  // 更新滚动状态
  updateScrollState() {
    const header = document.querySelector("nav");
    if (header) {
      header.classList.toggle("scrolled", this.state.isScrolled);
    }

    // 显示/隐藏返回顶部按钮
    const scrollTopBtn = document.querySelector('[x-show="showScrollTop"]');
    if (scrollTopBtn) {
      const event = new CustomEvent("scroll-state-change", {
        detail: { isScrolled: this.state.isScrolled },
      });
      window.dispatchEvent(event);
    }
  },

  // 更新导航高亮
  updateActiveNavigation(scrollY) {
    const sections = document.querySelectorAll("section[id]");
    let currentSection = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - this.config.scrollOffset;
      const sectionHeight = section.offsetHeight;

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSection = section.id;
      }
    });

    if (currentSection !== this.state.currentSection) {
      this.state.currentSection = currentSection;
      this.highlightNavigation(currentSection);
    }
  },

  // 高亮导航项
  highlightNavigation(sectionId) {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach((link) => {
      const href = link.getAttribute("href").substring(1);
      link.classList.toggle("active", href === sectionId);
    });
  },

  // 视差效果
  updateParallaxEffects(scrollY) {
    const parallaxElements = document.querySelectorAll("[data-parallax]");

    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.dataset.parallax) || 0.5;
      const yPos = -(scrollY * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  },

  // 处理窗口大小改变
  handleResize() {
    // 重新初始化图表
    if (typeof Chart !== "undefined") {
      Chart.helpers.each(Chart.instances, (instance) => {
        instance.resize();
      });
    }

    // 移动端菜单处理
    if (window.innerWidth >= 768 && this.state.mobileMenuOpen) {
      this.state.mobileMenuOpen = false;
      this.updateMobileMenu();
    }
  },

  // 键盘导航
  handleKeyNavigation(event) {
    switch (event.key) {
      case "Escape":
        this.closeMobileMenu();
        this.closeModals();
        break;
      case "Tab":
        this.handleTabNavigation(event);
        break;
      case "Enter":
      case " ":
        if (event.target.hasAttribute("data-action")) {
          event.preventDefault();
          this.handleActionClick(event.target);
        }
        break;
    }
  },

  // 处理点击事件
  handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (target) {
      event.preventDefault();
      this.handleActionClick(target);
    }

    // 处理平滑滚动
    const scrollLink = event.target.closest('a[href^="#"]');
    if (scrollLink) {
      event.preventDefault();
      this.smoothScrollTo(scrollLink.getAttribute("href"));
    }
  },

  // 处理动作点击
  handleActionClick(element) {
    const action = element.dataset.action;
    const target = element.dataset.target;

    switch (action) {
      case "toggle-theme":
        this.toggleTheme();
        break;
      case "toggle-mobile-menu":
        this.toggleMobileMenu();
        break;
      case "copy-code":
        this.copyCode(target);
        break;
      case "share":
        this.shareContent(target);
        break;
      case "scroll-to-top":
        this.smoothScrollTo("#top");
        break;
      default:
        console.warn("未知的动作:", action);
    }
  },

  // 平滑滚动
  smoothScrollTo(target) {
    let targetElement;

    if (target === "#top") {
      targetElement = document.body;
    } else {
      targetElement = document.querySelector(target);
    }

    if (targetElement) {
      const targetTop = target === "#top" ? 0 : targetElement.offsetTop - this.config.scrollOffset;

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    }
  },

  // 主题切换
  toggleTheme() {
    this.state.isDarkMode = !this.state.isDarkMode;
    this.updateTheme();

    // 保存到本地存储
    localStorage.setItem("claude-theme", this.state.isDarkMode ? "dark" : "light");

    // 触发主题变更事件
    const event = new CustomEvent("theme-change", {
      detail: { isDarkMode: this.state.isDarkMode },
    });
    window.dispatchEvent(event);
  },

  // 更新主题
  updateTheme() {
    document.documentElement.classList.toggle("light-mode", !this.state.isDarkMode);

    // 更新主题切换按钮状态
    const themeToggles = document.querySelectorAll('[data-action="toggle-theme"]');
    themeToggles.forEach((toggle) => {
      toggle.classList.toggle("active", !this.state.isDarkMode);
    });
  },

  // 初始化主题
  initializeTheme() {
    const savedTheme = localStorage.getItem("claude-theme");
    if (savedTheme) {
      this.state.isDarkMode = savedTheme === "dark";
    } else {
      // 检测系统主题偏好
      this.state.isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    this.updateTheme();
  },

  // 移动端菜单切换
  toggleMobileMenu() {
    this.state.mobileMenuOpen = !this.state.mobileMenuOpen;
    this.updateMobileMenu();
  },

  // 更新移动端菜单
  updateMobileMenu() {
    const mobileMenu = document.querySelector("[data-mobile-menu]");
    const menuToggle = document.querySelector('[data-action="toggle-mobile-menu"]');

    if (mobileMenu) {
      mobileMenu.classList.toggle("open", this.state.mobileMenuOpen);
    }

    if (menuToggle) {
      menuToggle.classList.toggle("active", this.state.mobileMenuOpen);
    }

    // 防止背景滚动
    document.body.style.overflow = this.state.mobileMenuOpen ? "hidden" : "";
  },

  // 关闭移动端菜单
  closeMobileMenu() {
    if (this.state.mobileMenuOpen) {
      this.state.mobileMenuOpen = false;
      this.updateMobileMenu();
    }
  },

  // 复制代码
  async copyCode(target) {
    const codeElement = target
      ? document.querySelector(target)
      : event.target.closest(".code-block")?.querySelector("code");

    if (codeElement) {
      try {
        await navigator.clipboard.writeText(codeElement.textContent);
        this.showToast("代码已复制到剪贴板", "success");
      } catch (err) {
        console.error("复制失败:", err);
        this.showToast("复制失败，请手动选择复制", "error");
      }
    }
  },

  // 分享内容
  async shareContent(url = window.location.href) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Claude 4 横空出世：AI 编程新王者如何重塑开发生态",
          text: "Claude 4 深度技术解析，全面解读AI编程助手的革命性升级",
          url: url,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("分享失败:", err);
        }
      }
    } else {
      // 回退到复制链接
      try {
        await navigator.clipboard.writeText(url);
        this.showToast("链接已复制到剪贴板", "success");
      } catch (err) {
        console.error("复制链接失败:", err);
      }
    }
  },

  // 显示提示消息
  showToast(message, type = "info", duration = 3000) {
    // 移除现有的 toast
    const existingToast = document.querySelector(".toast");
    if (existingToast) {
      existingToast.remove();
    }

    // 创建新的 toast
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // 添加样式
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#1DB954"};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      max-width: 320px;
    `;

    document.body.appendChild(toast);

    // 自动移除
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = "slideOut 0.3s ease-out forwards";
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  // 初始化动画
  initializeAnimations() {
    // 添加动画样式
    if (!document.querySelector("#claude-animations")) {
      const style = document.createElement("style");
      style.id = "claude-animations";
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .toast-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `;
      document.head.appendChild(style);
    }
  },

  // 设置交叉观察器
  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "-50px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up");
          // 可以在这里添加其他进入视口的动画
        }
      });
    }, observerOptions);

    // 观察需要动画的元素
    const animateElements = document.querySelectorAll("[data-animate]");
    animateElements.forEach((el) => observer.observe(el));
  },

  // 工具函数：节流
  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // 工具函数：防抖
  debounce(func, wait, immediate) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  },

  // 处理表单提交
  handleFormSubmit(event) {
    const form = event.target;
    if (form.hasAttribute("data-ajax")) {
      event.preventDefault();
      this.submitFormAjax(form);
    }
  },

  // Ajax 表单提交
  async submitFormAjax(form) {
    const formData = new FormData(form);
    const submitButton = form.querySelector('[type="submit"]');

    // 显示加载状态
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "提交中...";
    }

    try {
      const response = await fetch(form.action || window.location.href, {
        method: form.method || "POST",
        body: formData,
      });

      if (response.ok) {
        this.showToast("提交成功！", "success");
        form.reset();
      } else {
        throw new Error("提交失败");
      }
    } catch (error) {
      console.error("表单提交错误:", error);
      this.showToast("提交失败，请重试", "error");
    } finally {
      // 恢复按钮状态
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "提交";
      }
    }
  },

  // 关闭所有模态框
  closeModals() {
    const modals = document.querySelectorAll("[data-modal]");
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
  },

  // Tab 导航处理
  handleTabNavigation(event) {
    // 确保焦点在可见元素内循环
    const focusableElements = document.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const visibleElements = Array.from(focusableElements).filter((el) => {
      return el.offsetWidth > 0 && el.offsetHeight > 0;
    });

    if (visibleElements.length === 0) return;

    const currentIndex = visibleElements.indexOf(document.activeElement);

    if (event.shiftKey) {
      // Shift + Tab (向后)
      if (currentIndex <= 0) {
        event.preventDefault();
        visibleElements[visibleElements.length - 1].focus();
      }
    } else {
      // Tab (向前)
      if (currentIndex >= visibleElements.length - 1) {
        event.preventDefault();
        visibleElements[0].focus();
      }
    }
  },
};

// 等待 DOM 加载完成后初始化应用
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ClaudeApp.init();
  });
} else {
  ClaudeApp.init();
}

// 导出到全局作用域
window.ClaudeApp = ClaudeApp;

// SEO 优化扩展模块
window.ClaudeApp.SEO = {
  // 初始化SEO功能
  init() {
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.trackPageViews();
    this.setupRichSnippets();
    this.monitorPerformance();
    this.setupSocialSharing();
    console.log("🔍 SEO 优化模块已初始化");
  },

  // 懒加载设置
  setupLazyLoading() {
    if ("IntersectionObserver" in window) {
      const lazyImages = document.querySelectorAll("img[data-src], iframe[data-src]");

      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target;
              if (element.dataset.src) {
                element.src = element.dataset.src;
                element.removeAttribute("data-src");
                element.classList.remove("lazy");
                observer.unobserve(element);
              }
            }
          });
        },
        {
          rootMargin: "50px 0px",
          threshold: 0.1,
        }
      );

      lazyImages.forEach((image) => imageObserver.observe(image));
    }
  },

  // 图片优化
  setupImageOptimization() {
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      // 添加loading属性
      if (!img.hasAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }

      // 添加decode属性
      if (!img.hasAttribute("decoding")) {
        img.setAttribute("decoding", "async");
      }

      // 处理图片加载错误
      img.addEventListener("error", () => {
        img.style.display = "none";
        console.warn(`图片加载失败: ${img.src}`);
      });
    });
  },

  // 页面浏览量统计
  trackPageViews() {
    // 发送页面浏览事件到Google Analytics（如果存在）
    if (typeof gtag !== "undefined") {
      gtag("config", "GA_MEASUREMENT_ID", {
        page_title: document.title,
        page_location: window.location.href,
      });
    }

    // 记录阅读进度
    this.trackReadingProgress();
  },

  // 阅读进度追踪
  trackReadingProgress() {
    const article = document.querySelector("main");
    if (!article) return;

    let maxScrollPercentage = 0;
    const readingMilestones = [25, 50, 75, 100];
    const triggeredMilestones = new Set();

    const calculateScrollPercentage = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      return Math.round((scrollTop / docHeight) * 100);
    };

    const handleScroll = ClaudeApp.throttle(() => {
      const scrollPercentage = calculateScrollPercentage();
      maxScrollPercentage = Math.max(maxScrollPercentage, scrollPercentage);

      readingMilestones.forEach((milestone) => {
        if (scrollPercentage >= milestone && !triggeredMilestones.has(milestone)) {
          triggeredMilestones.add(milestone);

          // 发送阅读进度事件
          if (typeof gtag !== "undefined") {
            gtag("event", "reading_progress", {
              event_category: "engagement",
              event_label: `${milestone}%`,
              value: milestone,
            });
          }

          console.log(`📖 阅读进度: ${milestone}%`);
        }
      });
    }, 250);

    window.addEventListener("scroll", handleScroll);
  },

  // 设置富文本片段
  setupRichSnippets() {
    // 添加面包屑导航结构化数据
    this.addBreadcrumbSchema();

    // 添加FAQ结构化数据
    this.addFAQSchema();

    // 添加阅读时间
    this.addReadingTime();
  },

  // 面包屑结构化数据
  addBreadcrumbSchema() {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "首页",
          item: window.location.origin,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Claude 4 深度解析",
          item: window.location.href,
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);
  },

  // FAQ结构化数据
  addFAQSchema() {
    const faqs = [
      {
        question: "Claude 4 和 Claude 3.5 有什么区别？",
        answer:
          "Claude 4 在SWE-bench测试中达到72.5%-72.7%的成绩，相比Claude 3.5有显著提升。主要改进包括扩展思维、并行工具执行、增强记忆等五大核心功能。",
      },
      {
        question: "Claude Code 如何与 IDE 集成？",
        answer:
          "Claude Code 提供VS Code和JetBrains的Beta扩展，支持内联编辑界面和GitHub Actions集成。可以通过运行 /install-github-app 命令安装GitHub应用。",
      },
      {
        question: "Claude 4 的定价策略是什么？",
        answer:
          "Claude Sonnet 4 输入价格为$3/百万token，输出价格为$15/百万token。Claude Opus 4 输入价格为$15/百万token，输出价格为$75/百万token。",
      },
    ];

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);
  },

  // 添加阅读时间
  addReadingTime() {
    const article = document.querySelector("main");
    if (!article) return;

    const text = article.textContent || "";
    const wordsPerMinute = 200; // 中文阅读速度约200字/分钟
    const readingTime = Math.ceil(text.length / wordsPerMinute);

    // 更新页面中的阅读时间显示
    const readingTimeElements = document.querySelectorAll("[data-reading-time]");
    readingTimeElements.forEach((element) => {
      element.textContent = `约 ${readingTime} 分钟阅读`;
    });
  },

  // 性能监控
  monitorPerformance() {
    // 监控Core Web Vitals
    if ("web-vital" in window) {
      const sendToAnalytics = (metric) => {
        if (typeof gtag !== "undefined") {
          gtag("event", metric.name, {
            event_category: "Web Vitals",
            value: Math.round(metric.value),
            non_interaction: true,
          });
        }
      };

      // 监控关键性能指标
      ["CLS", "FID", "FCP", "LCP", "TTFB"].forEach((metric) => {
        if (typeof webVitals !== "undefined" && webVitals[`get${metric}`]) {
          webVitals[`get${metric}`](sendToAnalytics);
        }
      });
    }

    // 页面加载性能
    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation) {
        console.log("⚡ 页面性能指标:", {
          DNS查询: `${navigation.domainLookupEnd - navigation.domainLookupStart}ms`,
          TCP连接: `${navigation.connectEnd - navigation.connectStart}ms`,
          页面加载: `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
          DOM准备: `${navigation.domContentLoadedEventEnd - navigation.navigationStart}ms`,
        });
      }
    });
  },

  // 社交分享设置
  setupSocialSharing() {
    // 动态更新分享链接
    const shareButtons = document.querySelectorAll("[data-share]");
    shareButtons.forEach((button) => {
      const platform = button.dataset.share;
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      const description = encodeURIComponent(document.querySelector('meta[name="description"]')?.content || "");

      let shareUrl = "";
      switch (platform) {
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
          break;
        case "weibo":
          shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${title}`;
          break;
      }

      if (shareUrl) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(shareUrl, "_blank", "width=600,height=400");
        });
      }
    });
  },

  // 生成站点地图数据
  generateSitemapData() {
    const pages = [
      {
        url: window.location.origin + window.location.pathname,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: "1.0",
      },
    ];

    // 添加锚点链接
    const anchors = document.querySelectorAll("[id]");
    anchors.forEach((anchor) => {
      if (anchor.id && anchor.id !== "top") {
        pages.push({
          url: `${window.location.origin}${window.location.pathname}#${anchor.id}`,
          lastmod: new Date().toISOString(),
          changefreq: "monthly",
          priority: "0.8",
        });
      }
    });

    return pages;
  },
};

// 初始化SEO模块
document.addEventListener("DOMContentLoaded", () => {
  ClaudeApp.SEO.init();
});

// Service Worker 注册（用于PWA和缓存优化）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/claude-introduce/sw.js")
      .then((registration) => {
        console.log("💾 Service Worker 注册成功:", registration);
      })
      .catch((error) => {
        console.log("❌ Service Worker 注册失败:", error);
      });
  });
}
