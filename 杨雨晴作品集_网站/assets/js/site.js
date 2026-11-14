/* =========================================================
   杨雨晴 · 作品集
   交互：滚动状态、移动菜单、入场动画、
        导航高亮、章节锚点高亮、数字滚动
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 移动端菜单 ---------- */
  var burger = document.getElementById('burger');
  var tabs = document.getElementById('tabs');

  function closeMenu() {
    if (!tabs || !burger) return;
    tabs.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }

  if (burger && tabs) {
    burger.addEventListener('click', function () {
      var open = tabs.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    tabs.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  /* ---------- 2. 顶栏滚动态 ---------- */
  var topbar = document.getElementById('topbar');
  function syncBar() {
    if (topbar) topbar.classList.toggle('is-scrolled', window.scrollY > 6);
  }
  window.addEventListener('scroll', syncBar, { passive: true });
  syncBar();

  /* ---------- 3. 入场动画 ---------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));

  if (!('IntersectionObserver' in window) || reduce) {
    rvs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    rvs.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. 首页：顶部导航 + 左侧目录高亮 ---------- */
  // 顶部导航只关心 4 个主板块；左侧目录同样映射到这 4 个板块
  var homeTabs = tabs ? Array.prototype.slice.call(tabs.querySelectorAll('a[href^="#"]')) : [];
  var sideToc = document.getElementById('toc');
  var tocLinks = sideToc ? Array.prototype.slice.call(sideToc.querySelectorAll('.toc-list a[href^="#"]')) : [];

  var tracked = ['about', 'works', 'path', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ((homeTabs.length || tocLinks.length) && tracked.length) {
    var syncTabs = function () {
      // 以视口中上部为判定线，最后一块滚到底时强制高亮最后一项
      var pos = window.scrollY + window.innerHeight * 0.3;
      var current = '';
      tracked.forEach(function (s) {
        if (s.offsetTop <= pos) current = s.id;
      });
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 8) {
        current = tracked[tracked.length - 1].id;
      }

      homeTabs.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + current;
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });

      var activeLink = null;
      tocLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + current;
        a.classList.toggle('is-active', on);
        if (on) activeLink = a;
      });

      // 窄屏横向目录：让当前项滚进可视区
      if (activeLink && sideToc.scrollWidth > sideToc.clientWidth + 2 && activeLink.scrollIntoView) {
        activeLink.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    };

    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      // rAF 在部分环境（含无头浏览器）调度不稳定，加 setTimeout 兜底
      var run = function () { syncTabs(); tick = false; };
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(run);
        window.setTimeout(run, 60);
      } else {
        run();
      }
    }, { passive: true });
    window.addEventListener('resize', syncTabs, { passive: true });
    syncTabs();
  }

  /* ---------- 5. 详情页：章节锚点高亮 ---------- */
  var caseNav = document.getElementById('caseNav');
  if (caseNav) {
    var links = Array.prototype.slice.call(caseNav.querySelectorAll('a'));
    var chapters = links.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);

    if (chapters.length) {
      var offset = 66 + 48;

      var syncCase = function () {
        var pos = window.scrollY + offset + 24;
        var active = null;
        chapters.forEach(function (c) {
          if (c.offsetTop <= pos) active = c.id;
        });
        // 滚动到底部时高亮最后一节
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
          active = chapters[chapters.length - 1].id;
        }
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + active);
        });
      };

      var t2 = false;
      window.addEventListener('scroll', function () {
        if (t2) return;
        t2 = true;
        window.requestAnimationFrame(function () { syncCase(); t2 = false; });
      }, { passive: true });
      syncCase();

      // 横向导航：让当前项滚入视野
      links.forEach(function (a) {
        a.addEventListener('click', function () {
          if (a.scrollIntoView) {
            a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
          }
        });
      });
    }
  }

  /* ---------- 6. 数字滚动（首页 stats） ---------- */
  var nums = Array.prototype.slice.call(document.querySelectorAll('.stat .k'));
  if (nums.length && !reduce && 'IntersectionObserver' in window) {
    var digits = nums.map(function (el) {
      var txt = el.textContent.trim();
      var m = txt.match(/^(\d+)/);
      return m ? { el: el, target: parseInt(m[1], 10), pad: m[1].length, raw: txt } : null;
    }).filter(Boolean);

    var numIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var item = digits.find(function (d) { return d.el === en.target; });
        if (!item) return;
        numIO.unobserve(en.target);

        var start = performance.now();
        var dur = 900;
        var raw = item.raw;
        var suffix = raw.replace(/^\d+/, '');

        function step(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = Math.round(item.target * eased);
          // 动画过程中不做补零，避免出现「036 页」这类中间态
          item.el.innerHTML = String(val) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else item.el.innerHTML = raw;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });

    digits.forEach(function (d) { numIO.observe(d.el); });
  }

  /* ---------- 7. 页脚年份 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 8. 图片加载失败兜底：显示占位提示 ---------- */
  Array.prototype.slice.call(document.querySelectorAll('img')).forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.dataset.failed) return;
      img.dataset.failed = '1';
      img.style.background = '#e9e3d7';
      img.alt = img.alt + '（图片待补充）';
    });
  });
})();
