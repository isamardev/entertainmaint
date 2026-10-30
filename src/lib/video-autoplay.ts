/**
 * Smart Viewport Scroll Autoplay & Auto-Pause for Videos & Embeds
 *
 * Requirements:
 * 1. When the user scrolls (up or down) and stops at a video/embed post, it auto-plays smoothly (muted).
 * 2. When the user scrolls past it (either scrolling up or scrolling down), it pauses immediately.
 * 3. As the user reaches the next video/embed, that next video starts playing automatically.
 * 4. Only the primary in-view video plays if multiple videos exist on the page ("assy he chlta rehy").
 * 5. Works seamlessly across HTML5 <video> elements and iframe video embeds (YouTube, Vimeo, etc.).
 */

export interface PlayableMediaItem {
  id: string;
  element: HTMLElement;
  type: "video" | "youtube" | "vimeo" | "instagram" | "other";
  play: () => void;
  pause: () => void;
  isManuallyPaused: boolean;
  lastRatio: number;
}

const registeredMedia = new Map<HTMLElement, PlayableMediaItem>();

let sharedObserver: IntersectionObserver | null = null;
let scrollStopTimer: ReturnType<typeof setTimeout> | null = null;
let isScrollListening = false;
let isTicking = false;
let isUserScrolling = false;
let userScrollTimeout: ReturnType<typeof setTimeout> | null = null;

function detectMediaType(el: HTMLElement): PlayableMediaItem["type"] {
  if (el.tagName === "VIDEO") return "video";
  if (el.tagName === "IFRAME") {
    const src = (el.getAttribute("src") || "").toLowerCase();
    if (src.includes("youtube.com") || src.includes("youtu.be") || src.includes("youtube-nocookie.com")) {
      return "youtube";
    }
    if (src.includes("vimeo.com")) {
      return "vimeo";
    }
    if (src.includes("instagram.com")) {
      return "instagram";
    }
  }
  return "other";
}

function createMediaController(el: HTMLElement, type: PlayableMediaItem["type"]): {
  play: () => void;
  pause: () => void;
} {
  if (type === "video" && el instanceof HTMLVideoElement) {
    // Native HTML5 <video>
    el.muted = true;
    el.playsInline = true;
    el.loop = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("loop", "");

    return {
      play: () => {
        el.muted = true;
        if (el.paused) {
          el.play().catch(() => {});
        }
      },
      pause: () => {
        if (!el.paused) {
          el.pause();
        }
      },
    };
  }

  if (type === "youtube" && el instanceof HTMLIFrameElement) {
    // Ensure enablejsapi=1 is on YouTube iframe
    try {
      const src = el.src;
      if (src && !src.includes("enablejsapi=1")) {
        el.src = `${src}${src.includes("?") ? "&" : "?"}enablejsapi=1`;
      }
    } catch {}

    return {
      play: () => {
        try {
          el.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "mute", args: [] }),
            "*",
          );
          el.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }),
            "*",
          );
        } catch {}
      },
      pause: () => {
        try {
          el.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
            "*",
          );
        } catch {}
      },
    };
  }

  if (type === "vimeo" && el instanceof HTMLIFrameElement) {
    return {
      play: () => {
        try {
          el.contentWindow?.postMessage(JSON.stringify({ method: "setVolume", value: 0 }), "*");
          el.contentWindow?.postMessage(JSON.stringify({ method: "play" }), "*");
        } catch {}
      },
      pause: () => {
        try {
          el.contentWindow?.postMessage(JSON.stringify({ method: "pause" }), "*");
        } catch {}
      },
    };
  }

  if (type === "instagram" && el instanceof HTMLIFrameElement) {
    return {
      play: () => {
        try {
          el.contentWindow?.postMessage(JSON.stringify({ type: "PLAY" }), "*");
          el.contentWindow?.postMessage(JSON.stringify({ method: "play" }), "*");
          el.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo" }), "*");
        } catch {}
      },
      pause: () => {
        try {
          el.contentWindow?.postMessage(JSON.stringify({ type: "PAUSE" }), "*");
          el.contentWindow?.postMessage(JSON.stringify({ method: "pause" }), "*");
          el.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo" }), "*");
        } catch {}
      },
    };
  }

  // Fallback for other iframes (e.g. reset on offscreen if needed)
  return {
    play: () => {},
    pause: () => {},
  };
}

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const item = registeredMedia.get(entry.target as HTMLElement);
          if (!item) return;

          item.lastRatio = entry.intersectionRatio;

          // If scrolled out of view or less than 20% visible, pause immediately
          if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
            item.pause();
            item.isManuallyPaused = false;
          } else if (entry.intersectionRatio >= 0.35) {
            // Video entered visible zone: schedule active video evaluation
            scheduleEvaluate();
          }
        });
      },
      {
        threshold: [0, 0.2, 0.35, 0.5, 0.7, 0.9],
      },
    );
  }
  return sharedObserver;
}

