/* JJTrip 五城虚拟地图布局。坐标使用 0–100 百分比，便于地点与 SVG 同步定位。 */
(function () {
  "use strict";

  const commonDefs = `
    <defs>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#52728d" flood-opacity=".18"/>
      </filter>
      <pattern id="waterDots" width="34" height="34" patternUnits="userSpaceOnUse">
        <path d="M4 17 Q11 11 18 17 T32 17" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>
      </pattern>
      <pattern id="cityGrid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M0 14 H28 M14 0 V28" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
      </pattern>
      <style>
        .land{stroke:#fff;stroke-width:7;stroke-linejoin:round;filter:url(#softShadow)}
        .district{stroke:#fff;stroke-width:4;stroke-linejoin:round;opacity:.96}
        .road{fill:none;stroke:#fff;stroke-width:7;stroke-linecap:round;stroke-dasharray:15 12;opacity:.82}
        .rail{fill:none;stroke:#385d8a;stroke-width:4;stroke-linecap:round;stroke-dasharray:7 10;opacity:.58}
        .bridge{fill:none;stroke:#fff6cf;stroke-width:9;stroke-linecap:round;stroke-dasharray:4 11}
        .label{font:800 22px 'Microsoft YaHei',sans-serif;fill:#334e68;paint-order:stroke;stroke:#fff;stroke-width:6;stroke-linejoin:round}
        .label-small{font:800 17px 'Microsoft YaHei',sans-serif;fill:#486581;paint-order:stroke;stroke:#fff;stroke-width:5;stroke-linejoin:round}
        .water-label{font:800 18px 'Microsoft YaHei',sans-serif;letter-spacing:5px;fill:#2780b8;opacity:.72}
        .city-title{font:950 34px 'Microsoft YaHei',sans-serif;fill:#173f6b;paint-order:stroke;stroke:#fff;stroke-width:8}
        .city-sub{font:700 16px 'Microsoft YaHei',sans-serif;fill:#45657f;paint-order:stroke;stroke:#fff;stroke-width:5}
        .icon{font:30px sans-serif;paint-order:stroke;stroke:#fff;stroke-width:5}
        .tree{font:25px sans-serif;paint-order:stroke;stroke:#fff;stroke-width:4}
      </style>
    </defs>`;

  function frame(content, water = "#bceaff") {
    return `<svg viewBox="0 0 1000 650" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="城市卡通虚拟地图">
      ${commonDefs}
      <rect width="1000" height="650" fill="${water}"/>
      <rect width="1000" height="650" fill="url(#waterDots)"/>
      ${content}
    </svg>`;
  }

  const hongkong = frame(`
    <path class="land" fill="#bde7a6" d="M80 15 H930 Q976 19 965 106 L941 225 Q935 267 872 269 L689 259 Q613 252 537 269 L361 250 Q281 239 205 260 L74 240 Q36 230 42 181 Z"/>
    <path class="district" fill="#f9d87b" d="M329 188 Q435 159 553 173 L631 253 Q560 287 472 276 L361 250 Z"/>
    <path class="district" fill="#f6a97b" d="M459 255 Q526 237 590 252 L628 352 L511 362 L438 321 Z"/>
    <path class="district" fill="#d7bcff" d="M367 236 Q421 225 467 252 L438 321 L372 301 Z"/>
    <path class="land" fill="#ffd99e" d="M233 408 Q326 360 449 389 Q538 409 625 391 Q721 365 865 413 L840 504 Q731 522 627 505 Q524 486 433 515 Q332 544 222 506 Z"/>
    <path class="district" fill="#ffbd8d" d="M318 410 Q376 385 447 395 L431 514 Q365 534 304 521 Z"/>
    <path class="district" fill="#f8a8bd" d="M447 395 Q510 407 565 402 L568 493 Q508 491 431 514 Z"/>
    <path class="district" fill="#aee5ca" d="M565 402 Q628 390 690 392 L705 511 Q637 512 568 493 Z"/>
    <path class="district" fill="#c5b8ff" d="M690 392 Q770 388 865 413 L840 504 Q779 515 705 511 Z"/>
    <path class="land" fill="#b8e3a8" d="M44 405 Q101 351 187 377 L211 484 Q171 538 91 527 L29 469 Z"/>
    <path class="land" fill="#d8eda9" d="M93 566 q34-30 72 1 q-24 39-69 26 Z M878 554 q29-27 66 2 q-25 34-63 22 Z"/>
    <path class="road" d="M119 89 Q336 111 561 86 T894 101 M219 214 Q418 195 609 229 T889 195"/>
    <path class="rail" d="M476 154 Q488 224 512 272 L530 349 M390 291 Q492 316 610 294"/>
    <path class="bridge" d="M510 353 Q520 374 522 394 M631 353 Q651 374 651 394"/>
    <rect x="485" y="334" width="74" height="12" rx="6" fill="#fff" opacity=".85"/>
    <text class="city-title" x="65" y="62">香港</text><text class="city-sub" x="66" y="88">山海相拥 · 维港两岸</text>
    <text class="label" x="192" y="118">新界</text><text class="label" x="410" y="223">旺角</text>
    <text class="label-small" x="446" y="273">油麻地</text><text class="label" x="487" y="331">尖沙咀</text>
    <text class="label-small" x="357" y="286">西九龙</text><text class="water-label" x="420" y="380">维多利亚港</text>
    <text class="label-small" x="304" y="468">坚尼地城</text><text class="label-small" x="449" y="457">中环</text>
    <text class="label-small" x="548" y="452">金钟</text><text class="label-small" x="640" y="461">湾仔</text>
    <text class="label-small" x="754" y="456">铜锣湾</text><text class="label" x="72" y="457">大屿山</text>
    <text class="label-small" x="93" y="589">离岛</text>
    <text class="icon" x="492" y="319">🛳️</text><text class="icon" x="434" y="482">🚋</text>
    <text class="icon" x="735" y="431">🏙️</text><text class="tree" x="116" y="193">🌳</text><text class="tree" x="780" y="171">🌳</text>
  `);

  const singapore = frame(`
    <path class="land" fill="#bfe7a2" d="M72 218 Q136 105 299 81 Q455 53 621 93 Q781 117 894 219 Q954 276 912 376 Q868 475 708 506 Q514 544 327 503 Q154 466 82 363 Q38 301 72 218 Z"/>
    <path class="district" fill="#ffd780" d="M244 181 Q346 123 447 159 L471 266 L335 301 L243 252 Z"/>
    <path class="district" fill="#ffb68b" d="M397 198 Q510 145 611 195 L627 293 L471 310 Z"/>
    <path class="district" fill="#d8c2ff" d="M581 181 Q683 169 763 226 L724 328 L620 294 Z"/>
    <path class="district" fill="#f8abc1" d="M307 296 Q410 252 506 304 L487 418 L350 421 Z"/>
    <path class="district" fill="#aee8cf" d="M487 302 Q591 268 687 318 L670 435 L489 419 Z"/>
    <path class="district" fill="#96d9dc" d="M676 306 Q775 293 841 350 L768 451 L669 435 Z"/>
    <path class="land" fill="#f6ce80" d="M295 545 Q409 510 541 533 Q638 548 719 529 L756 579 Q635 611 504 598 Q385 591 276 584 Z"/>
    <path class="land" fill="#b9e2a4" d="M845 112 Q900 91 947 127 L930 194 L864 202 Z"/>
    <path class="road" d="M181 258 Q346 205 510 233 T831 276 M177 376 Q355 345 529 382 T801 368"/>
    <path class="rail" d="M284 143 Q355 233 442 304 Q524 373 664 421"/>
    <path class="bridge" d="M493 419 Q505 483 501 530 M627 430 Q640 486 625 536"/>
    <path d="M578 412 Q635 386 687 417 Q650 463 590 455 Z" fill="#7bc5ee" stroke="#fff" stroke-width="5"/>
    <text class="city-title" x="60" y="63">新加坡</text><text class="city-sub" x="61" y="89">花园城市 · 多元街区</text>
    <text class="label" x="273" y="210">乌节路</text><text class="label-small" x="421" y="242">小印度</text>
    <text class="label-small" x="596" y="238">甘榜格南</text><text class="label" x="337" y="366">牛车水</text>
    <text class="label" x="555" y="384">滨海湾</text><text class="label-small" x="681" y="383">滨海湾花园</text>
    <text class="water-label" x="474" y="490">新加坡海峡</text><text class="label" x="442" y="570">圣淘沙</text>
    <text class="label-small" x="861" y="155">樟宜</text>
    <text class="icon" x="602" y="419">🦁</text><text class="icon" x="669" y="434">🌿</text>
    <text class="icon" x="482" y="565">🎡</text><text class="icon" x="866" y="167">✈️</text><text class="tree" x="174" y="334">🌳</text>
  `, "#b9e8ff");

  const shenzhen = frame(`
    <path class="land" fill="#bde6a5" d="M0 0 H1000 V482 Q895 458 810 489 Q716 518 617 476 Q525 438 434 478 Q317 532 202 478 Q106 438 0 473 Z"/>
    <path class="district" fill="#f8d37c" d="M18 59 H244 L263 439 Q145 424 30 454 Z"/>
    <path class="district" fill="#f6b288" d="M244 84 H433 L448 470 Q357 497 263 439 Z"/>
    <path class="district" fill="#aee4cd" d="M433 65 H621 L627 477 Q529 440 448 470 Z"/>
    <path class="district" fill="#f5abc1" d="M621 75 H790 L810 489 Q715 519 627 477 Z"/>
    <path class="district" fill="#d2bdff" d="M790 46 H1000 V482 Q906 458 810 489 Z"/>
    <path d="M331 445 Q396 420 474 461 Q427 522 339 505 Z" fill="#82ccef" stroke="#fff" stroke-width="5"/>
    <path d="M0 474 Q105 439 202 478 Q317 532 434 478 Q525 438 617 476 Q716 518 810 489 Q895 458 1000 482 V650 H0 Z" fill="#a9e2ff"/>
    <rect y="474" width="1000" height="176" fill="url(#waterDots)"/>
    <path class="road" d="M70 165 Q277 125 481 169 T922 151 M70 305 Q277 268 493 302 T925 281"/>
    <path class="rail" d="M89 235 Q300 208 505 240 T927 221"/>
    <path class="bridge" d="M362 471 Q371 527 355 606 M539 472 Q562 527 564 604"/>
    <text class="city-title" x="50" y="58">深圳</text><text class="city-sub" x="51" y="84">山海连城 · 活力湾区</text>
    <text class="label" x="89" y="230">宝安</text><text class="label" x="298" y="244">南山</text>
    <text class="label" x="498" y="237">福田</text><text class="label" x="671" y="248">罗湖</text><text class="label" x="853" y="231">盐田</text>
    <text class="label-small" x="333" y="450">人才公园</text><text class="label-small" x="472" y="329">市民中心</text>
    <text class="label-small" x="495" y="185">莲花山</text><text class="label-small" x="683" y="324">东门</text>
    <text class="water-label" x="390" y="574">深圳湾</text>
    <text class="icon" x="530" y="285">🏙️</text><text class="icon" x="701" y="347">🏮</text>
    <text class="tree" x="516" y="164">🌳</text><text class="tree" x="359" y="426">🌳</text><text class="icon" x="149" y="359">🎡</text>
  `, "#a9e2ff");

  const macau = frame(`
    <path class="land" fill="#f6d27f" d="M362 20 Q492 5 590 79 L608 226 Q561 280 469 266 Q382 246 337 171 Z"/>
    <path class="district" fill="#f3a98b" d="M372 31 Q472 17 558 77 L566 139 L359 134 Z"/>
    <path class="district" fill="#f8b7c8" d="M359 134 L566 139 L583 218 Q538 259 468 247 Q397 232 346 176 Z"/>
    <path class="land" fill="#bce7aa" d="M373 318 Q474 277 600 322 L623 427 Q515 462 395 421 Z"/>
    <path class="district" fill="#d7c2ff" d="M391 354 Q498 322 609 344 L620 429 Q512 462 397 421 Z"/>
    <path class="land" fill="#b0dec2" d="M395 436 Q512 405 623 439 L646 606 Q525 638 396 586 Z"/>
    <path class="district" fill="#ffd993" d="M404 436 Q510 411 622 442 L631 510 Q516 540 399 506 Z"/>
    <path class="bridge" d="M441 256 Q425 291 434 326 M552 256 Q575 287 566 322 M589 218 Q704 272 620 371"/>
    <path class="road" d="M393 92 Q469 64 553 99 M415 378 Q504 348 599 376 M421 482 Q519 455 622 485 M427 555 Q525 530 632 556"/>
    <text class="city-title" x="60" y="63">澳门</text><text class="city-sub" x="61" y="89">世遗街巷 · 海岛风情</text>
    <text class="label" x="397" y="98">澳门半岛</text><text class="label-small" x="390" y="161">大三巴 · 议事亭前地</text>
    <text class="label" x="454" y="382">氹仔</text><text class="label" x="471" y="486">路氹</text><text class="label" x="475" y="569">路环</text>
    <text class="water-label" x="108" y="330">珠江口</text><text class="water-label" x="685" y="335">南海</text>
    <text class="icon" x="456" y="135">⛪</text><text class="icon" x="485" y="397">🏘️</text>
    <text class="icon" x="518" y="486">🏨</text><text class="tree" x="535" y="573">🌳</text><text class="icon" x="330" y="232">🌉</text>
  `, "#b9e9ff");

  const kualalumpur = frame(`
    <rect x="0" y="0" width="1000" height="650" fill="#c6e9ad"/>
    <path class="district" fill="#f7d47d" d="M60 54 Q252 20 406 77 L393 225 Q228 253 72 208 Z"/>
    <path class="district" fill="#b6e3c4" d="M405 74 Q586 34 759 92 L738 243 Q567 264 394 225 Z"/>
    <path class="district" fill="#d7c1ff" d="M759 91 Q886 113 957 203 L908 337 L739 243 Z"/>
    <path class="district" fill="#f7b2c4" d="M78 209 Q232 176 394 225 L425 407 Q251 436 90 382 Z"/>
    <path class="district" fill="#ffb58a" d="M394 225 Q568 194 738 243 L737 420 Q583 453 425 407 Z"/>
    <path class="district" fill="#9fdbd1" d="M738 243 L908 337 L888 491 Q796 503 736 420 Z"/>
    <path class="district" fill="#badfa6" d="M90 382 Q251 353 425 407 L408 587 Q244 613 82 550 Z"/>
    <path class="district" fill="#f8da91" d="M425 407 Q575 380 737 420 L725 588 Q566 620 408 587 Z"/>
    <path class="road" d="M109 164 Q333 123 535 167 T883 191 M111 329 Q312 285 508 328 T872 352 M143 496 Q338 459 530 494 T835 500"/>
    <path class="rail" d="M222 80 Q321 205 463 289 Q575 356 760 420 M137 432 Q328 359 535 304 T854 238"/>
    <path d="M264 0 Q291 139 348 246 Q400 341 381 650" fill="none" stroke="#79c9ec" stroke-width="16" opacity=".75"/>
    <text class="city-title" x="55" y="58">吉隆坡</text><text class="city-sub" x="56" y="84">多元文化 · 热带都会</text>
    <text class="label" x="174" y="145">黑风洞</text><text class="label" x="435" y="254">市中心</text>
    <text class="label-small" x="423" y="301">双子塔</text><text class="label" x="199" y="343">独立广场</text>
    <text class="label-small" x="266" y="392">茨厂街</text><text class="label" x="589" y="404">武吉免登</text>
    <text class="label-small" x="611" y="452">阿罗街</text><text class="label-small" x="222" y="527">湖滨公园</text>
    <text class="icon" x="462" y="325">🏙️</text><text class="icon" x="204" y="374">🏛️</text>
    <text class="icon" x="614" y="432">🍜</text><text class="icon" x="173" y="180">🛕</text><text class="tree" x="251" y="540">🌳</text>
  `, "#c6e9ad");

  const generic = frame(`
    <path class="land" fill="#bde5a7" d="M67 98 Q244 38 438 85 Q628 25 861 101 Q954 197 913 354 Q873 514 688 558 Q501 616 313 554 Q124 515 65 365 Q23 230 67 98 Z"/>
    <path class="district" fill="#f8d480" d="M126 147 Q284 87 431 136 L418 306 L113 325 Z"/>
    <path class="district" fill="#f5b18a" d="M431 136 Q596 78 765 148 L786 321 L418 306 Z"/>
    <path class="district" fill="#d2beff" d="M113 325 L418 306 L469 508 Q281 545 145 450 Z"/>
    <path class="district" fill="#aee5cc" d="M418 306 L786 321 L824 454 Q659 549 469 508 Z"/>
    <path class="road" d="M136 221 Q326 171 516 213 T840 228 M144 402 Q348 354 541 402 T817 397"/>
    <text class="city-title" x="61" y="64">JJTrip 城市地图</text><text class="city-sub" x="62" y="91">拖动地点，制作你的旅行手册</text>
    <text class="label" x="227" y="238">城市北区</text><text class="label" x="551" y="231">城市东区</text>
    <text class="label" x="228" y="424">城市西区</text><text class="label" x="577" y="430">城市南区</text>
    <text class="icon" x="475" y="335">🏙️</text><text class="tree" x="727" y="458">🌳</text>
  `);

  window.JJTRIP_MAPS = {
    hongkong: {
      title: "香港",
      caption: "九龙在维港北侧，港岛沿南岸展开；大屿山与离岛位于西南外围。",
      bounds: { minLng: 114.115, maxLng: 114.19, minLat: 22.265, maxLat: 22.34, left: 21, right: 87, top: 17, bottom: 81 },
      overrides: {
        hk_peak: [31, 76], hk_peaktram: [60, 74], hk_taikwun: [55, 67], hk_pmq: [46, 73], hk_centralmarket: [63, 66], hk_graham: [42, 79],
        hk_lanfong: [52, 79], hk_saiyingpun: [39, 65], hk_kennedy: [28, 70], hk_starferry: [64, 61], hk_clocktower: [48, 54], hk_aos: [58, 48],
        hk_k11: [61, 55], hk_mplus: [38, 47], hk_artpark: [43, 40], hk_australia: [54, 39], hk_templestreet: [47, 32], hk_hopyik: [31, 24]
      },
      svg: hongkong
    },
    singapore: {
      title: "新加坡",
      caption: "滨海湾位于南部核心，牛车水、乌节路、小印度与甘榜格南环绕中心；圣淘沙在南侧离岛。",
      bounds: { minLng: 103.828, maxLng: 103.872, minLat: 1.273, maxLat: 1.312, left: 20, right: 80, top: 21, bottom: 69 },
      overrides: {
        sg_merlion: [56, 61], sg_esplanade: [58, 51], sg_mbs: [64, 69], sg_gardens: [73, 63], sg_supertree: [78, 55], sg_fortcanning: [40, 42],
        sg_oldhill: [49, 48], sg_gallery: [57, 42], sg_buddha: [37, 61], sg_maxwell: [43, 69], sg_yakun: [48, 61], sg_songfa: [39, 51],
        sg_sultan: [62, 32], sg_haji: [68, 39], sg_tenteng: [45, 25], sg_tekka: [52, 33], sg_tiong: [21, 60], sg_jewel: [85, 25]
      },
      svg: singapore
    },
    shenzhen: {
      title: "深圳",
      caption: "宝安在西，南山、福田、罗湖向东排列，盐田位于最东；深圳湾贴近南部海岸。",
      bounds: { minLng: 113.87, maxLng: 114.16, minLat: 22.47, maxLat: 22.68, left: 7, right: 94, top: 12, bottom: 76 },
      overrides: {
        sz_civic: [52, 43], sz_lianhua: [53, 28], sz_gangxia: [61, 51], sz_pafc: [54, 61], sz_huaqiang: [61, 35], sz_dongmen: [71, 44],
        sz_luohu: [77, 55], sz_dafen: [84, 30], sz_gankeng: [88, 18], sz_octloft: [41, 49], sz_hexiangning: [35, 57], sz_nantou: [25, 49],
        sz_talent: [37, 69], sz_sunrise: [34, 79], sz_seaworld: [22, 71], sz_happyharbor: [15, 49], sz_baheri: [61, 70], sz_runyuan: [44, 64]
      },
      svg: shenzhen
    },
    macau: {
      title: "澳门",
      caption: "澳门半岛在北，氹仔居中，路氹连接南侧路环；三座跨海桥串起半岛与离岛。",
      bounds: { minLng: 113.525, maxLng: 113.57, minLat: 22.105, maxLat: 22.205, left: 34, right: 65, top: 10, bottom: 91 },
      overrides: {
        mo_ruins: [45, 13], mo_love: [36, 13], mo_fort: [39, 21], mo_senado: [47, 29], mo_dominic: [48, 21], mo_margaret: [47, 37],
        mo_wongchi: [38, 29], mo_ama: [38, 37], mo_tower: [56, 37], mo_guia: [56, 13], mo_fisherman: [58, 21], mo_guanyin: [57, 29],
        mo_cunha: [45, 54], mo_taipahouses: [58, 54], mo_mokyikei: [50, 62], mo_venetian: [51, 72], mo_londoner: [60, 80], mo_lordstow: [48, 90]
      },
      svg: macau
    },
    kualalumpur: {
      title: "吉隆坡",
      caption: "双子塔位于市中心，独立广场与茨厂街在西侧老城；武吉免登、阿罗街在东南，黑风洞位于北郊。",
      bounds: { minLng: 101.685, maxLng: 101.722, minLat: 3.115, maxLat: 3.17, left: 18, right: 82, top: 18, bottom: 83 },
      overrides: {
        kl_petronas: [54, 43], kl_klccpark: [55, 51], kl_saloma: [58, 27], kl_kltower: [46, 35], kl_merdeka: [23, 48], kl_sultan: [34, 44],
        kl_centralmarket: [38, 52], kl_petaling: [30, 63], kl_kwai: [40, 69], kl_merchant: [42, 61], kl_mosque: [23, 56], kl_islamicmuseum: [18, 64],
        kl_theanhou: [23, 76], kl_batu: [22, 17], kl_alor: [66, 64], kl_lot10: [66, 44], kl_villagepark: [12, 70], kl_pavilion: [72, 55], kl_trx: [76, 73]
      },
      svg: kualalumpur
    },
    generic: {
      title: "自定义城市",
      caption: "这是自定义城市的通用卡通布局，可在编辑模式拖动地点进行排布。",
      bounds: null,
      overrides: {},
      svg: generic
    }
  };
})();

