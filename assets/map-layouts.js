/* JJTrip stable map bootstrap and route-detail overlay interactions. */
(function () {
  "use strict";

  const MAP_CORE_VERSION = "20260806-stable-loader-1";

  function fallbackMapSvg(title, caption) {
    return `<svg viewBox="0 0 1000 650" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}城市地图">
      <defs>
        <pattern id="fallbackWaterDots" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M4 17 Q11 11 18 17 T32 17" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>
        </pattern>
      </defs>
      <rect width="1000" height="650" fill="#b9e8ff"/>
      <rect width="1000" height="650" fill="url(#fallbackWaterDots)"/>
      <path d="M70 105 Q250 40 438 88 Q625 28 860 102 Q950 190 910 354 Q872 514 688 557 Q500 614 313 553 Q125 515 67 366 Q24 232 70 105 Z" fill="#bde5a7" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
      <path d="M126 150 Q284 90 431 138 L418 307 L113 326 Z" fill="#f8d480" stroke="#fff" stroke-width="4"/>
      <path d="M431 138 Q596 80 765 150 L786 322 L418 307 Z" fill="#f5b18a" stroke="#fff" stroke-width="4"/>
      <path d="M113 326 L418 307 L469 508 Q281 545 145 450 Z" fill="#d2beff" stroke="#fff" stroke-width="4"/>
      <path d="M418 307 L786 322 L824 454 Q659 549 469 508 Z" fill="#aee5cc" stroke="#fff" stroke-width="4"/>
      <path d="M136 221 Q326 171 516 213 T840 228 M144 402 Q348 354 541 402 T817 397" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="15 12" opacity=".82"/>
      <text x="60" y="66" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="34" font-weight="900" fill="#173f6b" stroke="#fff" stroke-width="8" paint-order="stroke">${title}</text>
      <text x="61" y="94" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="16" font-weight="700" fill="#45657f" stroke="#fff" stroke-width="5" paint-order="stroke">${caption}</text>
      <text x="475" y="345" font-size="42">🏙️</text>
    </svg>`;
  }

  function installFallbackMaps() {
    const specs = {
      hongkong: {
        title: "香港",
        caption: "山海相拥 · 维港两岸",
        bounds: { minLng: 114.115, maxLng: 114.19, minLat: 22.265, maxLat: 22.34, left: 21, right: 87, top: 17, bottom: 81 }
      },
      singapore: {
        title: "新加坡",
        caption: "花园城市 · 多元街区",
        bounds: { minLng: 103.828, maxLng: 103.872, minLat: 1.273, maxLat: 1.312, left: 20, right: 80, top: 21, bottom: 69 }
      },
      shenzhen: {
        title: "深圳",
        caption: "山海连城 · 活力湾区",
        bounds: { minLng: 113.87, maxLng: 114.16, minLat: 22.47, maxLat: 22.68, left: 7, right: 94, top: 12, bottom: 76 }
      },
      macau: {
        title: "澳门",
        caption: "世遗街巷 · 海岛风情",
        bounds: { minLng: 113.525, maxLng: 113.57, minLat: 22.105, maxLat: 22.205, left: 34, right: 65, top: 10, bottom: 91 }
      },
      kualalumpur: {
        title: "吉隆坡",
        caption: "多元文化 · 热带都会",
        bounds: { minLng: 101.685, maxLng: 101.722, minLat: 3.115, maxLat: 3.17, left: 18, right: 82, top: 18, bottom: 83 }
      },
      generic: {
        title: "自定义城市",
        caption: "拖动地点，制作你的旅行手册",
        bounds: null
      }
    };

    window.JJTRIP_MAPS = Object.fromEntries(Object.entries(specs).map(([cityId, spec]) => [cityId, {
      ...spec,
      overrides: {},
      svg: fallbackMapSvg(spec.title, spec.caption)
    }]));
  }

  function loadMapCoreSynchronously() {
    if (window.JJTRIP_MAPS?.hongkong?.svg) return true;

    try {
      const request = new XMLHttpRequest();
      request.open("GET", `./assets/map-layouts-core-v7.js?v=${MAP_CORE_VERSION}`, false);
      request.overrideMimeType?.("text/javascript");
      request.send(null);
      const loaded = request.status === 0 || (request.status >= 200 && request.status < 300);
      if (!loaded || !request.responseText.trim()) throw new Error(`地图核心请求失败：${request.status}`);
      (0, eval)(`${request.responseText}\n//# sourceURL=map-layouts-core-v7.js`);
    } catch (error) {
      console.error("JJTrip 地图核心加载失败，已启用备用地图。", error);
    }

    if (!window.JJTRIP_MAPS?.hongkong?.svg) installFallbackMaps();
    return Boolean(window.JJTRIP_MAPS?.hongkong?.svg);
  }

  loadMapCoreSynchronously();

  if (typeof window.save !== "function") {
    window.save = function () {
      try {
        const key = "jjtrip_mvp_v3";
        const raw = localStorage.getItem(key);
        if (!raw) return;
        localStorage.setItem(key, JSON.stringify(JSON.parse(raw)));
      } catch (_) {
        // The app still continues in memory if storage is unavailable.
      }
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const drawer = document.getElementById("routeDrawer");
    const handle = document.getElementById("routeHandle");
    const detail = document.getElementById("detailPanel");
    const mapStage = document.getElementById("mapStage");
    if (!drawer || !handle || !detail || !mapStage) return;

    const originalParent = detail.parentNode;
    const originalNextSibling = detail.nextSibling;
    let routeStopDetailActive = false;
    let detailIsPortalled = false;

    const routeLayoutProperties = [
      "position", "z-index", "top", "right", "bottom", "left", "box-sizing",
      "width", "max-width", "height", "min-height", "max-height", "overflow-y",
      "border-radius", "transform"
    ];

    const clearRouteCardLayout = () => {
      routeLayoutProperties.forEach(property => detail.style.removeProperty(property));
      const gallery = detail.querySelector(":scope > .place-gallery");
      if (gallery) {
        ["height", "min-height", "max-height", "flex"].forEach(property => gallery.style.removeProperty(property));
      }
    };

    const restoreDetail = () => {
      if (detailIsPortalled) {
        if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
          originalParent.insertBefore(detail, originalNextSibling);
        } else {
          originalParent.appendChild(detail);
        }
        detailIsPortalled = false;
      }
      clearRouteCardLayout();
    };

    const portalDetail = () => {
      if (detailIsPortalled) return;
      document.body.appendChild(detail);
      detailIsPortalled = true;
    };

    const arrangeDetailContent = () => {
      const gallery = detail.querySelector(":scope > .place-gallery");
      const actions = detail.querySelector(":scope > .detail-primary-actions");
      if (gallery && actions && gallery.nextElementSibling !== actions) {
        gallery.insertAdjacentElement("afterend", actions);
      }
    };

    const applyRouteCardLayout = () => {
      if (!routeStopDetailActive || !detail.classList.contains("open") || drawer.classList.contains("collapsed")) return;

      const mapRect = mapStage.getBoundingClientRect();
      const drawerRect = drawer.getBoundingClientRect();
      const mobile = window.innerWidth <= 720;
      const halfMapHeight = Math.round(Math.max(220, Math.min(mobile ? 420 : 520, mapRect.height * 0.5)));
      const bottomOffset = Math.max(8, Math.round(window.innerHeight - drawerRect.bottom));
      const important = (property, value) => detail.style.setProperty(property, value, "important");

      important("position", "fixed");
      important("z-index", "4000");
      important("top", "auto");
      important("bottom", `${bottomOffset}px`);
      important("box-sizing", "border-box");
      important("height", `${halfMapHeight}px`);
      important("min-height", "0");
      important("max-height", `${halfMapHeight}px`);
      important("overflow-y", "auto");
      important("border-radius", mobile ? "22px" : "24px");

      if (mobile) {
        important("right", "10px");
        important("left", "10px");
        important("width", "auto");
        important("max-width", "none");
        important("transform", "none");
      } else {
        important("right", "auto");
        important("left", "50%");
        important("width", "420px");
        important("max-width", "calc(100vw - 36px)");
        important("transform", "translateX(-50%)");
      }

      const gallery = detail.querySelector(":scope > .place-gallery");
      if (gallery) {
        const galleryHeight = Math.round(Math.max(96, Math.min(132, halfMapHeight * 0.3)));
        gallery.style.setProperty("height", `${galleryHeight}px`, "important");
        gallery.style.setProperty("min-height", `${galleryHeight}px`, "important");
        gallery.style.setProperty("max-height", `${galleryHeight}px`, "important");
        gallery.style.setProperty("flex", "0 0 auto", "important");
      }
    };

    const syncRouteDetailOverlay = () => {
      arrangeDetailContent();
      const shouldOverlay = routeStopDetailActive && detail.classList.contains("open") && !drawer.classList.contains("collapsed");
      if (shouldOverlay) {
        portalDetail();
        detail.classList.add("route-card-overlay");
        document.body.classList.add("route-detail-open");
        applyRouteCardLayout();
      } else {
        detail.classList.remove("route-card-overlay");
        document.body.classList.remove("route-detail-open");
        restoreDetail();
      }
    };

    const closeDetailToRoute = () => {
      routeStopDetailActive = false;
      detail.querySelector("#closeDetailBtn")?.click();
      requestAnimationFrame(syncRouteDetailOverlay);
    };

    drawer.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".route-node") && !target.closest("button")) routeStopDetailActive = true;
    }, true);

    drawer.addEventListener("click", event => {
      if (drawer.classList.contains("collapsed")) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".route-content")) return;
      if (target.closest("button, a, input, select, textarea, .route-node, .route-edge, [role='button'], [role='tab']")) return;
      handle.click();
    });

    document.addEventListener("pointerdown", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (routeStopDetailActive && detail.classList.contains("open")) {
        if (target.closest("#detailPanel") || target.closest(".route-node")) return;
        event.preventDefault();
        event.stopPropagation();
        closeDetailToRoute();
        return;
      }

      if (detail.classList.contains("open")) return;
      if (drawer.classList.contains("collapsed")) return;
      if (!target.closest("#mapStage")) return;
      if (target.closest("#detailPanel, .place-marker, .map-zoom-controls, .edit-toolbar, .add-place-tip, button, input, select, textarea")) return;
      handle.click();
    }, true);

    const detailObserver = new MutationObserver(() => {
      if (!detail.classList.contains("open")) routeStopDetailActive = false;
      syncRouteDetailOverlay();
    });
    detailObserver.observe(detail, { childList: true, attributes: true, attributeFilter: ["class"] });

    const drawerObserver = new MutationObserver(() => {
      if (drawer.classList.contains("collapsed")) routeStopDetailActive = false;
      syncRouteDetailOverlay();
    });
    drawerObserver.observe(drawer, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", () => {
      if (routeStopDetailActive) requestAnimationFrame(applyRouteCardLayout);
    }, { passive: true });

    syncRouteDetailOverlay();
  });
})();
