/* JJTrip map bootstrap and route-panel interaction refinements. */
(function () {
  "use strict";

  document.write('<script src="./assets/map-layouts-core-v7.js"><' + '/script>');

  document.addEventListener("DOMContentLoaded", () => {
    const drawer = document.getElementById("routeDrawer");
    const handle = document.getElementById("routeHandle");
    if (!drawer || !handle) return;

    drawer.addEventListener("click", event => {
      if (drawer.classList.contains("collapsed")) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".route-content")) return;
      if (target.closest("button, a, input, select, textarea, .route-node, .route-edge, [role='button'], [role='tab']")) return;
      handle.click();
    });
  });
})();