export function calculateElementVisibility(el: HTMLElement) {
  if (!el || typeof window === "undefined" || !document.body.contains(el)) {
    return { visibleRatio: 0, visibleHeight: 0, centerDistance: Infinity, inViewport: false };
  }

  let rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight || 800;

  // If the video element itself has 0 dimensions (e.g. while loading metadata/sources),
  // use its parent container's bounding box so it is detected as in-view.
  if ((rect.height <= 0 || rect.width <= 0) && el.parentElement) {
    const parentRect = el.parentElement.getBoundingClientRect();
    if (parentRect.height > 0 && parentRect.width > 0) {
      rect = parentRect;
    }
  }

  if (rect.height <= 0 || rect.width <= 0) {
    return { visibleRatio: 0, visibleHeight: 0, centerDistance: Infinity, inViewport: false };
  }

  // Completely outside viewport
  if (rect.bottom <= 0 || rect.top >= vh) {
    return { visibleRatio: 0, visibleHeight: 0, centerDistance: Infinity, inViewport: false };
  }

  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(vh, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const visibleRatio = visibleHeight / rect.height;

  const elementCenterY = rect.top + rect.height / 2;
  const viewportCenterY = vh / 2;
  const centerDistance = Math.abs(elementCenterY - viewportCenterY);

  return {
    visibleRatio,
    visibleHeight,
    centerDistance,
    inViewport: visibleRatio > 0,
    rect,
  };
}

// Backward compatible helper
export const calculateVideoVisibility = calculateElementVisibility;

export function pauseAllVideos() {
  registeredMedia.forEach((item) => {
    item.pause();
  });
}

/**
 * Evaluates all registered media items and plays the single best in-view item
 * (the one closest to vertical center of viewport), while pausing any others.
 * As user scrolls, the active video pauses and the next one automatically plays.
 */
export function evaluateActiveVideo() {
  if (typeof document === "undefined" || document.hidden) {
    pauseAllVideos();
    return;
  }

  if (registeredMedia.size === 0) return;

  const vh = window.innerHeight || document.documentElement.clientHeight || 800;
  let bestItem: PlayableMediaItem | null = null;
  let minDistance = Infinity;

  registeredMedia.forEach((item) => {
    if (!document.body.contains(item.element)) return;
    const vis = calculateElementVisibility(item.element);

    // If scrolled out of view or less than 15% visible and far from center, reset manual pause flag
    if (!vis.inViewport || vis.visibleRatio < 0.15 || vis.centerDistance > vh * 0.6) {
      item.isManuallyPaused = false;
      item.pause();
      return;
    }

    // Video is a valid candidate if reasonably near viewport center and not manually paused
    const inCenterZone = vis.centerDistance < Math.max(vh * 0.48, 360);
    const hasGoodVisibility = vis.visibleRatio >= 0.2 || vis.visibleHeight >= 120;

    if (inCenterZone && hasGoodVisibility && !item.isManuallyPaused) {
      if (vis.centerDistance < minDistance) {
        minDistance = vis.centerDistance;
        bestItem = item;
      }
    }
  });

  // Fallback: if no video is in center zone but a video is well visible in viewport and only candidate
  if (!bestItem) {
    registeredMedia.forEach((item) => {
      if (!document.body.contains(item.element) || item.isManuallyPaused) return;
      const vis = calculateElementVisibility(item.element);
      if (vis.inViewport && (vis.visibleRatio >= 0.35 || vis.visibleHeight >= 180)) {
        if (vis.centerDistance < minDistance) {
          minDistance = vis.centerDistance;
          bestItem = item;
        }
      }
    });
  }

  registeredMedia.forEach((item) => {
    if (item === bestItem) {
      item.play();
    } else {
      item.pause();
    }
  });
}

function scheduleEvaluate() {
  if (scrollStopTimer) clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => {
    evaluateActiveVideo();
  }, 40);
}

