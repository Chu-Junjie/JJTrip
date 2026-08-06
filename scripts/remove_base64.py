from __future__ import annotations

import re
from pathlib import Path

APP_PATH = Path("assets/app.js")
INDEX_PATH = Path("index.html")
WORKFLOW_PATH = Path(".github/workflows/remove-jjtrip-base64.yml")
SCRIPT_PATH = Path("scripts/remove_base64.py")
RELEASE = "20260806-no-base64-1"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise SystemExit(f"Unexpected occurrence count for {label}: {text.count(old)}")
    return text.replace(old, new, 1)


def update_app() -> None:
    app = APP_PATH.read_text(encoding="utf-8")

    app = app.replace("  const MAX_PLACE_IMAGE_CHARACTERS = 3200000;\n", "")
    app = app.replace("  const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;\n", "")

    if "function isBase64ImageSource" not in app:
        marker = "  function normalisePlace(cityId, input, placeIndex) {\n"
        helper = (
            "  function isBase64ImageSource(value) {\n"
            "    return /^data:image\\//i.test(String(value || \\\"\\\").trim());\n"
            "  }\n\n"
        )
        app = replace_once(app, marker, helper + marker, "normalisePlace marker")

    old_images = '''    const legacyImage = String(place.image || "").trim();
    const seedPlace = SEED?.cities?.[cityId]?.places?.find(item => String(item?.id) === place.id);
    const seedImages = Array.isArray(seedPlace?.images) ? seedPlace.images : [];
    place.images = Array.isArray(place.images)
      ? Array.from(new Set(place.images.map(image => String(image || "").trim()).filter(Boolean)))
      : legacyImage ? [legacyImage] : [];
'''
    new_images = '''    const legacyImage = String(place.image || "").trim();
    const safeLegacyImage = isBase64ImageSource(legacyImage) ? "" : legacyImage;
    const seedPlace = SEED?.cities?.[cityId]?.places?.find(item => String(item?.id) === place.id);
    const seedImages = Array.isArray(seedPlace?.images) ? seedPlace.images : [];
    place.images = Array.isArray(place.images)
      ? Array.from(new Set(place.images
          .map(image => String(image || "").trim())
          .filter(image => image && !isBase64ImageSource(image))))
      : safeLegacyImage ? [safeLegacyImage] : [];
'''
    if old_images in app:
        app = app.replace(old_images, new_images, 1)
    elif "safeLegacyImage" not in app:
        raise SystemExit("Could not locate place image normalization")

    old_replacer = '''  function databaseReplacer(key, value) {
    if (key === "image" && typeof value === "string" && value.startsWith("data:image/") && Array.isArray(this.images) && this.images[0] === value) {
      return undefined;
    }
    return value;
  }
'''
    new_replacer = '''  function databaseReplacer(key, value) {
    if (typeof value === "string" && isBase64ImageSource(value)) return undefined;
    return value;
  }
'''
    if old_replacer in app:
        app = app.replace(old_replacer, new_replacer, 1)
    elif "isBase64ImageSource(value)) return undefined" not in app:
        raise SystemExit("Could not locate database replacer")

    app = app.replace(
        '${image.startsWith("data:image/") ? "本地上传照片" : escapeHtml(image)}',
        '${escapeHtml(image)}',
    )

    upload_ui = re.compile(
        r'\n        <div class="field"><label for="imageUpload">.*?<input id="imageUpload".*?</div>',
        re.DOTALL,
    )
    app, count = upload_ui.subn(
        '\n        <p class="field-help">为避免大型 Base64 图片拖慢加载，已停用本地照片上传；请使用图片网址或自动实景图。</p>',
        app,
        count=1,
    )
    if count == 0 and '已停用本地照片上传' not in app:
        raise SystemExit("Could not remove local upload UI")

    app = app.replace("可上传本地照片或添加图片网址", "可添加图片网址或匹配自动实景图")
    app = app.replace(
        'showToast("图片网址无效，请使用 http、https、data:image 或相对路径");',
        'showToast("图片网址无效，请使用 http、https 或相对路径");',
    )

    old_supported = '''  function isSupportedImageSource(source) {
    if (/^data:image\\//i.test(source)) return true;
    try {
      const url = new URL(source, location.href);
      return ["http:", "https:", "file:"].includes(url.protocol);
    } catch (_) {
      return false;
    }
  }
'''
    new_supported = '''  function isSupportedImageSource(source) {
    if (isBase64ImageSource(source)) return false;
    try {
      const url = new URL(source, location.href);
      return ["http:", "https:", "file:"].includes(url.protocol);
    } catch (_) {
      return false;
    }
  }
'''
    if old_supported in app:
        app = app.replace(old_supported, new_supported, 1)
    elif "if (isBase64ImageSource(source)) return false;" not in app:
        raise SystemExit("Could not update image source validation")

    normalised_line = '    const normalisedImages = Array.from(new Set(nextImages.map(image => String(image || "").trim()).filter(Boolean)));\n'
    if normalised_line in app:
        app = app.replace(
            normalised_line,
            '''    if (nextImages.some(isBase64ImageSource)) {
      showToast("不再支持 Base64 图片，请改用图片网址");
      return false;
    }
    const normalisedImages = Array.from(new Set(nextImages.map(image => String(image || "").trim()).filter(Boolean)));
''',
            1,
        )

    app = re.sub(
        r'\n    if \(normalisedImages\.reduce\(\(total, image\) => total \+ image\.length, 0\) > MAX_PLACE_IMAGE_CHARACTERS\) \{.*?\n    \}',
        "",
        app,
        count=1,
        flags=re.DOTALL,
    )

    upload_handler = re.compile(
        r'\n    dom\.detailPanel\.querySelector\("#imageUpload"\)\.addEventListener\("change", async event => \{.*?\n    \}\);(?=\n    dom\.detailPanel\.querySelector\("#deletePlaceBtn"\))',
        re.DOTALL,
    )
    app = upload_handler.sub("", app, count=1)

    compress_function = re.compile(
        r'\n  function compressImage\(file\) \{.*?\n  \}(?=\n\n  function deletePlace)',
        re.DOTALL,
    )
    app = compress_function.sub("", app, count=1)

    APP_PATH.write_text(app, encoding="utf-8")


