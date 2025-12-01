var Entity = {
  pos_x: 0,
  pos_y: 0,
  size_x: 0,
  size_y: 0,

  move_x: 0,
  move_y: 0,
  speed: 0,
  dy: 0,
  onGround: false,
  onLadder: false,
  type: "Entity",

  extend: function (proto) {
    var object = Object.create(this);
    for (var key in proto) {
      if (proto.hasOwnProperty(key)) {
        object[key] = proto[key];
      }
    }
    return object;
  },

  draw: function (ctx) {},
  update: function () {},

  kill: function () {
    gameManager.kill(this);
  },

  onTouchMap: function () {},
  onTouchEntity: function (ent) {},
};

var Player = Entity.extend({
  type: "Player",
  frameIndex: 0,
  frameTimer: 0,
  frameInterval: 150,
  dirLeft: false,
  justJumped: false,
  animations: {
    idle: ["player_idle_0", "player_idle_1", "player_idle_2", "player_idle_3"],
    walk: [
      "player_walk_0",
      "player_walk_1",
      "player_walk_2",
      "player_walk_3",
      "player_walk_4",
      "player_walk_5",
    ],
  },
  speed: 2.5,
  baseSpeed: 2.5,
  boostedSpeed: 3.5,
  speedBoostDuration: 10000,
  _speedBoostTimer: null,

  update: function () {
    this.move_x = 0;
    this.move_y = 0;

    if (eventsManager.action.moveLeft) {
      this.move_x = -1;
    } else if (eventsManager.action.moveRight) {
      this.move_x = 1;
    }

    if (eventsManager.action.moveUp) {
      this.move_y = -1;
    } else if (eventsManager.action.moveDown) {
      this.move_y = 1;
    }

    var ladderTile = mapManager.getTileAtLayer(
      3,
      this.pos_x + this.size_x / 2,
      this.pos_y + this.size_y / 2
    );
    var ladderBelow = mapManager.getTileAtLayer(
      3,
      this.pos_x + this.size_x / 2,
      this.pos_y + this.size_y + 1
    );

    this.onLadder = ladderTile !== 0;
    if (!this.onLadder && eventsManager.action.moveDown && ladderBelow !== 0) {
      this.onLadder = true;
    }

    if (!this.onLadder) {
      this.dy = (this.dy || 0) + physicManager.gravity;
    } else {
      this.dy = 0;
    }

    if (eventsManager.action.jump && this.onGround && !this.onLadder) {
      this.dy = -physicManager.jumpForce;
      this.onGround = false;
      this.justJumped = true;
    }

    physicManager.applyHorizontal(this);
    physicManager.applyVertical(this);

    if (this.pos_y > mapManager.mapSize.y) {
      this.kill();
      return;
    }

    var enemy = physicManager.entityAtXY(this);
    if (enemy && enemy.type === "Zombie") {
      this.kill();
    }

    if (this.justJumped) {
      soundManager.play("assets/sounds/jump.mp3");
      this.justJumped = false;
    }
  },

  applySpeedBoost: function () {
    this.speed = this.boostedSpeed;
    if (this._speedBoostTimer) {
      clearTimeout(this._speedBoostTimer);
    }
    var self = this;
    this._speedBoostTimer = setTimeout(function () {
      self.speed = self.baseSpeed;
      self._speedBoostTimer = null;
    }, this.speedBoostDuration);
  },

  draw: function (ctx) {
    var now = Date.now();
    if (!this._lastFrameTime) {
      this._lastFrameTime = now;
    }

    var anim = this.move_x === 0 ? "idle" : "walk";
    var flip = this.move_x < 0;
    var frames = this.animations[anim];

    if (now - this._lastFrameTime > this.frameInterval) {
      this.frameIndex = (this.frameIndex + 1) % frames.length;
      this._lastFrameTime = now;
    }

    spriteManager.drawSprite(
      ctx,
      frames[this.frameIndex],
      this.pos_x,
      this.pos_y,
      flip
    );
  },
});

var Zombie = Entity.extend({
  type: "Zombie",
  frameIndex: 0,
  frameTimer: 0,
  frameInterval: 150,
  move_x: -1,
  speed: 1.2,
  animations: {
    walk: [
      "zombie_walk_0",
      "zombie_walk_1",
      "zombie_walk_2",
      "zombie_walk_3",
      "zombie_walk_4",
      "zombie_walk_5",
    ],
  },

  update: function () {
    var ladderTile = mapManager.getTileAtLayer(
      3,
      this.pos_x + this.size_x / 2,
      this.pos_y + this.size_y / 2
    );
    var ladderBelow = mapManager.getTileAtLayer(
      3,
      this.pos_x + this.size_x / 2,
      this.pos_y + this.size_y + 1
    );

    this.onLadder = ladderTile !== 0;
    if (!this.onLadder && ladderBelow !== 0) {
      this.onLadder = true;
    }

    if (!this.onLadder) {
      this.dy = (this.dy || 0) + physicManager.gravity;
    } else {
      this.dy = 0;
    }

    physicManager.applyHorizontal(this);
    physicManager.applyVertical(this);

    if (this.pos_y > mapManager.mapSize.y) {
      this.kill();
      return;
    }

    physicManager.updateZombie(this);
  },

  draw: function (ctx) {
    var now = Date.now();
    if (!this._lastFrameTime) {
      this._lastFrameTime = now;
    }

    var frames = this.animations.walk;
    if (now - this._lastFrameTime > this.frameInterval) {
      this.frameIndex = (this.frameIndex + 1) % frames.length;
      this._lastFrameTime = now;
    }

    var flip = this.move_x < 0;
    spriteManager.drawSprite(
      ctx,
      frames[this.frameIndex],
      this.pos_x,
      this.pos_y,
      flip
    );
  },
});

var Cash = Entity.extend({
  type: "Cash",
  frameIndex: 0,
  frameInterval: 150,
  animations: ["cash_0", "cash_1", "cash_2", "cash_3", "cash_4", "cash_5"],

  draw: function (ctx) {
    var now = Date.now();
    if (!this._lastFrameTime) {
      this._lastFrameTime = now;
    }
    if (now - this._lastFrameTime > this.frameInterval) {
      this.frameIndex = (this.frameIndex + 1) % this.animations.length;
      this._lastFrameTime = now;
    }
    var frameName = this.animations[this.frameIndex];
    spriteManager.drawSprite(ctx, frameName, this.pos_x, this.pos_y);
  },

  onTouchEntity: function () {
    soundManager.playWorldSound(
      "assets/sounds/cash.mp3",
      this.pos_x,
      this.pos_y
    );
  },
});

var Adrenaline = Entity.extend({
  type: "Adrenaline",
  draw: function (ctx) {
    spriteManager.drawSprite(ctx, "adrenaline", this.pos_x, this.pos_y);
  },

  onTouchEntity: function () {
    soundManager.playWorldSound(
      "assets/sounds/adrenaline.mp3",
      this.pos_x,
      this.pos_y
    );
  },
});
