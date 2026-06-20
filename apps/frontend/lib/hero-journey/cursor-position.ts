/** Центр элемента в локальных px контейнера (учитывает scale stage). */
export function measureCenterInContainer(target: HTMLElement, container: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (containerRect.width <= 0 || containerRect.height <= 0) {
    return null;
  }

  const scale = containerRect.width / container.offsetWidth;
  const safeScale = scale > 0 ? scale : 1;

  return {
    x: (targetRect.left + targetRect.width / 2 - containerRect.left) / safeScale,
    y: (targetRect.top + targetRect.height / 2 - containerRect.top) / safeScale,
  };
}

/** Сколько прокрутить каталог (layout px), чтобы target был виден целиком. */
export function computeCatalogScrollOffset(
  scrollEl: HTMLElement,
  viewportEl: HTMLElement,
  targetEl: HTMLElement,
  padding = 56,
): number {
  const maxScroll = Math.max(0, scrollEl.scrollHeight - viewportEl.clientHeight);
  const scrollRect = scrollEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  if (scrollRect.width <= 0 || viewportEl.clientHeight <= 0) {
    return maxScroll > 0 ? maxScroll : 140;
  }

  const layoutScale = scrollEl.offsetWidth / scrollRect.width;
  const targetBottomLayout = (targetRect.bottom - scrollRect.top) * layoutScale;
  const needed = Math.max(0, Math.ceil(targetBottomLayout - viewportEl.clientHeight + padding));

  if (maxScroll === 0) {
    return Math.max(needed, 120);
  }

  return Math.min(maxScroll, Math.max(needed, Math.round(maxScroll * 0.72), 140));
}

export function applyCatalogScrollOffset(
  scrollEl: HTMLElement,
  viewportEl: HTMLElement,
  targetEl: HTMLElement,
) {
  const scrollY = computeCatalogScrollOffset(scrollEl, viewportEl, targetEl);
  scrollEl.style.setProperty("--dhj-catalog-scroll-y", `-${scrollY}px`);
  return scrollY;
}

export function setCursorPoint(
  root: HTMLElement,
  prefix: string,
  point: { x: number; y: number },
) {
  root.style.setProperty(`--dhj-x-${prefix}`, `${point.x.toFixed(1)}px`);
  root.style.setProperty(`--dhj-y-${prefix}`, `${point.y.toFixed(1)}px`);
}
