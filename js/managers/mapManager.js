var mapManager = {
  mapData: null,
  tLayer: null,
  xCount: 0,
  yCount: 0,
  tSize: { x: 0, y: 0 },
  mapSize: { x: 0, y: 0 },
  tilesets: [],
  imgLoadCount: 0,
  imgCount: 0,
  jsonLoaded: false,
  mapDir: "",
  view: { x: 0, y: 0, w: 0, h: 0 },

  loadMap: function (path) {
    this.tLayer = null;
    this.mapData = null;
    this.tilesets = [];
    this.imgLoadCount = 0;
    this.imgCount = 0;
    this.jsonLoaded = false;
    var lastSlash = path.lastIndexOf("/");
    this.mapDir = lastSlash !== -1 ? path.substring(0, lastSlash + 1) : "";

    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.status === 200) {
        mapManager.parseMap(request.responseText);
      }
    };
    request.open("GET", path, true);
    request.send();
  },

  parseMap: function (tilesJSON) {
    this.mapData = JSON.parse(tilesJSON);

    this.xCount = this.mapData.width;
    this.yCount = this.mapData.height;

    this.tSize.x = this.mapData.tilewidth;
    this.tSize.y = this.mapData.tileheight;

    this.mapSize.x = this.xCount * this.tSize.x;
    this.mapSize.y = this.yCount * this.tSize.y;

    this.tilesets = [];
    this.imgLoadCount = 0;
    var imageLayerCount = 0;
    for (var l = 0; l < this.mapData.layers.length; l++) {
      if (this.mapData.layers[l].type === "imagelayer" && this.mapData.layers[l].image) {
        imageLayerCount++;
      }
    }
    this.imgCount = this.mapData.tilesets.length + imageLayerCount;
    this.jsonLoaded = false;

    if (this.imgCount === 0) {
      this.jsonLoaded = true;
    }

    for (var i = 0; i < this.mapData.tilesets.length; i++) {
      var tileset = this.mapData.tilesets[i];
      var image = new Image();

      image.onload = function () {
        mapManager.imgLoadCount++;
        if (mapManager.imgLoadCount === mapManager.imgCount) {
          mapManager.jsonLoaded = true;
        }
      };

      image.src = this.resolvePath(tileset.image);

      var ts = {};
      ts.firstgid = tileset.firstgid;
      ts.image = image;
      ts.name = tileset.name;
      ts.xCount = Math.floor(tileset.imagewidth / this.tSize.x);
      ts.yCount = Math.floor(tileset.imageheight / this.tSize.y);

      this.tilesets.push(ts);
    }

    for (var il = 0; il < this.mapData.layers.length; il++) {
      var layer = this.mapData.layers[il];
      if (layer.type === "imagelayer" && layer.image) {
        (function (targetLayer) {
          var img = new Image();
          img.onload = function () {
            mapManager.imgLoadCount++;
            if (mapManager.imgLoadCount === mapManager.imgCount) {
              mapManager.jsonLoaded = true;
            }
          };
          targetLayer.imageObj = img;
          img.src = mapManager.resolvePath(targetLayer.image);
        })(layer);
      }
    }
  },

  getTileset: function (tileIndex) {
    for (var i = this.tilesets.length - 1; i >= 0; i--) {
      var ts = this.tilesets[i];
      if (tileIndex >= ts.firstgid) {
        return ts;
      }
    }
    return null;
  },

  getTile: function (tileIndex) {
    if (tileIndex === 0) {
      return null;
    }

    var tileset = this.getTileset(tileIndex);
    if (!tileset) {
      return null;
    }

    var localIdx = tileIndex - tileset.firstgid;
    var x = localIdx % tileset.xCount;
    var y = Math.floor(localIdx / tileset.xCount);

    var tile = {
      img: tileset.image,
      px: x * this.tSize.x,
      py: y * this.tSize.y
    };

    return tile;
  },

  // Tile from specific tilelayer number (0-based among tilelayers)
  getTileAtLayer: function (layerIndex, x, y) {
    if (!this.mapData) {
      return 0;
    }
    var tileLayers = [];
    for (var i = 0; i < this.mapData.layers.length; i++) {
      var l = this.mapData.layers[i];
      if (l.type === "tilelayer") {
        tileLayers.push(l);
      }
    }
    var layer = tileLayers[layerIndex];
    if (!layer) {
      return 0;
    }

    var tileX = Math.floor(x / this.tSize.x);
    var tileY = Math.floor(y / this.tSize.y);

    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX >= this.xCount ||
      tileY >= this.yCount
    ) {
      return 0;
    }

    var idx = tileY * this.xCount + tileX;
    return layer.data[idx];
  },

  isVisible: function (x, y, width, height) {
    return !(
      x + width < this.view.x ||
      x > this.view.x + this.view.w ||
      y + height < this.view.y ||
      y > this.view.y + this.view.h
    );
  },

  draw: function (ctx) {
    if (!this.mapData || !this.jsonLoaded) {
      var self = this;
      setTimeout(function () {
        self.draw(ctx);
      }, 100);
      return;
    }

    if (!this.tLayer) {
      for (var i = 0; i < this.mapData.layers.length; i++) {
        var layer = this.mapData.layers[i];
        if (layer.type === "tilelayer") {
          this.tLayer = layer;
          break;
        }
      }
    }

    if (!this.tLayer) {
      return;
    }

    for (var li = 0; li < this.mapData.layers.length; li++) {
      var layer = this.mapData.layers[li];
      if (!layer.visible) {
        continue;
      }

      if (layer.type === "imagelayer" && layer.imageObj) {
        var baseX = layer.x || 0;
        var baseY = layer.y || 0;
        var img = layer.imageObj;
        var imgY = baseY - this.view.y;

        if (layer.repeatx) {
          // Tile the background horizontally to cover the entire view
          var startX =
            Math.floor((this.view.x - baseX) / img.width) * img.width + baseX;
          for (
            var drawX = startX;
            drawX < this.view.x + this.view.w + img.width;
            drawX += img.width
          ) {
            ctx.drawImage(img, drawX - this.view.x, imgY);
          }
        } else {
          ctx.drawImage(img, baseX - this.view.x, imgY);
        }
        continue;
      }

      if (layer.type !== "tilelayer") {
        continue;
      }

      if (!this.tLayer) {
        this.tLayer = layer;
      }

      for (var t = 0; t < layer.data.length; t++) {
        var tileIndex = layer.data[t];
        if (tileIndex === 0) {
          continue;
        }

        var tile = this.getTile(tileIndex);
        if (!tile) {
          continue;
        }

        var pX = (t % this.xCount) * this.tSize.x;
        var pY = Math.floor(t / this.xCount) * this.tSize.y;

        if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y)) {
          continue;
        }

        pX -= this.view.x;
        pY -= this.view.y;

        ctx.drawImage(
          tile.img,
          tile.px,
          tile.py,
          this.tSize.x,
          this.tSize.y,
          pX,
          pY,
          this.tSize.x,
          this.tSize.y
        );
      }
    }
  },

  parseEntities: function () {
    if (!this.mapData || !this.jsonLoaded) {
      var self = this;
      setTimeout(function () {
        self.parseEntities();
      }, 100);
      return;
    }

    for (var i = 0; i < this.mapData.layers.length; i++) {
      var layer = this.mapData.layers[i];
      if (layer.type === "objectgroup") {
        var entities = layer.objects;

        for (var j = 0; j < entities.length; j++) {
          var e = entities[j];
          try {
            var typeName = e.type || e.name;
            var proto = gameManager.factory[typeName];
            if (!proto) {
              console.log("Factory not found for entity type:", typeName);
              continue;
            }

            var obj = Object.create(proto);
            obj.type = typeName;
            obj.pos_x = e.x;
            obj.pos_y = e.y;
            obj.size_x = e.width;
            obj.size_y = e.height;

            // Normalize sizes for sprite frames (player/zombie 32x48)
            if (typeName === "Player" || typeName === "Zombie") {
              var oldHeight = obj.size_y;
              obj.size_x = 32;
              obj.size_y = typeName === "Player" ? 35 : 40;
              // Keep feet aligned with Tiled object placement
              obj.pos_y -= obj.size_y - oldHeight;
            }

            gameManager.entities.push(obj);

            if (typeName === "Player") {
              gameManager.initPlayer(obj);
            }
          } catch (ex) {
            console.log("Error while creating entity:", e, ex);
          }
        }

        break;
      }
    }
  },

  getTileIdx: function (x, y) {
    return y * this.xCount + x;
  },

  getTileAt: function (x, y) {
    if (!this.tLayer) {
      return 0;
    }
    var idx = this.getTileIdx(x, y);
    return this.tLayer.data[idx];
  },

  centerAt: function (x, y) {
    if (x < this.view.w / 2) {
      this.view.x = 0;
    } else if (x > this.mapSize.x - this.view.w / 2) {
      this.view.x = this.mapSize.x - this.view.w;
    } else {
      this.view.x = x - this.view.w / 2;
    }

    if (y < this.view.h / 2) {
      this.view.y = 0;
    } else if (y > this.mapSize.y - this.view.h / 2) {
      this.view.y = this.mapSize.y - this.view.h;
    } else {
      this.view.y = y - this.view.h / 2;
    }
  },
  
  resolvePath: function (resourcePath) {
    if (!resourcePath) {
      return resourcePath;
    }
    if (resourcePath.indexOf("http://") === 0 || resourcePath.indexOf("https://") === 0 || resourcePath.indexOf("/") === 0) {
      return resourcePath;
    }
    return this.mapDir + resourcePath;
  }
};
