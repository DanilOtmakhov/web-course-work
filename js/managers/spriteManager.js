var spriteManager = {
  image: new Image(),
  sprites: [],
  imgLoaded: false,
  jsonLoaded: false,

  _atlasTotal: 0,
  _loadedImages: 0,
  _loadedJson: 0,

  loadAtlas: function (atlasJsonPath, atlasImagePath) {
    this._atlasTotal++;

    var self = this;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.status === 200) {
        self.parseAtlas(request.responseText, atlasImagePath);
      }
    };
    request.open("GET", atlasJsonPath, true);
    request.send();
  },

  loadImg: function (imgPath, targetImage) {
    var self = this;
    var img = targetImage || this.image;
    img.onload = function () {
      self._loadedImages++;
      if (self._loadedImages === self._atlasTotal) {
        self.imgLoaded = true;
      }
    };
    img.src = imgPath;
  },

  parseAtlas: function (atlasJSON, atlasImagePath) {
    var atlas = JSON.parse(atlasJSON);
    var img = new Image();
    this.image = img;

    for (var i = 0; i < atlas.frames.length; i++) {
      var f = atlas.frames[i];
      this.sprites.push({
        name: f.name,
        x: f.x,
        y: f.y,
        w: f.w,
        h: f.h,
        img: img
      });
    }

    this._loadedJson++;
    if (this._loadedJson === this._atlasTotal) {
      this.jsonLoaded = true;
    }

    this.loadImg(atlasImagePath, img);
  },

  getSprite: function (name) {
    for (var i = 0; i < this.sprites.length; i++) {
      var s = this.sprites[i];
      if (s.name === name) {
        return s;
      }
    }
    return null;
  },

  drawSprite: function (ctx, name, x, y, flipX) {
    if (!this.imgLoaded || !this.jsonLoaded) {
      var self = this;
      setTimeout(function () {
        self.drawSprite(ctx, name, x, y, flipX);
      }, 100);
      return;
    }

    var sprite = this.getSprite(name);
    if (!sprite) {
      return;
    }

    if (
      typeof mapManager !== "undefined" &&
      !mapManager.isVisible(x, y, sprite.w, sprite.h)
    ) {
      return;
    }

    var drawX = x;
    var drawY = y;
    if (typeof mapManager !== "undefined") {
      drawX -= mapManager.view.x;
      drawY -= mapManager.view.y;
    }

    if (flipX) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        sprite.img,
        sprite.x,
        sprite.y,
        sprite.w,
        sprite.h,
        -(drawX + sprite.w),
        drawY,
        sprite.w,
        sprite.h
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        sprite.img,
        sprite.x,
        sprite.y,
        sprite.w,
        sprite.h,
        drawX,
        drawY,
        sprite.w,
        sprite.h
      );
    }
  }
};
