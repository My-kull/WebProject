// Input manager for keyboard/mouse state with edge-triggered presses.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, down: false, pressed: false };
    this._rect = canvas.getBoundingClientRect();
    this._scaleX = canvas.width / this._rect.width || 1;
    this._scaleY = canvas.height / this._rect.height || 1;

    this._handlers = {
      keydown: (e) => {
        if (!this.down.has(e.code)) this.pressed.add(e.code);
        this.down.add(e.code);
      },
      keyup: (e) => {
        this.down.delete(e.code);
      },
      mousemove: (e) => {
        this.mouse.x = (e.clientX - this._rect.left) * this._scaleX;
        this.mouse.y = (e.clientY - this._rect.top) * this._scaleY;
      },
      mousedown: () => {
        if (!this.mouse.down) this.mouse.pressed = true;
        this.mouse.down = true;
      },
      mouseup: () => {
        this.mouse.down = false;
      },
      resize: () => {
        this.updateCanvasMetrics();
      },
    };

    window.addEventListener("keydown", this._handlers.keydown);
    window.addEventListener("keyup", this._handlers.keyup);
    canvas.addEventListener("mousemove", this._handlers.mousemove);
    canvas.addEventListener("mousedown", this._handlers.mousedown);
    canvas.addEventListener("mouseenter", this._handlers.resize);
    window.addEventListener("resize", this._handlers.resize);
    window.addEventListener("scroll", this._handlers.resize, true);
    window.addEventListener("mouseup", this._handlers.mouseup);
  }

  isDown(code) { return this.down.has(code); }
  wasPressed(code) { return this.pressed.has(code); }

  updateCanvasMetrics() {
    this._rect = this.canvas.getBoundingClientRect();
    this._scaleX = this.canvas.width / this._rect.width || 1;
    this._scaleY = this.canvas.height / this._rect.height || 1;
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.pressed = false;
  }

  destroy() {
    window.removeEventListener("keydown", this._handlers.keydown);
    window.removeEventListener("keyup", this._handlers.keyup);
    window.removeEventListener("resize", this._handlers.resize);
    window.removeEventListener("scroll", this._handlers.resize, true);
    window.removeEventListener("mouseup", this._handlers.mouseup);
    this.canvas?.removeEventListener?.("mousemove", this._handlers.mousemove);
    this.canvas?.removeEventListener?.("mousedown", this._handlers.mousedown);
    this.canvas?.removeEventListener?.("mouseenter", this._handlers.resize);
  }
}
