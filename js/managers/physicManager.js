var physicManager = {
  gravity: 0.5,
  jumpForce: 10,

  update: function (obj) {
    if (obj.type === "Player" || obj.type === "Zombie" || obj.type === "Cash") {
      return;
    }

    var ladderTile = mapManager.getTileAtLayer(
      3,
      obj.pos_x + obj.size_x / 2,
      obj.pos_y + obj.size_y / 2
    );

    obj.onLadder = ladderTile !== 0;

    if (!obj.onLadder) {
      obj.dy = (obj.dy || 0) + this.gravity;
    } else {
      obj.dy = 0;
    }

    this.applyHorizontal(obj);
    this.applyVertical(obj);

    if (obj.pos_y > mapManager.mapSize.y) {
      obj.kill();
    }
  },

  applyHorizontal: function (obj) {
    var dx = obj.move_x * obj.speed;
    if (dx === 0 && obj.type !== "Zombie") {
      return;
    }

    var newX = obj.pos_x + dx;
    var tileXCheck = dx > 0 ? newX + obj.size_x - 1 : newX;
    var tileYTop = Math.floor(obj.pos_y / mapManager.tSize.y);
    var tileYBot = Math.floor(
      (obj.pos_y + obj.size_y - 1) / mapManager.tSize.y
    );

    var tileX = Math.floor(tileXCheck / mapManager.tSize.x);

    var hit =
      mapManager.getTileAtLayer(
        2,
        tileX * mapManager.tSize.x + 1,
        tileYTop * mapManager.tSize.y + 1
      ) ||
      mapManager.getTileAtLayer(
        2,
        tileX * mapManager.tSize.x + 1,
        tileYBot * mapManager.tSize.y + 1
      );

    if (hit) {
      if (this.isDeadly(hit)) {
        obj.kill();
      } else {
        if (dx > 0) {
          obj.pos_x = tileX * mapManager.tSize.x - obj.size_x;
        } else if (dx < 0) {
          obj.pos_x = (tileX + 1) * mapManager.tSize.x;
        }
      }
    } else {
      obj.pos_x = newX;
    }
  },

  applyVertical: function (obj) {
    if (obj.onLadder) {
      if (obj.type === "Player") {
        obj.pos_y += obj.move_y * obj.speed;
      }
      obj.onGround = true;
      obj.dy = 0;
      return;
    }

    var dy = obj.dy || 0;
    var newY = obj.pos_y + dy;

    var edgeOffset = 10;

    var xLeft = obj.pos_x + edgeOffset;
    var xCenter = obj.pos_x + obj.size_x / 2;
    var xRight = obj.pos_x + obj.size_x - edgeOffset;

    var tileXLeft = Math.floor(xLeft / mapManager.tSize.x);
    var tileXCenter = Math.floor(xCenter / mapManager.tSize.x);
    var tileXRight = Math.floor(xRight / mapManager.tSize.x);

    var tileYBottom = Math.floor((newY + obj.size_y - 1) / mapManager.tSize.y);
    var tileYTop = Math.floor(newY / mapManager.tSize.y);

    if (dy > 0) {
      var hitL = mapManager.getTileAtLayer(
        2,
        tileXLeft * mapManager.tSize.x + 1,
        tileYBottom * mapManager.tSize.y + 1
      );
      var hitC = mapManager.getTileAtLayer(
        2,
        tileXCenter * mapManager.tSize.x + 1,
        tileYBottom * mapManager.tSize.y + 1
      );
      var hitR = mapManager.getTileAtLayer(
        2,
        tileXRight * mapManager.tSize.x + 1,
        tileYBottom * mapManager.tSize.y + 1
      );

      var hitDown = hitL || hitC || hitR;

      if (hitDown) {
        if (this.isDeadly(hitDown)) {
          obj.kill();
          return;
        }

        obj.onGround = true;
        obj.dy = 0;
        obj.pos_y = tileYBottom * mapManager.tSize.y - obj.size_y;
      } else {
        obj.onGround = false;
        obj.pos_y = newY;
      }
      return;
    }

    if (dy < 0) {
      var hitUL = mapManager.getTileAtLayer(
        2,
        tileXLeft * mapManager.tSize.x + 1,
        tileYTop * mapManager.tSize.y + 1
      );
      var hitUC = mapManager.getTileAtLayer(
        2,
        tileXCenter * mapManager.tSize.x + 1,
        tileYTop * mapManager.tSize.y + 1
      );
      var hitUR = mapManager.getTileAtLayer(
        2,
        tileXRight * mapManager.tSize.x + 1,
        tileYTop * mapManager.tSize.y + 1
      );

      var hitUp = hitUL || hitUC || hitUR;

      if (hitUp) {
        if (this.isDeadly(hitUp)) {
          obj.kill();
          return;
        }

        obj.dy = 0;
        obj.pos_y = (tileYTop + 1) * mapManager.tSize.y;
      } else {
        obj.pos_y = newY;
      }
      return;
    }

    var footY = Math.floor((obj.pos_y + obj.size_y) / mapManager.tSize.y);

    var standL = mapManager.getTileAtLayer(
      2,
      tileXLeft * mapManager.tSize.x + 1,
      footY * mapManager.tSize.y + 1
    );
    var standC = mapManager.getTileAtLayer(
      2,
      tileXCenter * mapManager.tSize.x + 1,
      footY * mapManager.tSize.y + 1
    );
    var standR = mapManager.getTileAtLayer(
      2,
      tileXRight * mapManager.tSize.x + 1,
      footY * mapManager.tSize.y + 1
    );

    if (standL || standC || standR) {
      obj.onGround = true;
    } else {
      obj.onGround = false;
    }
  },

  entityAtXY: function (obj) {
    for (var i = 0; i < gameManager.entities.length; i++) {
      var e = gameManager.entities[i];
      if (e === obj) {
        continue;
      }
      if (
        obj.pos_x < e.pos_x + e.size_x &&
        obj.pos_x + obj.size_x > e.pos_x &&
        obj.pos_y < e.pos_y + e.size_y &&
        obj.pos_y + obj.size_y > e.pos_y
      ) {
        return e;
      }
    }
    return null;
  },

  isDeadly: function (tileId) {
    return tileId >= 234 && tileId <= 239;
  },

  updateZombie: function (obj) {
    if (typeof obj.dir === "undefined") {
      obj.dir = 1;
    }
    if (!obj.minX && !obj.maxX) {
      obj.minX = obj.pos_x - 160;
      obj.maxX = obj.pos_x + 160;
    }

    var nextX = obj.pos_x + obj.dir * obj.speed;
    var edgeX = obj.dir > 0 ? nextX + obj.size_x - 1 : nextX;
    var tileYFeet = Math.floor(
      (obj.pos_y + obj.size_y + 1) / mapManager.tSize.y
    );
    var tileXFeet = Math.floor(edgeX / mapManager.tSize.x);
    var groundAhead = mapManager.getTileAtLayer(
      2,
      tileXFeet * mapManager.tSize.x + 1,
      tileYFeet * mapManager.tSize.y + 1
    );

    var tileYBody = Math.floor(
      (obj.pos_y + obj.size_y / 2) / mapManager.tSize.y
    );
    var wallAhead = mapManager.getTileAtLayer(
      2,
      tileXFeet * mapManager.tSize.x + 1,
      tileYBody * mapManager.tSize.y + 1
    );

    if (!groundAhead || wallAhead) {
      obj.dir *= -1;
      obj.move_x = obj.dir;
      return;
    }

    if (nextX < obj.minX || nextX > obj.maxX) {
      obj.dir *= -1;
      obj.move_x = obj.dir;
      return;
    }

    obj.pos_x = nextX;
    obj.move_x = obj.dir;
  },
};
