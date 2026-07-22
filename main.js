/* Esmetu Catering — shared site behavior */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Sticky header: transparent -> cream ---------- */
  var header = $(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = $(".hamburger");
  var mobileMenu = $("#mobile-menu");
  function closeMenu() {
    if (!burger || !mobileMenu) return;
    burger.classList.remove("open");
    mobileMenu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }
  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("no-scroll", open);
    });
    $$("a", mobileMenu).forEach(function (a) { a.addEventListener("click", closeMenu); });
  }

  /* ---------- Scroll-reveal animations ---------- */
  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Menu tabs ---------- */
  var tabs = $$(".tab");
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = t !== tab;
        });
      });
    });
  }

  /* ---------- Testimonials carousel ---------- */
  var tViewport = $(".t-viewport");
  if (tViewport) {
    var slides = $$(".t-slide", tViewport);
    var dotsWrap = $(".t-dots");
    var current = 0;
    var timer = null;

    var dots = slides.map(function (_, i) {
      var d = document.createElement("button");
      d.className = "t-dot";
      d.setAttribute("aria-label", "Show testimonial " + (i + 1));
      d.addEventListener("click", function () { go(i, true); });
      if (dotsWrap) dotsWrap.appendChild(d);
      return d;
    });

    function render() {
      slides.forEach(function (s, i) { s.hidden = i !== current; });
      dots.forEach(function (d, i) {
        if (i === current) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }
    function go(i, manual) {
      var next = (i + slides.length) % slides.length;
      if (next === current) return;
      var active = slides[current];
      active.classList.add("fading");
      window.setTimeout(function () {
        active.classList.remove("fading");
        current = next;
        render();
      }, 220);
      if (manual) restart();
    }
    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(function () { go(current + 1); }, 6500);
    }
    var prev = $(".t-arrow--prev"); var next = $(".t-arrow--next");
    if (prev) prev.addEventListener("click", function () { go(current - 1, true); });
    if (next) next.addEventListener("click", function () { go(current + 1, true); });
    var tSection = tViewport.closest("section") || tViewport;
    tSection.addEventListener("mouseenter", function () { if (timer) window.clearInterval(timer); });
    tSection.addEventListener("mouseleave", restart);
    render();
    restart();
  }

  /* ---------- Gallery lightbox ---------- */
  var lightbox = $("#lightbox");
  if (lightbox) {
    var lbImg = $("img", lightbox);
    var lbCaption = $("figcaption", lightbox);
    var items = $$(".g-item");
    var lbIndex = 0;
    var lastFocus = null;

    function openLb(i) {
      lbIndex = i;
      var img = $("img", items[i]);
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCaption.textContent = img.alt;
      lastFocus = document.activeElement;
      lightbox.classList.add("open");
      document.body.classList.add("no-scroll");
      $(".lb-close", lightbox).focus();
    }
    function closeLb() {
      lightbox.classList.remove("open");
      document.body.classList.remove("no-scroll");
      if (lastFocus) lastFocus.focus();
    }
    function stepLb(dir) { openLb((lbIndex + dir + items.length) % items.length); }

    items.forEach(function (item, i) {
      item.addEventListener("click", function () { openLb(i); });
    });
    $(".lb-close", lightbox).addEventListener("click", closeLb);
    $(".lb-prev", lightbox).addEventListener("click", function (e) { e.stopPropagation(); stepLb(-1); });
    $(".lb-next", lightbox).addEventListener("click", function (e) { e.stopPropagation(); stepLb(1); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") stepLb(-1);
      if (e.key === "ArrowRight") stepLb(1);
    });
  }

  /* ---------- Escape closes mobile menu ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Toast ---------- */
  var toast = $("#toast");
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 4500);
  }

  /* ---------- Quote request form (placeholder endpoint) ---------- */
  var form = $("#quote-form");
  if (form) {
    var dateInput = $("#f-date");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      /* TODO: replace with real endpoint (e.g. fetch("/api/quote", {method:"POST", body: JSON.stringify(data)})) */
      console.log("Quote request submitted:", data);
      form.reset();
      showToast("Thank you! Your request is in — we'll get back to you within 24 hours.");
    });
  }

  /* ---------- Service cards preselect event type ---------- */
  $$("[data-event]").forEach(function (link) {
    link.addEventListener("click", function () {
      var select = $("#f-type");
      if (select) select.value = link.getAttribute("data-event");
    });
  });

  /* ---------- Footer year ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
