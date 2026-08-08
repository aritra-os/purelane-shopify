class PlScenes extends HTMLElement {
  connectedCallback() {
    this.layers = Array.from(this.querySelectorAll('.pl-scene'));
    this.current = 0;
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.wideEnough = window.matchMedia('(min-width: 1024px)');

    this.rescan = this.rescan.bind(this);
    document.addEventListener('shopify:section:load', this.rescan);
    document.addEventListener('shopify:section:unload', this.rescan);

    this.rescan();
    this.initParallax();
  }

  disconnectedCallback() {
    document.removeEventListener('shopify:section:load', this.rescan);
    document.removeEventListener('shopify:section:unload', this.rescan);
    if (this.io) this.io.disconnect();
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('mousemove', this.onMouseMove);
  }

  rescan() {
    if (this.io) this.io.disconnect();

    // rootMargin -50%/-50% collapses the viewport to a single centre line.
    // A section "intersects" exactly when it crosses that line, so this is
    // the scene the reader is currently looking at. No scroll listener,
    // no offsetTop walk, no forced layout reads on every frame — the
    // original's pickScene() read offsetTop up the ancestor chain on every
    // rAF tick, which is the forced-reflow bug documented in the build notes.
    this.io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.setScene(Number(entry.target.dataset.scene));
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

    document.querySelectorAll('[data-scene]').forEach((el) => this.io.observe(el));
  }

  setScene(n) {
    if (!n || n === this.current) return;
    this.current = n;
    this.layers.forEach((layer, i) => layer.classList.toggle('is-on', i + 1 === n));
    this.dataset.depth = String(n);
  }

  // Subtle mouse-driven drift on the water layers, desktop only, and only
  // when motion is allowed. Reads mouse position + scroll, writes CSS
  // custom properties per layer — this part is a direct, working port of
  // the original, just gated correctly.
  initParallax() {
    if (this.reduce.matches) return;

    const layers = Array.from(this.querySelectorAll('.pl-wl'));
    const depths = [0.05, 0.09, 0.03, 0.02];
    let mx = 0, my = 0, raf = null;

    const frame = () => {
      raf = null;
      const y = window.scrollY || window.pageYOffset;
      layers.forEach((el, i) => {
        const d = depths[i] || 0.05;
        el.style.setProperty('--px', `${(mx * d * 130).toFixed(1)}px`);
        el.style.setProperty('--py', `${(-y * d + my * d * 90).toFixed(1)}px`);
      });
    };

    this.onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };
    window.addEventListener('scroll', this.onScroll, { passive: true });

    if (this.wideEnough.matches) {
      this.onMouseMove = (e) => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
        this.onScroll();
      };
      window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    }

    frame();
  }
}

customElements.define('pl-scenes', PlScenes);
