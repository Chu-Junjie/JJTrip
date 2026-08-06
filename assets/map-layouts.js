/* JJTrip map bootstrap and route-detail overlay interactions. */
(function () {
  "use strict";

  document.write('<script src="./assets/map-layouts-core-v7.js"><' + '/script>');

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
      if (target.closest(".route-node") && !target.closest("button")) {
        routeStopDetailActive = true;
      }
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
