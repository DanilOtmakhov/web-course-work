// Chapter 7: sound manager (loading, playback, distance attenuation, music)
var soundManager = {
  clips: {},
  context: null,
  gainNode: null,
  loaded: false,
  muted: false,
  masterVolume: 1,

  init: function () {
    if (this.loaded) {
      return;
    }
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioCtx();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.loaded = true;
    } catch (ex) {
      console.log("AudioContext not supported:", ex);
      this.loaded = false;
    }
  },

  load: function (path, callback) {
    if (!this.context) {
      this.init();
    }
    if (!this.context) {
      return;
    }

    var clip = this.clips[path];
    if (clip) {
      if (clip.loaded && callback) {
        callback(clip.buffer);
      }
      return;
    }

    clip = { path: path, buffer: null, loaded: false, playing: [] };
    this.clips[path] = clip;

    var request = new XMLHttpRequest();
    request.open("GET", path, true);
    request.responseType = "arraybuffer";
    var self = this;

    request.onload = function () {
      self.context.decodeAudioData(
        request.response,
        function (buffer) {
          clip.buffer = buffer;
          clip.loaded = true;
          if (callback) {
            callback(buffer);
          }
        },
        function (err) {
          console.log("Error decoding audio", path, err);
        }
      );
    };

    request.onerror = function () {
      console.log("Error loading audio", path);
    };

    request.send();
  },

  loadArray: function (array, callback) {
    var remaining = array.length;
    if (remaining === 0) {
      if (callback) {
        callback();
      }
      return;
    }
    var self = this;
    var onload = function () {
      remaining--;
      if (remaining === 0 && callback) {
        callback();
      }
    };
    for (var i = 0; i < array.length; i++) {
      this.load(array[i], onload);
    }
  },

  play: function (path, settings) {
    settings = settings || {};
    if (!this.context) {
      this.init();
    }
    if (!this.context) {
      return false;
    }
    var self = this;
    var clip = this.clips[path];
    if (!clip) {
      this.load(path, function () {
        self.play(path, settings);
      });
      return false;
    }
    if (!clip.loaded) {
      this.load(path, function () {
        self.play(path, settings);
      });
      return false;
    }

    var source = this.context.createBufferSource();
    source.buffer = clip.buffer;
    source.loop = !!settings.looping;

    var gain = this.context.createGain();
    var volume =
      typeof settings.volume === "number" ? settings.volume : 1;
    gain.gain.value = this.muted ? 0 : volume * this.masterVolume;

    source.connect(gain);
    gain.connect(this.gainNode);

    if (this.context.state === "suspended") {
      this.context.resume();
    }

    source.start(0);
    clip.playing.push(source);

    source.onended = function () {
      var idx = clip.playing.indexOf(source);
      if (idx !== -1) {
        clip.playing.splice(idx, 1);
      }
    };

    return true;
  },

  playWorldSound: function (path, x, y) {
    var player = gameManager && gameManager.player ? gameManager.player : null;
    var volume = 1;
    if (player) {
      var px = player.pos_x + player.size_x / 2;
      var py = player.pos_y + player.size_y / 2;
      var dx = px - x;
      var dy = py - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var maxDist = 600; // radius for attenuation
      volume = Math.max(0, 1 - dist / maxDist);
    }
    this.play(path, { volume: volume });
  },

  toggleMute: function () {
    this.muted = !this.muted;
    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : this.masterVolume;
    }
  },

  stopAll: function () {
    for (var path in this.clips) {
      if (!this.clips.hasOwnProperty(path)) {
        continue;
      }
      var clip = this.clips[path];
      if (!clip.playing) {
        continue;
      }
      for (var i = 0; i < clip.playing.length; i++) {
        try {
          clip.playing[i].stop();
        } catch (ex) {
          // ignore stop errors
        }
      }
      clip.playing = [];
    }
  }
};