/* JJTrip navigation compatibility fixes loaded before app.js. */
(function () {
  "use strict";

  const CITY_IDS = {
    "香港": "hongkong",
    "新加坡": "singapore",
    "深圳": "shenzhen",
    "澳门": "macau",
    "吉隆坡": "kualalumpur"
  };
  let pendingCityId = "";

  document.addEventListener("click", event => {
    const option = event.target.closest?.(".quick-city-option");
    if (!option) return;
    const name = option.querySelector("b")?.textContent?.trim() || "";
    pendingCityId = CITY_IDS[name] || "";
  }, true);

  window.save = function () {
    if (!pendingCityId) return;
    try {
      const key = "jjtrip_mvp_v3";
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);
      data.currentCity = pendingCityId;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_) {
      // Switching still completes in memory even when local storage is unavailable.
    } finally {
      pendingCityId = "";
    }
  };

  function installNavigationFixes() {
    const bottomNav = document.getElementById("bottomNav");
    const routeDrawer = document.getElementById("routeDrawer");
    const detailPanel = document.getElementById("detailPanel");
    const settings = document.getElementById("settingsBackdrop");
    const settingsDrawer = document.querySelector(".settings-drawer");
    const closeSettingsButton = document.getElementById("closeSettingsBtn");

    if (!bottomNav || !routeDrawer || !settings || !settingsDrawer || !closeSettingsButton) {
      setTimeout(installNavigationFixes, 50);
      return;
    }

    const syncRouteDrawer = () => {
      const activeNav = bottomNav.querySelector("[data-nav].active")?.dataset.nav || "home";
      const show = activeNav === "plan";
      routeDrawer.hidden = !show;
      routeDrawer.classList.toggle("is-hidden", !show);
      detailPanel?.classList.toggle("route-visible", show);
    };

    const navObserver = new MutationObserver(syncRouteDrawer);
    navObserver.observe(bottomNav, { subtree: true, attributes: true, attributeFilter: ["class"] });
    navObserver.observe(routeDrawer, { attributes: true, attributeFilter: ["class", "hidden"] });
    document.addEventListener("click", event => {
      if (event.target.closest?.("[data-nav], .filter-chip, .search-shell, .quick-city-option")) {
        queueMicrotask(syncRouteDrawer);
      }
    });
    syncRouteDrawer();

    const edgeWidth = 40;
    const closeThreshold = 74;
    let tracking = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let latestDx = 0;
    let horizontal = false;
    let intentLocked = false;

    settings.style.touchAction = "pan-y";

    const resetDrawer = animate => {
      settingsDrawer.style.transition = animate ? "transform 0.18s ease" : "";
      settingsDrawer.style.transform = "translateX(0px)";
      if (animate) setTimeout(() => {
        settingsDrawer.style.transition = "";
        settingsDrawer.style.transform = "";
      }, 220);
    };

    const finishSwipe = close => {
      if (!tracking) return;
      tracking = false;
      pointerId = null;
      if (!close) {
        resetDrawer(true);
        return;
      }
      const width = settingsDrawer.getBoundingClientRect().width;
      settingsDrawer.style.transition = "transform 0.18s ease";
      settingsDrawer.style.transform = `translateX(${Math.max(latestDx, width)}px)`;
      setTimeout(() => closeSettingsButton.click(), 160);
    };

    settings.addEventListener("pointerdown", event => {
      if (!settings.classList.contains("open")) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const drawerLeft = settingsDrawer.getBoundingClientRect().left;
      if (event.clientX > Math.max(edgeWidth, drawerLeft + edgeWidth)) return;
      tracking = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      latestDx = 0;
      horizontal = false;
      intentLocked = false;
      settingsDrawer.style.transition = "none";
      try { settings.setPointerCapture?.(pointerId); } catch (_) {}
    });

    settings.addEventListener("pointermove", event => {
      if (!tracking || event.pointerId !== pointerId) return;
      const dx = Math.max(0, event.clientX - startX);
      const dy = event.clientY - startY;
      if (!intentLocked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        intentLocked = true;
        horizontal = dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.1;
      }
      if (!horizontal) {
        finishSwipe(false);
        return;
      }
      latestDx = dx;
      event.preventDefault();
      settingsDrawer.style.transform = `translateX(${dx}px)`;
    });

    settings.addEventListener("pointerup", event => {
      if (!tracking || event.pointerId !== pointerId) return;
      const width = settingsDrawer.getBoundingClientRect().width;
      const threshold = Math.min(Math.max(closeThreshold, width * 0.18), width * 0.4);
      finishSwipe(horizontal && latestDx >= threshold);
    });
    settings.addEventListener("pointercancel", () => finishSwipe(false));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installNavigationFixes, { once: true });
  } else {
    installNavigationFixes();
  }
})();
