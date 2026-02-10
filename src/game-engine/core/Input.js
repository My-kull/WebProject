// Minimal input manager: tracks keyboard and mouse state per frame.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, down: false, pressed: false };

    this._handlers = {
      keydown: (e) => {
        if (!this.down.has(e.code)) this.pressed.add(e.code);
        this.down.add(e.code);
      },
      keyup: (e) => {
        this.down.delete(e.code);
      },
      mousemove: (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
        this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
      },
      mousedown: () => {
        if (!this.mouse.down) this.mouse.pressed = true;
        this.mouse.down = true;
      },
      mouseup: () => {
        this.mouse.down = false;
      },
    };

    // Keyboard state
    window.addEventListener("keydown", this._handlers.keydown);
    window.addEventListener("keyup", this._handlers.keyup);

    // Mouse position mapped to canvas pixels
    canvas.addEventListener("mousemove", this._handlers.mousemove);

    // Mouse buttons (pressed = edge-triggered, down = held)
    canvas.addEventListener("mousedown", this._handlers.mousedown);
    window.addEventListener("mouseup", this._handlers.mouseup);
  }

  // Held key
  isDown(code) { return this.down.has(code); }
  // Pressed this frame
  wasPressed(code) { return this.pressed.has(code); }

  // Clear edge-triggered inputs at end of frame
  endFrame() {
    this.pressed.clear();
    this.mouse.pressed = false;
  }

  destroy() {
    window.removeEventListener("keydown", this._handlers.keydown);
    window.removeEventListener("keyup", this._handlers.keyup);
    window.removeEventListener("mouseup", this._handlers.mouseup);
    this.canvas?.removeEventListener?.("mousemove", this._handlers.mousemove);
    this.canvas?.removeEventListener?.("mousedown", this._handlers.mousedown);
  }
}
