var leaderboardManager = {
  records: [],
  recordsKey: "parkRunnerRecords",
  recordsListEl: null,

  init: function (opts) {
    opts = opts || {};
    this.recordsListEl = opts.listEl || null;
    if (opts.storageKey) {
      this.recordsKey = opts.storageKey;
    }
    this.loadRecords();
    this.renderRecords();
  },

  loadRecords: function () {
    this.records = [];
    try {
      var stored = localStorage.getItem(this.recordsKey);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.records = parsed;
          this.sortRecords();
          if (this.records.length > 5) {
            this.records = this.records.slice(0, 5);
          }
        }
      }
    } catch (ex) {
      this.records = [];
    }
  },

  saveRecords: function () {
    try {
      localStorage.setItem(this.recordsKey, JSON.stringify(this.records));
    } catch (ex) {}
  },

  sortRecords: function () {
    if (!this.records || this.records.length === 0) {
      return;
    }
    this.records.sort(function (a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.ts - a.ts;
    });
  },

  addRecord: function (name, score) {
    var recName = name || "Player";
    var recScore = score || 0;
    var existingIdx = -1;
    for (var i = 0; i < this.records.length; i++) {
      if (this.records[i].name === recName) {
        existingIdx = i;
        break;
      }
    }
    if (existingIdx !== -1) {
      var existing = this.records[existingIdx];
      if (existing.score >= recScore) {
        this.sortRecords();
        this.renderRecords();
        return;
      }
      this.records.splice(existingIdx, 1);
    }
    var record = {
      name: recName,
      score: recScore,
      ts: Date.now()
    };
    this.records.unshift(record);
    this.sortRecords();
    if (this.records.length > 5) {
      this.records = this.records.slice(0, 5);
    }
    this.saveRecords();
    this.renderRecords();
  },

  renderRecords: function () {
    if (!this.recordsListEl) {
      return;
    }
    this.sortRecords();
    this.recordsListEl.innerHTML = "";
    if (!this.records || this.records.length === 0) {
      var emptyEl = document.createElement("li");
      emptyEl.className = "record-empty";
      emptyEl.textContent = "No records yet";
      this.recordsListEl.appendChild(emptyEl);
      return;
    }
    for (var i = 0; i < this.records.length; i++) {
      var rec = this.records[i];
      var row = document.createElement("li");
      var nameSpan = document.createElement("span");
      nameSpan.textContent = (i + 1) + ". " + rec.name;
      var scoreSpan = document.createElement("span");
      scoreSpan.textContent = rec.score;
      row.appendChild(nameSpan);
      row.appendChild(scoreSpan);
      this.recordsListEl.appendChild(row);
    }
  }
};
