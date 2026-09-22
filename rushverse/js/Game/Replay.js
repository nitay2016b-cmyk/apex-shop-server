/* RUSHVERSE - Game/Replay.js
   Persistence for the "last run" replay: GameLoop keeps the most recent
   run's recorded samples/moments in memory (getLastReplay); this module is
   the only thing that writes it to the save file, on an explicit
   "SAVE RUN" action, one slot at a time. */
(function (RV) {
  'use strict';

  function saveLastRun() {
    var data = RV.GameLoop.getLastReplay();
    if (!data) return false;
    var s = RV.Save.get();
    s.replay.lastRun = data;
    s.replaysSaved += 1;
    RV.Save.save();
    return true;
  }

  function getSaved() {
    return RV.Save.get().replay.lastRun;
  }

  RV.Replay = { saveLastRun: saveLastRun, getSaved: getSaved };
})(window.RV || (window.RV = {}));
