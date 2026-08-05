/* JJTrip 页面交互：旧存档迁移、虚拟地图、地点详情、规划抽屉与本地编辑模式。 */
(function () {
  "use strict";

  const STORAGE_KEY = "jjtrip_mvp_v3";
  const RECOVERY_KEY = "jjtrip_mvp_v3_recovery";
  const NAV_COLLAPSE_KEY = "jjtrip_nav_collapsed";
  const MAP_MIN_SCALE = 0.55;
  const MAP_MAX_SCALE = 3.6;
  const MAX_PLACE_IMAGES = 12;
  const MAX_PLACE_IMAGE_CHARACTERS = 3200000;
  const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;
  const EDIT_PASSWORD_HASH = 2576725674;
  const FIXED_CITY_IDS = ["hongkong", "singapore", "shenzhen", "macau", "kualalumpur"];
  const TYPE_ALIASES = {
    "attraction": "景点", "景區": "景点", "景区": "景点", "夜景": "景点", "其他": "景点",
    "restaurant": "餐厅", "restaurants": "餐厅", "餐饮": "餐厅", "咖啡": "餐厅", "咖啡馆": "餐厅", "cafe": "餐厅", "coffee": "餐厅",
    "snack": "小吃", "snacks": "小吃", "小食": "小吃", "美食": "小吃",
    "photo": "拍照机位", "photo spot": "拍照机位", "拍摄机位": "拍照机位", "摄影": "拍照机位",
    "park": "公园", "garden": "公园", "绿地": "公园",
    "museum": "博物馆", "gallery": "博物馆", "美术馆": "博物馆",
    "shopping": "购物", "shop": "购物", "商场": "购物",
    "transport": "交通", "station": "交通", "交通站点": "交通", "车站": "交通"
  };
  const CURRENCY_TRANSLATIONS = { "HK$": "港币", "SGD": "新加坡元", "CNY": "人民币", "MOP": "澳门元", "MYR": "马来西亚令吉" };
  const PLACE_TRANSLATIONS = {
    hk_pmq: { name: ["PMQ元创方", "元创方"] },
    hk_k11: { name: ["K11 MUSEA海旁", "尖沙咀艺术购物馆海旁", "K11艺术购物馆海旁"] },
    hk_mplus: { name: ["M+", "西九龙视觉文化博物馆"] },
    sg_merlion: { address: ["One Fullerton", "富丽敦一号"] },
    sg_esplanade: { address: ["Esplanade Bridge", "滨海艺术中心桥"] },
    sg_mbs: { address: ["Bayfront Avenue", "海湾舫道"] },
    sg_gardens: { address: ["18 Marina Gardens Drive", "滨海花园通道18号"] },
    sg_supertree: { address: ["Supertree Grove", "超级树丛林"] },
    sg_fortcanning: { address: ["Fort Canning Park", "福康宁公园"] },
    sg_oldhill: { address: ["140 Hill Street", "禧街140号"] },
    sg_gallery: { address: ["1 St Andrew's Road", "圣安德烈路1号"] },
    sg_buddha: { address: ["288 South Bridge Road", "桥南路288号"] },
    sg_maxwell: { address: ["1 Kadayanallur Street", "卡达耶纳卢街1号"] },
    sg_yakun: { address: ["18 China Street", "中国街18号"] },
    sg_songfa: { address: ["11 New Bridge Road", "新桥路11号"] },
    sg_sultan: { address: ["3 Muscat Street", "马士吉街3号"], photoTip: ["从Bussorah Street正中构图金色圆顶。", "从巴梭拉街正中构图金色圆顶。"] },
    sg_haji: { address: ["Haji Lane", "哈芝巷"] },
    sg_tenteng: { address: ["37 Kerbau Road", "克尔宝路37号"] },
    sg_tekka: { address: ["665 Buffalo Road", "水牛路665号"] },
    sg_tiong: { address: ["30 Seng Poh Road", "成保路30号"] },
    sg_jewel: { address: ["78 Airport Boulevard", "机场林荫道78号"] },
    kl_petronas: { address: ["Kuala Lumpur City Centre", "吉隆坡城中城"], photoTip: ["KLCC公园、喷水池和正门广角机位。", "城中城公园、喷水池和正门广角机位。"] },
    kl_klccpark: { name: ["KLCC公园湖畔", "城中城公园湖畔"], address: ["Jalan Ampang", "安邦路"] },
    kl_saloma: { address: ["Kampung Baru", "甘榜峇鲁"] },
    kl_kltower: { address: ["Jalan Puncak", "布纳卡路"] },
    kl_merdeka: { address: ["Jalan Raja", "拉惹路"] },
    kl_sultan: { address: ["Jalan Raja", "拉惹路"] },
    kl_centralmarket: { address: ["Jalan Hang Kasturi", "汉卡斯杜丽路"] },
    kl_petaling: { address: ["Petaling Street", "茨厂街"] },
    kl_kwai: { address: ["Lorong Panggung", "戏院巷"] },
    kl_merchant: { name: ["Merchant's Lane", "茨厂街后巷咖啡馆"], address: ["Jalan Petaling", "茨厂街"] },
    kl_mosque: { address: ["Jalan Perdana", "柏达纳路"] },
    kl_islamicmuseum: { address: ["Jalan Lembah Perdana", "柏达纳谷路"] },
    kl_theanhou: { address: ["65 Persiaran Endah", "恩达道65号"] },
    kl_batu: { address: ["Gombak", "鹅唛"] },
    kl_alor: { address: ["Jalan Alor", "阿罗街"] },
    kl_lot10: { address: ["50 Jalan Sultan Ismail", "苏丹依斯迈路50号"] },
    kl_villagepark: { name: ["Village Park Restaurant", "乡村公园餐厅"], address: ["Damansara Uptown", "白沙罗上城"] },
    kl_pavilion: { address: ["Bukit Bintang", "武吉免登"] },
    kl_trx: { name: ["TRX Exchange屋顶公园", "敦拉萨国际贸易中心屋顶公园"], address: ["Tun Razak Exchange", "敦拉萨国际贸易中心"] }
  };

  const dom = {
    currentCityName: document.getElementById("currentCityName"),
    searchInput: document.getElementById("searchInput"),
    filterBar: document.getElementById("filterBar"),
    mapStage: document.getElementById("mapStage"),
    virtualMap: document.getElementById("virtualMap"),
    mapTransformLayer: document.getElementById("mapTransformLayer"),
    mapArt: document.getElementById("mapArt"),
    markerLayer: document.getElementById("markerLayer"),
    routeOverlay: document.getElementById("routeOverlay"),
    mapCaption: document.getElementById("mapCaption"),
    topbarToggle: document.getElementById("topbarToggle"),
    zoomInBtn: document.getElementById("zoomInBtn"),
    zoomOutBtn: document.getElementById("zoomOutBtn"),
    resetMapViewBtn: document.getElementById("resetMapViewBtn"),
    mapGestureHint: document.getElementById("mapGestureHint"),
    addPlaceTip: document.getElementById("addPlaceTip"),
    editToolbar: document.getElementById("editToolbar"),
    quickAddPlaceBtn: document.getElementById("quickAddPlaceBtn"),
    quickFinishEditBtn: document.getElementById("quickFinishEditBtn"),
    detailPanel: document.getElementById("detailPanel"),
    mascot: document.getElementById("floatingMascot"),
    routeDrawer: document.getElementById("routeDrawer"),
    routeHandle: document.getElementById("routeHandle"),
    routeTitle: document.getElementById("routeTitle"),
    routeSummary: document.getElementById("routeSummary"),
    timeline: document.getElementById("timeline"),
    settings: document.getElementById("settingsBackdrop"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    modeBadge: document.getElementById("modeBadge"),
    modeHint: document.getElementById("modeHint"),
    enterEditControls: document.getElementById("enterEditControls"),
    passwordInput: document.getElementById("passwordInput"),
    passwordError: document.getElementById("passwordError"),
    enterEditBtn: document.getElementById("enterEditBtn"),
    finishEditBtn: document.getElementById("finishEditBtn"),
    cityList: document.getElementById("cityList"),
    addCityBtn: document.getElementById("addCityBtn"),
    cityNameInput: document.getElementById("cityNameInput"),
    citySummaryInput: document.getElementById("citySummaryInput"),
    saveCityInfoBtn: document.getElementById("saveCityInfoBtn"),
    startAddPlaceBtn: document.getElementById("startAddPlaceBtn"),
    cancelAddPlaceBtn: document.getElementById("cancelAddPlaceBtn"),
    cancelAddPlaceMapBtn: document.getElementById("cancelAddPlaceMapBtn"),
    placeAtMapCenterBtn: document.getElementById("placeAtMapCenterBtn"),
    exportBtn: document.getElementById("exportBtn"),
    importLabel: document.getElementById("importLabel"),
    importInput: document.getElementById("importInput"),
    saveVersionBtn: document.getElementById("saveVersionBtn"),
    versionSelect: document.getElementById("versionSelect"),
    restoreVersionBtn: document.getElementById("restoreVersionBtn"),
    resetBtn: document.getElementById("resetBtn"),
    addPlaceModal: document.getElementById("addPlaceModal"),
    addPlacePreview: document.getElementById("addPlacePreview"),
    newPlaceNameInput: document.getElementById("newPlaceNameInput"),
    newPlaceTypeChoices: document.getElementById("newPlaceTypeChoices"),
    newPlaceDefaultIconBtn: document.getElementById("newPlaceDefaultIconBtn"),
    newPlaceDefaultIcon: document.getElementById("newPlaceDefaultIcon"),
    newPlaceIconChoices: document.getElementById("newPlaceIconChoices"),
    newPlaceCustomIconInput: document.getElementById("newPlaceCustomIconInput"),
    applyNewPlaceCustomIconBtn: document.getElementById("applyNewPlaceCustomIconBtn"),
    newPlaceLocationNote: document.getElementById("newPlaceLocationNote"),
    confirmAddPlaceBtn: document.getElementById("confirmAddPlaceBtn"),
    cancelAddPlaceModalBtn: document.getElementById("cancelAddPlaceModalBtn"),
    segmentModal: document.getElementById("segmentModal"),
    segmentTitle: document.getElementById("segmentTitle"),
    segmentMode: document.getElementById("segmentMode"),
    segmentMinutes: document.getElementById("segmentMinutes"),
    segmentKm: document.getElementById("segmentKm"),
    segmentNote: document.getElementById("segmentNote"),
    saveSegmentBtn: document.getElementById("saveSegmentBtn"),
    cancelSegmentBtn: document.getElementById("cancelSegmentBtn"),
    toast: document.getElementById("toast")
  };

  let loadWarning = "";
  let damagedStorageRaw = "";
  let isEditMode = false;
  let selectedId = null;
  let filterType = "全部";
  let searchText = "";
  let addPlaceMode = false;
  let pendingPlacePosition = null;
  let newPlaceDraft = { type: "景点", emoji: "" };
  let drawerExpanded = false;
  let editingSegment = null;
  let mascotPosition = null;
  let saveFailureUntil = 0;
  let mapView = { scale: 1, x: 0, y: 0 };
  let mapContentSize = { width: 0, height: 0 };
  let mapViewCityId = null;
  let mapGestureUsed = false;
  let db = loadDatabase();

  function deepClone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }


  function mapViewportRect() {
    return dom.virtualMap.getBoundingClientRect();
  }

  function updateMapContentSize() {
    const rect = mapViewportRect();
    if (!rect.width || !rect.height) return mapContentSize;
    const width = innerWidth <= 720
      ? Math.max(rect.width, Math.min(rect.height * 1.05, rect.width * 1.65))
      : rect.width;
    const height = rect.height;
    mapContentSize = { width, height };
    dom.mapTransformLayer.style.width = `${width}px`;
    dom.mapTransformLayer.style.height = `${height}px`;
    return mapContentSize;
  }

  function clampMapView(view = mapView) {
    const rect = mapViewportRect();
    const size = updateMapContentSize();
    const scale = clamp(finiteNumber(view.scale) ?? 1, MAP_MIN_SCALE, MAP_MAX_SCALE);
    const scaledWidth = size.width * scale;
    const scaledHeight = size.height * scale;
    const x = scaledWidth <= rect.width
      ? (rect.width - scaledWidth) / 2
      : clamp(finiteNumber(view.x) ?? 0, rect.width - scaledWidth, 0);
    const y = scaledHeight <= rect.height
      ? (rect.height - scaledHeight) / 2
      : clamp(finiteNumber(view.y) ?? 0, rect.height - scaledHeight, 0);
    return { scale, x, y };
  }

  function applyMapView(resolveLabels = true) {
    mapView = clampMapView(mapView);
    dom.mapTransformLayer.style.transform = `translate3d(${mapView.x}px, ${mapView.y}px, 0) scale(${mapView.scale})`;
    dom.mapTransformLayer.style.setProperty("--marker-view-scale", String(1 / mapView.scale));
    dom.zoomInBtn.disabled = mapView.scale >= MAP_MAX_SCALE - 0.01;
    dom.zoomOutBtn.disabled = mapView.scale <= MAP_MIN_SCALE + 0.01;
    if (resolveLabels) requestAnimationFrame(() => {
      resolveMarkerPositions();
      resolveMarkerLabels();
    });
  }

  function resetMapView(announce = false) {
    const rect = mapViewportRect();
    const size = updateMapContentSize();
    const fitScale = clamp(Math.min(rect.width / Math.max(1, size.width), rect.height / Math.max(1, size.height)), MAP_MIN_SCALE, 1);
    mapView = { scale: fitScale, x: 0, y: 0 };
    applyMapView();
    if (announce) showToast("已显示完整地图");
  }

  function mapPointFromClient(clientX, clientY) {
    const rect = mapViewportRect();
    return {
      x: (clientX - rect.left - mapView.x) / Math.max(0.01, mapView.scale),
      y: (clientY - rect.top - mapView.y) / Math.max(0.01, mapView.scale),
      width: mapContentSize.width || rect.width,
      height: mapContentSize.height || rect.height
    };
  }

  function zoomMapTo(nextScale, clientX, clientY) {
    const rect = mapViewportRect();
    if (!rect.width || !rect.height) return;
    const targetScale = clamp(nextScale, MAP_MIN_SCALE, MAP_MAX_SCALE);
    const focusX = finiteNumber(clientX) ?? rect.left + rect.width / 2;
    const focusY = finiteNumber(clientY) ?? rect.top + rect.height / 2;
    const contentPoint = mapPointFromClient(focusX, focusY);
    mapView = {
      scale: targetScale,
      x: focusX - rect.left - contentPoint.x * targetScale,
      y: focusY - rect.top - contentPoint.y * targetScale
    };
    applyMapView();
    dismissMapGestureHint();
  }

  function dismissMapGestureHint() {
    if (mapGestureUsed) return;
    mapGestureUsed = true;
    dom.mapGestureHint?.classList.add("dismissed");
  }

  function setNavigationCollapsed(collapsed, save = true) {
    document.querySelector(".app-shell")?.classList.toggle("nav-collapsed", collapsed);
    dom.topbarToggle.setAttribute("aria-expanded", String(!collapsed));
    dom.topbarToggle.querySelector(".topbar-toggle-text").textContent = collapsed ? "显示导航" : "隐藏导航";
    dom.topbarToggle.setAttribute("aria-label", collapsed ? "显示顶部导航" : "隐藏顶部导航");
    if (save) {
      try { localStorage.setItem(NAV_COLLAPSE_KEY, collapsed ? "1" : "0"); } catch (_) {}
    }
    requestAnimationFrame(() => {
      updateMapTextScale();
      applyMapView();
      clampAndPlaceMascot(false);
    });
  }

  function bindMapGestures() {
    const pointers = new Map();
    let panStart = null;
    let pinchStart = null;
    let moved = false;

    const pointerPosition = event => ({ x: event.clientX, y: event.clientY });
    const midpoint = (first, second) => ({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 });
    const distance = (first, second) => Math.hypot(second.x - first.x, second.y - first.y);
    const excluded = target => target.closest(".place-marker, .add-place-tip, .edit-toolbar, .map-zoom-controls");

    dom.virtualMap.addEventListener("pointerdown", event => {
      if (excluded(event.target) || addPlaceMode) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      pointers.set(event.pointerId, pointerPosition(event));
      try { dom.virtualMap.setPointerCapture?.(event.pointerId); } catch (_) {}
      const values = Array.from(pointers.values());
      if (values.length === 1) {
        panStart = { pointer: values[0], view: { ...mapView } };
        pinchStart = null;
      } else if (values.length === 2) {
        const middle = midpoint(values[0], values[1]);
        const rect = mapViewportRect();
        pinchStart = {
          distance: Math.max(1, distance(values[0], values[1])),
          scale: mapView.scale,
          contentX: (middle.x - rect.left - mapView.x) / mapView.scale,
          contentY: (middle.y - rect.top - mapView.y) / mapView.scale
        };
        panStart = null;
      }
    });

    dom.virtualMap.addEventListener("pointermove", event => {
      if (!pointers.has(event.pointerId)) return;
      event.preventDefault();
      pointers.set(event.pointerId, pointerPosition(event));
      const values = Array.from(pointers.values());
      if (values.length >= 2 && pinchStart) {
        const middle = midpoint(values[0], values[1]);
        const rect = mapViewportRect();
        const nextScale = clamp(pinchStart.scale * distance(values[0], values[1]) / pinchStart.distance, MAP_MIN_SCALE, MAP_MAX_SCALE);
        mapView = {
          scale: nextScale,
          x: middle.x - rect.left - pinchStart.contentX * nextScale,
          y: middle.y - rect.top - pinchStart.contentY * nextScale
        };
        moved = true;
        dom.virtualMap.classList.add("is-panning");
        applyMapView(false);
        dismissMapGestureHint();
      } else if (values.length === 1 && panStart) {
        const dx = values[0].x - panStart.pointer.x;
        const dy = values[0].y - panStart.pointer.y;
        if (Math.hypot(dx, dy) < 4) return;
        moved = true;
        dom.virtualMap.classList.add("is-panning");
        mapView = { scale: panStart.view.scale, x: panStart.view.x + dx, y: panStart.view.y + dy };
        applyMapView(false);
        dismissMapGestureHint();
      }
    });

    const finishPointer = event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      try { dom.virtualMap.releasePointerCapture?.(event.pointerId); } catch (_) {}
      const values = Array.from(pointers.values());
      if (values.length === 1) panStart = { pointer: values[0], view: { ...mapView } };
      else panStart = null;
      pinchStart = null;
      if (!values.length) {
        dom.virtualMap.classList.remove("is-panning");
        if (moved) requestAnimationFrame(() => {
          resolveMarkerPositions();
          resolveMarkerLabels();
        });
        moved = false;
      }
    };
    dom.virtualMap.addEventListener("pointerup", finishPointer);
    dom.virtualMap.addEventListener("pointercancel", finishPointer);

    dom.virtualMap.addEventListener("wheel", event => {
      if (event.target.closest(".place-marker, .edit-toolbar, .add-place-tip")) return;
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.12 : 0.89;
      zoomMapTo(mapView.scale * factor, event.clientX, event.clientY);
    }, { passive: false });

    dom.virtualMap.addEventListener("dblclick", event => {
      if (event.target.closest(".place-marker, .edit-toolbar, .add-place-tip")) return;
      event.preventDefault();
      zoomMapTo(mapView.scale * 1.35, event.clientX, event.clientY);
    });
  }

  function roundMapCoordinate(value) {
    return Math.round(clamp(value, 4, 96) * 100) / 100;
  }

  function stableHash(text) {
    let hash = 2166136261;
    for (const character of String(text)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash;
  }

  function hashPassword(text) {
    return stableHash(text);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function normaliseType(value) {
    const original = String(value ?? "").trim();
    if (TYPE_CONFIG[original]) return original;
    const lower = original.toLowerCase();
    return TYPE_ALIASES[original] || TYPE_ALIASES[lower] || "景点";
  }

  function splitIconGraphemes(value) {
    const cleaned = String(value ?? "").replace(/[\u0000-\u001f\u007f\s]+/g, "");
    if (!cleaned) return [];
    try {
      return Array.from(new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(cleaned), part => part.segment);
    } catch (_) {
      const result = [];
      let joinNext = false;
      for (const character of Array.from(cleaned)) {
        const codePoint = character.codePointAt(0);
        const combining = (codePoint >= 0x300 && codePoint <= 0x36f) || (codePoint >= 0x1ab0 && codePoint <= 0x1aff)
          || (codePoint >= 0x1dc0 && codePoint <= 0x1dff) || (codePoint >= 0x20d0 && codePoint <= 0x20ff)
          || (codePoint >= 0xfe00 && codePoint <= 0xfe0f) || (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff)
          || codePoint === 0x20e3;
        const regional = codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
        const last = result[result.length - 1] || "";
        const lastCodePoint = Array.from(last).at(-1)?.codePointAt(0);
        const lastIsRegional = lastCodePoint >= 0x1f1e6 && lastCodePoint <= 0x1f1ff;
        if (result.length && (joinNext || combining || character === "‍" || (regional && lastIsRegional && Array.from(last).length === 1))) {
          result[result.length - 1] += character;
        } else {
          result.push(character);
        }
        joinNext = character === "‍";
      }
      return result;
    }
  }

  function normalisePlaceIcon(value) {
    return splitIconGraphemes(value).slice(0, 2).join("");
  }

  function placeIconClass(value) {
    return splitIconGraphemes(value).length > 1 ? " text-icon" : "";
  }

  function iconChoices(type) {
    const info = TYPE_CONFIG[normaliseType(type)] || TYPE_CONFIG["景点"];
    return Array.from(new Set([info.emoji, ...(Array.isArray(info.icons) ? info.icons : [])].map(normalisePlaceIcon).filter(Boolean)));
  }

  function typeInfo(place) {
    const base = TYPE_CONFIG[normaliseType(place?.type)] || TYPE_CONFIG["景点"];
    return { ...base, emoji: normalisePlaceIcon(place?.emoji) || base.emoji };
  }

  function layoutFor(cityId) {
    return window.JJTRIP_MAPS?.[cityId] || window.JJTRIP_MAPS?.generic;
  }

  // 旧地点只有经纬度；首次载入时按每城独立边界投影，并加入稳定错位。
  function deriveMapPosition(cityId, place, placeIndex) {
    const layout = layoutFor(cityId);
    const override = layout?.overrides?.[place.id];
    if (Array.isArray(override) && override.length === 2) {
      return { mapX: roundMapCoordinate(override[0]), mapY: roundMapCoordinate(override[1]) };
    }

    const lat = finiteNumber(place.lat);
    const lng = finiteNumber(place.lng);
    const bounds = layout?.bounds;
    let x;
    let y;
    if (bounds && lat !== null && lng !== null) {
      const lngRatio = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1);
      const latRatio = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat || 1);
      x = bounds.left + clamp(lngRatio, 0, 1) * (bounds.right - bounds.left);
      y = bounds.top + clamp(latRatio, 0, 1) * (bounds.bottom - bounds.top);
    } else {
      const column = placeIndex % 6;
      const row = Math.floor(placeIndex / 6) % 5;
      x = 17 + column * 13.2;
      y = 22 + row * 13.5;
    }

    const hash = stableHash(place.id || `${cityId}_${placeIndex}`);
    const jitterX = ((hash % 9) - 4) * 0.38;
    const jitterY = (((hash >>> 8) % 9) - 4) * 0.34;
    return { mapX: roundMapCoordinate(x + jitterX), mapY: roundMapCoordinate(y + jitterY) };
  }

  function normalisePlace(cityId, input, placeIndex) {
    const place = isPlainObject(input) ? input : {};
    place.id = String(place.id || `${cityId}_place_${placeIndex + 1}`);
    place.name = String(place.name || "未命名地点");
    place.type = normaliseType(place.type);
    place.note = String(place.note || "暂无简介");
    place.hours = String(place.hours || "待补充");
    place.price = String(place.price || "待补充");
    place.address = String(place.address || "待补充");
    place.photoTip = String(place.photoTip || "暂无拍照机位说明");
    place.source = String(place.source || "");
    const legacyImage = String(place.image || "").trim();
    place.images = Array.isArray(place.images)
      ? Array.from(new Set(place.images.map(image => String(image || "").trim()).filter(Boolean)))
      : legacyImage ? [legacyImage] : [];
    place.image = place.images[0] || "";
    place.emoji = normalisePlaceIcon(place.emoji);
    place.tags = Array.isArray(place.tags) ? place.tags.map(tag => String(tag).trim()).filter(Boolean) : [];
    const translation = PLACE_TRANSLATIONS[place.id];
    if (translation) {
      for (const [field, pair] of Object.entries(translation)) {
        if (![pair[0], ...pair.slice(2)].includes(place[field])) continue;
        const originalField = `original${field[0].toUpperCase()}${field.slice(1)}`;
        if (!place[originalField]) place[originalField] = pair[0];
        place[field] = pair[1];
      }
    }
    if (CURRENCY_TRANSLATIONS[place.price]) {
      if (!place.originalPrice) place.originalPrice = place.price;
      place.price = CURRENCY_TRANSLATIONS[place.price];
    }

    const mapX = finiteNumber(place.mapX);
    const mapY = finiteNumber(place.mapY);
    if (mapX === null || mapY === null || mapX < 0 || mapX > 100 || mapY < 0 || mapY > 100) {
      Object.assign(place, deriveMapPosition(cityId, place, placeIndex));
    } else {
      place.mapX = roundMapCoordinate(mapX);
      place.mapY = roundMapCoordinate(mapY);
    }
    return place;
  }

  function normaliseCity(cityId, input) {
    const source = isPlainObject(input) ? input : {};
    source.name = String(source.name || layoutFor(cityId)?.title || "自定义城市");
    source.summary = String(source.summary || "在彩色虚拟地图上规划城市行程。");
    source.center = Array.isArray(source.center) ? source.center : [0, 0];
    source.zoom = finiteNumber(source.zoom) ?? 12;
    source.coord = String(source.coord || "wgs84");
    source.places = Array.isArray(source.places) ? source.places : [];
    source.places = source.places.map((place, index) => normalisePlace(cityId, place, index));
    source.route = Array.isArray(source.route) ? source.route.map(id => String(id)) : [];
    source.segments = isPlainObject(source.segments) ? source.segments : {};
    return source;
  }

  function normaliseDatabase(input, strict = false) {
    if (!isPlainObject(input) || !isPlainObject(input.cities)) {
      if (strict) throw new Error("文件缺少城市数据");
      input = deepClone(SEED);
    }
    const result = input;
    result.meta = isPlainObject(result.meta) ? result.meta : {};
    result.meta.app = "JJTrip";
    result.meta.version = 7;
    result.meta.updated = "2026-08-06";
    result.settings = isPlainObject(result.settings) ? result.settings : {};
    result.versions = Array.isArray(result.versions) ? result.versions : [];

    for (const cityId of FIXED_CITY_IDS) {
      if (!isPlainObject(result.cities[cityId]) && isPlainObject(SEED.cities[cityId])) {
        result.cities[cityId] = deepClone(SEED.cities[cityId]);
      }
    }
    for (const [cityId, cityData] of Object.entries(result.cities)) {
      result.cities[cityId] = normaliseCity(cityId, cityData);
    }

    if (!result.cities[result.currentCity]) {
      result.currentCity = result.cities.hongkong ? "hongkong" : Object.keys(result.cities)[0];
    }
    if (!result.currentCity) throw new Error("没有可用城市");

    result.versions.forEach(version => {
      if (!isPlainObject(version) || !isPlainObject(version.data)) return;
      const cityId = String(version.cityId || result.currentCity);
      version.cityId = cityId;
      version.data = normaliseCity(cityId, version.data);
    });

    const savedMascot = result.settings.mascotPosition;
    if (!isPlainObject(savedMascot) || finiteNumber(savedMascot.x) === null || finiteNumber(savedMascot.y) === null) {
      result.settings.mascotPosition = null;
    } else {
      result.settings.mascotPosition = { x: Number(savedMascot.x), y: Number(savedMascot.y) };
    }
    return result;
  }

  function loadDatabase() {
    let raw = "";
    try {
      raw = localStorage.getItem(STORAGE_KEY) || "";
      if (!raw) return normaliseDatabase(deepClone(SEED));
      return normaliseDatabase(JSON.parse(raw));
    } catch (error) {
      damagedStorageRaw = raw;
      loadWarning = "检测到本机旧存档损坏，已临时载入默认数据；损坏内容尚未被覆盖。";
      return normaliseDatabase(deepClone(SEED));
    }
  }

  function preserveDamagedStorage() {
    if (!damagedStorageRaw) return;
    try {
      localStorage.setItem(RECOVERY_KEY, damagedStorageRaw);
      damagedStorageRaw = "";
    } catch (_) {
      // 保留原键，不在恢复副本写入失败时主动删除任何内容。
    }
  }

  function databaseReplacer(key, value) {
    if (key === "image" && typeof value === "string" && value.startsWith("data:image/") && Array.isArray(this.images) && this.images[0] === value) {
      return undefined;
    }
    return value;
  }

  function serialiseDatabase(database = db, pretty = false) {
    return JSON.stringify(database, databaseReplacer, pretty ? 2 : undefined);
  }

  function saveDatabase(database = db) {
    try {
      preserveDamagedStorage();
      localStorage.setItem(STORAGE_KEY, serialiseDatabase(database));
      return true;
    } catch (error) {
      saveFailureUntil = Date.now() + 1200;
      showToast("本地存储空间不足，请先导出备份或减少图片", true);
      return false;
    }
  }

  function currentCity() {
    return db.cities[db.currentCity];
  }

  function showToast(message, force = false) {
    if (!force && Date.now() < saveFailureUntil) return;
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    clearTimeout(dom.toast._hideTimer);
    dom.toast._hideTimer = setTimeout(() => dom.toast.classList.remove("show"), 2400);
  }

  function validRouteEntries() {
    const cityData = currentCity();
    const placeById = new Map(cityData.places.map(place => [place.id, place]));
    const entries = [];
    cityData.route.forEach((id, storedIndex) => {
      const place = placeById.get(id);
      if (place) entries.push({ id, place, storedIndex });
    });
    return entries;
  }

  function renderAll() {
    document.body.classList.toggle("edit-mode", isEditMode);
    document.body.classList.toggle("add-place-mode", addPlaceMode);
    dom.searchInput.value = searchText;
    dom.addPlaceTip.hidden = !addPlaceMode;
    dom.editToolbar.hidden = !isEditMode || addPlaceMode || dom.addPlaceModal.classList.contains("open");
    renderMapBase();
    renderFilters();
    renderMarkers();
    renderRouteDrawer();
    renderSettings();
    if (selectedId) {
      const place = currentCity().places.find(item => item.id === selectedId);
      if (place) renderDetail(place);
      else closeDetail();
    } else {
      dom.detailPanel.classList.remove("open");
      dom.detailPanel.replaceChildren();
    }
    requestAnimationFrame(() => clampAndPlaceMascot(false));
  }

  function renderMapBase() {
    if (mapViewCityId !== db.currentCity) {
      mapViewCityId = db.currentCity;
      const rect = mapViewportRect();
      const size = updateMapContentSize();
      mapView = { scale: 1, x: (rect.width - size.width) / 2, y: (rect.height - size.height) / 2 };
    }
    const cityData = currentCity();
    const layout = layoutFor(db.currentCity);
    dom.currentCityName.textContent = cityData.name;
    dom.mapArt.innerHTML = layout?.svg || "";
    requestAnimationFrame(updateMapTextScale);
    const resultCount = filteredPlaces().length;
    const totalCount = cityData.places.length;
    const countText = resultCount === totalCount ? `${totalCount} 个地点` : `显示 ${resultCount} / ${totalCount} 个地点`;
    const editText = isEditMode ? " · 编辑中：可拖动标记" : "";
    dom.mapCaption.textContent = `${cityData.summary || layout?.caption || "城市漫游地图"} · ${countText}${editText}`;
    requestAnimationFrame(() => applyMapView(false));
  }

  function updateMapTextScale() {
    const rect = dom.virtualMap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const size = updateMapContentSize();
    const scale = clamp((1000 / 650) * (size.height / Math.max(1, size.width)), 0.78, 2.85);
    dom.mapArt.style.setProperty("--map-text-scale-x", String(scale));
  }

  function renderFilters() {
    const types = ["全部", ...Object.keys(TYPE_CONFIG).filter(type => currentCity().places.some(place => place.type === type))];
    dom.filterBar.replaceChildren();
    for (const type of types) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip${filterType === type ? " active" : ""}`;
      button.textContent = type === "全部" ? "全部" : `${TYPE_CONFIG[type].emoji} ${type}`;
      button.setAttribute("aria-pressed", String(filterType === type));
      button.addEventListener("click", () => {
        filterType = type;
        renderFilters();
        renderMapBase();
        renderMarkers();
      });
      dom.filterBar.appendChild(button);
    }
  }

  function filteredPlaces() {
    const query = searchText.toLocaleLowerCase("zh-CN");
    return currentCity().places.filter(place => {
      if (filterType !== "全部" && place.type !== filterType) return false;
      if (!query) return true;
      const haystack = [place.name, place.type, place.note, place.address, ...(place.tags || [])].join(" ").toLocaleLowerCase("zh-CN");
      return haystack.includes(query);
    });
  }

  function renderMarkers() {
    const visibleIds = new Set(filteredPlaces().map(place => place.id));
    const routeIndexById = new Map(validRouteEntries().map((entry, index) => [entry.id, index]));
    dom.markerLayer.replaceChildren();
    currentCity().places.forEach(place => {
      if (!visibleIds.has(place.id)) return;
      const info = typeInfo(place);
      const marker = document.createElement("button");
      const routeIndex = routeIndexById.get(place.id);
      marker.type = "button";
      marker.className = "place-marker";
      if (selectedId === place.id) marker.classList.add("selected");
      if (routeIndex !== undefined) marker.classList.add("in-plan");
      if (place.mapX < 20) marker.classList.add("edge-left");
      else if (place.mapX > 68) marker.classList.add("edge-right");
      marker.style.left = `${place.mapX}%`;
      marker.style.top = `${place.mapY}%`;
      marker.style.zIndex = String(Math.round(place.mapY) + 10);
      marker.style.setProperty("--marker-color", info.color);
      marker.dataset.placeId = place.id;
      marker.title = place.name;
      marker.setAttribute("aria-label", `${place.name}，${place.type}${routeIndex !== undefined ? "，已加入规划" : ""}`);
      marker.innerHTML = `${routeIndex !== undefined ? `<span class="plan-index">${routeIndex + 1}</span>` : ""}<span class="marker-emoji${placeIconClass(info.emoji)}">${escapeHtml(info.emoji)}</span><span class="marker-name">${escapeHtml(place.name)}</span>`;
      bindMarkerPointer(marker, place);
      marker.addEventListener("click", event => {
        if (event.detail === 0) selectPlace(place.id);
      });
      dom.markerLayer.appendChild(marker);
    });
    requestAnimationFrame(() => {
      resolveMarkerPositions();
      resolveMarkerLabels();
    });
    renderRouteLine();
  }

  // 地图资料坐标保持不变；仅在屏幕像素层轻微错开过密触控点，确保 44px 图标中心可点。
  function resolveMarkerPositions() {
    const markers = Array.from(dom.markerLayer.querySelectorAll(".place-marker"));
    const mapRect = { width: dom.mapTransformLayer.clientWidth, height: dom.mapTransformLayer.clientHeight };
    if (!markers.length || !mapRect.width || !mapRect.height) return;
    const placeById = new Map(currentCity().places.map(place => [place.id, place]));
    const placed = [];
    const candidates = [{ x: 0, y: 0 }];
    const separation = (innerWidth <= 720 ? 38 : 24) / Math.max(0.78, mapView.scale);
    const step = separation + 2 / Math.max(0.78, mapView.scale);
    for (let ring = 1; ring <= 5; ring += 1) {
      for (let y = -ring; y <= ring; y += 1) {
        for (let x = -ring; x <= ring; x += 1) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== ring) continue;
          candidates.push({ x: x * step, y: y * step });
        }
      }
    }
    candidates.sort((first, second) => first.x ** 2 + first.y ** 2 - second.x ** 2 - second.y ** 2);

    for (const marker of markers) {
      const place = placeById.get(marker.dataset.placeId);
      if (!place) continue;
      const rawX = mapRect.width * place.mapX / 100;
      const rawY = mapRect.height * place.mapY / 100;
      const baseX = clamp(rawX, 23, mapRect.width - 23);
      const baseY = clamp(rawY, 23, mapRect.height - 23);
      let chosen = { x: baseX, y: baseY };
      for (const offset of candidates) {
        const candidate = {
          x: clamp(baseX + offset.x, 23, mapRect.width - 23),
          y: clamp(baseY + offset.y, 23, mapRect.height - 23)
        };
        const conflicts = placed.some(other => Math.abs(candidate.x - other.x) < separation && Math.abs(candidate.y - other.y) < separation);
        if (!conflicts) {
          chosen = candidate;
          break;
        }
      }
      marker.style.setProperty("--marker-nudge-x", `${Math.round((chosen.x - rawX) * 10) / 10}px`);
      marker.style.setProperty("--marker-nudge-y", `${Math.round((chosen.y - rawY) * 10) / 10}px`);
      marker.dataset.displayX = String(roundMapCoordinate(chosen.x / mapRect.width * 100));
      marker.dataset.displayY = String(roundMapCoordinate(chosen.y / mapRect.height * 100));
      marker.classList.toggle("edge-left", chosen.x / mapRect.width * 100 < 20);
      marker.classList.toggle("edge-right", chosen.x / mapRect.width * 100 > 68);
      placed.push(chosen);
    }
    renderRouteLine();
  }

  function resolveMarkerLabels() {
    const markers = Array.from(dom.markerLayer.querySelectorAll(".place-marker"));
    markers.forEach(marker => marker.classList.remove("compact-marker"));
    const markerRects = new Map(markers.map(marker => [marker, marker.getBoundingClientRect()]));
    const ordered = markers.sort((first, second) => {
      const firstPriority = first.classList.contains("selected") ? 2 : first.classList.contains("in-plan") ? 1 : 0;
      const secondPriority = second.classList.contains("selected") ? 2 : second.classList.contains("in-plan") ? 1 : 0;
      return secondPriority - firstPriority;
    });
    const occupiedLabels = [];
    for (const marker of ordered) {
      const label = marker.querySelector(".marker-name");
      const labelRect = label?.getBoundingClientRect();
      const coversAnotherMarker = labelRect && markers.some(other => other !== marker && rectanglesOverlap(labelRect, markerRects.get(other), 2));
      const overlapsLabel = labelRect && occupiedLabels.some(other => rectanglesOverlap(labelRect, other, 2));
      if (!marker.classList.contains("selected") && (coversAnotherMarker || overlapsLabel)) {
        marker.classList.add("compact-marker");
      } else if (labelRect) {
        occupiedLabels.push(labelRect);
      }
    }
  }

  function bindMarkerPointer(marker, place) {
    marker.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      let movedDistance = 0;
      let dragging = false;
      try { marker.setPointerCapture?.(event.pointerId); } catch (_) {}

      const onMove = moveEvent => {
        if (moveEvent.pointerId !== event.pointerId) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        movedDistance = Math.hypot(dx, dy);
        if (!isEditMode || movedDistance < 8) return;
        dragging = true;
        marker.classList.add("dragging");
        marker.style.setProperty("--marker-nudge-x", "0px");
        marker.style.setProperty("--marker-nudge-y", "0px");
        const point = mapPointFromClient(moveEvent.clientX, moveEvent.clientY);
        place.mapX = roundMapCoordinate(point.x / Math.max(1, point.width) * 100);
        place.mapY = roundMapCoordinate(point.y / Math.max(1, point.height) * 100);
        marker.dataset.displayX = String(place.mapX);
        marker.dataset.displayY = String(place.mapY);
        marker.style.left = `${place.mapX}%`;
        marker.style.top = `${place.mapY}%`;
        marker.style.zIndex = "100";
        renderRouteLine();
      };

      const finish = endEvent => {
        if (endEvent.pointerId !== event.pointerId) return;
        marker.removeEventListener("pointermove", onMove);
        marker.removeEventListener("pointerup", finish);
        marker.removeEventListener("pointercancel", cancel);
        marker.classList.remove("dragging");
        try { marker.releasePointerCapture?.(event.pointerId); } catch (_) {}
        if (dragging) {
          saveDatabase();
          renderMarkers();
          if (selectedId === place.id) renderDetail(place);
          showToast("地点位置已更新");
        } else if (movedDistance < 8) {
          selectPlace(place.id);
        }
      };

      const cancel = cancelEvent => {
        if (cancelEvent.pointerId !== event.pointerId) return;
        marker.removeEventListener("pointermove", onMove);
        marker.removeEventListener("pointerup", finish);
        marker.removeEventListener("pointercancel", cancel);
        marker.classList.remove("dragging");
        try { marker.releasePointerCapture?.(event.pointerId); } catch (_) {}
        if (dragging) {
          saveDatabase();
          renderMarkers();
          if (selectedId === place.id) renderDetail(place);
        }
      };

      marker.addEventListener("pointermove", onMove);
      marker.addEventListener("pointerup", finish);
      marker.addEventListener("pointercancel", cancel);
    });
  }

  function routePathBetween(start, end, index) {
    const middleX = (start.mapX + end.mapX) / 2;
    const middleY = (start.mapY + end.mapY) / 2 + (index % 2 === 0 ? -4.2 : 4.2);
    return `M ${start.mapX} ${start.mapY} Q ${middleX} ${middleY} ${end.mapX} ${end.mapY}`;
  }

  function displayPosition(place) {
    const marker = Array.from(dom.markerLayer.querySelectorAll(".place-marker"))
      .find(item => item.dataset.placeId === place.id);
    return {
      ...place,
      mapX: finiteNumber(marker?.dataset.displayX) ?? place.mapX,
      mapY: finiteNumber(marker?.dataset.displayY) ?? place.mapY
    };
  }

  function renderRouteLine() {
    const places = validRouteEntries().map(entry => displayPosition(entry.place));
    if (places.length < 2) {
      dom.routeOverlay.replaceChildren();
      return;
    }
    const defs = `<defs><marker id="routeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#fb923c" stroke="#fff" stroke-width="1.5"/></marker></defs>`;
    let lines = "";
    for (let index = 0; index < places.length - 1; index += 1) {
      const path = routePathBetween(places[index], places[index + 1], index);
      lines += `<path class="route-line-shadow" d="${path}"/><path class="route-line" d="${path}" marker-end="url(#routeArrow)"/>`;
    }
    const dots = places.map(place => `<circle class="route-dot" cx="${place.mapX}" cy="${place.mapY}" r="1.25"/>`).join("");
    dom.routeOverlay.innerHTML = defs + lines + dots;
  }

  function selectPlace(placeId) {
    const place = currentCity().places.find(item => item.id === placeId);
    if (!place) return;
    selectedId = placeId;
    renderMarkers();
    renderDetail(place);
    renderRouteDrawer();
    dom.detailPanel.classList.add("open");
    requestAnimationFrame(() => clampAndPlaceMascot(false));
    setTimeout(() => clampAndPlaceMascot(false), 320);
  }

  function closeDetail() {
    selectedId = null;
    dom.detailPanel.classList.remove("open");
    dom.detailPanel.replaceChildren();
    renderMarkers();
    renderRouteDrawer();
    requestAnimationFrame(() => clampAndPlaceMascot(false));
  }

  function previewMarkup(place, info) {
    const images = Array.isArray(place.images) ? place.images : [];
    if (!images.length) {
      return `<div class="place-gallery empty"><div class="gallery-empty"><strong class="${placeIconClass(info.emoji).trim()}">${escapeHtml(info.emoji)}</strong><span>暂无参考图片</span></div></div>`;
    }
    const slides = images.map((image, index) => `<figure class="gallery-slide place-preview" role="group" aria-label="第 ${index + 1} 张，共 ${images.length} 张">
      <div class="preview-fallback"><strong class="${placeIconClass(info.emoji).trim()}">${escapeHtml(info.emoji)}</strong><span>图片加载中</span></div>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(place.name)}参考图片 ${index + 1}" ${index ? 'loading="lazy"' : ""}>
    </figure>`).join("");
    const controls = images.length > 1 ? `<button class="gallery-control previous" type="button" aria-label="上一张照片">‹</button><button class="gallery-control next" type="button" aria-label="下一张照片">›</button>
      <div class="gallery-status" aria-live="polite"><span class="gallery-count">1 / ${images.length}</span><span class="gallery-dots" aria-hidden="true">${images.map((_, index) => `<i class="gallery-dot${index === 0 ? " active" : ""}"></i>`).join("")}</span></div>` : "";
    return `<div class="place-gallery" data-gallery-count="${images.length}"><div class="gallery-track" tabindex="0" aria-label="${escapeHtml(place.name)}照片，可左右滑动">${slides}</div>${controls}</div>`;
  }

  function bindGallery() {
    const gallery = dom.detailPanel.querySelector(".place-gallery[data-gallery-count]");
    if (!gallery) return;
    const track = gallery.querySelector(".gallery-track");
    const slides = Array.from(gallery.querySelectorAll(".gallery-slide"));
    const count = slides.length;
    let activeIndex = 0;
    let scrollFrame = 0;

    const updateStatus = index => {
      activeIndex = clamp(index, 0, count - 1);
      const counter = gallery.querySelector(".gallery-count");
      if (counter) counter.textContent = `${activeIndex + 1} / ${count}`;
      gallery.querySelectorAll(".gallery-dot").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === activeIndex));
    };
    const showSlide = index => {
      const target = clamp(index, 0, count - 1);
      track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
      updateStatus(target);
    };

    gallery.querySelector(".gallery-control.previous")?.addEventListener("click", () => showSlide(activeIndex - 1));
    gallery.querySelector(".gallery-control.next")?.addEventListener("click", () => showSlide(activeIndex + 1));
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => updateStatus(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
    }, { passive: true });
    track.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + 1);
      }
    });
  }

  function readOnlyDetails(place) {
    const tags = place.tags.length ? place.tags : ["暂无标签"];
    return `<div class="info-grid">
      <div class="info-item"><b>地点类型</b><span>${escapeHtml(place.type)}</span></div>
      <div class="info-item"><b>参考价格</b><span>${escapeHtml(place.price || "待补充")}</span></div>
      <div class="info-item"><b>开放或营业时间</b><span>${escapeHtml(place.hours || "待补充")}</span></div>
      <div class="info-item"><b>地址</b><span>${escapeHtml(place.address || "待补充")}</span></div>
    </div>
    <div class="section-title">地点简介</div><div class="description">${escapeHtml(place.note || "暂无简介")}</div>
    <div class="section-title">标签</div><div class="tag-list">${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    <div class="section-title">拍照机位说明</div><div class="description">${escapeHtml(place.photoTip || "暂无拍照机位说明")}</div>`;
  }

  function editDetails(place) {
    const images = Array.isArray(place.images) ? place.images : [];
    const info = typeInfo(place);
    const choices = iconChoices(place.type);
    const imageItems = images.map((image, index) => `<div class="image-edit-item"><img src="${escapeHtml(image)}" alt=""><span>${image.startsWith("data:image/") ? "本地上传照片" : escapeHtml(image)}</span><button class="btn-danger" type="button" data-remove-image="${index}" aria-label="删除第 ${index + 1} 张照片">删除</button></div>`).join("");
    const iconButtons = choices.map(icon => `<button class="icon-choice${place.emoji === icon ? " active" : ""}" type="button" data-place-icon="${escapeHtml(icon)}" aria-label="使用图标 ${escapeHtml(icon)}" aria-pressed="${place.emoji === icon}">${escapeHtml(icon)}</button>`).join("");
    return `<div class="editor-banner"><span class="editor-banner-mark" aria-hidden="true">✦</span><div><b>编辑地点</b><small>修改内容会自动保存在这台设备</small></div><span class="autosave-badge">自动保存</span></div>
      <section class="editor-section" aria-labelledby="basicEditorTitle">
        <div class="editor-section-title" id="basicEditorTitle"><span>01</span><div><b>基本资料</b><small>名称、类型和营业信息</small></div></div>
        <div class="field"><label for="placeNameInput">地点名称</label><input id="placeNameInput" data-place-field="name" value="${escapeHtml(place.name)}" autocomplete="off"></div>
        <div class="grid-two"><div class="field"><label for="placeTypeSelect">地点类型</label><select id="placeTypeSelect" data-place-field="type">${Object.keys(TYPE_CONFIG).map(type => `<option value="${type}"${type === place.type ? " selected" : ""}>${TYPE_CONFIG[type].emoji} ${type}</option>`).join("")}</select></div><div class="field"><label for="placePriceInput">参考价格</label><input id="placePriceInput" data-place-field="price" value="${escapeHtml(place.price)}"></div></div>
        <div class="field"><label for="placeHoursInput">开放或营业时间</label><input id="placeHoursInput" data-place-field="hours" value="${escapeHtml(place.hours)}"></div>
        <div class="field"><label for="placeAddressInput">地址</label><input id="placeAddressInput" data-place-field="address" value="${escapeHtml(place.address)}"></div>
      </section>
      <section class="editor-section icon-editor" aria-labelledby="iconEditorTitle">
        <div class="editor-section-title" id="iconEditorTitle"><span>02</span><div><b>地点图标</b><small>按类型推荐，也可以输入自己的符号</small></div><output class="icon-live-preview${placeIconClass(info.emoji)}" style="--marker-color:${info.color}" aria-label="当前图标">${escapeHtml(info.emoji)}</output></div>
        <button class="icon-auto-choice${place.emoji ? "" : " active"}" id="resetPlaceIconBtn" type="button" aria-pressed="${!place.emoji}"><span>${escapeHtml(TYPE_CONFIG[place.type].emoji)}</span><b>跟随地点类型</b><small>切换类型时自动更新</small></button>
        <div class="icon-choice-grid" role="group" aria-label="${escapeHtml(place.type)}推荐图标">${iconButtons}</div>
        <div class="icon-custom-row"><div class="field"><label for="customIconInput">自定义图标</label><input id="customIconInput" value="${escapeHtml(place.emoji)}" maxlength="40" autocomplete="off" placeholder="输入 1–2 个 Emoji 或短文字"></div><button class="btn-soft" id="applyCustomIconBtn" type="button">使用自定义</button></div>
        <p class="field-help">留空并应用即可恢复为该类型的默认图标。</p>
      </section>
      <section class="editor-section" aria-labelledby="contentEditorTitle">
        <div class="editor-section-title" id="contentEditorTitle"><span>03</span><div><b>介绍与标签</b><small>补充攻略内容和拍照建议</small></div></div>
        <div class="field"><label for="placeNoteInput">地点简介</label><textarea id="placeNoteInput" data-place-field="note">${escapeHtml(place.note)}</textarea></div>
        <div class="field"><label for="placePhotoTipInput">拍照机位说明</label><textarea id="placePhotoTipInput" data-place-field="photoTip">${escapeHtml(place.photoTip)}</textarea></div>
        <div class="field"><label for="tagsInput">标签（使用逗号分隔）</label><input id="tagsInput" value="${escapeHtml(place.tags.join("，"))}" placeholder="例如：日落，亲子，雨天可去"></div>
      </section>
      <section class="editor-section" aria-labelledby="photoEditorTitle">
        <div class="editor-section-title" id="photoEditorTitle"><span>04</span><div><b>地点照片</b><small>最多 12 张，可在详情中左右滑动</small></div><span class="section-count">${images.length}/12</span></div>
        <div class="field"><label for="imageUrlInput">添加图片网址</label><div class="image-add-row"><input id="imageUrlInput" type="text" inputmode="url" placeholder="https://… 或 ./assets/…"><button class="btn" id="addImageUrlBtn" type="button">添加</button></div></div>
        <div class="field"><label for="imageUpload">上传本地照片（可多选）</label><input id="imageUpload" type="file" accept="image/*" multiple><p class="field-help">图片会压缩后保存在本机；单张原图不超过 15 MB。</p></div>
        ${imageItems ? `<div class="image-edit-list" aria-label="已添加照片">${imageItems}</div>` : `<div class="editor-empty-state"><span aria-hidden="true">🖼️</span><div><b>还没有地点照片</b><small>可上传本地照片或添加图片网址</small></div></div>`}
      </section>
      <section class="editor-section" aria-labelledby="sourceEditorTitle">
        <div class="editor-section-title" id="sourceEditorTitle"><span>05</span><div><b>来源与管理</b><small>记录资料出处或管理地点</small></div></div>
        <div class="field"><label for="placeSourceInput">资料来源网址</label><input id="placeSourceInput" data-place-field="source" value="${escapeHtml(place.source)}" inputmode="url" placeholder="https://…"></div>
        <p class="edit-note">可直接拖动地图标记更新位置；坐标只用于虚拟地图排版，不会显示在日常浏览中。</p>
        <div class="danger-zone"><div><b>删除这个地点</b><small>同时会从当前规划和交通连接中移除</small></div><button class="btn-danger" id="deletePlaceBtn" type="button">删除地点</button></div>
      </section>`;
  }

  function renderDetail(place) {
    const info = typeInfo(place);
    const inPlan = currentCity().route.includes(place.id);
    dom.detailPanel.classList.toggle("editing", isEditMode);
    dom.detailPanel.innerHTML = `<button class="panel-close" id="closeDetailBtn" type="button" aria-label="关闭地点详情" title="关闭">×</button>
      <div class="place-heading"><div class="big-emoji${placeIconClass(info.emoji)}" data-detail-icon style="--marker-color:${info.color}">${escapeHtml(info.emoji)}</div><div><h2 data-detail-name>${escapeHtml(place.name)}</h2><div class="place-type" data-detail-type>${escapeHtml(currentCity().name)} · ${escapeHtml(place.type)}</div></div></div>
      ${previewMarkup(place, info)}
      ${isEditMode ? editDetails(place) : readOnlyDetails(place)}
      <div class="actions">
        ${inPlan ? `<span class="plan-state">已加入规划</span><button class="btn-danger" id="planToggleBtn" type="button">移出规划</button>` : `<button class="btn-primary" id="planToggleBtn" type="button">加入规划</button>`}
        ${place.source ? `<button class="btn" id="sourceBtn" type="button">查看资料来源</button>` : ""}
      </div>`;
    dom.detailPanel.classList.add("open");
    dom.detailPanel.querySelector("#closeDetailBtn").addEventListener("click", closeDetail);
    dom.detailPanel.querySelector("#planToggleBtn").addEventListener("click", () => togglePlan(place.id));
    const sourceButton = dom.detailPanel.querySelector("#sourceBtn");
    if (sourceButton) sourceButton.addEventListener("click", () => openSource(place.source));
    dom.detailPanel.querySelectorAll(".gallery-slide img").forEach(previewImage => {
      previewImage.addEventListener("load", () => {
        const fallback = previewImage.previousElementSibling;
        if (fallback) fallback.hidden = true;
      });
      previewImage.addEventListener("error", () => {
        const fallbackText = previewImage.previousElementSibling?.querySelector("span");
        if (fallbackText) fallbackText.textContent = "图片无法加载";
        previewImage.remove();
      });
      if (previewImage.complete && previewImage.naturalWidth) previewImage.dispatchEvent(new Event("load"));
    });
    bindGallery();
    if (isEditMode) bindPlaceEditor(place);
  }

  function openSource(source) {
    try {
      const url = new URL(source, location.href);
      if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported");
      window.open(url.href, "_blank", "noopener,noreferrer");
    } catch (_) {
      showToast("资料来源网址无效");
    }
  }

  function bindPlaceEditor(place) {
    const editorCityId = db.currentCity;
    const rerenderEditorAtCurrentPosition = () => {
      const scrollTop = dom.detailPanel.scrollTop;
      renderDetail(place);
      dom.detailPanel.scrollTop = scrollTop;
    };

    dom.detailPanel.querySelectorAll("[data-place-field]").forEach(input => {
      input.addEventListener("change", () => {
        const field = input.dataset.placeField;
        const previousValue = place[field];
        const nextValue = field === "type" ? normaliseType(input.value) : input.value.trim();
        if (field === "name" && !nextValue) {
          input.value = previousValue;
          showToast("地点名称不能为空");
          return;
        }
        place[field] = nextValue;
        if (!saveDatabase()) {
          place[field] = previousValue;
          input.value = previousValue;
          return;
        }
        if (["name", "type"].includes(field)) {
          renderFilters();
          renderMarkers();
        }
        if (["name", "type", "note"].includes(field)) renderRouteDrawer();
        if (field === "name") {
          const heading = dom.detailPanel.querySelector("[data-detail-name]");
          if (heading) heading.textContent = place.name;
        }
        if (["type", "source"].includes(field)) rerenderEditorAtCurrentPosition();
        showToast("地点资料已保存");
      });
    });
    dom.detailPanel.querySelector("#tagsInput").addEventListener("change", event => {
      const previousTags = [...place.tags];
      place.tags = event.target.value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
      if (!saveDatabase()) {
        place.tags = previousTags;
        event.target.value = previousTags.join("，");
        return;
      }
      showToast("标签已保存");
    });

    const commitPlaceIcon = value => {
      if (!isLivePlace(place, editorCityId)) return;
      const previousIcon = place.emoji;
      place.emoji = normalisePlaceIcon(value);
      if (!saveDatabase()) {
        place.emoji = previousIcon;
        return;
      }
      renderMarkers();
      renderRouteDrawer();
      rerenderEditorAtCurrentPosition();
      showToast(place.emoji ? `地点图标已更新为 ${place.emoji}` : "已恢复为类型默认图标");
    };

    dom.detailPanel.querySelector("#resetPlaceIconBtn").addEventListener("click", () => commitPlaceIcon(""));
    dom.detailPanel.querySelectorAll("[data-place-icon]").forEach(button => {
      button.addEventListener("click", () => commitPlaceIcon(button.dataset.placeIcon));
    });
    const customIconInput = dom.detailPanel.querySelector("#customIconInput");
    const applyCustomIcon = () => {
      const segments = splitIconGraphemes(customIconInput.value);
      if (segments.length > 2) {
        showToast("自定义图标最多使用 2 个 Emoji 或文字");
        customIconInput.focus();
        return;
      }
      commitPlaceIcon(segments.join(""));
    };
    dom.detailPanel.querySelector("#applyCustomIconBtn").addEventListener("click", applyCustomIcon);
    customIconInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCustomIcon();
      }
    });
    customIconInput.addEventListener("input", () => {
      const preview = dom.detailPanel.querySelector(".icon-live-preview");
      if (preview) {
        const previewIcon = normalisePlaceIcon(customIconInput.value) || TYPE_CONFIG[place.type].emoji;
        preview.textContent = previewIcon;
        preview.classList.toggle("text-icon", splitIconGraphemes(previewIcon).length > 1);
      }
    });

    const addImageUrl = () => {
      const input = dom.detailPanel.querySelector("#imageUrlInput");
      const source = input.value.trim();
      if (!source) return;
      if (!isSupportedImageSource(source)) {
        showToast("图片网址无效，请使用 http、https、data:image 或相对路径");
        return;
      }
      if (place.images.includes(source)) {
        showToast("这张图片已经添加过了");
        return;
      }
      commitPlaceImages(place, [...place.images, source], "图片网址已添加", editorCityId);
    };
    dom.detailPanel.querySelector("#addImageUrlBtn").addEventListener("click", addImageUrl);
    dom.detailPanel.querySelector("#imageUrlInput").addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        addImageUrl();
      }
    });
    dom.detailPanel.querySelectorAll("[data-remove-image]").forEach(button => button.addEventListener("click", () => {
      const imageIndex = Number(button.dataset.removeImage);
      if (!Number.isInteger(imageIndex) || !place.images[imageIndex]) return;
      if (!confirm(`确定删除第 ${imageIndex + 1} 张照片吗？`)) return;
      commitPlaceImages(place, place.images.filter((_, index) => index !== imageIndex), "照片已删除", editorCityId);
    }));
    dom.detailPanel.querySelector("#imageUpload").addEventListener("change", async event => {
      const input = event.target;
      const files = Array.from(input.files || []).filter(file => file.type.startsWith("image/"));
      if (!files.length) return;
      const remaining = MAX_PLACE_IMAGES - place.images.length;
      if (files.length > remaining) {
        input.value = "";
        showToast(`每个地点最多保存 ${MAX_PLACE_IMAGES} 张照片，请减少本次选择`);
        return;
      }
      if (files.some(file => file.size > MAX_SOURCE_IMAGE_BYTES)) {
        input.value = "";
        showToast("单张原始照片不能超过 15 MB，请先缩小后再上传");
        return;
      }
      input.disabled = true;
      try {
        const compressed = [];
        for (const file of files) compressed.push(await compressImage(file));
        if (!isLivePlace(place, editorCityId)) {
          showToast("地点已切换或删除，本次照片没有保存");
          return;
        }
        commitPlaceImages(place, [...place.images, ...compressed], `已添加 ${compressed.length} 张本地照片`, editorCityId);
      } catch (_) {
        showToast("图片处理失败，本次照片没有保存");
      } finally {
        input.value = "";
        input.disabled = false;
      }
    });
    dom.detailPanel.querySelector("#deletePlaceBtn").addEventListener("click", () => deletePlace(place));
  }

  function isSupportedImageSource(source) {
    if (/^data:image\//i.test(source)) return true;
    try {
      const url = new URL(source, location.href);
      return ["http:", "https:", "file:"].includes(url.protocol);
    } catch (_) {
      return false;
    }
  }

  function isLivePlace(place, cityId) {
    return db.currentCity === cityId && selectedId === place.id && dom.detailPanel.classList.contains("open")
      && Boolean(db.cities[cityId]?.places?.some(item => item === place));
  }

  function commitPlaceImages(place, nextImages, message, cityId = db.currentCity) {
    if (!isLivePlace(place, cityId)) {
      showToast("地点已切换或删除，本次图片修改没有保存");
      return false;
    }
    const previousImages = [...place.images];
    const previousImage = place.image;
    const normalisedImages = Array.from(new Set(nextImages.map(image => String(image || "").trim()).filter(Boolean)));
    if (normalisedImages.length > MAX_PLACE_IMAGES) {
      showToast(`每个地点最多保存 ${MAX_PLACE_IMAGES} 张照片`);
      return false;
    }
    if (normalisedImages.reduce((total, image) => total + image.length, 0) > MAX_PLACE_IMAGE_CHARACTERS) {
      showToast("该地点照片总容量过大，请删除部分照片或改用图片网址");
      return false;
    }
    place.images = normalisedImages;
    place.image = place.images[0] || "";
    if (!saveDatabase()) {
      place.images = previousImages;
      place.image = previousImage;
      if (db.currentCity === cityId && selectedId === place.id && dom.detailPanel.classList.contains("open")) renderDetail(place);
      return false;
    }
    if (db.currentCity === cityId && selectedId === place.id && dom.detailPanel.classList.contains("open")) renderDetail(place);
    showToast(message);
    return true;
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          try {
            if (!image.width || !image.height) throw new Error("无法读取图片尺寸");
            const maximum = 1280;
            const scale = Math.min(1, maximum / Math.max(image.width, image.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            const context = canvas.getContext("2d");
            if (!context) throw new Error("无法处理图片");
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.78));
          } catch (error) {
            reject(error);
          }
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function deletePlace(place) {
    if (!isEditMode) return;
    if (!confirm(`确定删除“${place.name}”吗？此操作只影响本机数据。`)) return;
    const cityData = currentCity();
    cityData.places = cityData.places.filter(item => item.id !== place.id);
    cityData.route = cityData.route.filter(id => id !== place.id);
    for (const key of Object.keys(cityData.segments)) {
      const [startId, endId] = key.split("__");
      if (startId === place.id || endId === place.id) delete cityData.segments[key];
    }
    saveDatabase();
    closeDetail();
    renderAll();
    showToast("地点已删除");
  }

  function togglePlan(placeId) {
    const cityData = currentCity();
    const existingIndex = cityData.route.indexOf(placeId);
    if (existingIndex >= 0) {
      cityData.route = cityData.route.filter(id => id !== placeId);
      showToast("已移出规划");
    } else {
      cityData.route.push(placeId);
      drawerExpanded = false;
      showToast("已加入规划");
    }
    saveDatabase();
    renderMarkers();
    renderRouteDrawer();
    const place = cityData.places.find(item => item.id === placeId);
    if (place) renderDetail(place);
  }

  function segmentKey(startId, endId) {
    return `${startId}__${endId}`;
  }

  function estimateDistance(start, end) {
    const lat1 = finiteNumber(start?.lat);
    const lng1 = finiteNumber(start?.lng);
    const lat2 = finiteNumber(end?.lat);
    const lng2 = finiteNumber(end?.lng);
    if ([lat1, lng1, lat2, lng2].every(value => value !== null)) {
      const earthRadius = 6371;
      const toRadians = value => value * Math.PI / 180;
      const dLat = toRadians(lat2 - lat1);
      const dLng = toRadians(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
      return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return Math.hypot((end?.mapX || 0) - (start?.mapX || 0), (end?.mapY || 0) - (start?.mapY || 0)) * 0.16;
  }

  function getSegment(startId, endId) {
    const cityData = currentCity();
    const key = segmentKey(startId, endId);
    if (!isPlainObject(cityData.segments[key])) {
      const start = cityData.places.find(place => place.id === startId);
      const end = cityData.places.find(place => place.id === endId);
      if (!start || !end) return { mode: "步行", minutes: 0, km: 0, note: "" };
      const km = Math.max(0.1, Number((estimateDistance(start, end) * 1.18).toFixed(1)));
      cityData.segments[key] = { mode: "步行", minutes: Math.max(1, Math.round(km / 4.5 * 60)), km, note: "自动估算，可在编辑模式修改" };
      saveDatabase();
    }
    const segment = cityData.segments[key];
    segment.mode = String(segment.mode || "步行");
    segment.minutes = Math.max(0, finiteNumber(segment.minutes) ?? 0);
    segment.km = Math.max(0, finiteNumber(segment.km) ?? 0);
    segment.note = String(segment.note || "");
    return segment;
  }

  function routeTotals(entries) {
    let minutes = 0;
    let kilometres = 0;
    for (let index = 0; index < entries.length - 1; index += 1) {
      const segment = getSegment(entries[index].id, entries[index + 1].id);
      minutes += Number(segment.minutes) || 0;
      kilometres += Number(segment.km) || 0;
    }
    return { minutes, kilometres };
  }

  function renderRouteDrawer() {
    const previousScrollLeft = dom.timeline.scrollLeft;
    const entries = validRouteEntries();
    renderRouteLine();
    if (!entries.length) {
      drawerExpanded = false;
      dom.routeDrawer.hidden = true;
      dom.detailPanel.classList.remove("route-visible");
      dom.routeDrawer.classList.add("is-hidden", "collapsed");
      dom.routeHandle.setAttribute("aria-expanded", "false");
      dom.timeline.replaceChildren();
      requestAnimationFrame(() => clampAndPlaceMascot(false));
      return;
    }

    dom.routeDrawer.hidden = false;
    dom.detailPanel.classList.add("route-visible");
    dom.routeDrawer.classList.remove("is-hidden");
    dom.routeDrawer.classList.toggle("collapsed", !drawerExpanded);
    dom.routeHandle.setAttribute("aria-expanded", String(drawerExpanded));
    dom.routeTitle.textContent = `我的规划（${entries.length}）`;
    const totals = routeTotals(entries);
    dom.routeSummary.textContent = entries.length > 1
      ? `${totals.minutes} 分钟交通 · ${totals.kilometres.toFixed(1)} 公里${drawerExpanded ? "" : " · 点击或向上滑动展开"}`
      : drawerExpanded ? "已规划 1 个地点" : "点击或向上滑动展开";
    dom.timeline.replaceChildren();

    entries.forEach((entry, visibleIndex) => {
      const place = entry.place;
      const info = typeInfo(place);
      const node = document.createElement("article");
      node.className = `route-node${selectedId === place.id ? " selected" : ""}`;
      node.innerHTML = `<div class="route-node-top"><span class="route-type">${escapeHtml(info.emoji)} ${escapeHtml(place.type)}</span><span class="route-number">第 ${visibleIndex + 1} 站</span></div><h3>${escapeHtml(place.name)}</h3><p>${escapeHtml(place.note || "暂无简介")}</p>${isEditMode ? `<div class="node-actions"><button type="button" data-move="-1">前移</button><button type="button" data-move="1">后移</button><button type="button" data-remove>删除</button></div>` : ""}`;
      node.addEventListener("click", event => {
        if (!event.target.closest("button")) selectPlace(place.id);
      });
      if (isEditMode) {
        node.querySelectorAll("[data-move]").forEach(button => button.addEventListener("click", event => {
          event.stopPropagation();
          moveRouteEntry(visibleIndex, Number(button.dataset.move));
        }));
        node.querySelector("[data-remove]").addEventListener("click", event => {
          event.stopPropagation();
          togglePlan(place.id);
        });
      }
      dom.timeline.appendChild(node);

      if (visibleIndex < entries.length - 1) {
        const next = entries[visibleIndex + 1];
        const segment = getSegment(entry.id, next.id);
        const edge = document.createElement("div");
        edge.className = `route-edge${isEditMode ? " editable" : ""}`;
        edge.innerHTML = `<b>${escapeHtml(segment.mode)}</b><div class="edge-line"></div><span>${Number(segment.minutes) || 0} 分钟 · ${(Number(segment.km) || 0).toFixed(1)} 公里</span>${segment.note ? `<span>${escapeHtml(segment.note)}</span>` : ""}`;
        if (isEditMode) {
          edge.tabIndex = 0;
          edge.setAttribute("role", "button");
          edge.setAttribute("aria-label", `编辑从${place.name}到${next.place.name}的交通连接`);
          edge.addEventListener("click", () => openSegmentEditor(entry.id, next.id));
          edge.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") openSegmentEditor(entry.id, next.id);
          });
        }
        dom.timeline.appendChild(edge);
      }
    });
    requestAnimationFrame(() => {
      dom.timeline.scrollLeft = previousScrollLeft;
      clampAndPlaceMascot(false);
    });
  }

  function moveRouteEntry(visibleIndex, direction) {
    if (!isEditMode) return;
    const entries = validRouteEntries();
    const targetIndex = visibleIndex + direction;
    if (targetIndex < 0 || targetIndex >= entries.length) return;
    const currentStoredIndex = entries[visibleIndex].storedIndex;
    const targetStoredIndex = entries[targetIndex].storedIndex;
    const route = currentCity().route;
    [route[currentStoredIndex], route[targetStoredIndex]] = [route[targetStoredIndex], route[currentStoredIndex]];
    saveDatabase();
    renderMarkers();
    renderRouteDrawer();
    showToast("规划顺序已更新");
  }

  function setDrawerExpanded(value) {
    if (!validRouteEntries().length) return;
    if (value && innerWidth <= 720 && dom.detailPanel.classList.contains("open")) closeDetail();
    drawerExpanded = Boolean(value);
    dom.routeDrawer.classList.toggle("collapsed", !drawerExpanded);
    dom.routeHandle.setAttribute("aria-expanded", String(drawerExpanded));
    renderRouteDrawer();
    setTimeout(() => clampAndPlaceMascot(false), 320);
  }

  function bindRouteHandle() {
    dom.routeHandle.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const startX = event.clientX;
      const startY = event.clientY;
      let lastX = startX;
      let lastY = startY;
      dom.routeHandle.setPointerCapture?.(event.pointerId);
      const move = moveEvent => {
        if (moveEvent.pointerId !== event.pointerId) return;
        lastX = moveEvent.clientX;
        lastY = moveEvent.clientY;
      };
      const finish = endEvent => {
        if (endEvent.pointerId !== event.pointerId) return;
        cleanup();
        const dx = lastX - startX;
        const dy = lastY - startY;
        if (Math.abs(dy) > 36 && Math.abs(dy) > Math.abs(dx)) setDrawerExpanded(dy < 0);
        else if (Math.hypot(dx, dy) < 9) setDrawerExpanded(!drawerExpanded);
      };
      const cancel = cancelEvent => {
        if (cancelEvent.pointerId === event.pointerId) cleanup();
      };
      const cleanup = () => {
        dom.routeHandle.removeEventListener("pointermove", move);
        dom.routeHandle.removeEventListener("pointerup", finish);
        dom.routeHandle.removeEventListener("pointercancel", cancel);
      };
      dom.routeHandle.addEventListener("pointermove", move);
      dom.routeHandle.addEventListener("pointerup", finish);
      dom.routeHandle.addEventListener("pointercancel", cancel);
    });
    dom.routeHandle.addEventListener("click", event => {
      if (event.detail === 0) setDrawerExpanded(!drawerExpanded);
    });
  }

  function openSegmentEditor(startId, endId) {
    if (!isEditMode) return;
    const start = currentCity().places.find(place => place.id === startId);
    const end = currentCity().places.find(place => place.id === endId);
    if (!start || !end) {
      showToast("交通连接中的地点已经不存在");
      return;
    }
    editingSegment = { startId, endId };
    const segment = getSegment(startId, endId);
    dom.segmentTitle.textContent = `${start.name} → ${end.name}`;
    dom.segmentMode.value = segment.mode;
    dom.segmentMinutes.value = segment.minutes;
    dom.segmentKm.value = segment.km;
    dom.segmentNote.value = segment.note;
    dom.segmentModal.classList.add("open");
    dom.segmentModal.setAttribute("aria-hidden", "false");
  }

  function closeSegmentEditor() {
    editingSegment = null;
    dom.segmentModal.classList.remove("open");
    dom.segmentModal.setAttribute("aria-hidden", "true");
  }

  function saveSegmentEditor() {
    if (!isEditMode || !editingSegment) return;
    const segment = getSegment(editingSegment.startId, editingSegment.endId);
    segment.mode = dom.segmentMode.value;
    segment.minutes = Math.max(0, Number(dom.segmentMinutes.value) || 0);
    segment.km = Math.max(0, Number(dom.segmentKm.value) || 0);
    segment.note = dom.segmentNote.value.trim();
    saveDatabase();
    closeSegmentEditor();
    renderRouteDrawer();
    showToast("交通连接已保存");
  }

  function openSettings() {
    dom.settings.classList.add("open");
    dom.settings.setAttribute("aria-hidden", "false");
    renderSettings();
    setTimeout(() => dom.closeSettingsBtn.focus(), 100);
  }

  function closeSettings() {
    dom.settings.classList.remove("open");
    dom.settings.setAttribute("aria-hidden", "true");
    dom.mascot.focus({ preventScroll: true });
  }

  function renderSettings() {
    dom.modeBadge.textContent = isEditMode ? "编辑模式" : "日常浏览";
    dom.modeBadge.classList.toggle("editing", isEditMode);
    dom.modeHint.textContent = isEditMode
      ? "编辑功能已解锁：可新增地点、选择或自定义图标、拖动标记、完善城市资料、调整路线并管理存档。"
      : "日常浏览可搜索、筛选、查看详情和规划路线。需要新增或修改地点时，再进入编辑模式。";
    dom.enterEditControls.hidden = isEditMode;
    dom.finishEditBtn.hidden = !isEditMode;
    dom.passwordError.textContent = "";
    document.querySelectorAll("[data-edit-only]").forEach(element => {
      element.disabled = !isEditMode;
    });
    document.querySelectorAll("[data-edit-field]").forEach(element => {
      element.disabled = !isEditMode;
    });
    dom.importInput.disabled = !isEditMode;
    dom.importLabel.setAttribute("aria-disabled", String(!isEditMode));
    dom.cityNameInput.value = currentCity().name;
    dom.citySummaryInput.value = currentCity().summary || "";
    dom.cancelAddPlaceBtn.hidden = !addPlaceMode;
    renderCityList();
    renderVersions();
  }

  function renderCityList() {
    dom.cityList.replaceChildren();
    for (const [cityId, cityData] of Object.entries(db.cities)) {
      const row = document.createElement("div");
      row.className = `city-item${cityId === db.currentCity ? " current" : ""}`;
      const plannedCount = cityData.route.filter(id => cityData.places.some(place => place.id === id)).length;
      row.innerHTML = `<div><b>${escapeHtml(cityData.name)}</b><div class="city-meta">${cityData.places.length} 个地点 · ${plannedCount} 个规划点</div></div><button class="btn" type="button">${cityId === db.currentCity ? "当前城市" : "切换"}</button>`;
      const button = row.querySelector("button");
      button.disabled = cityId === db.currentCity;
      button.addEventListener("click", () => switchCity(cityId));
      dom.cityList.appendChild(row);
    }
  }

  function switchCity(cityId) {
    if (!db.cities[cityId]) return;
    db.currentCity = cityId;
    selectedId = null;
    filterType = "全部";
    searchText = "";
    dom.searchInput.value = "";
    addPlaceMode = false;
    drawerExpanded = false;
    saveDatabase();
    closeDetail();
    renderAll();
    closeSettings();
    showToast(`已切换到${currentCity().name}`);
  }

  function enterEditMode() {
    const password = dom.passwordInput.value;
    if (hashPassword(password) !== EDIT_PASSWORD_HASH) {
      dom.passwordError.textContent = "密码错误，请重新输入。";
      dom.passwordInput.select();
      return;
    }
    isEditMode = true;
    dom.passwordInput.value = "";
    renderAll();
    showToast("已进入编辑模式");
  }

  function finishEditMode() {
    isEditMode = false;
    addPlaceMode = false;
    pendingPlacePosition = null;
    dom.addPlaceTip.hidden = true;
    closeAddPlaceModal(false);
    closeSegmentEditor();
    renderAll();
    showToast("已完成编辑，当前为日常浏览");
  }

  function addCity() {
    if (!isEditMode) return;
    const name = prompt("请输入新城市名称");
    if (!name?.trim()) return;
    const cityId = `city_${Date.now()}`;
    db.cities[cityId] = normaliseCity(cityId, city(name.trim(), [0, 0], 12, "请补充城市说明。", "wgs84", []));
    db.currentCity = cityId;
    selectedId = null;
    addPlaceMode = false;
    filterType = "全部";
    searchText = "";
    saveDatabase();
    renderAll();
    closeSettings();
    showToast("新城市已创建");
  }

  function saveCityInfo() {
    if (!isEditMode) return;
    const cityData = currentCity();
    cityData.name = dom.cityNameInput.value.trim() || cityData.name;
    cityData.summary = dom.citySummaryInput.value.trim();
    saveDatabase();
    renderAll();
    showToast("城市资料已保存");
  }

  function startAddPlace() {
    if (!isEditMode) return;
    closeAddPlaceModal(true);
    addPlaceMode = true;
    renderAll();
    closeSettings();
    showToast("点击地图空白处，设置新地点的位置");
  }

  function cancelAddPlace(showMessage = true) {
    addPlaceMode = false;
    pendingPlacePosition = null;
    closeAddPlaceModal(false);
    renderAll();
    if (showMessage) showToast("已退出新增地点");
  }

  function renderNewPlaceTypeChoices() {
    dom.newPlaceTypeChoices.replaceChildren();
    for (const [type, info] of Object.entries(TYPE_CONFIG)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `type-choice${newPlaceDraft.type === type ? " active" : ""}`;
      button.dataset.newPlaceType = type;
      button.setAttribute("aria-pressed", String(newPlaceDraft.type === type));
      button.innerHTML = `<span style="--type-color:${info.color}">${escapeHtml(info.emoji)}</span><b>${escapeHtml(type)}</b>`;
      button.addEventListener("click", () => {
        newPlaceDraft.type = type;
        newPlaceDraft.emoji = "";
        dom.newPlaceCustomIconInput.value = "";
        renderNewPlaceCreator();
      });
      dom.newPlaceTypeChoices.appendChild(button);
    }
  }

  function renderNewPlaceIconChoices() {
    const defaultIcon = TYPE_CONFIG[newPlaceDraft.type].emoji;
    dom.newPlaceDefaultIcon.textContent = defaultIcon;
    dom.newPlaceDefaultIconBtn.classList.toggle("active", !newPlaceDraft.emoji);
    dom.newPlaceDefaultIconBtn.setAttribute("aria-pressed", String(!newPlaceDraft.emoji));
    dom.newPlaceIconChoices.replaceChildren();
    for (const icon of iconChoices(newPlaceDraft.type)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `icon-choice${newPlaceDraft.emoji === icon ? " active" : ""}${placeIconClass(icon)}`;
      button.dataset.newPlaceIcon = icon;
      button.textContent = icon;
      button.setAttribute("aria-label", `使用图标 ${icon}`);
      button.setAttribute("aria-pressed", String(newPlaceDraft.emoji === icon));
      button.addEventListener("click", () => {
        newPlaceDraft.emoji = icon;
        dom.newPlaceCustomIconInput.value = icon;
        renderNewPlaceCreator();
      });
      dom.newPlaceIconChoices.appendChild(button);
    }
  }

  function updateNewPlacePreview() {
    const info = TYPE_CONFIG[newPlaceDraft.type];
    const icon = newPlaceDraft.emoji || info.emoji;
    dom.addPlacePreview.textContent = icon;
    dom.addPlacePreview.style.setProperty("--marker-color", info.color);
    dom.addPlacePreview.classList.toggle("text-icon", splitIconGraphemes(icon).length > 1);
    const position = pendingPlacePosition;
    dom.newPlaceLocationNote.innerHTML = position
      ? `<span aria-hidden="true">📍</span><span>将添加到地图位置 <b>${position.mapX.toFixed(1)}%, ${position.mapY.toFixed(1)}%</b>；创建后仍可拖动调整。</span>`
      : `<span aria-hidden="true">📍</span><span>地点将添加到刚才选择的地图位置。</span>`;
  }

  function renderNewPlaceCreator() {
    renderNewPlaceTypeChoices();
    renderNewPlaceIconChoices();
    updateNewPlacePreview();
  }

  function openAddPlaceModal(mapX, mapY) {
    if (!isEditMode) return;
    pendingPlacePosition = { mapX: roundMapCoordinate(mapX), mapY: roundMapCoordinate(mapY) };
    newPlaceDraft = { type: "景点", emoji: "" };
    addPlaceMode = false;
    document.body.classList.remove("add-place-mode");
    dom.addPlaceTip.hidden = true;
    dom.editToolbar.hidden = true;
    dom.newPlaceNameInput.value = "";
    dom.newPlaceCustomIconInput.value = "";
    renderNewPlaceCreator();
    dom.addPlaceModal.classList.add("open");
    dom.addPlaceModal.setAttribute("aria-hidden", "false");
    setTimeout(() => dom.newPlaceNameInput.focus(), 80);
  }

  function closeAddPlaceModal(clearPosition = true) {
    dom.addPlaceModal.classList.remove("open");
    dom.addPlaceModal.setAttribute("aria-hidden", "true");
    if (clearPosition) pendingPlacePosition = null;
  }

  function applyNewPlaceCustomIcon() {
    const segments = splitIconGraphemes(dom.newPlaceCustomIconInput.value);
    if (segments.length > 2) {
      showToast("自定义图标最多使用 2 个 Emoji 或文字");
      dom.newPlaceCustomIconInput.focus();
      return;
    }
    newPlaceDraft.emoji = segments.join("");
    dom.newPlaceCustomIconInput.value = newPlaceDraft.emoji;
    renderNewPlaceCreator();
  }

  function confirmAddPlace() {
    if (!isEditMode || !pendingPlacePosition) return;
    const typedIconSegments = splitIconGraphemes(dom.newPlaceCustomIconInput.value);
    if (typedIconSegments.length > 2) {
      showToast("自定义图标最多使用 2 个 Emoji 或文字");
      dom.newPlaceCustomIconInput.focus();
      return;
    }
    newPlaceDraft.emoji = typedIconSegments.join("");
    const name = dom.newPlaceNameInput.value.trim();
    if (!name) {
      showToast("请先填写地点名称");
      dom.newPlaceNameInput.focus();
      return;
    }
    const id = `${db.currentCity}_${Date.now()}`;
    const place = normalisePlace(db.currentCity, poi(id, name, newPlaceDraft.type, null, null, "请补充地点简介。", "待补充", "待补充", "待补充", "暂无拍照机位说明", "", newPlaceDraft.emoji), currentCity().places.length);
    place.mapX = pendingPlacePosition.mapX;
    place.mapY = pendingPlacePosition.mapY;
    currentCity().places.push(place);
    if (!saveDatabase()) {
      currentCity().places = currentCity().places.filter(item => item !== place);
      return;
    }
    closeAddPlaceModal(true);
    renderAll();
    selectPlace(place.id);
    requestAnimationFrame(() => {
      dom.detailPanel.scrollTop = 0;
      dom.detailPanel.querySelector("#placeNoteInput")?.focus({ preventScroll: true });
    });
    showToast(`已创建${place.type}“${place.name}”，可继续完善资料`);
  }

  function createPlaceAt(event) {
    if (!addPlaceMode || !isEditMode || event.target.closest(".place-marker, .add-place-tip, .edit-toolbar")) return;
    const point = mapPointFromClient(event.clientX, event.clientY);
    const mapX = point.x / Math.max(1, point.width) * 100;
    const mapY = point.y / Math.max(1, point.height) * 100;
    openAddPlaceModal(mapX, mapY);
  }

  function createPlaceAtMapCenter() {
    if (!addPlaceMode || !isEditMode) return;
    openAddPlaceModal(50, 50);
  }

  function saveVersion() {
    if (!isEditMode) return;
    const defaultName = `${currentCity().name} ${new Date().toLocaleString("zh-CN", { hour12: false })}`;
    const label = prompt("请输入版本名称", defaultName);
    if (!label?.trim()) return;
    const version = {
      id: Date.now(), cityId: db.currentCity, label: label.trim(), created: new Date().toISOString(), data: deepClone(currentCity())
    };
    db.versions.push(version);
    if (!saveDatabase()) {
      db.versions = db.versions.filter(item => item !== version);
      return;
    }
    renderVersions();
    showToast("手动版本已保存");
  }

  function renderVersions() {
    const options = db.versions
      .filter(version => isPlainObject(version) && version.cityId === db.currentCity && isPlainObject(version.data))
      .map(version => `<option value="${escapeHtml(version.id)}">${escapeHtml(version.label || "未命名版本")}</option>`)
      .join("");
    dom.versionSelect.innerHTML = `<option value="">请选择已保存版本</option>${options}`;
    dom.versionSelect.disabled = !options;
  }

  function restoreVersion() {
    if (!isEditMode) return;
    const versionId = dom.versionSelect.value;
    const version = db.versions.find(item => String(item?.id) === versionId && item.cityId === db.currentCity);
    if (!version || !isPlainObject(version.data)) {
      showToast("请先选择可用版本");
      return;
    }
    if (!confirm("恢复版本会覆盖当前城市内容，确定继续吗？")) return;
    const cityId = db.currentCity;
    const previousCity = db.cities[cityId];
    db.cities[cityId] = normaliseCity(cityId, deepClone(version.data));
    if (!saveDatabase()) {
      db.cities[cityId] = previousCity;
      return;
    }
    selectedId = null;
    addPlaceMode = false;
    drawerExpanded = false;
    renderAll();
    showToast("版本已恢复");
  }

  function exportDatabase() {
    const blob = new Blob([serialiseDatabase(db, true)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `JJTrip备份-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 300);
    showToast("备份已导出");
  }

  async function importDatabase(event) {
    if (!isEditMode) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = normaliseDatabase(parsed, true);
      if (!confirm("导入会替换当前本机数据，确定继续吗？建议先导出备份。")) return;
      if (!saveDatabase(imported)) return;
      db = imported;
      selectedId = null;
      filterType = "全部";
      searchText = "";
      drawerExpanded = false;
      addPlaceMode = false;
      isEditMode = false;
      mascotPosition = db.settings.mascotPosition;
      renderAll();
      showToast("数据已导入，当前为日常浏览");
    } catch (error) {
      showToast("导入失败：文件格式不正确或内容已损坏");
    }
  }

  function resetDatabase() {
    if (!isEditMode) return;
    if (!confirm("恢复默认数据会覆盖本机地点、规划和手动版本。确定继续吗？")) return;
    const resetData = normaliseDatabase(deepClone(SEED));
    if (!saveDatabase(resetData)) return;
    db = resetData;
    selectedId = null;
    filterType = "全部";
    searchText = "";
    drawerExpanded = false;
    addPlaceMode = false;
    isEditMode = false;
    mascotPosition = db.settings.mascotPosition;
    renderAll();
    showToast("已恢复默认数据，当前为日常浏览");
  }

  function rectanglesOverlap(first, second, padding = 0) {
    return first.left < second.right + padding && first.right > second.left - padding && first.top < second.bottom + padding && first.bottom > second.top - padding;
  }

  function mascotBounds() {
    const rect = dom.mascot.getBoundingClientRect();
    const width = rect.width || (innerWidth <= 720 ? 62 : 72);
    const height = rect.height || (innerWidth <= 720 ? 102 : 118);
    const rootStyle = getComputedStyle(document.documentElement);
    const safeLeft = finiteNumber(parseFloat(rootStyle.getPropertyValue("--safe-left"))) ?? 0;
    const safeRight = finiteNumber(parseFloat(rootStyle.getPropertyValue("--safe-right"))) ?? 0;
    const safeBottom = finiteNumber(parseFloat(rootStyle.getPropertyValue("--safe-bottom"))) ?? 0;
    const headerBottom = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0;
    const minX = safeLeft + 9;
    const maximumX = innerWidth - width - safeRight - 9;
    const screenBottom = innerHeight - height - safeBottom - 9;
    let bottomLimit = screenBottom;
    if (!dom.routeDrawer.hidden && !dom.routeDrawer.classList.contains("is-hidden")) {
      bottomLimit = Math.min(bottomLimit, dom.routeDrawer.getBoundingClientRect().top - height - 10);
    }
    return {
      width,
      height,
      minX,
      maxX: Math.max(minX, maximumX),
      minY: Math.min(screenBottom, headerBottom + 9),
      maxY: Math.max(Math.min(screenBottom, headerBottom + 9), bottomLimit)
    };
  }

  function clampMascotPosition(position) {
    const bounds = mascotBounds();
    let x = clamp(finiteNumber(position?.x) ?? bounds.maxX, bounds.minX, bounds.maxX);
    let y = clamp(finiteNumber(position?.y) ?? bounds.minY + 18, bounds.minY, bounds.maxY);
    const mascotRect = { left: x, top: y, right: x + bounds.width, bottom: y + bounds.height };
    if (dom.detailPanel.classList.contains("open")) {
      const avoidRect = dom.detailPanel.getBoundingClientRect();
      if (rectanglesOverlap(mascotRect, avoidRect, 7)) {
        const leftCandidate = avoidRect.left - bounds.width - 12;
        if (leftCandidate >= bounds.minX) x = clamp(leftCandidate, bounds.minX, bounds.maxX);
        else y = clamp(avoidRect.top - bounds.height - 10, bounds.minY, bounds.maxY);
      }
    }
    return { x: Math.round(x), y: Math.round(y) };
  }

  function placeMascot(position, save = false) {
    mascotPosition = clampMascotPosition(position);
    dom.mascot.style.left = `${mascotPosition.x}px`;
    dom.mascot.style.top = `${mascotPosition.y}px`;
    if (save) {
      db.settings.mascotPosition = { ...mascotPosition };
      saveDatabase();
    }
  }

  function clampAndPlaceMascot(save = false) {
    const saved = mascotPosition || db.settings.mascotPosition;
    placeMascot(saved, save);
  }

  function bindMascotPointer() {
    dom.mascot.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const origin = mascotPosition || clampMascotPosition(db.settings.mascotPosition);
      let moved = 0;
      let dragging = false;
      dom.mascot.setPointerCapture?.(event.pointerId);

      const move = moveEvent => {
        if (moveEvent.pointerId !== event.pointerId) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        moved = Math.hypot(dx, dy);
        if (moved < 7) return;
        dragging = true;
        dom.mascot.classList.add("dragging");
        placeMascot({ x: origin.x + dx, y: origin.y + dy }, false);
      };

      const finish = endEvent => {
        if (endEvent.pointerId !== event.pointerId) return;
        cleanup();
        dom.mascot.classList.remove("dragging");
        try { dom.mascot.releasePointerCapture?.(event.pointerId); } catch (_) {}
        if (dragging) placeMascot(mascotPosition, true);
        else if (moved < 7) openSettings();
      };

      const cancel = cancelEvent => {
        if (cancelEvent.pointerId !== event.pointerId) return;
        cleanup();
        dom.mascot.classList.remove("dragging");
        if (dragging) placeMascot(mascotPosition, true);
      };

      const cleanup = () => {
        dom.mascot.removeEventListener("pointermove", move);
        dom.mascot.removeEventListener("pointerup", finish);
        dom.mascot.removeEventListener("pointercancel", cancel);
      };
      dom.mascot.addEventListener("pointermove", move);
      dom.mascot.addEventListener("pointerup", finish);
      dom.mascot.addEventListener("pointercancel", cancel);
    });
    dom.mascot.addEventListener("click", event => {
      if (event.detail === 0) openSettings();
    });
  }

  function bindEvents() {
    dom.topbarToggle.addEventListener("click", () => {
      const collapsed = !document.querySelector(".app-shell")?.classList.contains("nav-collapsed");
      setNavigationCollapsed(collapsed);
    });
    dom.zoomInBtn.addEventListener("click", () => zoomMapTo(mapView.scale * 1.25));
    dom.zoomOutBtn.addEventListener("click", () => zoomMapTo(mapView.scale / 1.25));
    dom.resetMapViewBtn.addEventListener("click", () => resetMapView(true));
    bindMapGestures();
    dom.searchInput.addEventListener("input", event => {
      searchText = event.target.value.trim();
      renderMapBase();
      renderMarkers();
    });
    dom.virtualMap.addEventListener("click", createPlaceAt);
    bindMascotPointer();
    bindRouteHandle();
    dom.closeSettingsBtn.addEventListener("click", closeSettings);
    dom.settings.addEventListener("pointerdown", event => {
      if (event.target === dom.settings) closeSettings();
    });
    dom.enterEditBtn.addEventListener("click", enterEditMode);
    dom.passwordInput.addEventListener("keydown", event => {
      if (event.key === "Enter") enterEditMode();
    });
    dom.finishEditBtn.addEventListener("click", finishEditMode);
    dom.addCityBtn.addEventListener("click", addCity);
    dom.saveCityInfoBtn.addEventListener("click", saveCityInfo);
    dom.startAddPlaceBtn.addEventListener("click", startAddPlace);
    dom.quickAddPlaceBtn.addEventListener("click", startAddPlace);
    dom.quickFinishEditBtn.addEventListener("click", finishEditMode);
    dom.cancelAddPlaceBtn.addEventListener("click", () => cancelAddPlace());
    dom.cancelAddPlaceMapBtn.addEventListener("click", cancelAddPlace);
    dom.placeAtMapCenterBtn.addEventListener("click", createPlaceAtMapCenter);
    dom.newPlaceDefaultIconBtn.addEventListener("click", () => {
      newPlaceDraft.emoji = "";
      dom.newPlaceCustomIconInput.value = "";
      renderNewPlaceCreator();
    });
    dom.applyNewPlaceCustomIconBtn.addEventListener("click", applyNewPlaceCustomIcon);
    dom.newPlaceCustomIconInput.addEventListener("input", () => {
      const previewIcon = normalisePlaceIcon(dom.newPlaceCustomIconInput.value) || TYPE_CONFIG[newPlaceDraft.type].emoji;
      dom.addPlacePreview.textContent = previewIcon;
      dom.addPlacePreview.classList.toggle("text-icon", splitIconGraphemes(previewIcon).length > 1);
    });
    dom.newPlaceCustomIconInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyNewPlaceCustomIcon();
      }
    });
    dom.newPlaceNameInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        confirmAddPlace();
      }
    });
    dom.confirmAddPlaceBtn.addEventListener("click", confirmAddPlace);
    dom.cancelAddPlaceModalBtn.addEventListener("click", () => cancelAddPlace(false));
    dom.addPlaceModal.addEventListener("pointerdown", event => {
      if (event.target === dom.addPlaceModal) cancelAddPlace(false);
    });
    dom.exportBtn.addEventListener("click", exportDatabase);
    dom.importInput.addEventListener("change", importDatabase);
    dom.importLabel.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && isEditMode) dom.importInput.click();
    });
    dom.saveVersionBtn.addEventListener("click", saveVersion);
    dom.restoreVersionBtn.addEventListener("click", restoreVersion);
    dom.resetBtn.addEventListener("click", resetDatabase);
    dom.saveSegmentBtn.addEventListener("click", saveSegmentEditor);
    dom.cancelSegmentBtn.addEventListener("click", closeSegmentEditor);
    dom.segmentModal.addEventListener("pointerdown", event => {
      if (event.target === dom.segmentModal) closeSegmentEditor();
    });
    window.addEventListener("resize", () => {
      updateMapTextScale();
      applyMapView(false);
      resolveMarkerPositions();
      resolveMarkerLabels();
      clampAndPlaceMascot(true);
    });
    window.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (dom.addPlaceModal.classList.contains("open")) cancelAddPlace(false);
      else if (dom.segmentModal.classList.contains("open")) closeSegmentEditor();
      else if (dom.settings.classList.contains("open")) closeSettings();
      else if (addPlaceMode) cancelAddPlace();
      else if (dom.detailPanel.classList.contains("open")) closeDetail();
    });
  }

  function initialise() {
    isEditMode = false;
    bindEvents();
    let navigationCollapsed = false;
    try { navigationCollapsed = localStorage.getItem(NAV_COLLAPSE_KEY) === "1"; } catch (_) {}
    setNavigationCollapsed(navigationCollapsed, false);
    renderAll();
    mascotPosition = db.settings.mascotPosition;
    requestAnimationFrame(() => clampAndPlaceMascot(false));
    if (!damagedStorageRaw) saveDatabase();
    if (loadWarning) setTimeout(() => showToast(loadWarning), 250);
  }

  initialise();
})();
