/**
 * Public Administration story page — interactions
 * - Intersection Observer scroll reveals
 * - Parallax backgrounds
 * - Horizontal subject slider (buttons, dots, drag, keyboard)
 * - Header glass state on scroll
 */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Smooth in-page navigation (enhanced focus) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      if (target.hasAttribute("tabindex")) target.focus();
    });
  });

  /* ---------- Header: solid glass when scrolled ---------- */
  const header = document.querySelector(".site-header");
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mobile navigation drawer ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const primaryNav = document.getElementById("primary-nav");
  const navBackdrop = document.querySelector(".site-nav__backdrop");
  const mqNavMobile = window.matchMedia("(max-width: 768px)");

  function setNavOpen(open) {
    if (!header || !navToggle) return;
    header.classList.toggle("is-nav-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-nav-open", open);
    if (navBackdrop) {
      if (open && mqNavMobile.matches) {
        navBackdrop.removeAttribute("hidden");
        navBackdrop.setAttribute("aria-hidden", "false");
      } else {
        navBackdrop.setAttribute("hidden", "");
        navBackdrop.setAttribute("aria-hidden", "true");
      }
    }
  }

  navToggle?.addEventListener("click", () => {
    setNavOpen(!header.classList.contains("is-nav-open"));
  });

  navBackdrop?.addEventListener("click", () => setNavOpen(false));

  primaryNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setNavOpen(false);
  });

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 768) setNavOpen(false);
    },
    { passive: true }
  );

  /* ---------- Intersection Observer: generic reveals ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = parseInt(el.getAttribute("data-reveal-delay"), 10) || 0;
          setTimeout(() => el.classList.add("is-visible"), delay);
          revealObserver.unobserve(el);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Career grid: staggered fade-up ---------- */
  const careerItems = document.querySelectorAll(".career-item[data-stagger]");
  const careersSection = document.getElementById("careers");
  if (careerItems.length && careersSection && !prefersReducedMotion) {
    const staggerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          careerItems.forEach((item, i) => {
            setTimeout(() => item.classList.add("is-visible"), i * 90);
          });
          staggerObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );
    staggerObserver.observe(careersSection);
  } else {
    careerItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- Parallax layers inside panels ---------- */
  const parallaxLayers = document.querySelectorAll(".parallax-layer[data-parallax]");

  function updateParallax() {
    if (prefersReducedMotion || !parallaxLayers.length) return;
    const vh = window.innerHeight;
    parallaxLayers.forEach((layer) => {
      const panel = layer.closest(".panel");
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      const speed = parseFloat(layer.dataset.parallax) || 0.35;
      // Normalize panel position in viewport (-1 top .. 1 bottom)
      const mid = rect.top + rect.height / 2;
      const norm = (mid - vh / 2) / (vh * 0.9);
      const offsetY = norm * 80 * speed;
      layer.style.transform = `translate3d(0, ${offsetY}px, 0) scale(1.06)`;
    });
  }

  if (parallaxLayers.length && !prefersReducedMotion) {
    window.addEventListener("scroll", updateParallax, { passive: true });
    window.addEventListener("resize", updateParallax);
    updateParallax();
  }

  /* ---------- Horizontal subject slider ---------- */
  const sliderRoot = document.querySelector("[data-slider]");
  if (sliderRoot) {
    const viewport = sliderRoot.querySelector("[data-slider-viewport]");
    const track = sliderRoot.querySelector("[data-slider-track]");
    const btnPrev = sliderRoot.querySelector("[data-slider-prev]");
    const btnNext = sliderRoot.querySelector("[data-slider-next]");
    const dotsHost = document.querySelector("[data-slider-dots]");

    if (viewport && track) {
      let translate = 0;
      let pointerId = null;
      let startX = 0;
      let startTranslate = 0;

      function getGap() {
        const g = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 20;
        return g;
      }

      function getStep() {
        const card = track.querySelector(".subject-card");
        if (!card) return 300;
        return card.offsetWidth + getGap();
      }

      function maxTranslate() {
        return Math.max(0, track.scrollWidth - viewport.clientWidth);
      }

      function clamp(value) {
        const max = maxTranslate();
        return Math.max(0, Math.min(value, max));
      }

      function setTranslate(x) {
        translate = clamp(x);
        track.style.transform = `translate3d(${-translate}px, 0, 0)`;
        updateDots();
      }

      function slidePrev() {
        setTranslate(translate - getStep());
      }

      function slideNext() {
        setTranslate(translate + getStep());
      }

      /* Dots: one per snap position */
      let dotButtons = [];
      function buildDots() {
        if (!dotsHost) return;
        dotsHost.innerHTML = "";
        dotButtons = [];
        const step = getStep();
        const max = maxTranslate();
        const count = Math.max(1, Math.round(max / step) + 1);
        for (let i = 0; i < count; i++) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "slider__dot";
          b.setAttribute("aria-label", `Go to slide ${i + 1}`);
          const pos = Math.min(i * step, max);
          b.addEventListener("click", () => setTranslate(pos));
          dotsHost.appendChild(b);
          dotButtons.push(b);
        }
        updateDots();
      }

      function updateDots() {
        if (!dotButtons.length) return;
        const step = getStep();
        const idx = Math.round(translate / step);
        dotButtons.forEach((d, i) => d.classList.toggle("is-active", i === idx));
      }

      btnPrev?.addEventListener("click", slidePrev);
      btnNext?.addEventListener("click", slideNext);

      viewport.addEventListener(
        "pointerdown",
        (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          pointerId = e.pointerId;
          startX = e.clientX;
          startTranslate = translate;
          viewport.setPointerCapture(pointerId);
        },
        { passive: true }
      );

      viewport.addEventListener("pointermove", (e) => {
        if (e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        setTranslate(startTranslate - dx);
      });

      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);

      function endDrag(e) {
        if (e.pointerId !== pointerId) return;
        const pid = pointerId;
        pointerId = null;
        try {
          if (pid != null) viewport.releasePointerCapture(pid);
        } catch (_) {
          /* ignore if already released */
        }
        const step = getStep();
        const snapped = Math.round(translate / step) * step;
        setTranslate(snapped);
      }

      sliderRoot.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          slidePrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          slideNext();
        }
      });

      window.addEventListener("resize", () => {
        translate = clamp(translate);
        setTranslate(translate);
        buildDots();
      });

      buildDots();
      setTranslate(0);
      sliderRoot.setAttribute("tabindex", "0");
    }
  }
})();
