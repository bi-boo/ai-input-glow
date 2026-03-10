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
   * 找到容器后加上 class，仅此而已。
   * GLOW_ATTR 标记防止对同一元素重复处理。
   */
  function applyGlow() {
    const container = findContainer();
    if (!container || container.hasAttribute(GLOW_ATTR)) return;
    container.setAttribute(GLOW_ATTR, '');
    container.classList.add(GLOW_CLASS);
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
