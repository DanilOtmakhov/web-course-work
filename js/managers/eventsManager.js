// Chapter 4: user interaction manager (keyboard handling)
var eventsManager = {
  bind: {},
  action: {},

  setup: function (canvas) {
    this.bind[37] = "moveLeft";
    this.bind[39] = "moveRight";
    this.bind[38] = "moveUp";
    this.bind[40] = "moveDown";  // ArrowDown
    this.bind[65] = "moveLeft";  // A
    this.bind[68] = "moveRight"; // D
    this.bind[87] = "moveUp";    // W
    this.bind[83] = "moveDown";  // S
    this.bind[32] = "jump";      // Space
    this.bind[80] = "pause";     // P
    this.bind[13] = "start";     // Enter
    this.bind[77] = "mute";      // M

    var self = this;
    document.body.addEventListener("keydown", function (ev) {
      self.onKeyDown(ev);
    });
    document.body.addEventListener("keyup", function (ev) {
      self.onKeyUp(ev);
    });
  },

  onKeyDown: function (ev) {
    var action = this.bind[ev.keyCode];
    if (action) {
      this.action[action] = true;
    }
  },

  onKeyUp: function (ev) {
    var action = this.bind[ev.keyCode];
    if (action) {
      this.action[action] = false;
    }
  }
};
