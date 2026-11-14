/* =========================================================
   入口封面页 · 交互
   - 入场时卡片带一点视差（跟随鼠标/手指倾斜）
   - 点击任意处进入主页
   - 支持回车/空格键进入
   - 尊重 prefers-reduced-motion
   ========================================================= */
(function () {
  'use strict';

  var cover = document.getElementById('cover');
  var card = document.getElementById('card');
  if (!cover || !card) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 0. 触发入场：先标记 js，再在下一帧加 play ---------- */
  document.documentElement.classList.add('js');
  // 双 rAF 保证浏览器先应用「起点」样式，过渡才会真正播放
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      cover.classList.add('play');
    });
  });

  /* ---------- 1. 鼠标视差：卡片轻微跟随倾斜 ---------- */
  if (fine && !reduce) {
    var raf = null;
    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };

    function loop() {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      // 用 CSS 变量叠加位移，避免覆盖过渡里的 transform
      card.style.setProperty('--tx', (current.x * 10).toFixed(2) + 'px');
      card.style.setProperty('--ty', (current.y * 8).toFixed(2) + 'px');
      if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    window.addEventListener('mousemove', function (e) {
      var nx = (e.clientX / window.innerWidth) * 2 - 1;
      var ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.x = Math.max(-1, Math.min(1, nx));
      target.y = Math.max(-1, Math.min(1, ny));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ---------- 2. 键盘可达：回车 / 空格 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      // <a> 本身已处理 Enter，这里补上空格与兜底
      e.preventDefault();
      go();
    }
  });

  /* ---------- 3. 点击进入（整屏都是 a） ---------- */
  function go() {
    if (cover.dataset.leaving) return;
    cover.dataset.leaving = '1';

    if (!reduce) {
      // 离开时卡片轻微放大淡出，形成「推门」的感觉
      cover.classList.add('leaving');
      setTimeout(function () { window.location.href = 'home.html'; }, 300);
    } else {
      window.location.href = 'home.html';
    }
  }

  cover.addEventListener('click', function (e) {
    e.preventDefault();
    go();
  });

  /* ---------- 4. 触屏：避免误触拖动后跳转 ---------- */
  var startX = 0, startY = 0;
  cover.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  cover.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0];
    var dx = Math.abs(t.clientX - startX);
    var dy = Math.abs(t.clientY - startY);
    if (dx > 24 || dy > 24) return; // 视为滑动，不跳转
    e.preventDefault();
    go();
  });

  /* ---------- 5. 预加载主页，跳转更顺 ---------- */
  window.addEventListener('load', function () {
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = 'home.html';
    document.head.appendChild(link);
  });
})();
