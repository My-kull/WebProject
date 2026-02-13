// Asset cache for images and sprite sheets.
export class Assets {
  constructor() {
    this.images = new Map();
    this.sheets = new Map();
    this.sheetSections = new Map();
  }

  loadImage(key, url) {
    if (this.images.has(key)) return Promise.resolve(this.images.get(key));

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  getImage(key) {
    return this.images.get(key) || null;
  }

  async loadSpriteSheet(key, url, frameW, frameH, options = {}) {
    if (this.sheets.has(key)) return this.sheets.get(key);

    const margin = options.margin ?? 0;
    const spacing = options.spacing ?? 0;
    const img = await this.loadImage(key, url);

    const usableW = img.width - margin * 2;
    const usableH = img.height - margin * 2;

    const cols = Math.floor((usableW + spacing) / (frameW + spacing));
    const rows = Math.floor((usableH + spacing) / (frameH + spacing));

    const frames = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const sx = margin + x * (frameW + spacing);
        const sy = margin + y * (frameH + spacing);
        frames.push({ x: sx, y: sy, w: frameW, h: frameH });
      }
    }

    const sheet = { image: img, frames, frameW, frameH, cols, rows };
    this.sheets.set(key, sheet);
    return sheet;
  }

  getSpriteSheet(key) {
    return this.sheets.get(key) || null;
  }

  getFrameRect(key, frameIndex = 0) {
    const sheet = this.sheets.get(key);
    if (!sheet) return null;
    const frame = sheet.frames[frameIndex];
    if (!frame) return null;
    return {
      img: sheet.image,
      sx: frame.x,
      sy: frame.y,
      sw: frame.w,
      sh: frame.h,
    };
  }

  async loadSpriteSheetSection(section, key, url, frameW, frameH, options = {}) {
    const sectionMap = this.sheetSections.get(section) || new Map();
    this.sheetSections.set(section, sectionMap);

    const fullKey = `${section}:${key}`;
    sectionMap.set(key, fullKey);
    return this.loadSpriteSheet(fullKey, url, frameW, frameH, options);
  }

  getSpriteSheetSection(section, key) {
    const sectionMap = this.sheetSections.get(section);
    if (!sectionMap) return null;
    const fullKey = sectionMap.get(key);
    if (!fullKey) return null;
    return this.getSpriteSheet(fullKey);
  }

  getFrameRectSection(section, key, frameIndex = 0) {
    const sectionMap = this.sheetSections.get(section);
    if (!sectionMap) return null;
    const fullKey = sectionMap.get(key);
    if (!fullKey) return null;
    return this.getFrameRect(fullKey, frameIndex);
  }
}
