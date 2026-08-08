class PlMarquee extends HTMLElement {
  connectedCallback() {
    this.btn = this.querySelector('[data-pause]');
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (this.reduce.matches) this.setPaused(true);

    this.btn?.addEventListener('click', () => this.setPaused(!this.classList.contains('is-paused')));

    this.onReduceChange = () => { if (this.reduce.matches) this.setPaused(true); };
    this.reduce.addEventListener('change', this.onReduceChange);
  }

  disconnectedCallback() {
    this.reduce.removeEventListener('change', this.onReduceChange);
  }

  setPaused(paused) {
    this.classList.toggle('is-paused', paused);
    this.btn?.setAttribute('aria-pressed', String(paused));
  }
}
customElements.define('pl-marquee', PlMarquee);
