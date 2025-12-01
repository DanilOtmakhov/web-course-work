var gameManager = {
  factory: {
    Player: Player,
    Zombie: Zombie,
    Cash: Cash,
    Adrenaline: Adrenaline
  },

  entities: [],
  laterKill: [],
  player: null,
  canvas: null,
  ctx: null,
  paused: false,
  started: false,
  awaitingName: true,
  entitiesParsed: false,
  _prevPause: false,
  _prevStart: false,
  _prevMute: false,
  score: 0,
  playerName: "",
  hudScoreEl: null,
  hudLevelEl: null,
  hudStateEl: null,
  pauseModal: null,
  gameOverModal: null,
  modalScoreEl: null,
  nameModal: null,
  nameForm: null,
  nameInput: null,
  nameErrorEl: null,
  currentLevel: 0,
  levels: ["maps/level1.json", "maps/level2.json"],

  loadAll: function (canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.hudScoreEl = document.querySelector("#hud-score strong");
    this.hudLevelEl = document.querySelector("#hud-level strong");
    this.hudStateEl = document.getElementById("hud-state");
    this.pauseModal = document.getElementById("modal-pause");
    this.gameOverModal = document.getElementById("modal-gameover");
    this.modalScoreEl = document.getElementById("modal-score");
    var recordsListEl = document.getElementById("records-list");
    this.nameModal = document.getElementById("modal-name");
    this.nameForm = document.getElementById("name-form");
    this.nameInput = document.getElementById("player-name");
    this.nameErrorEl = document.getElementById("name-error");

    var btnContinue = document.getElementById("btn-continue");
    var btnPlayAgain = document.getElementById("btn-play-again");
    var btnQuitPause = document.getElementById("btn-quit-pause");
    var btnQuitOver = document.getElementById("btn-quit-over");
    var self = this;
    if (btnContinue) {
      btnContinue.addEventListener("click", function () {
        self.resumeFromPause();
      });
    }
    if (btnPlayAgain) {
      btnPlayAgain.addEventListener("click", function () {
        self.restartGame();
      });
    }
    if (btnQuitPause) {
      btnQuitPause.addEventListener("click", function () {
        self.quitToNameEntry();
      });
    }
    if (btnQuitOver) {
      btnQuitOver.addEventListener("click", function () {
        self.quitToNameEntry();
      });
    }
    if (this.nameForm) {
      this.nameForm.addEventListener("submit", function (ev) {
        ev.preventDefault();
        self.handleNameSubmit();
      });
    }
    if (this.nameInput) {
      this.nameInput.addEventListener("input", function () {
        self.clearNameError();
      });
    }

    mapManager.loadMap(this.levels[this.currentLevel]);
    spriteManager.loadAtlas("assets/atlas/atlas_player.json", "assets/images/player.png");
    spriteManager.loadAtlas("assets/atlas/atlas_zombie.json", "assets/images/zombie.png");
    spriteManager.loadAtlas("assets/atlas/atlas_cash.json", "assets/images/cash.png");
    spriteManager.loadAtlas("assets/atlas/atlas_adrenaline.json", "assets/images/adrenaline.png");
    soundManager.init();
    soundManager.loadArray(
      [
        "assets/sounds/background.mp3",
        "assets/sounds/kill.mp3",
        "assets/sounds/jump.mp3",
        "assets/sounds/win.mp3",
        "assets/sounds/game_over.mp3",
        "assets/sounds/cash.mp3",
        "assets/sounds/adrenaline.mp3"
      ],
      function () {}
    );

    leaderboardManager.init({
      listEl: recordsListEl,
      storageKey: "parkRunnerRecords"
    });
    eventsManager.setup(canvas);
    this.showNameModal();
  },

  initPlayer: function (obj) {
    this.player = obj;
  },

  kill: function (obj) {
    this.laterKill.push(obj);
    if (obj.type === "Player") {
      soundManager.stopAll();
      soundManager.play("assets/sounds/kill.mp3");
      soundManager.play("assets/sounds/game_over.mp3");
      this.showGameOver();
    }
  },

  startGame: function () {
    if (!this.playerName) {
      return;
    }
    this.awaitingName = false;
    this.resetRunState();
  },

  resetRunState: function () {
    soundManager.stopAll();
    this.score = 0;
    this.currentLevel = 0;
    this.entities = [];
    this.laterKill = [];
    this.entitiesParsed = false;
    this.player = null;
    this.started = true;
    this.paused = false;
    this._prevPause = false;
    this._prevStart = false;
    mapManager.loadMap(this.levels[this.currentLevel]);
    this.playBackground();
    this.updateHud();
    this.hideModals();
  },

  resetToMenuState: function () {
    soundManager.stopAll();
    this.score = 0;
    this.currentLevel = 0;
    this.entities = [];
    this.laterKill = [];
    this.entitiesParsed = false;
    this.player = null;
    this.started = false;
    this.paused = false;
    this._prevPause = false;
    this._prevStart = false;
    mapManager.loadMap(this.levels[this.currentLevel]);
    this.updateHud();
  },

  showNameModal: function () {
    this.awaitingName = true;
    this.resetToMenuState();
    this.hideModals();
    this.clearNameError();
    if (this.nameModal) {
      this.nameModal.style.display = "flex";
    }
    if (this.nameInput) {
      this.nameInput.value = this.playerName || "";
      this.nameInput.focus();
      this.nameInput.select();
    }
  },

  hideNameModal: function () {
    if (this.nameModal) {
      this.nameModal.style.display = "none";
    }
  },

  playBackground: function () {
    soundManager.play("assets/sounds/background.mp3", {
      volume: 0.5,
      looping: true
    });
  },

  handleNameSubmit: function () {
    if (!this.nameInput) {
      return;
    }
    var name = (this.nameInput.value || "").trim();
    if (!name) {
      this.showNameError("Enter your username");
      this.shakeNameInput();
      return;
    }
    if (name.length > 10) {
      this.showNameError("Max 10 symbols");
      this.shakeNameInput();
      return;
    }
    this.playerName = name;
    this.hideNameModal();
    this.clearNameError();
    eventsManager.action.start = false;
    this._prevStart = false;
    this.startGame();
  },

  showNameError: function (msg) {
    if (this.nameErrorEl) {
      this.nameErrorEl.textContent = msg || "";
    }
  },

  clearNameError: function () {
    if (this.nameErrorEl) {
      this.nameErrorEl.textContent = "";
    }
  },

  shakeNameInput: function () {
    if (!this.nameInput) {
      return;
    }
    this.nameInput.classList.remove("shake");
    void this.nameInput.offsetWidth;
    this.nameInput.classList.add("shake");
  },

  quitToNameEntry: function () {
    this.showNameModal();
  },

  nextLevel: function () {
    this.currentLevel++;
    if (this.currentLevel < this.levels.length) {
      this.entities = [];
      this.laterKill = [];
      this.entitiesParsed = false;
      this.player = null;
      mapManager.loadMap(this.levels[this.currentLevel]);
      this.playBackground();
      this.updateHud();
    } else {
      this.showGameOver(true);
    }
  },

  update: function () {
    var startPressed = !!eventsManager.action.start;
    var mutePressed = !!eventsManager.action.mute;
    if (mutePressed && !this._prevMute) {
      soundManager.toggleMute();
    }
    this._prevMute = mutePressed;

    if (!this.started) {
      if (!this.awaitingName && this.playerName && startPressed && !this._prevStart) {
        this.startGame();
      }
      this._prevStart = startPressed;
      this._prevPause = !!eventsManager.action.pause;
      if (this.paused && mapManager.mapData && mapManager.jsonLoaded) {
        mapManager.draw(this.ctx);
        this.draw(this.ctx);
      }
      return;
    }

    var pausePressed = !!eventsManager.action.pause;
    if (pausePressed && !this._prevPause) {
      this.togglePause();
    }
    this._prevPause = pausePressed;

    this._prevStart = startPressed;

    if (this.paused) {
      if (mapManager.mapData && mapManager.jsonLoaded) {
        mapManager.draw(this.ctx);
        this.draw(this.ctx);
      }
      return;
    }

    if (!this.entitiesParsed && mapManager.mapData && mapManager.jsonLoaded) {
      this.entitiesParsed = true;
      mapManager.parseEntities();
    }

    for (var i = 0; i < this.entities.length; i++) {
      var ent = this.entities[i];
      if (ent.type === "Player" || ent.type === "Zombie") {
        if (typeof ent.update === "function") {
          ent.update();
        }
      } else {
        physicManager.update(ent);
        if (typeof ent.update === "function") {
          ent.update();
        }
      }

      if (ent.type === "Cash" && this.player && this.checkIntersect(this.player, ent)) {
        if (typeof ent.onTouchEntity === "function") {
          ent.onTouchEntity(this.player);
        }
        this.score += 1;
        this.updateHud();
        this.kill(ent);
      }

      if (ent.type === "Adrenaline" && this.player && this.checkIntersect(this.player, ent)) {
        if (typeof ent.onTouchEntity === "function") {
          ent.onTouchEntity(this.player);
        }
        if (typeof this.player.applySpeedBoost === "function") {
          this.player.applySpeedBoost();
        }
        this.kill(ent);
      }
    }

    if (this.laterKill.length > 0) {
      for (var k = 0; k < this.laterKill.length; k++) {
        var idx = this.entities.indexOf(this.laterKill[k]);
        if (idx !== -1) {
          this.entities.splice(idx, 1);
        }
      }
      this.laterKill.length = 0;
    }

    if (this.player) {
      if (
        this.currentLevel === 0 &&
        this.player.pos_x >= mapManager.mapSize.x - this.player.size_x
      ) {
        soundManager.stopAll();
        this.nextLevel();
        return;
      }
      if (
        this.currentLevel === this.levels.length - 1 &&
        this.player.pos_x >= mapManager.mapSize.x - this.player.size_x
      ) {
        soundManager.stopAll();
        soundManager.play("assets/sounds/win.mp3");
        this.showGameOver(true);
        return;
      }

      mapManager.centerAt(this.player.pos_x, this.player.pos_y);
    }

    mapManager.draw(this.ctx);
    this.draw(this.ctx);
  },

  draw: function (ctx) {
    for (var i = 0; i < this.entities.length; i++) {
      this.entities[i].draw(ctx);
    }
  },

  checkIntersect: function (a, b) {
    return (
      a.pos_x < b.pos_x + b.size_x &&
      a.pos_x + a.size_x > b.pos_x &&
      a.pos_y < b.pos_y + b.size_y &&
      a.pos_y + a.size_y > b.pos_y
    );
  },

  updateHud: function () {
    if (this.hudScoreEl) {
      this.hudScoreEl.textContent = this.score;
    }
    if (this.hudLevelEl) {
      this.hudLevelEl.textContent = this.currentLevel + 1;
    }
    if (this.hudStateEl) {
      this.hudStateEl.textContent = this.awaitingName
        ? "Player"
        : this.playerName;
    }
  },

  togglePause: function () {
    if (!this.started) {
      return;
    }
    this.paused = !this.paused;
    if (this.paused) {
      soundManager.stopAll();
      this.showPause();
    } else {
      this.playBackground();
      this.hideModals();
    }
  },

  showPause: function () {
    if (this.pauseModal) {
      this.pauseModal.style.display = "flex";
    }
  },

  showGameOver: function (win) {
    this.started = false;
    this.paused = true;
    this.awaitingName = false;
    var titleEl = this.gameOverModal ? this.gameOverModal.querySelector("h2") : null;
    if (titleEl) {
      titleEl.textContent = win ? "You Win" : "Game Over";
    }
    if (this.modalScoreEl) {
      this.modalScoreEl.textContent = this.score;
    }
    if (win && this.currentLevel >= this.levels.length - 1) {
      leaderboardManager.addRecord(this.playerName || "Player", this.score);
    } else {
      leaderboardManager.renderRecords();
    }
    this.updateHud();
    if (this.gameOverModal) {
      this.gameOverModal.style.display = "flex";
    }
  },

  hideModals: function () {
    if (this.pauseModal) {
      this.pauseModal.style.display = "none";
    }
    if (this.gameOverModal) {
      this.gameOverModal.style.display = "none";
    }
  },

  startLoop: function () {
    if (!this._boundGameLoop) {
      this._boundGameLoop = this.gameLoop.bind(this);
    }
    requestAnimationFrame(this._boundGameLoop);
  },

  gameLoop: function () {
    if (!this.ctx || !this.canvas) {
      return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.update();
    requestAnimationFrame(this._boundGameLoop);
  },

  resumeFromPause: function () {
    this.paused = false;
    this.playBackground();
    this.hideModals();
  },

  restartGame: function () {
    if (!this.playerName) {
      this.showNameModal();
      return;
    }
    this.awaitingName = false;
    this.resetRunState();
  }
};
