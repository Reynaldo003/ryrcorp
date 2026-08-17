import { useCallback, useEffect, useRef, useState } from "react";

export function useVirtualRows({ items, rowHeight = 46, overscanPx = 600 }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const medir = () => setViewportH(el.clientHeight || 0);
    medir();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    window.addEventListener("resize", medir);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, []);

  const onScroll = useCallback((e) => setScrollTop(e.currentTarget.scrollTop), []);
  const resetScroll = useCallback(() => {
    setScrollTop(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, []);

  const total = items.length;
  const start = Math.max(0, Math.floor((scrollTop - overscanPx) / rowHeight));
  const end = Math.min(total, Math.ceil((scrollTop + viewportH + overscanPx) / rowHeight));

  return {
    containerRef,
    onScroll,
    resetScroll,
    total,
    visible: items.slice(start, end),
    topOffset: start * rowHeight,
    bottomOffset: Math.max(0, (total - end) * rowHeight),
  };
}