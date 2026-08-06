/* JJTrip non-blocking map bootstrap and route-detail overlay interactions. */
(function () {
  "use strict";

  var MAP_CORE_VERSION = "20260806-nonblocking-loader-2";
  var CITY_IDS = {
    "香港": "hongkong",
    "新加坡": "singapore",
    "深圳": "shenzhen",
    "澳门": "macau",
    "吉隆坡": "kualalumpur"
  };
  var pendingCityId = "";

  /* The app uses Array#at during initial data normalisation. Older iOS WebViews do not provide it. */
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, "at", {
      configurable: true,
      writable: true,
      value: function (index) {
        var length = this.length >>> 0;
        var position = Number(index) || 0;
        if (position < 0) position += length;
        return position < 0 || position >= length ? undefined : this[position];
      }
    });
  }

  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function () {
      while (this.firstChild) this.removeChild(this.firstChild);
      for (var index = 0; index < arguments.length; index += 1) {
        var value = arguments[index];
        this.appendChild(value instanceof Node ? value : document.createTextNode(String(value)));
      }
    };
  }

  function fallbackMapSvg(title, caption) {
    return '<svg viewBox="0 0 1000 650" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + title + '城市地图">' +
      '<defs><pattern id="fallbackWaterDots" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M4 17 Q11 11 18 17 T32 17" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/></pattern></defs>' +
      '<rect width="1000" height="650" fill="#b9e8ff"/><rect width="1000" height="650" fill="url(#fallbackWaterDots)"/>' +
      '<path d="M70 105 Q250 40 438 88 Q625 28 860 102 Q950 190 910 354 Q872 514 688 557 Q500 614 313 553 Q125 515 67 366 Q24 232 70 105 Z" fill="#bde5a7" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>' +
      '<path d="M126 150 Q284 90 431 138 L418 307 L113 326 Z" fill="#f8d480" stroke="#fff" stroke-width="4"/>' +
      '<path d="M431 138 Q596 80 765 150 L786 322 L418 307 Z" fill="#f5b18a" stroke="#fff" stroke-width="4"/>' +
      '<path d="M113 326 L418 307 L469 508 Q281 545 145 450 Z" fill="#d2beff" stroke="#fff" stroke-width="4"/>' +
      '<path d="M418 307 L786 322 L824 454 Q659 549 469 508 Z" fill="#aee5cc" stroke="#fff" stroke-width="4"/>' +
      '<path d="M136 221 Q326 171 516 213 T840 228 M144 402 Q348 354 541 402 T817 397" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="15 12" opacity=".82"/>' +
      '<text x="60" y="66" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="34" font-weight="900" fill="#173f6b" stroke="#fff" stroke-width="8" paint-order="stroke">' + title + '</text>' +
      '<text x="61" y="94" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="16" font-weight="700" fill="#45657f" stroke="#fff" stroke-width="5" paint-order="stroke">' + caption + '</text>' +
      '<text x="475" y="345" font-size="42">🏙️</text></svg>';
  }

  function installFallbackMaps() {
    if (window.JJTRIP_MAPS && window.JJTRIP_MAPS.hongkong) return;
    var specs = {
      hongkong: { title: "香港", caption: "山海相拥 · 维港两岸", bounds: { minLng: 114.115, maxLng: 114.19, minLat: 22.265, maxLat: 22.34, left: 21, right: 87, top: 17, bottom: 81 } },
      singapore: { title: "新加坡", caption: "花园城市 · 多元街区", bounds: { minLng: 103.828, maxLng: 103.872, minLat: 1.273, maxLat: 1.312, left: 20, right: 80, top: 21, bottom: 69 } },
      shenzhen: { title: "深圳", caption: "山海连城 · 活力湾区", bounds: { minLng: 113.87, maxLng: 114.16, minLat: 22.47, maxLat: 22.68, left: 7, right: 94, top: 12, bottom: 76 } },
      macau: { title: "澳门", caption: "世遗街巷 · 海岛风情", bounds: { minLng: 113.525, maxLng: 113.57, minLat: 22.105, maxLat: 22.205, left: 34, right: 65, top: 10, bottom: 91 } },
      kualalumpur: { title: "吉隆坡", caption: "多元文化 · 热带都会", bounds: { minLng: 101.685, maxLng: 101.722, minLat: 3.115, maxLat: 3.17, left: 18, right: 82, top: 18, bottom: 83 } },
      generic: { title: "自定义城市", caption: "拖动地点，制作你的旅行手册", bounds: null }
    };
    var maps = {};
    Object.keys(specs).forEach(function (cityId) {
      var spec = specs[cityId];
      maps[cityId] = {
        title: spec.title,
        caption: spec.caption,
        bounds: spec.bounds,
        overrides: {},
        svg: fallbackMapSvg(spec.title, spec.caption)
      };
    });
    window.JJTRIP_MAPS = maps;
  }

  function currentCityId() {
    var nameNode = document.getElementById("currentCityName");
    var name = nameNode ? nameNode.textContent.trim() : "";
    if (CITY_IDS[name]) return CITY_IDS[name];
    try {
      var raw = localStorage.getItem("jjtrip_mvp_v3");
      var data = raw ? JSON.parse(raw) : null;
      if (data && data.currentCity) return String(data.currentCity);
    } catch (_) {}
    return "hongkong";
  }

  function refreshMapFromCore() {
    var cityId = currentCityId();
    var layout = window.JJTRIP_MAPS && (window.JJTRIP_MAPS[cityId] || window.JJTRIP_MAPS.generic);
    var mapArt = document.getElementById("mapArt");
    if (mapArt && layout && layout.svg) mapArt.innerHTML = layout.svg;
    try { window.dispatchEvent(new Event("resize")); } catch (_) {}
  }

  function loadMapCoreWithoutBlocking() {
    if (document.querySelector('script[data-jjtrip-map-core="1"]')) return;
    var script = document.createElement("script");
    script.src = "./assets/map-layouts-core-v7.js?v=" + MAP_CORE_VERSION;
    script.async = true;
    script.setAttribute("data-jjtrip-map-core", "1");
    script.onload = refreshMapFromCore;
    script.onerror = function () {
      console.error("JJTrip 地图核心加载失败，当前继续使用备用地图。");
    };
    document.head.appendChild(script);
  }

  function showStartupError(message) {
    if (document.getElementById("jjtripStartupError")) return;
    var mapStage = document.getElementById("mapStage");
    if (!mapStage) return;
    var panel = document.createElement("div");
    panel.id = "jjtripStartupError";
    panel.setAttribute("role", "alert");
    panel.style.cssText = "position:absolute;z-index:5000;top:18px;left:18px;right:18px;padding:14px 16px;border:1px solid #fecaca;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 12px 34px rgba(15,23,42,.18);font:600 14px/1.5 -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;color:#991b1b";
    panel.textContent = "页面脚本未完成加载：" + message;
    mapStage.appendChild(panel);
  }

  window.addEventListener("error", function (event) {
    var filterBar = document.getElementById("filterBar");
    if (filterBar && filterBar.children.length) return;
    showStartupError(event.message || "未知脚本错误");
  });
  window.addEventListener("unhandledrejection", function (event) {
    var filterBar = document.getElementById("filterBar");
    if (filterBar && filterBar.children.length) return;
    var reason = event.reason && event.reason.message ? event.reason.message : String(event.reason || "未知异步错误");
    showStartupError(reason);
  });

  installFallbackMaps();
  loadMapCoreWithoutBlocking();

  document.addEventListener("click", function (event) {
    var option = event.target && event.target.closest ? event.target.closest(".quick-city-option") : null;
    if (!option) return;
    var nameNode = option.querySelector("b");
    pendingCityId = CITY_IDS[nameNode ? nameNode.textContent.trim() : ""] || "";
  }, true);

  window.save = function () {
    if (!pendingCityId) return;
    try {
      var key = "jjtrip_mvp_v3";
      var raw = localStorage.getItem(key);
      if (!raw) return;
      var data = JSON.parse(raw);
      data.currentCity = pendingCityId;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_) {
      // City switching still completes in memory when storage is unavailable.
    } finally {
      pendingCityId = "";
    }
  };

  window.setTimeout(function () {
    var filterBar = document.getElementById("filterBar");
    var markerLayer = document.getElementById("markerLayer");
    if (filterBar && filterBar.children.length) return;
    if (markerLayer && markerLayer.children.length) return;
    showStartupError("核心界面初始化超时，请截图此提示并刷新页面");
  }, 4500);

  document.addEventListener("DOMContentLoaded", function () {
    var drawer = document.getElementById("routeDrawer");
    var handle = document.getElementById("routeHandle");
    var detail = document.getElementById("detailPanel");
    var mapStage = document.getElementById("mapStage");
    if (!drawer || !handle || !detail || !mapStage) return;

    var originalParent = detail.parentNode;
    var originalNextSibling = detail.nextSibling;
    var routeStopDetailActive = false;
    var detailIsPortalled = false;
    var routeLayoutProperties = [
      "position", "z-index", "top", "right", "bottom", "left", "box-sizing",
      "width", "max-width", "height", "min-height", "max-height", "overflow-y",
      "border-radius", "transform"
    ];

    function directChildByClass(parent, className) {
      for (var index = 0; index < parent.children.length; index += 1) {
        if (parent.children[index].classList.contains(className)) return parent.children[index];
      }
      return null;
    }

    function clearRouteCardLayout() {
      routeLayoutProperties.forEach(function (property) { detail.style.removeProperty(property); });
      var gallery = directChildByClass(detail, "place-gallery");
      if (gallery) {
        ["height", "min-height", "max-height", "flex"].forEach(function (property) { gallery.style.removeProperty(property); });
      }
    }

    function restoreDetail() {
      if (detailIsPortalled) {
        if (originalNextSibling && originalNextSibling.parentNode === originalParent) originalParent.insertBefore(detail, originalNextSibling);
        else originalParent.appendChild(detail);
        detailIsPortalled = false;
      }
      clearRouteCardLayout();
    }

    function portalDetail() {
      if (detailIsPortalled) return;
      document.body.appendChild(detail);
      detailIsPortalled = true;
    }

    function arrangeDetailContent() {
      var gallery = directChildByClass(detail, "place-gallery");
      var actions = directChildByClass(detail, "detail-primary-actions");
      if (gallery && actions && gallery.nextElementSibling !== actions) gallery.insertAdjacentElement("afterend", actions);
    }

    function applyRouteCardLayout() {
      if (!routeStopDetailActive || !detail.classList.contains("open") || drawer.classList.contains("collapsed")) return;
      var mapRect = mapStage.getBoundingClientRect();
      var drawerRect = drawer.getBoundingClientRect();
      var mobile = window.innerWidth <= 720;
      var halfMapHeight = Math.round(Math.max(220, Math.min(mobile ? 420 : 520, mapRect.height * 0.5)));
      var bottomOffset = Math.max(8, Math.round(window.innerHeight - drawerRect.bottom));
      function important(property, value) { detail.style.setProperty(property, value, "important"); }

      important("position", "fixed");
      important("z-index", "4000");
      important("top", "auto");
      important("bottom", bottomOffset + "px");
      important("box-sizing", "border-box");
      important("height", halfMapHeight + "px");
      important("min-height", "0");
      important("max-height", halfMapHeight + "px");
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

      var gallery = directChildByClass(detail, "place-gallery");
      if (gallery) {
        var galleryHeight = Math.round(Math.max(96, Math.min(132, halfMapHeight * 0.3)));
        gallery.style.setProperty("height", galleryHeight + "px", "important");
        gallery.style.setProperty("min-height", galleryHeight + "px", "important");
        gallery.style.setProperty("max-height", galleryHeight + "px", "important");
        gallery.style.setProperty("flex", "0 0 auto", "important");
      }
    }

    function syncRouteDetailOverlay() {
      arrangeDetailContent();
      var shouldOverlay = routeStopDetailActive && detail.classList.contains("open") && !drawer.classList.contains("collapsed");
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
    }

    function closeDetailToRoute() {
      routeStopDetailActive = false;
      var closeButton = detail.querySelector("#closeDetailBtn");
      if (closeButton) closeButton.click();
      requestAnimationFrame(syncRouteDetailOverlay);
    }

    drawer.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".route-node") && !target.closest("button")) routeStopDetailActive = true;
    }, true);

    drawer.addEventListener("click", function (event) {
      if (drawer.classList.contains("collapsed")) return;
      var target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".route-content")) return;
      if (target.closest("button, a, input, select, textarea, .route-node, .route-edge, [role='button'], [role='tab']")) return;
      handle.click();
    });

    document.addEventListener("pointerdown", function (event) {
      var target = event.target;
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

    var detailObserver = new MutationObserver(function () {
      if (!detail.classList.contains("open")) routeStopDetailActive = false;
      syncRouteDetailOverlay();
    });
    detailObserver.observe(detail, { childList: true, attributes: true, attributeFilter: ["class"] });

    var drawerObserver = new MutationObserver(function () {
      if (drawer.classList.contains("collapsed")) routeStopDetailActive = false;
      syncRouteDetailOverlay();
    });
    drawerObserver.observe(drawer, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", function () {
      if (routeStopDetailActive) requestAnimationFrame(applyRouteCardLayout);
    }, { passive: true });

    syncRouteDetailOverlay();
  });
})();
