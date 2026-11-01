/* Know Your BIS - home page interactions */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var SCENES = [
    { img: 'steel-construction', label: 'Construction steel', head: 'Steel that holds buildings up.', sub: 'TMT bars and structural steel need IS 1786 conformity before they reach a site.', href: '/assistant?q=' + encodeURIComponent('Is IS 1786 mandatory for TMT steel rebar?'), cta: 'Ask about IS 1786' },
    { img: 'water', label: 'Packaged water', head: 'Safe water, tested and marked.', sub: 'Packaged drinking water must carry the ISI mark under IS 14543.', href: '/assistant?q=' + encodeURIComponent('What are the testing requirements for Packaged Drinking Water IS 14543?'), cta: 'Ask about IS 14543' },
    { img: 'gold-jewellery', label: 'Gold hallmarking', head: 'Every piece, a six-digit identity.', sub: 'Hallmarked jewellery carries a unique HUID you can verify.', href: '/assistant?q=' + encodeURIComponent('How does Gold Hallmarking 6 digit HUID work?'), cta: 'Ask about HUID' },
    { img: 'electronics', label: 'Electronics', head: 'Registered before it is sold.', sub: 'Many electronics and IT products need BIS registration under CRS.', href: '/recommend?q=' + encodeURIComponent('LED bulb'), cta: 'Find standards' },
    { img: 'power-lines', label: 'Power & cables', head: 'Cables built to carry the load.', sub: 'Wires, cables and fittings have mandatory safety standards.', href: '/recommend?q=' + encodeURIComponent('electric cables and wires'), cta: 'Find standards' },
    { img: 'toys', label: 'Toy safety', head: 'Toys that are safe to play with.', sub: 'Toy safety rules apply to makers and importers alike.', href: '/recommend?q=' + encodeURIComponent('I manufacture electric toy cars'), cta: 'Check toy safety' }
  ];
  var VERDICTS = [
    { n: 'IS 1786', t: 'High strength deformed steel bars and wires for concrete reinforcement', s: 'mandatory', c: 'Construction steel', test: 'Tensile, bend, rebend, chemical', q: 'Is IS 1786 mandatory for TMT steel rebar?' },
    { n: 'IS 14543', t: 'Packaged drinking water (other than packaged natural mineral water)', s: 'mandatory', c: 'Food & water', test: 'Microbiological, chemical, physical', q: 'What are the testing requirements for Packaged Drinking Water IS 14543?' },
    { n: 'IS 1417', t: 'Gold and gold alloys, jewellery and artefacts: fineness and marking', s: 'mandatory', c: 'Gold hallmarking', test: 'Fineness by fire assay or XRF', q: 'How does Gold Hallmarking 6 digit HUID work?' },
    { n: 'IS 15644', t: 'Safety of toys: general requirements', s: 'mandatory', c: 'Toys', test: 'Mechanical, flammability, chemical', q: 'Toy safety QCO requirements' }
  ];
  var PHS = ['Search IS numbers, products, or ask compliance questions...', 'Try: IS 1786', 'Try: packaged drinking water', 'Try: gold hallmarking', 'Try: LED bulb'];
  var GREETS = [['नमस्ते', 'हिन्दी', 'hi'], ['নমস্কার', 'বাংলা', 'bn'], ['नमस्कार', 'मराठी', 'mr'], ['வணக்கம்', 'தமிழ்', 'ta'], ['నమస్కారం', 'తెలుగు', 'te'], ['નમસ્તે', 'ગુજરાતી', 'gu'], ['ನಮಸ್ಕಾರ', 'ಕನ್ನಡ', 'kn'], ['Hello', 'English', 'en']];
  var ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v6c0 5 3.8 8.2 9 9 5.2-.8 9-4 9-9V7z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>';

  function hero() {
    var band = $('.hero-band'); if (!band) return;
    // particles
    var pw = $('.particles', band);
    if (pw && !reduce) {
      var cols = ['#FFD08A', '#fff', '#FF9933', '#8CF0C6'];
      for (var i = 0; i < 26; i++) {
        var p = document.createElement('i'); p.className = 'pt'; var s = 3 + Math.random() * 5;
        p.style.cssText = 'left:' + Math.random() * 100 + '%;width:' + s + 'px;height:' + s + 'px;--c:' + cols[i % 4] + ';--t:' + (9 + Math.random() * 9) + 's;--dl:-' + Math.random() * 14 + 's;--dx:' + (Math.random() * 120 - 60) + 'px';
        pw.appendChild(p);
      }
    }
    // pointer parallax + glow
    if (!reduce && matchMedia('(hover:hover)').matches) {
      band.addEventListener('pointermove', function (e) {
        var r = band.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        band.style.setProperty('--px', (x - .5).toFixed(3)); band.style.setProperty('--py', (y - .5).toFixed(3));
        band.style.setProperty('--mx', (x * 100) + '%'); band.style.setProperty('--my', (y * 100) + '%');
      });
    }
    // typing placeholder
    var inp = $('#catalog-search-input'), ph = $('.ph', band);
    if (inp && ph) {
      var pi = 0, ci = 0, del = false, tm;
      var step = function () {
        if (document.activeElement === inp || inp.value) { ph.style.display = 'none'; tm = setTimeout(step, 600); return; }
        ph.style.display = '';
        var w = PHS[pi]; ph.firstChild.nodeValue = w.slice(0, ci);
        if (reduce) { ph.firstChild.nodeValue = PHS[0]; return; }
        if (!del && ci < w.length) { ci++; tm = setTimeout(step, 45); }
        else if (!del) { del = true; tm = setTimeout(step, 1600); }
        else if (ci > 0) { ci--; tm = setTimeout(step, 22); }
        else { del = false; pi = (pi + 1) % PHS.length; tm = setTimeout(step, 300); }
      };
      ph.insertBefore(document.createTextNode(''), ph.firstChild); step();
      inp.addEventListener('blur', function () { clearTimeout(tm); step(); });
    }
    var pill = $('.search-pill', band);
    var ai = $('#hero-ai-btn');
    if (ai) ai.addEventListener('click', function () {
      var q = inp && inp.value.trim();
      window.location.href = '/assistant' + (q ? '?q=' + encodeURIComponent(q) : '');
    });

    // slideshow in hero (background) + caption + quick tags
    var holder = $('.hero-bg .hero-ss', band), cap = $('.hero-cap-text', band), bar = $('.hero-cap .pfill', band);
    if (holder && window.KYBSlideshow) {
      var tags = $$('.qt.auto', band);
      band.__ss = new window.KYBSlideshow(holder, SCENES.map(function (s) { return s.img; }), {
        interval: 6500,
        onChange: function (n) {
          if (cap) cap.textContent = SCENES[n].label;
          if (bar) { bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); }
          tags.forEach(function (t, k) { t.classList.toggle('active', k === n % tags.length); });
        }
      });
    }
  }

  /* verdict plate with stamp */
  function plate() {
    var pl = $('.plate'); if (!pl) return;
    var v = $('.verdict', pl), line = $('.match-line .ml-text', pl), i = 0, paused = false;
    function render(k) {
      var d = VERDICTS[k];
      v.innerHTML = '<div><span class="stamp ' + d.s + '">' + (d.s === 'mandatory' ? 'Mandatory' : 'Voluntary') + '</span>' +
        '<div class="is-num"><span class="nm">IS</span> ' + esc(d.n.replace('IS ', '')) + '</div><p class="is-title">' + esc(d.t) + '</p></div>' +
        '<dl class="facts"><div class="fact"><dt>Category</dt><dd>' + esc(d.c) + '</dd></div>' +
        '<div class="fact"><dt>Tests</dt><dd>' + esc(d.test) + '</dd></div>' +
        '<div class="fact"><dt>Ask AI</dt><dd><a class="linklike" href="/assistant?q=' + encodeURIComponent(d.q) + '">' + esc(d.q) + '</a></dd></div></dl>';
      if (line) line.textContent = 'Example result: ' + d.n;
      v.classList.remove('out'); v.classList.add('in');
      var st = $('.stamp', v);
      if (st) { if (reduce) st.classList.add('static'); else setTimeout(function () { st.classList.add('hit'); pl.classList.remove('thud'); void pl.offsetWidth; pl.classList.add('thud'); }, 380); }
    }
    render(0);
    pl.addEventListener('mouseenter', function () { paused = true; });
    pl.addEventListener('mouseleave', function () { paused = false; });
    if (!reduce) setInterval(function () {
      if (paused || document.hidden) return;
      v.classList.add('out');
      setTimeout(function () { i = (i + 1) % VERDICTS.length; render(i); }, 240);
    }, 6500);
  }

  /* showcase: its own slideshow with text */
  function showcase() {
    var box = $('.showcase'); if (!box || !window.KYBSlideshow) return;
    var holder = $('.sc-ss', box), text = $('.sc-text', box), tabs = $$('.sc-tab', box);
    var kick = $('.sc-kick', text), h = $('h2', text), p = $('p', text), a = $('a', text);
    var ss = new window.KYBSlideshow(holder, SCENES.map(function (s) { return s.img; }), {
      interval: 7000,
      onChange: function (n) {
        var S = SCENES[n];
        tabs.forEach(function (t, k) {
          t.setAttribute('aria-pressed', k === n ? 'true' : 'false');
          var f = $('.pfill', t); f.classList.remove('run'); if (k === n) { void f.offsetWidth; f.classList.add('run'); }
        });
        text.classList.add('swapping');
        setTimeout(function () {
          kick.textContent = S.label; h.textContent = S.head; p.textContent = S.sub; a.textContent = S.cta; a.setAttribute('href', S.href);
          text.classList.remove('swapping'); text.classList.remove('fresh'); void text.offsetWidth; text.classList.add('fresh');
        }, n === 0 && !text.dataset.init ? 0 : 260);
        text.dataset.init = '1';
      }
    });
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { ss.go(k); }); });
  }

  function counts() {
    var els = $$('[data-count]'); if (!els.length) return;
    var run = function (el) {
      var to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), d = 1400;
      if (reduce) { el.textContent = to + suf; return; }
      (function f(t) { var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e) + suf; if (k < 1) requestAnimationFrame(f); })(t0);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: .5 });
    els.forEach(function (e) { io.observe(e); });
  }

  function marquee() {
    var tr = $('.mq-track'); if (!tr) return;
    tr.innerHTML = tr.innerHTML + tr.innerHTML;
  }

  /* featured standards rail from the real API */
  function rail() {
    var el = $('#feat-rail'); if (!el || !window.APIClient) return;
    var accents = ['#C4120F', '#0F7A06', '#A14F00', '#8E2B5F'];
    APIClient.searchStandards('', 'All').then(function (data) {
      var rows = (data && data.results || []).slice(0, 8);
      if (!rows.length) { el.parentNode.style.display = 'none'; return; }
      el.innerHTML = rows.map(function (s, k) {
        var mand = !!s.isMandatory;
        var num = String(s.isNumber || '').replace(/^IS\s*/i, '');
        return '<a class="fcard" style="--acc:' + accents[k % 4] + '" href="/assistant?q=' + encodeURIComponent('Tell me about IS ' + num) + '">' +
          '<span class="f-top"><span class="f-cat">' + esc(s.category || 'Standard') + '</span><span class="f-icon">' + ICON + '</span></span>' +
          '<span class="f-num"><small>IS</small> ' + esc(num) + '</span>' +
          '<span class="f-title">' + esc(s.title || s.name || '') + '</span>' +
          '<span class="f-foot"><span class="badge ' + (mand ? 'mandatory' : 'voluntary') + '">' + (mand ? 'Mandatory' : 'Voluntary') + '</span><span class="f-go">Ask AI <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></span></a>';
      }).join('');
      var prev = $('#rail-prev'), next = $('#rail-next');
      var upd = function () { prev.disabled = el.scrollLeft < 8; next.disabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8; };
      prev.onclick = function () { el.scrollBy({ left: -340, behavior: 'smooth' }); };
      next.onclick = function () { el.scrollBy({ left: 340, behavior: 'smooth' }); };
      el.addEventListener('scroll', upd, { passive: true }); upd();
      if (!reduce && matchMedia('(hover:hover)').matches) $$('.fcard', el).forEach(function (c) {
        c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.transform = 'perspective(800px) rotateX(' + ((.5 - (e.clientY - r.top) / r.height) * 6) + 'deg) rotateY(' + (((e.clientX - r.left) / r.width - .5) * 8) + 'deg) translateY(-4px)'; });
        c.addEventListener('pointerleave', function () { c.style.transform = ''; });
      });
    }).catch(function () { el.parentNode.style.display = 'none'; });
  }

  /* language band: sliding thumb + greeting letters */
  function langs() {
    var band = $('.lang-band'); if (!band) return;
    var chips = $('.lchips', band), thumb = $('.thumb', chips), btns = $$('.chip', chips);
    var g = $('.greet', band), gl = $('.greet-lang', band), dots = $('.gdots', band), cur = 0, hold = false;
    function mv(b) { var r = b.getBoundingClientRect(), p = chips.getBoundingClientRect(); thumb.style.width = r.width + 'px'; thumb.style.height = r.height + 'px'; thumb.style.transform = 'translate(' + (r.left - p.left) + 'px,' + (r.top - p.top) + 'px)'; thumb.style.opacity = 1; }
    function show(k) {
      cur = k; var d = GREETS[k]; g.textContent = '';
      Array.from(d[0]).forEach(function (ch, j) { var s = document.createElement('span'); s.className = 'gl'; s.textContent = ch; s.style.animationDelay = (j * 60) + 'ms'; g.appendChild(s); });
      g.setAttribute('lang', d[2]); gl.textContent = d[1];
      $$('i', dots).forEach(function (x, j) { x.classList.toggle('on', j === k); });
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === d[2] ? 'true' : 'false'); });
      var on = btns.filter(function (b) { return b.dataset.lang === d[2]; })[0]; if (on) mv(on);
    }
    GREETS.forEach(function () { dots.appendChild(document.createElement('i')); });
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        hold = true; try { localStorage.setItem('chat_language', b.dataset.lang); } catch (e) {}
        show(GREETS.findIndex(function (x) { return x[2] === b.dataset.lang; }));
      });
    });
    var saved; try { saved = localStorage.getItem('chat_language'); } catch (e) {}
    var si = GREETS.findIndex(function (x) { return x[2] === saved; }); show(si > -1 ? si : 0);
    if (si > -1) hold = true;
    addEventListener('resize', function () { show(cur); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { show(cur); });
    if (!reduce) setInterval(function () { if (!hold && !document.hidden) show((cur + 1) % GREETS.length); }, 3200);
  }

  /* how-it-works: line fills as you scroll */
  function steps() {
    var wrap = $('.steps'); if (!wrap) return;
    var fill = $('.fill', wrap), st = $$('.step', wrap);
    function upd() {
      var r = wrap.getBoundingClientRect(), vh = innerHeight, p = Math.min(1, Math.max(0, (vh * .6 - r.top) / r.height));
      fill.style.transform = 'scaleY(' + p + ')';
      st.forEach(function (s) { s.classList.toggle('reached', s.getBoundingClientRect().top < vh * .6); });
    }
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  document.addEventListener('DOMContentLoaded', function () {
    hero(); plate(); showcase(); counts(); marquee(); rail(); langs(); steps();
  });
})();
