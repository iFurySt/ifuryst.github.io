let libraryPromise;
function loadLibraries(reader) {
  libraryPromise ??= Promise.all([import(`${reader.dataset.libraryUrl}pdf.js`), import(reader.dataset.flipLibraryUrl)]).then(([pdfjs, flip]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = `${reader.dataset.libraryUrl}pdf.worker.js`;
    return { pdfjs, PageFlip: flip.PageFlip };
  });
  return libraryPromise;
}
function initializeReader(reader) {
  const stage = reader.querySelector(".pdf-stage");
  const pages = reader.querySelector(".pdf-pages");
  const status = reader.querySelector(".pdf-status");
  const input = reader.querySelector("input");
  const count = reader.querySelector("[data-page-count]");
  const hasCover = reader.dataset.cover !== "false";
  const cache = new Map();
  const pendingTurns = [];
  let suppressClick = false;
  let processingTurns = false,
    lastTurnRequest = -Infinity,
    pendingDeadline = -Infinity,
    rapidTurning = false;
  let pdf,
    book,
    leaves,
    current = 1,
    ready = false,
    gesture,
    resizeTimer,
    lastWidth = 0,
    generation = 0,
    preparation = 0;
  function spreadStart(page) {
    if (hasCover && page === 1) return 1;
    return page - ((page - (hasCover ? 2 : 1)) % 2);
  }
  function numbers() {
    return (hasCover && current === 1) || current === pdf.numPages ? [current] : [current, current + 1];
  }
  function updateCaption() {
    current = book.getCurrentPageIndex() + 1;
    input.value = String(current);
    const visible = numbers();
    count.textContent = `${visible.length > 1 ? `–${visible[1]}` : ""} / ${pdf.numPages}`;
    status.textContent = `第 ${visible.join("–")} 页，共 ${pdf.numPages} 页`;
    status.classList.remove("is-visible");
    stage.classList.toggle("is-cover", hasCover && current === 1);
    stage.classList.toggle("is-single", visible.length === 1);
    pages.style.setProperty("--paper-left", String((current - 1) / pdf.numPages));
    pages.style.setProperty("--paper-right", String((pdf.numPages - visible.at(-1)) / pdf.numPages));
  }
  async function rasterize(number, epoch) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: Math.max(100, stage.clientWidth) / 2 / page.getViewport({ scale: 1 }).width });
    const ratio = Math.min(window.devicePixelRatio || 1, 2, 4096 / Math.max(viewport.width, viewport.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width * ratio);
    canvas.height = Math.ceil(viewport.height * ratio);
    try {
      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport,
        transform: [canvas.width / viewport.width, 0, 0, canvas.height / viewport.height, 0, 0],
      }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PDF image conversion failed");
      if (epoch !== generation) return;
      const url = URL.createObjectURL(blob);
      const image = leaves[number - 1].firstElementChild;
      image.src = url;
      await image.decode();
      return url;
    } finally {
      page.cleanup();
      canvas.width = canvas.height = 0;
    }
  }
  async function prepare(page = current) {
    ready = false;
    stage.setAttribute("aria-busy", "true");
    const epoch = generation;
    const request = ++preparation;
    try {
      // Render the visible spread first, then both sides of nearby turning leaves.
      const required = [...new Set([page, page + 1, page - 2, page - 1, page + 2, page + 3])].filter(
        (number) => number >= 1 && number <= pdf.numPages
      );
      const nearby = [...new Set([...required, ...Array.from({ length: 10 }, (_, i) => page - 4 + i)])].filter(
        (number) => number >= 1 && number <= pdf.numPages
      );
      for (const number of nearby) {
        if (epoch !== generation || request !== preparation) return false;
        if (!cache.has(number)) {
          const task = rasterize(number, epoch);
          cache.set(number, task);
          task.catch(() => {
            if (cache.get(number) === task) cache.delete(number);
          });
        }
        if (required.includes(number)) await cache.get(number);
        // The current spread and both turning leaves are enough to start a drag.
        // More distant prefetching must not lock out a held pointer.
        if (number === required.at(-1) && epoch === generation && request === preparation) {
          ready = true;
          startPendingGesture();
        }
      }
      if (epoch !== generation || request !== preparation) return false;
      // Evict only settled pages, after a fold finishes, so its cloned image stays valid.
      for (const [number, promise] of cache) {
        if (!nearby.includes(number)) {
          cache.delete(number);
          promise.then((url) => {
            if (url) URL.revokeObjectURL(url);
          });
          leaves[number - 1].firstElementChild.removeAttribute("src");
        }
      }
      ready = true;
      startPendingGesture();
      return true;
    } catch (error) {
      console.error("PDF rendering failed", error.message, error);
      cache.clear();
      status.textContent = "这一页未能显示，请刷新页面重试。";
      status.classList.add("is-visible");
      return false;
    } finally {
      if (epoch === generation && request === preparation) stage.setAttribute("aria-busy", "false");
    }
  }
  async function drainTurns() {
    if (!book || processingTurns || gesture?.canDrag || book.getState() !== "read") return;
    processingTurns = true;
    try {
      if (!(ready || (await prepare()))) {
        pendingTurns.length = 0;
        return;
      }
      if (performance.now() > pendingDeadline) pendingTurns.length = 0;
      while (pendingTurns.length && book.getState() === "read" && !gesture?.canDrag) {
        const direction = pendingTurns.shift();
        if ((direction < 0 && current === 1) || (direction > 0 && numbers().at(-1) === pdf.numPages)) continue;
        book.getSettings().flippingTime = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : rapidTurning ? 90 : 350;
        if (direction < 0) book.flipPrev("bottom");
        else book.flipNext("bottom");
      }
    } finally {
      processingTurns = false;
      startPendingGesture();
      if (pendingTurns.length && !gesture?.canDrag && book.getState() === "read") queueMicrotask(() => void drainTurns());
    }
  }
  function advance(direction, defer = false) {
    if (!book || gesture?.canDrag) return;
    const now = performance.now();
    rapidTurning = now - lastTurnRequest < 250;
    lastTurnRequest = now;
    // Keep only the latest intent, never one queued action per tap.
    // Discard stale taps when rendering is slow; completed swipes still count.
    pendingDeadline = defer ? Infinity : now + 200;
    pendingTurns[0] = direction;
    if (book.getState() === "flipping") book.getRender().finishAnimation();
    void drainTurns();
  }
  function startPendingGesture() {
    if (!gesture || gesture.canDrag || !ready || pendingTurns.length || book.getState() !== "read") return;
    gesture.canDrag = true;
    book.startUserTouch(gesture.startPosition);
    if (gesture.moved) book.userMove(gesture.lastPosition, true);
  }
  function position(event) {
    const bounds = book.getUI().getDistElement().getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }
  function finishGesture(event, navigate = false) {
    if (!gesture || (event?.pointerId !== undefined && event.pointerId !== gesture.id)) return;
    const finished = gesture;
    // Clear first: releasing capture can synchronously dispatch lostpointercapture.
    gesture = null;
    if (finished.canDrag) book.userStop(event ? position(event) : finished.lastPosition, !finished.moved);
    else if (navigate && finished.moved && (finished.lastPosition.x - finished.startPosition.x) * finished.direction < -stage.clientWidth / 4) {
      // A fast swipe released before rasterization finishes still counts as a turn.
      advance(finished.direction, true);
    }
    if (stage.hasPointerCapture(finished.id)) stage.releasePointerCapture(finished.id);
    if (navigate && finished.moved) {
      suppressClick = true;
      setTimeout(() => {
        suppressClick = false;
      }, 0);
    }
    if (pendingTurns.length) void drainTurns();
  }
  stage.addEventListener("click", (event) => {
    if (suppressClick) return;
    const bounds = stage.getBoundingClientRect();
    advance(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
  });
  stage.addEventListener("dragstart", (event) => event.preventDefault());
  stage.addEventListener("mousedown", (event) => {
    if (event.button === 0) event.preventDefault();
  });
  stage.addEventListener("pointerdown", (event) => {
    if (event.button === 0 && event.pointerType === "mouse") event.preventDefault();
    if (!book || event.button !== 0 || !event.isPrimary) return;
    if (gesture) finishGesture();
    // Released hand folds retain "user_fold" while their settling animation runs.
    if (book.getState() === "flipping" || book.getState() === "user_fold") book.getRender().finishAnimation();
    const bounds = stage.getBoundingClientRect();
    stage.dataset.turn = event.clientX < bounds.left + bounds.width / 2 ? "previous" : "next";
    gesture = {
      id: event.pointerId,
      direction: stage.dataset.turn === "previous" ? -1 : 1,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      startPosition: position(event),
      lastPosition: position(event),
      canDrag: false,
    };
    stage.setPointerCapture(event.pointerId);
    startPendingGesture();
    if (!ready && !processingTurns && !pendingTurns.length) void prepare();
  });
  // A pointerup outside the window is not reliably delivered by every browser.
  // Reconcile the physical button state as soon as the mouse returns anywhere.
  window.addEventListener(
    "pointermove",
    (event) => {
      if (gesture && event.pointerId === gesture.id && event.pointerType === "mouse" && (event.buttons & 1) === 0) {
        finishGesture(event);
      }
    },
    true
  );
  stage.addEventListener("pointermove", (event) => {
    const bounds = stage.getBoundingClientRect();
    stage.dataset.turn = event.clientX < bounds.left + bounds.width / 2 ? "previous" : "next";
    if (!gesture || event.pointerId !== gesture.id) return;
    gesture.moved ||= Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 5;
    gesture.lastPosition = position(event);
    if (gesture.canDrag) book.userMove(gesture.lastPosition, true);
    else startPendingGesture();
  });
  stage.addEventListener("pointerup", (event) => finishGesture(event, true));
  stage.addEventListener("pointercancel", (event) => finishGesture(event));
  stage.addEventListener("lostpointercapture", () => finishGesture());
  window.addEventListener("blur", () => finishGesture());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) finishGesture();
  });
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      advance(event.key === "ArrowRight" ? 1 : -1);
    }
  });
  reader.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = Number(input.value);
    if (!book || !Number.isFinite(value) || book.getState() !== "read") return;
    pendingTurns.length = 0;
    const target = spreadStart(Math.max(1, Math.min(pdf.numPages, Math.floor(value))));
    if (await prepare(target)) {
      book.turnToPage(target - 1);
      updateCaption();
    }
  });
  new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width;
    if (Math.abs(width - lastWidth) < 1) return;
    lastWidth = width;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!book || gesture || book.getState() !== "read") return;
      generation++;
      for (const promise of cache.values())
        promise.then((url) => {
          if (url) URL.revokeObjectURL(url);
        });
      cache.clear();
      book.update();
      void prepare();
    }, 200);
  }).observe(stage);
  async function load() {
    try {
      const { pdfjs, PageFlip } = await loadLibraries(reader);
      const library = reader.dataset.libraryUrl;
      pdf = await pdfjs.getDocument({
        url: reader.dataset.pdfUrl,
        disableAutoFetch: true,
        disableStream: true,
        cMapUrl: `${library}cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${library}standard_fonts/`,
        wasmUrl: `${library}wasm/`,
      }).promise;
      const first = await pdf.getPage(1);
      const viewport = first.getViewport({ scale: 1 });
      first.cleanup();
      leaves = Array.from({ length: pdf.numPages }, (_, index) => {
        const leaf = document.createElement("div");
        leaf.className = "pdf-leaf";
        const image = document.createElement("img");
        image.alt = `PDF 第 ${index + 1} 页`;
        image.draggable = false;
        leaf.append(image);
        return leaf;
      });
      book = new PageFlip(pages, {
        width: viewport.width,
        height: viewport.height,
        size: "stretch",
        minWidth: 50,
        maxWidth: 2048,
        minHeight: 30,
        maxHeight: 2048,
        usePortrait: false,
        showCover: hasCover,
        useMouseEvents: false,
        showPageCorners: false,
        flippingTime: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 750,
        maxShadowOpacity: 0.28,
        autoSize: true,
      });
      book.on("flip", () => {
        updateCaption();
      });
      book.on("changeState", ({ data }) => {
        stage.dataset.state = data;
        if (data === "read") {
          ready = false;
          queueMicrotask(() => void drainTurns());
        }
      });
      book.loadFromHTML(leaves);
      updateCaption();
      await prepare();
      input.max = String(pdf.numPages);
      input.disabled = false;
      void drainTurns();
    } catch (error) {
      console.error("PDF loading failed", error);
      status.textContent = "相册未能加载，请刷新页面重试。";
      status.classList.add("is-visible");
    }
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void load();
      }
    },
    { rootMargin: "400px" }
  );
  observer.observe(reader);
}
document.querySelectorAll(".pdf-reader").forEach(initializeReader);