def update_index() -> None:
    html = INDEX_PATH.read_text(encoding="utf-8")

    cleanup_script = f'''  <script>
  (() => {{
    const dataKey = "jjtrip_mvp_v3";
    const recoveryKey = "jjtrip_mvp_v3_recovery";
    const migrationKey = "jjtrip_remove_base64_v1";
    const cityIds = ["hongkong", "singapore", "shenzhen", "macau", "kualalumpur"];
    const clean = value => {{
      if (typeof value === "string" && /^data:image\\//i.test(value.trim())) return undefined;
      if (Array.isArray(value)) return value.map(clean).filter(item => item !== undefined);
      if (value && typeof value === "object") {{
        const result = {{}};
        for (const [key, item] of Object.entries(value)) {{
          const cleaned = clean(item);
          if (cleaned !== undefined) result[key] = cleaned;
        }}
        return result;
      }}
      return value;
    }};
    try {{
      if (localStorage.getItem(migrationKey) !== "1") {{
        for (const key of [dataKey, recoveryKey]) {{
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {{
            const data = clean(JSON.parse(raw));
            for (const cityId of cityIds) {{
              const city = data?.cities?.[cityId];
              if (!city) continue;
              city.places = Array.isArray(city.places) ? city.places.slice(0, 18) : [];
            }}
            localStorage.setItem(key, JSON.stringify(data));
          }} catch (_) {{
            localStorage.removeItem(key);
          }}
        }}
        localStorage.setItem(migrationKey, "1");
      }}
    }} catch (_) {{}}
  }})();
  </script>
  <script src="./assets/app.js?v={RELEASE}"></script>'''

    existing_migration = re.compile(
        r'  <script>\n  \(\(\) => \{\n    const dataKey = "jjtrip_mvp_v3";.*?</script>\n\s*<script src="\./assets/app\.js\?v=[^"]+"></script>',
        re.DOTALL,
    )
    html, count = existing_migration.subn(cleanup_script, html, count=1)
    if count != 1:
        raise SystemExit("Could not replace existing storage migration")

    html = re.sub(r'20260806-(?:places-18|no-base64-1)', RELEASE, html)
    INDEX_PATH.write_text(html, encoding="utf-8")


def cleanup_repository() -> None:
    for path in (
        Path("assets/app.js.bak"),
        Path("assets/app.js.pre7"),
        WORKFLOW_PATH,
        SCRIPT_PATH,
    ):
        if path.exists():
            path.unlink()


if __name__ == "__main__":
    update_app()
    update_index()
    cleanup_repository()
