/**
 * Smart Viewport Scroll Autoplay & Auto-Pause for Videos
 *
 * Requirements:
 * 1. When the user scrolls (up or down) and stops at a video, it auto-plays smoothly (muted).
 * 2. When the user scrolls past it (either scrolling up or scrolling down), it pauses immediately.
 * 3. Only the primary in-view video plays if multiple videos exist on the page.
 * 4. Works across desktop and mobile browsers while strictly respecting autoplay policies.
 */

interface VideoMetadata {
  isManuallyPaused: boolean;
  lastRatio: number;
}

const registeredVideos = new Set<HTMLVideoElement>();
const videoMetadata = new WeakMap<HTMLVideoElement, VideoMetadata>();

let sharedObserver: IntersectionObserver | null = null;
let scrollStopTimer: ReturnType<typeof setTimeout> | null = null;
let isScrollListening = false;
let isTicking = false;
let isUserScrolling = false;
let userScrollTimeout: ReturnType<typeof setTimeout> | null = null;

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const meta = videoMetadata.get(video);
          if (meta) {
            meta.lastRatio = entry.intersectionRatio;
          }

          // If scrolled out of view or less than 20% visible, pause immediately
          if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
            pauseVideoSafely(video);
            if (meta) {
              // Reset manual pause once user leaves the video so it can play again on return
              meta.isManuallyPaused = false;
            }
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

export function calculateVideoVisibility(video: HTMLVideoElement) {
  if (!video || typeof window === "undefined" || !document.body.contains(video)) {
    return { visibleRatio: 0, centerDistance: Infinity, inViewport: false };
  }

  const rect = video.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight || 800;

  if (rect.height <= 0 || rect.width <= 0) {
    return { visibleRatio: 0, centerDistance: Infinity, inViewport: false };
  }

  // Completely outside viewport
  if (rect.bottom <= 0 || rect.top >= vh) {
    return { visibleRatio: 0, centerDistance: Infinity, inViewport: false };
  }

  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(vh, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const visibleRatio = visibleHeight / rect.height;

  const videoCenterY = rect.top + rect.height / 2;
  const viewportCenterY = vh / 2;
  const centerDistance = Math.abs(videoCenterY - viewportCenterY);

  return {
    visibleRatio,
    centerDistance,
    inViewport: visibleRatio > 0,
    rect,
  };
}

export function playVideoSafely(video: HTMLVideoElement) {
  if (!video || !document.body.contains(video)) return;

  // Always ensure autoplay compliance: muted, playsinline, loop
  video.muted = true;
  video.playsInline = true;
  if (!video.hasAttribute("muted")) video.setAttribute("muted", "");
  if (!video.hasAttribute("playsinline")) video.setAttribute("playsinline", "");
  if (!video.hasAttribute("loop")) video.setAttribute("loop", "");

  if (video.paused) {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // If sound permission issue, force mute and retry
        if (err?.name === "NotAllowedError" && !video.muted) {
          video.muted = true;
          video.play().catch(() => {});
        }
      });
    }
  }
}

export function pauseVideoSafely(video: HTMLVideoElement) {
  if (!video) return;
  if (!video.paused) {
    video.pause();
  }
}

export function pauseAllVideos() {
  registeredVideos.forEach((vid) => {
    pauseVideoSafely(vid);
  });
}

/**
 * Evaluates all registered videos and plays the single best in-view video
 * while pausing any other videos.
 */
export function evaluateActiveVideo() {
  if (typeof document === "undefined" || document.hidden) {
    pauseAllVideos();
    return;
  }

  if (registeredVideos.size === 0) return;

  let bestVideo: HTMLVideoElement | null = null;
  let minDistance = Infinity;

  registeredVideos.forEach((vid) => {
    if (!document.body.contains(vid)) return;
    const meta = videoMetadata.get(vid);
    const vis = calculateVideoVisibility(vid);

    // If scrolled out of view, pause and reset manual pause flag
    if (vis.visibleRatio < 0.2 || !vis.inViewport) {
      if (meta) meta.isManuallyPaused = false;
      pauseVideoSafely(vid);
      return;
    }

    // Video is a valid active candidate if at least 35% visible and user didn't manually pause it
    if (vis.visibleRatio >= 0.35 && (!meta || !meta.isManuallyPaused)) {
      if (vis.centerDistance < minDistance) {
        minDistance = vis.centerDistance;
        bestVideo = vid;
      }
    }
  });

  registeredVideos.forEach((vid) => {
    if (vid === bestVideo) {
      playVideoSafely(vid);
    } else {
      pauseVideoSafely(vid);
    }
  });
}

