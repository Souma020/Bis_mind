/* Know Your BIS - shared theme behaviour: header, theme reveal, slideshows, reveal-on-scroll */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IMG = ['steel-construction', 'water', 'gold-jewellery', 'electronics', 'power-lines', 'toys'];
  var url = function (n) { return "url('/assets/images/scene-" + n + ".webp')"; };

  /* Slideshow: crossfade + Ken Burns. root = element that becomes .ss */
  function Slideshow(root, names, opts) {
    opts = opts || {};
    this.root = root; this.names = names; this.i = -1; this.iv = opts.interval || 6500;
    this.onChange = opts.onChange; this.timer = null; this.visible = true; this.manual = false;
    var self = this;
    root.classList.add('ss');
    root.style.setProperty('--iv', this.iv + 'ms');
    root.style.setProperty('--dur', (this.iv * 1.6 / 1000) + 's');
    this.slides = names.map(function (n) {
      var s = document.createElement('div'); s.className = 'ss-slide';
      var im = document.createElement('div'); im.className = 'ss-img'; im.style.setProperty('--img', url(n));
      s.appendChild(im); root.appendChild(s); return s;
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        self.visible = e[0].isIntersecting;
        root.classList.toggle('is-paused', !self.visible);
        if (self.visible) self.schedule(); else clearTimeout(self.timer);
      }, { threshold: 0.05 }).observe(root);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(self.timer); else self.schedule();
    });
    this.go(0);
  }
  Slideshow.prototype.go = function (n) {
    var len = this.slides.length; n = (n + len) % len;
    var prev = this.slides[this.i], cur = this.slides[n];
    if (prev && prev !== cur) { prev.classList.remove('on'); prev.classList.add('leaving'); setTimeout(function () { prev.classList.remove('leaving'); }, 1800); }
    cur.classList.add('on'); this.i = n;
    if (this.onChange) this.onChange(n);
    this.schedule();
  };
  Slideshow.prototype.schedule = function () {
    var self = this; clearTimeout(this.timer);
    if (reduce || !this.visible || document.hidden) return;
    this.timer = setTimeout(function () { self.go(self.i + 1); }, this.iv);
  };
  window.KYBSlideshow = Slideshow; window.KYB_IMAGES = IMG;

  function bannerSlides() {
    document.querySelectorAll('.page-banner[data-ss]').forEach(function (b) {
      var holder = document.createElement('div');
      b.insertBefore(holder, b.firstChild);
      var names = b.getAttribute('data-ss').split(',');
      var cap = b.querySelector('.pb-cap-text');
      var labels = { 'steel-construction': 'Construction steel', water: 'Packaged water', 'gold-jewellery': 'Gold hallmarking', electronics: 'Electronics', 'power-lines': 'Power & cables', toys: 'Toy safety' };
      var bar = b.querySelector('.pfill');
      new Slideshow(holder, names, { interval: 7000, onChange: function (n) {
        if (cap) cap.textContent = labels[names[n]] || '';
        if (bar) { bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); }
      } });
      if (bar) bar.parentNode.style.setProperty('--iv', '7000ms');
    });
  }

  function header() {
    var h = document.querySelector('header.navbar'); if (!h) return;
    var bar = document.createElement('div'); bar.className = 'page-progress'; document.body.appendChild(bar);
    var tick = false;
    function onScroll() {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
        h.classList.toggle('scrolled', y > 8);
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
        tick = false;
      });
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    var ul = document.querySelector('.nav-links'); if (!ul) return;
    var pill = document.createElement('span'); pill.className = 'nav-pill'; ul.appendChild(pill);
    function move(a) {
      if (!a || getComputedStyle(ul).position === 'static' || innerWidth <= 768) { pill.style.opacity = 0; return; }
      var r = a.getBoundingClientRect(), p = ul.getBoundingClientRect();
      pill.style.width = r.width + 'px'; pill.style.height = r.height + 'px';
      pill.style.transform = 'translate(' + (r.left - p.left) + 'px,' + (r.top - p.top) + 'px)'; pill.style.opacity = 1;
    }
    function home() { return ul.querySelector('a.active'); }
    ul.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { move(a); });
      a.addEventListener('focus', function () { move(a); });
    });
    ul.addEventListener('mouseleave', function () { move(home()); });
    addEventListener('resize', function () { move(home()); });
    setTimeout(function () { move(home()); }, 60);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { move(home()); });
  }

  /* Theme change with circular reveal (View Transitions API) */
  window.KYBSetTheme = function (next, ev) {
    var root = document.documentElement;
    var apply = function () { root.setAttribute('data-theme', next); try { localStorage.setItem('theme', next); } catch (e) {} };
    if (!document.startViewTransition || reduce) { apply(); return; }
    var b = document.getElementById('theme-toggle').getBoundingClientRect();
    var x = b.left + b.width / 2, y = b.top + b.height / 2;
    var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var t = document.startViewTransition(apply);
    t.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  };

  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* Auto-reveal: cards and sections on inner pages */
  function autoReveal() {
    document.querySelectorAll('main > .card, main > section.card, main > .chat-wrapper, main > #recommend-results').forEach(function (e) { e.classList.add('reveal'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    header(); bannerSlides(); autoReveal(); reveal();
    requestAnimationFrame(function () { document.body.classList.add('loaded'); });
  });
})();
