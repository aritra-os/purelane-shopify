class PlRail extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('.pl-comborail');
    this.prevBtn = this.querySelector('[data-rail-prev]');
    this.nextBtn = this.querySelector('[data-rail-next]');
    if (!this.track) return;

    const step = () => this.track.querySelector('.pl-combo')?.offsetWidth + 14 || 300;

    this.prevBtn?.addEventListener('click', () =>
      this.track.scrollBy({ left: -step(), behavior: 'smooth' })
    );
    this.nextBtn?.addEventListener('click', () =>
      this.track.scrollBy({ left: step(), behavior: 'smooth' })
    );

    // Left/right arrow keys scroll the rail when it (or a child) has focus.
    this.track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); this.track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); this.track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
  }
}
customElements.define('pl-rail', PlRail);