function scheduleEvaluate() {
  if (scrollStopTimer) clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => {
    evaluateActiveVideo();
  }, 90);
}

function handleWindowScroll() {
  isUserScrolling = true;
  if (userScrollTimeout) clearTimeout(userScrollTimeout);
  userScrollTimeout = setTimeout(() => {
    isUserScrolling = false;
  }, 140);

  // Immediate check during scroll: if a playing video moves out of view, pause it right away
  if (!isTicking) {
    window.requestAnimationFrame(() => {
      registeredVideos.forEach((vid) => {
        if (!vid.paused) {
          const vis = calculateVideoVisibility(vid);
          // If less than 25% visible or gone past viewport borders, pause immediately
          if (vis.visibleRatio < 0.25 || !vis.inViewport) {
            pauseVideoSafely(vid);
          }
        }
      });
      isTicking = false;
    });
    isTicking = true;
  }

  // When scrolling stops / settles: auto-play where the user stopped
  if (scrollStopTimer) clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => {
    evaluateActiveVideo();
  }, 110);
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
  window.addEventListener("resize", scheduleEvaluate, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function teardownGlobalScrollListenersIfEmpty() {
  if (registeredVideos.size > 0 || !isScrollListening || typeof window === "undefined") return;
  isScrollListening = false;

  window.removeEventListener("scroll", handleWindowScroll);
  window.removeEventListener("scrollend" as any, handleScrollEnd);
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
 * Register a video element to participate in smart viewport scroll autoplay.
 * Returns an unregister cleanup function.
 */
export function registerScrollAutoPlay(video: HTMLVideoElement): () => void {
  if (!video) return () => {};

  registeredVideos.add(video);
  videoMetadata.set(video, {
    isManuallyPaused: false,
    lastRatio: 0,
  });

  // Ensure attributes for autoplay policy
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("loop", "");

  const handlePause = () => {
    // If paused by user click while still in view and not during active scrolling
    const meta = videoMetadata.get(video);
    if (meta && !isUserScrolling) {
      const vis = calculateVideoVisibility(video);
      if (vis.visibleRatio >= 0.4) {
        meta.isManuallyPaused = true;
      }
    }
  };

  const handlePlay = () => {
    const meta = videoMetadata.get(video);
    if (meta) {
      meta.isManuallyPaused = false;
    }
  };

  const handleLoadedData = () => {
    scheduleEvaluate();
  };

  video.addEventListener("pause", handlePause);
  video.addEventListener("play", handlePlay);
  video.addEventListener("loadeddata", handleLoadedData);

  ensureGlobalScrollListeners();

  const observer = getSharedObserver();
  if (observer) {
    observer.observe(video);
  }

  // Initial check
  scheduleEvaluate();

  return () => {
    video.removeEventListener("pause", handlePause);
    video.removeEventListener("play", handlePlay);
    video.removeEventListener("loadeddata", handleLoadedData);

    if (observer) {
      observer.unobserve(video);
    }
    registeredVideos.delete(video);
    teardownGlobalScrollListenersIfEmpty();
  };
}

/**
 * Automatically scan a container (e.g. article prose body) and register all video elements.
 */
export function initArticleVideoAutoPlay(container: HTMLElement): () => void {
  if (!container || typeof window === "undefined") return () => {};

  const cleanups: Array<() => void> = [];

  const attachToVideos = () => {
    const videos = container.querySelectorAll<HTMLVideoElement>("video");
    videos.forEach((vid) => {
      if (!registeredVideos.has(vid)) {
        cleanups.push(registerScrollAutoPlay(vid));
      }
    });
  };

  attachToVideos();

  // Also observe DOM mutations inside the container (e.g. hydrated Instagram embed videos)
  const mutationObserver = new MutationObserver(() => {
    attachToVideos();
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