function handleWindowScroll() {
  isUserScrolling = true;
  if (userScrollTimeout) clearTimeout(userScrollTimeout);
  userScrollTimeout = setTimeout(() => {
    isUserScrolling = false;
  }, 80);

  // Immediate check during scroll: if playing item leaves viewport, pause right away
  if (!isTicking) {
    window.requestAnimationFrame(() => {
      const vh = window.innerHeight || 800;
      registeredMedia.forEach((item) => {
        const vis = calculateElementVisibility(item.element);
        // If less than 20% visible or far from viewport center, pause immediately
        if (!vis.inViewport || vis.visibleRatio < 0.18 || vis.centerDistance > vh * 0.58) {
          item.pause();
          item.isManuallyPaused = false;
        }
      });
      isTicking = false;
    });
    isTicking = true;
  }

  // When scroll settles: auto-play the video that is now centered in view
  if (scrollStopTimer) clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => {
    evaluateActiveVideo();
  }, 50);
}

function handleScrollEnd() {
  evaluateActiveVideo();
}

function handleVisibilityChange() {
  if (document.hidden) {
    pauseAllVideos();
  } else {
    evaluateActiveVideo();
  }
}

function ensureGlobalScrollListeners() {
  if (isScrollListening || typeof window === "undefined") return;
  isScrollListening = true;

  window.addEventListener("scroll", handleWindowScroll, { passive: true });
  window.addEventListener("scrollend" as any, handleScrollEnd, { passive: true });
  window.addEventListener("touchmove", handleWindowScroll, { passive: true });
  window.addEventListener("touchend", scheduleEvaluate, { passive: true });
  window.addEventListener("resize", scheduleEvaluate, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Unlock playback on first user touch/click/scroll anywhere on page
  const unlock = () => {
    evaluateActiveVideo();
  };
  window.addEventListener("click", unlock, { once: true, passive: true });
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("wheel", unlock, { once: true, passive: true });
}

function teardownGlobalScrollListenersIfEmpty() {
  if (registeredMedia.size > 0 || !isScrollListening || typeof window === "undefined") return;
  isScrollListening = false;

  window.removeEventListener("scroll", handleWindowScroll);
  window.removeEventListener("scrollend" as any, handleScrollEnd);
  window.removeEventListener("touchmove", handleWindowScroll);
  window.removeEventListener("touchend", scheduleEvaluate);
  window.removeEventListener("resize", scheduleEvaluate);
  document.removeEventListener("visibilitychange", handleVisibilityChange);

  if (sharedObserver) {
    sharedObserver.disconnect();
    sharedObserver = null;
  }
  if (scrollStopTimer) {
    clearTimeout(scrollStopTimer);
    scrollStopTimer = null;
  }
}

/**
 * Register any playable media element (HTML5 <video> or video <iframe>)
 * to participate in smart viewport scroll autoplay and auto-pause.
 */
export function registerPlayableMedia(element: HTMLElement): () => void {
  if (!element || registeredMedia.has(element)) return () => {};

  const type = detectMediaType(element);
  const controller = createMediaController(element, type);

  let isProgrammatic = false;
  const safePause = () => {
    isProgrammatic = true;
    controller.pause();
    setTimeout(() => {
      isProgrammatic = false;
    }, 150);
  };

  const safePlay = () => {
    controller.play();
  };

  const item: PlayableMediaItem = {
    id: `media-${Math.random().toString(36).slice(2, 9)}`,
    element,
    type,
    play: safePlay,
    pause: safePause,
    isManuallyPaused: false,
    lastRatio: 0,
  };

  registeredMedia.set(element, item);

  if (element instanceof HTMLVideoElement) {
    // Track genuine user click on controls to pause
    let userTappedControls = false;
    const handlePointerDown = () => {
      userTappedControls = true;
      setTimeout(() => {
        userTappedControls = false;
      }, 500);
    };

    const handlePause = () => {
      if (isProgrammatic) return;
      // ONLY respect pause as manual if the user actually tapped on the video controls
      if (userTappedControls) {
        item.isManuallyPaused = true;
      }
    };
    const handlePlay = () => {
      item.isManuallyPaused = false;
    };

    element.addEventListener("pointerdown", handlePointerDown, { passive: true });
    element.addEventListener("pause", handlePause);
    element.addEventListener("play", handlePlay);
    element.addEventListener("loadeddata", scheduleEvaluate);
    element.addEventListener("loadedmetadata", scheduleEvaluate);
    element.addEventListener("canplay", scheduleEvaluate);
  }

  ensureGlobalScrollListeners();

  const observer = getSharedObserver();
  if (observer) {
    observer.observe(element);
  }

  scheduleEvaluate();

  return () => {
    item.pause();
    if (observer) {
      observer.unobserve(element);
    }
    registeredMedia.delete(element);
    teardownGlobalScrollListenersIfEmpty();
  };
}

// Backward-compatible alias for <video> elements
export function registerScrollAutoPlay(video: HTMLVideoElement): () => void {
  return registerPlayableMedia(video);
}

export function playVideoSafely(video: HTMLVideoElement) {
  const item = registeredMedia.get(video);
  if (item) {
    item.play();
  } else {
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
  }
}

export function pauseVideoSafely(video: HTMLVideoElement) {
  const item = registeredMedia.get(video);
  if (item) {
    item.pause();
  } else {
    video.pause();
  }
}

/**
 * Automatically scan a container (article body, embedded post, etc.)
 * and register all video elements and playable iframes for scroll autoplay.
 */
export function initArticleVideoAutoPlay(container: HTMLElement): () => void {
  if (!container || typeof window === "undefined") return () => {};

  const cleanups: Array<() => void> = [];

  const attachToElements = () => {
    // 1. Scan native HTML5 <video> elements
    const videos = container.querySelectorAll<HTMLVideoElement>("video");
    videos.forEach((vid) => {
      if (!registeredMedia.has(vid)) {
        cleanups.push(registerPlayableMedia(vid));
      }
    });

    // 2. Scan playable iframes (YouTube, Vimeo, etc.)
    const iframes = container.querySelectorAll<HTMLIFrameElement>("iframe");
    iframes.forEach((ifr) => {
      const src = (ifr.getAttribute("src") || "").toLowerCase();
      const isPlayable =
        src.includes("youtube.com") ||
        src.includes("youtu.be") ||
        src.includes("vimeo.com") ||
        src.includes("instagram.com") ||
        src.includes("facebook.com/plugins/video");
      if (isPlayable && !registeredMedia.has(ifr)) {
        cleanups.push(registerPlayableMedia(ifr));
      }
    });
  };

  attachToElements();

  const mutationObserver = new MutationObserver(() => {
    attachToElements();
  });

  mutationObserver.observe(container, {
    childList: true,
    subtree: true,
  });

  return () => {
    mutationObserver.disconnect();
    cleanups.forEach((c) => c());
  };
}
