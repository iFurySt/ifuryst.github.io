(() => {
  const article = document.querySelector(".reading-shell #markdown-content");
  if (!article) return;

  article.querySelectorAll("table").forEach((table) => {
    if (table.closest(".table-responsive, .reading-table, .bootstrap-table")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "reading-table";
    wrapper.tabIndex = 0;
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute("aria-label", document.documentElement.lang.startsWith("en") ? "Scrollable table" : "可横向滚动的表格");
    table.before(wrapper);
    wrapper.append(table);
  });

  const toc = document.querySelector(".reading-toc");
  if (!toc) return;
  const headings = [...article.querySelectorAll("h1, h2, h3")].filter((h) => !h.hasAttribute("data-toc-skip"));
  if (headings.length < 2) return;
  const topLevel = Math.min(...headings.map((h) => Number(h.tagName[1])));
  const nav = toc.querySelector("nav");
  const links = headings.map((heading, index) => {
    if (!heading.id) {
      let id = `reading-section-${index + 1}`;
      while (document.getElementById(id)) id += "-";
      heading.id = id;
    }
    const link = document.createElement("a");
    link.href = `#${encodeURIComponent(heading.id)}`;
    link.textContent = heading.textContent;
    if (Number(heading.tagName[1]) > topLevel) link.dataset.nested = "";
    nav.append(link);
    return link;
  });
  toc.hidden = false;
  const details = toc.querySelector("details");
  const wide = matchMedia("(min-width: 1200px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let panelAnimation;
  let expanded = details.open;
  const setExpanded = (open, animate = false) => {
    const startHeight = details.open ? nav.getBoundingClientRect().height : 0;
    const startStyle = getComputedStyle(nav);
    const startPadding = details.open ? startStyle.paddingTop : "0px";
    const startPaddingBottom = details.open ? startStyle.paddingBottom : "0px";
    const startOpacity = details.open ? startStyle.opacity : "0";
    if (panelAnimation) panelAnimation.cancel();
    panelAnimation = null;
    expanded = open;
    details.toggleAttribute("data-expanded", open);
    if (!animate || wide.matches || reducedMotion.matches) {
      details.open = open;
      return;
    }
    details.open = true;
    const endHeight = open ? nav.getBoundingClientRect().height : 0;
    const endPadding = open ? getComputedStyle(nav).paddingTop : "0px";
    const endPaddingBottom = open ? getComputedStyle(nav).paddingBottom : "0px";
    const animation = nav.animate(
      [
        { height: `${startHeight}px`, paddingTop: startPadding, paddingBottom: startPaddingBottom, opacity: startOpacity, overflow: "hidden" },
        { height: `${endHeight}px`, paddingTop: endPadding, paddingBottom: endPaddingBottom, opacity: open ? 1 : 0, overflow: "hidden" },
      ],
      { duration: 220, easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" }
    );
    panelAnimation = animation;
    animation.onfinish = () => {
      if (panelAnimation !== animation) return;
      details.open = open;
      panelAnimation = null;
    };
  };
  toc.querySelector("summary").addEventListener("click", (event) => {
    if (wide.matches) return;
    event.preventDefault();
    setExpanded(!expanded, true);
  });
  const summary = toc.querySelector("summary span");
  const positionToc = () => {
    if (wide.matches) toc.style.setProperty("--reading-header-offset", `${article.closest("article").offsetTop}px`);
  };
  const adapt = () => {
    setExpanded(wide.matches);
    positionToc();
  };
  adapt();
  wide.addEventListener("change", adapt);
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a") && !wide.matches) setExpanded(false, true);
  });
  let pending = false;
  const update = () => {
    const contentBounds = article.getBoundingClientRect();
    const visible = wide.matches || (contentBounds.top <= 62 && contentBounds.bottom > 110);
    toc.toggleAttribute("data-visible", visible);
    if (!wide.matches && !visible && details.open) setExpanded(false);
    let active = 0;
    headings.forEach((heading, index) => {
      if (heading.getBoundingClientRect().top <= 140) active = index;
    });
    links.forEach((link, index) => {
      if (index === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    summary.textContent = headings[active].textContent;
    pending = false;
  };
  addEventListener(
    "scroll",
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  addEventListener("resize", () => {
    positionToc();
    update();
  });
  new ResizeObserver(positionToc).observe(document.querySelector(".post-header"));
  update();
})();
