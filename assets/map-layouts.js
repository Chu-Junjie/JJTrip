/* JJTrip map bootstrap and route-panel interaction refinements. */
(function () {
  "use strict";

  document.write('<script src="./assets/map-layouts-core-v7.js"><' + '/script>');

  document.addEventListener("DOMContentLoaded", () => {
    const drawer = document.getElementById("routeDrawer");
    const handle = document.getElementById("routeHandle");
    const detail = document.getElementById("detailPanel");
    const mapStage = document.getElementById("mapStage");
    if (!drawer || !handle || !detail || !mapStage) return;

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "route-detail-backdrop";
    backdrop.setAttribute("aria-label", "关闭地点详情并返回路线栏");
    backdrop.hidden = true;
    document.body.appendChild(backdrop);

    const arrangeDetailContent = () => {
      const gallery = detail.querySelector(":scope > .place-gallery");
      const actions = detail.querySelector(":scope > .detail-primary-actions");
      if (gallery && actions && gallery.nextElementSibling !== actions) {
        gallery.insertAdjacentElement("afterend", actions);
      }
    };

    const syncRouteDetailOverlay = () => {
      arrangeDetailContent();
      const shouldOverlay = detail.classList.contains("open") && !drawer.classList.contains("collapsed");
      detail.classList.toggle("route-card-overlay", shouldOverlay);
      document.body.classList.toggle("route-detail-open", shouldOverlay);
      backdrop.hidden = !shouldOverlay;
    };

    const closeDetailToRoute = () => {
      detail.querySelector("#closeDetailBtn")?.click();
      requestAnimationFrame(syncRouteDetailOverlay);
    };

    backdrop.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
    });
    backdrop.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      closeDetailToRoute();
    });

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

      if (detail.classList.contains("open")) return;
      if (drawer.classList.contains("collapsed")) return;
      if (!target.closest("#mapStage")) return;
      if (target.closest("#detailPanel, .place-marker, .map-zoom-controls, .edit-toolbar, .add-place-tip, button, input, select, textarea")) return;

      handle.click();
    }, true);

    const detailObserver = new MutationObserver(syncRouteDetailOverlay);
    detailObserver.observe(detail, { childList: true, attributes: true, attributeFilter: ["class"] });

    const drawerObserver = new MutationObserver(syncRouteDetailOverlay);
    drawerObserver.observe(drawer, { attributes: true, attributeFilter: ["class"] });

    syncRouteDetailOverlay();
  });
})();
