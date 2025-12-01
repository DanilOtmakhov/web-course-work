var eventsManager = {
  bind: {},
  action: {},

  setup: function (canvas) {
    this.bind[37] = "moveLeft";
    this.bind[39] = "moveRight";
    this.bind[38] = "moveUp";
    this.bind[40] = "moveDown";
    this.bind[65] = "moveLeft";
    this.bind[68] = "moveRight";
    this.bind[87] = "moveUp";
    this.bind[83] = "moveDown";
    this.bind[32] = "jump";
    this.bind[80] = "pause";
    this.bind[13] = "start";
    this.bind[77] = "mute";

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
