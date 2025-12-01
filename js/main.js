(function () {
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");

  function loadScripts(list, callback) {
    var index = 0;
    function next() {
      if (index >= list.length) {
        callback();
        return;
      }
      var s = document.createElement("script");
      s.src = list[index];
      s.onload = function () {
        index++;
        next();
      };
      document.head.appendChild(s);
    }
    next();
  }

  function waitReadyAndRun() {
    var readyMap = mapManager.mapData && mapManager.jsonLoaded;
    var readySprites = spriteManager.imgLoaded && spriteManager.jsonLoaded;
    if (!readyMap || !readySprites) {
      requestAnimationFrame(waitReadyAndRun);
      return;
    }

    canvas.width = Math.min(mapManager.mapSize.x, canvas.width);
    canvas.height = Math.min(mapManager.mapSize.y, canvas.height);

    mapManager.view.w = canvas.width;
    mapManager.view.h = canvas.height;

    gameManager.startLoop();
  }

  loadScripts(
    [
      "js/managers/mapManager.js",
      "js/managers/soundManager.js",
      "js/managers/eventsManager.js",
      "js/managers/spriteManager.js",
      "js/entities.js",
      "js/managers/physicManager.js",
      "js/managers/leaderboardManager.js",
      "js/managers/gameManager.js"
    ],
    function () {
      gameManager.loadAll(canvas, ctx);
      requestAnimationFrame(waitReadyAndRun);
    }
  );
})();
