import { useEffect, useRef } from "react";

/**
 * Simple intersection-observer based infinite scroll helper.
 * Provide a callback that loads more items and the hook will
 * trigger it when the sentinel enters the viewport.
 */
export function useInfiniteScroll({ onLoadMore, hasMore, disabled = false, rootMargin = "200px 0px", resetDeps = [] }) {
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isFetchingRef.current = false;
  }, [hasMore, disabled, ...resetDeps]);

  useEffect(() => {
    if (disabled || !hasMore) {
      return undefined;
    }

    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !isFetchingRef.current) {
            isFetchingRef.current = true;
            onLoadMore();
          }
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [disabled, hasMore, onLoadMore, rootMargin]);

  return sentinelRef;
}
