(() => {
  const navbar = document.querySelector('#navbar.navbar-adaptive');
  if (!navbar) return;
  const container = navbar.querySelector('.container');
  const menu = navbar.querySelector('#navbarNav');
  const links = menu.querySelector('.navbar-nav');
  const toggle = navbar.querySelector('.navbar-toggler');
  let pending = false;
  const measure = () => {
    pending = false;
    const containerStyle = getComputedStyle(container);
    const available = container.clientWidth - parseFloat(containerStyle.paddingLeft) - parseFloat(containerStyle.paddingRight);
    // Bootstrap's unconditional expansion class applies exactly the same styles
    // used for the final horizontal layout, even while the menu is collapsed.
    navbar.classList.add('navbar-measuring', 'navbar-expand');
    const brand = container.querySelector('.navbar-brand');
    let brandWidth = 0;
    if (brand) {
      const style = getComputedStyle(brand);
      brandWidth = brand.getBoundingClientRect().width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    }
    const needed = brandWidth + links.getBoundingClientRect().width;
    const fits = Math.ceil(needed) <= Math.floor(available);
    navbar.classList.toggle('navbar-expand', fits);
    navbar.classList.remove('navbar-measuring');
    if (fits) {
      // Do not leave a mobile menu open when returning to a narrow viewport.
      menu.classList.remove('show');
      toggle.classList.add('collapsed');
      toggle.setAttribute('aria-expanded', 'false');
    }
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(measure);
  };
  new ResizeObserver(schedule).observe(container);
  new MutationObserver(schedule).observe(links, { childList: true, subtree: true, characterData: true });
  addEventListener('resize', schedule);
  if (document.fonts) {
    document.fonts.ready.then(schedule);
    document.fonts.addEventListener('loadingdone', schedule);
  }
  measure();
})();
