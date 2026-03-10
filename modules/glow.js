/**
 * glow.js - 唯一 JS 文件
 * 职责：找到输入框容器 → 加 .ai-glow-active class → 结束
 * 不设置任何内联样式（overflow / position 等），不做无关功能
 */
(function () {
  'use strict';

  const GLOW_CLASS = 'ai-glow-active';
  const GLOW_ATTR  = 'data-ai-glow';   // 标记已处理的元素，防止重复添加
  const { hostname } = window.location;

  /**
   * 根据当前站点，用多级回退选择器找到输入框容器。
   *
   * ChatGPT：优先从稳定的 #prompt-textarea 向上找容器，
   *          fallback 到直接选择器。
   * Gemini：input-area-v2 是自定义元素名，非常稳定。
   * Grok：div.query-bar 是语义化 class，较稳定。
   */
  function findContainer() {
    if (hostname.includes('chatgpt.com')) {
      const textarea = document.querySelector('#prompt-textarea');
      if (textarea) {
        return (
          textarea.closest('[class*="shadow-short"]') ||
          textarea.closest('[class*="bg-token-bg-primary"]') ||
          textarea.closest('form')
        );
      }
      // DOM 还未加载 textarea 时的直接 fallback
      return document.querySelector('[class*="bg-token-bg-primary"][class*="shadow-short"]');
    }

    if (hostname.includes('gemini.google.com')) {
      return document.querySelector('input-area-v2');
    }

    if (hostname.includes('grok.com') || hostname.includes('x.ai')) {
      return document.querySelector('div.query-bar');
    }

    return null;
  }

  /**
   * 找到容器后加上 class。
   *
   * GLOW_ATTR 标记"已设置过监听器的容器"，防止重复绑定。
   * class 的存在性单独检查，以便在 React 重置 className 后能补回来。
   */
  function applyGlow() {
    const container = findContainer();
    if (!container) return;

    // 首次发现此容器：标记 + 添加 class 属性监听器
    if (!container.hasAttribute(GLOW_ATTR)) {
      container.setAttribute(GLOW_ATTR, '');
      // 监听 class 属性变化：React 重置 className 时立即补回 glow class
      new MutationObserver(function () {
        if (!container.classList.contains(GLOW_CLASS)) {
          container.classList.add(GLOW_CLASS);
        }
      }).observe(container, { attributes: true, attributeFilter: ['class'] });
    }

    // 确保 class 存在（首次 or 被 React 移除后重新触发时）
    if (!container.classList.contains(GLOW_CLASS)) {
      container.classList.add(GLOW_CLASS);
    }
  }

  // 初次执行：DOM 已就绪则立即运行，否则等待
  if (document.readyState !== 'loading') {
    applyGlow();
  } else {
    document.addEventListener('DOMContentLoaded', applyGlow, { once: true });
  }

  // MutationObserver：只用来捕捉 SPA 导航后新出现的输入框容器
  // 用 requestAnimationFrame 节流，避免高频触发
  let rafPending = false;
  const observer = new MutationObserver(function () {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      applyGlow();
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
