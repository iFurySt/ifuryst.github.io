(() => {
  const progress = document.getElementById('progress');
  if (!progress) return;
  const navbar = document.getElementById('navbar');
  let scheduled = false;
  const update = () => {
    const root = document.scrollingElement || document.documentElement;
    const distance = Math.max(0, root.scrollHeight - document.documentElement.clientHeight);
    progress.max = Math.max(1, distance);
    progress.value = Math.max(0, Math.min(root.scrollTop, distance));
    const navbarBottom = navbar ? Math.max(0, navbar.getBoundingClientRect().bottom) : 0;
    progress.style.top = `${navbarBottom}px`;
    scheduled = false;
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('pageshow', schedule);
  // Lazy-loaded images and embedded content can change the page height after load.
  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);
  if (navbar) observer.observe(navbar);
  update();
})();
