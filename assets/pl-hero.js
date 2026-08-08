class PlHeroStage extends HTMLElement {
  connectedCallback() {
    this.slides = Array.from(this.querySelectorAll('.pl-hslide'));
    this.dots = Array.from(this.querySelectorAll('.pl-hdot'));
    this.pauseBtn = this.querySelector('[data-pause]');
    this.index = 0;
    this.timer = null;
    this.userPaused = false;

    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.autoplay = this.dataset.autoplay === 'true';
    this.interval = Number(this.dataset.interval) || 4000;

    this.dots.forEach((d) =>
      d.addEventListener('click', () => { this.stop(); this.go(Number(d.dataset.index)); this.start(); })
    );

    this.pauseBtn?.addEventListener('click', () => {
      this.userPaused = !this.userPaused;
      this.pauseBtn.setAttribute('aria-pressed', String(this.userPaused));
      this.userPaused ? this.stop() : this.start();
    });

    this.addEventListener('mouseenter', () => this.stop());
    this.addEventListener('mouseleave', () => { if (!this.userPaused) this.start(); });

    this.io = new IntersectionObserver(
      (es) => es.forEach((e) => (e.isIntersecting ? this.start() : this.stop())),
      { threshold: 0.2 }
    );
    this.io.observe(this);

    // Editor: selecting a slide block pauses autoplay and jumps to it,
    // otherwise the merchant can never actually see the block they're
    // editing if the carousel keeps advancing underneath them.
    this.onBlockSelect = (e) => {
      if (!this.contains(e.target)) return;
      this.stop();
      const slide = e.target.closest('.pl-hslide');
      if (slide) this.go(Number(slide.dataset.index));
    };
    this.onBlockDeselect = () => { if (!this.userPaused) this.start(); };
    document.addEventListener('shopify:block:select', this.onBlockSelect);
    document.addEventListener('shopify:block:deselect', this.onBlockDeselect);
  }

  disconnectedCallback() {
    this.stop();
    this.io?.disconnect();
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    document.removeEventListener('shopify:block:deselect', this.onBlockDeselect);
  }

  go(n) {
    if (!this.slides.length) return;
    this.index = (n + this.slides.length) % this.slides.length;
    this.slides.forEach((s, i) => s.classList.toggle('is-on', i === this.index));
    this.dots.forEach((d, i) => {
      d.classList.toggle('is-on', i === this.index);
      d.setAttribute('aria-selected', String(i === this.index));
    });
  }

  start() {
    if (this.timer || !this.autoplay || this.userPaused || this.reduce.matches || this.slides.length < 2) return;
    this.timer = setInterval(() => this.go(this.index + 1), this.interval);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}
customElements.define('pl-hero-stage', PlHeroStage);
