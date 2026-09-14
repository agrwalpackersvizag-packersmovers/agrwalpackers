/* ==========================================================================
   Agarwal Packers Movers India — animations.js
   Purely presentational enhancement layered on top of main.js. Nothing here
   gates content: every element it touches is already visible in the base
   CSS, this file only adds motion on top. If GSAP fails to load, or the
   visitor asks for reduced motion, the site still reads and works exactly
   the same — just still.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Generic scroll-reveal (IntersectionObserver, no GSAP needed) ───── */
  (function revealOnScroll() {
    var groups = document.querySelectorAll('[data-reveal-group]');
    Array.prototype.forEach.call(groups, function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.setAttribute('data-reveal', '');
        child.style.setProperty('--reveal-i', i);
      });
    });

    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  })();

  /* ── 2. Header: compact on scroll ───────────────────────────────────────── */
  (function headerScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ── 3. Animated stat counters — only for genuine numeric values ───────── */
  (function statCounters() {
    var stats = document.querySelectorAll('.stat-value');
    if (!stats.length) return;

    function animate(el) {
      var raw = el.textContent.trim();
      var m = raw.match(/^([\d,]+)(.*)$/);
      if (!m) return; /* placeholder like "[X]+" — leave untouched */
      var target = parseInt(m[1].replace(/,/g, ''), 10);
      var suffix = m[2] || '';
      if (!target || reduceMotion) return;

      var start = null;
      var duration = 1100;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target).toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = target.toLocaleString('en-IN') + suffix;
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(stats, function (el) { io.observe(el); });
  })();

  /* ── 4. Testimonial carousel arrows ─────────────────────────────────────── */
  (function reviewCarousel() {
    Array.prototype.forEach.call(document.querySelectorAll('.review-carousel'), function (carousel) {
      var track = carousel.querySelector('.review-grid');
      var prev = carousel.querySelector('[data-dir="prev"]');
      var next = carousel.querySelector('[data-dir="next"]');
      if (!track || (!prev && !next)) return;
      function step(dir) {
        var card = track.querySelector('.review-card');
        var amount = card ? card.getBoundingClientRect().width + 20 : 300;
        track.scrollBy({ left: dir * amount, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      if (prev) prev.addEventListener('click', function () { step(-1); });
      if (next) next.addEventListener('click', function () { step(1); });
    });
  })();

  /* ── 5. Journey progress line (works with or without GSAP) ─────────────── */
  (function journeyProgress() {
    var road = document.querySelector('[data-journey]');
    if (!road) return;
    var stages = road.querySelectorAll('.journey-stage');

    function setProgress(p) {
      p = Math.max(0, Math.min(1, p));
      road.style.setProperty('--progress', p);
      var n = stages.length;
      Array.prototype.forEach.call(stages, function (stage, i) {
        var threshold = n > 1 ? i / (n - 1) : 0;
        stage.classList.toggle('is-active', p >= threshold - 0.02);
      });
    }

    if (reduceMotion) { setProgress(1); return; }

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({
        trigger: road,
        start: 'top 78%',
        end: 'bottom 45%',
        scrub: 0.6,
        onUpdate: function (self) { setProgress(self.progress); }
      });
    } else {
      /* Fallback: plain scroll listener, same math, no smoothing library. */
      var ticking = false;
      function onScroll() {
        var rect = road.getBoundingClientRect();
        var vh = window.innerHeight;
        var total = rect.height + vh * 0.55;
        var passed = vh * 0.78 - rect.top;
        setProgress(passed / total);
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
      }, { passive: true });
      onScroll();
    }
  })();

  /* ── 6. Hero road-strip: the truck drives as you scroll the hero ───────── */
  (function heroTruck() {
    var strip = document.querySelector('[data-hero-truck]');
    if (!strip) return;
    var truck = strip.querySelector('.hero-truck');
    var wheels = strip.querySelectorAll('.wheel');
    var exhaust = strip.querySelector('.exhaust-puff');
    var hero = document.querySelector('.hero');
    if (!truck || !hero) return;

    var X_START = parseFloat(strip.getAttribute('data-x-start')) || 60;
    var X_END = parseFloat(strip.getAttribute('data-x-end')) || 1040;
    var WHEEL_TURNS = 4;

    function render(p) {
      p = Math.max(0, Math.min(1, p));
      var x = X_START + (X_END - X_START) * p;
      truck.setAttribute('transform', 'translate(' + x.toFixed(1) + ',0)');
      var rot = p * WHEEL_TURNS * 360;
      wheels.forEach(function (w) { w.style.transform = 'rotate(' + rot.toFixed(0) + 'deg)'; });
      if (exhaust) exhaust.style.opacity = String(Math.max(0, Math.min(1, Math.min(p * 8, (1 - p) * 8))));
    }

    if (reduceMotion) { render(0.5); return; }

    var isDesktop = window.matchMedia('(min-width: 768px)').matches;

    if (isDesktop && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: function (self) { render(self.progress); }
      });
    } else if (isDesktop) {
      var ticking = false;
      function onScroll() {
        var rect = hero.getBoundingClientRect();
        var total = rect.height - window.innerHeight;
        var p = total > 0 ? -rect.top / total : 0;
        render(p);
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
      }, { passive: true });
      onScroll();
    } else {
      /* Mobile: a single drive-in the first time the strip is visible. */
      render(0);
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var start = null;
            function frame(ts) {
              if (start === null) start = ts;
              var p = Math.min(1, (ts - start) / 1400);
              render((1 - Math.pow(1 - p, 3)) * 0.62);
              if (p < 1) requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
            io.unobserve(entry.target);
          });
        }, { threshold: 0.4 });
        io.observe(strip);
      } else {
        render(0.5);
      }
    }
  })();

  /* ── 7. Keep ScrollTrigger honest after late layout shifts ─────────────── */
  /* Self-hosted fonts swap in and lazy images resolve their intrinsic size
     after ScrollTrigger has already cached pixel start/end offsets. Refresh
     once everything has actually settled so those offsets are not stale. */
  if (window.ScrollTrigger) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  /* ── 8. Process steps: highlight as each one crosses the viewport ──────── */
  (function processSteps() {
    var tracks = document.querySelectorAll('.steps-track');
    if (!tracks.length || !('IntersectionObserver' in window)) return;
    Array.prototype.forEach.call(tracks, function (track) {
      var steps = track.querySelectorAll('.step');
      if (reduceMotion) {
        Array.prototype.forEach.call(steps, function (s) { s.classList.add('is-active'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-active', entry.isIntersecting);
        });
      }, { threshold: 0.5, rootMargin: '0px 0px -15% 0px' });
      Array.prototype.forEach.call(steps, function (s) { io.observe(s); });
    });
  })();
})();
