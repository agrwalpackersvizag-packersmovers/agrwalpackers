/* ==========================================================================
   Agarwal Packers Movers India — main.js
   Vanilla JS, no dependencies, loaded with `defer`.

   Everything here is an ENHANCEMENT. With JavaScript disabled:
     • the navigation is fully visible (see .no-js rules in style.css)
     • the FAQ works (native <details>/<summary>)
     • the quote form still submits and is validated server-side by PHP
   ========================================================================== */
(function () {
  'use strict';

  /* ── 1. Mobile navigation ─────────────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close main menu' : 'Open main menu');
    };
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });
    /* A tap outside the open menu closes it. */
    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setNav(false);
    });
  }

  /* ── 2. Mark the current page in the navigation ───────────────────────── */
  var here = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  Array.prototype.forEach.call(document.querySelectorAll('.site-nav a[href]'), function (a) {
    var target = a.getAttribute('href').replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (target === here) a.setAttribute('aria-current', 'page');
  });

  /* ── 3. Analytics events ──────────────────────────────────────────────────
     Every CTA carries data-track="<event>" and data-location="<placement>".
     Events are pushed to dataLayer (GTM) and gtag (GA4) if either exists, so
     conversions can be wired up without touching the HTML again.

     Events emitted: call_click · whatsapp_click · email_click ·
                     quote_cta_click · quote_form_submit · gbp_click
     ─────────────────────────────────────────────────────────────────────── */
  function track(name, params) {
    var payload = params || {};
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push(Object.assign({ event: name }, payload));
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el || el.tagName === 'BUTTON') return;
    track(el.getAttribute('data-track'), {
      cta_location: el.getAttribute('data-location') || 'unknown',
      page_path: location.pathname
    });
  });

  /* ── 4. Quote form: spam controls + inline validation ─────────────────── */

  /* Cheap bot filter, not a security boundary: bots that never execute JS
     submit without this token and are rejected by the PHP handler.
     The matching check lives in /forms/quote-handler.php. */
  function jsToken() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var stamp = d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + p(d.getUTCHours());
    return btoa(stamp + '|apmi');
  }

  var RULES = {
    name: function (v) {
      if (!v.trim()) return 'Please enter your name.';
      if (v.trim().length < 2) return 'Please enter your full name.';
      return '';
    },
    phone: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Please enter a mobile number so we can send your quote.';
      if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
      if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.slice(1);
      if (digits.length !== 10) return 'Please enter a valid 10-digit mobile number.';
      if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
      return '';
    },
    email: function (v) {
      if (!v.trim()) return '';           /* optional field */
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please check the email address.';
    },
    moving_from: function (v) { return v.trim() ? '' : 'Where are you moving from?'; },
    moving_to: function (v) { return v.trim() ? '' : 'Where are you moving to?'; },
    service: function (v) { return v ? '' : 'Please choose the service you need.'; }
  };

  function fieldWrap(input) { return input.closest('.field') || input.parentNode; }

  function showError(input, msg) {
    var described = (input.getAttribute('aria-describedby') || '').split(/\s+/);
    var box = null;
    for (var i = 0; i < described.length; i++) {
      var el = described[i] && document.getElementById(described[i]);
      if (el && el.classList.contains('field-error')) { box = el; break; }
    }
    if (box) box.textContent = msg;
    fieldWrap(input).classList.toggle('has-error', !!msg);
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function validateField(input) {
    var rule = RULES[input.name];
    if (!rule) return true;
    var msg = rule(input.value);
    showError(input, msg);
    return !msg;
  }

  Array.prototype.forEach.call(document.querySelectorAll('.quote-form'), function (form) {
    var started = form.querySelector('input[name="form_started"]');
    var token = form.querySelector('input[name="js_token"]');
    if (started) started.value = String(Math.floor(Date.now() / 1000));
    if (token) token.value = jsToken();

    var status = document.getElementById(form.id + '-status');

    /* Validate on blur, then live-correct once a field has been flagged. */
    Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (input) {
      if (!RULES[input.name]) return;
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        if (fieldWrap(input).classList.contains('has-error')) validateField(input);
      });
    });

    form.addEventListener('submit', function (e) {
      var firstBad = null;

      Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (input) {
        if (!RULES[input.name]) return;
        if (!validateField(input) && !firstBad) firstBad = input;
      });

      var consent = form.querySelector('input[name="consent"]');
      if (consent && !consent.checked) {
        showError(consent, 'Please tick the box so we can contact you about this enquiry.');
        if (!firstBad) firstBad = consent;
      } else if (consent) {
        showError(consent, '');
      }

      if (firstBad) {
        e.preventDefault();
        if (status) {
          status.textContent = 'Please correct the highlighted fields and submit again.';
          status.className = 'form-status is-error';
        }
        firstBad.focus();
        return;
      }

      /* Valid — let the browser POST to the PHP handler. */
      if (status) {
        status.textContent = 'Sending your request…';
        status.className = 'form-status';
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
        /* Re-enable if the navigation is cancelled or the tab is restored. */
        setTimeout(function () { btn.disabled = false; btn.textContent = 'Get Free Moving Quote'; }, 8000);
      }
      track('quote_form_submit', {
        service: (form.querySelector('[name="service"]') || {}).value || '',
        moving_from: (form.querySelector('[name="moving_from"]') || {}).value || '',
        moving_to: (form.querySelector('[name="moving_to"]') || {}).value || '',
        page_path: location.pathname
      });
    });
  });

  /* ── 5. Accordion: keep one FAQ answer open at a time on small screens ─── */
  var faqLists = document.querySelectorAll('.faq-list');
  Array.prototype.forEach.call(faqLists, function (list) {
    var all = list.querySelectorAll('details');
    Array.prototype.forEach.call(all, function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open || window.innerWidth >= 768) return;
        Array.prototype.forEach.call(all, function (other) {
          if (other !== d) other.open = false;
        });
      });
    });
  });
})();
