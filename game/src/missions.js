// Puerto Solano - missions.js: 10-mission story campaign + side activities.
PS.Missions = (function () {
  var G = null, idx = 0, stageI = 0, active = false, done = false;
  var target = null, crates = [], escortCar = null, tailCar = null, tailSeen = 0, racePts = [], raceI = 0;
  var rng = PS.makeRng(42);
  var RACE = [[80, 160], [160, 40], [80, -80], [-40, -160], [-160, -40], [-80, 120]];
  function init(game, startIdx) { G = game; idx = startIdx || 0; }
  function current() { return PS.MISSIONS[idx] || null; }
  function start() {
    var m = current(); if (!m) { done = true; return; }
    active = true; stageI = 0;
    PS.HUD.setMission('MISSION ' + (idx + 1) + ': ' + m.name.toUpperCase());
    PS.HUD.banner(m.intro, 6000);
    setupStage();
  }
  function setupStage() {
    var m = current(), st = m.stages[stageI];
    crates.forEach(function (c) { G.scene.remove(c.mesh); }); crates = [];
    if (escortCar) { escortCar = null; } if (tailCar) { tailCar = null; }
    target = null;
    PS.Combat.clearEnemies();
    if (st.type === 'goto' || st.type === 'delivery' || st.type === 'escort') {
      target = { x: st.x, z: st.z };
      if (st.type === 'delivery') G.missionTimer = st.time;
      if (st.type === 'escort') {
        var mesh = PS.Vehicles.makeCar('sedan', 0x3a7bd5);
        mesh.position.set(G.player.pos.x + 6, 0, G.player.pos.z + 4); G.scene.add(mesh);
        escortCar = { mesh: mesh, health: 100, angle: 0, speed: 0, tires: 4 };
        G.extraCars.push(escortCar);
      }
    } else if (st.type === 'chase') {
      var mesh2 = PS.Vehicles.makeCar('sedan', 0xd64541);
      mesh2.position.set(G.player.pos.x + 30, 0, G.player.pos.z - 20); G.scene.add(mesh2);
      target = { car: { mesh: mesh2, health: 60, angle: 0, speed: 0, tires: 4 }, flee: true };
      G.extraCars.push(target.car);
    } else if (st.type === 'escape') {
      PS.Police.setStars(st.stars); target = { escape: true };
    } else if (st.type === 'shootout') {
      target = { x: st.x, z: st.z };
      for (var i = 0; i < st.count; i++) PS.Combat.spawnEnemy(st.x + (rng() - 0.5) * 26, st.z + (rng() - 0.5) * 26);
      PS.Combat.spawnPickup(st.x + 6, st.z + 6);
    } else if (st.type === 'tail') {
      var mesh3 = PS.Vehicles.makeCar('sedan', 0xe8e8e8);
      mesh3.position.set(G.player.pos.x + 24, 0, G.player.pos.z); G.scene.add(mesh3);
      tailCar = { mesh: mesh3, t: 0, lane: mesh3.position.z, vertical: false, speed: 11, dir: 1, health: 100, parked: false };
      G.traffic.cars.push(tailCar); tailSeen = 0;
      target = { tail: true, dest: { x: -160, z: -160 } };
    } else if (st.type === 'race') {
      racePts = RACE.slice(); raceI = 0; G.missionTimer = st.time;
      target = { x: racePts[0][0], z: racePts[0][1] };
    } else if (st.type === 'collect') {
      target = null;
      for (var j = 0; j < st.count; j++) {
        var cx = (rng() - 0.5) * 420, cz = (rng() - 0.5) * 420;
        var cm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), new THREE.MeshLambertMaterial({ color: 0xffd23e }));
        cm.position.set(cx, 1, cz); G.scene.add(cm);
        crates.push({ mesh: cm, got: false });
      }
    }
    PS.HUD.setObjective(st.label);
    if (target && target.x !== undefined) PS.Effects.setMarker(target.x, target.z, 0xffd23e);
    else if (target && target.car) PS.Effects.setMarker(target.car.mesh.position.x, target.car.mesh.position.z, 0xff5544);
    else PS.Effects.setMarker(null);
    G.marker = (target && target.x !== undefined) ? { x: target.x, z: target.z } : null;
  }
  function completeStage() {
    var m = current();
    stageI++;
    PS.Audio.chime();
    if (stageI >= m.stages.length) {
      active = false;
      G.cash += m.reward; PS.Audio.cash();
      PS.HUD.banner(m.outro + '  +$' + m.reward, 6000);
      PS.HUD.setObjective(''); PS.HUD.setMission(''); PS.Effects.setMarker(null); G.marker = null;
      idx++;
      G.saveGame();
      // Side activity flavour between missions.
      if (idx === 3) PS.HUD.banner('Side activity unlocked: steal any parked car - taxi fares pay $40 when you drop riders at glowing markers', 6000);
      setTimeout(function () { if (!done && current()) start(); }, 5000);
      if (!current()) { done = true; PS.HUD.banner('STORY COMPLETE - Puerto Solano is yours. Free roam!', 8000); }
    } else setupStage();
  }
  function fail(reason) {
    PS.HUD.banner('MISSION FAILED: ' + reason + ' - restarting stage', 4500);
    G.missionTimer = 0; setupStage();
  }
  function update(dt) {
    if (!active || !current()) return;
    var st = current().stages[stageI], p = G.player;
    if (G.missionTimer > 0) { G.missionTimer -= dt; if (G.missionTimer <= 0) { fail('Out of time'); return; } }
    if (!st) return;
    if (st.type === 'goto' || st.type === 'delivery') {
      if (PS.dist2(p.pos, target) < 64) completeStage();
    } else if (st.type === 'chase') {
      var c = target.car;
      // fleeing AI: drive away along +x with wobble, slow when damaged
      c.angle = PS.lerp(c.angle || 0, Math.PI / 2 + Math.sin(performance.now() * 0.001) * 0.4, dt);
      var sp = c.health > 20 ? 20 : 8;
      c.mesh.position.x += Math.sin(c.angle) * sp * dt; c.mesh.position.z += Math.cos(c.angle) * sp * dt;
      c.mesh.rotation.y = c.angle; PS.City.collide(c.mesh.position, 1.6);
      if (PS.dist2(p.pos, c.mesh.position) < 20 && Math.abs(p.speed) > 8) {
        c.health -= 22; PS.Audio.thud(); PS.Effects.burst(c.mesh.position.clone().setY(1), 0xffa040, 6, 3, 3);
        if (c.health <= 0) completeStage();
      }
      G.marker = { x: c.mesh.position.x, z: c.mesh.position.z };
      PS.Effects.setMarker(c.mesh.position.x, c.mesh.position.z, 0xff5544);
    } else if (st.type === 'escape') {
      if (PS.Police.getStars() === 0) completeStage();
    } else if (st.type === 'shootout') {
      if (PS.dist2(p.pos, target) < 5000 && PS.Combat.alive() === 0) completeStage();
      else if (PS.Combat.alive() === 0 && PS.dist2(p.pos, target) >= 5000) { /* must travel there */ }
      if (PS.Combat.alive() === 0 && PS.dist2(p.pos, target) < 900) completeStage();
    } else if (st.type === 'tail') {
      var d = Math.sqrt(PS.dist2(p.pos, tailCar.mesh.position));
      if (d < 13) { tailSeen += dt; PS.HUD.setObjective('TOO CLOSE - you are being spotted! (' + Math.ceil(3 - tailSeen) + ')'); if (tailSeen > 3) { fail('Spotted by the courier'); return; } }
      else PS.HUD.setObjective(st.label + ' - distance ' + Math.round(d) + 'm');
      if (PS.dist2(tailCar.mesh.position, target.dest) < 200) completeStage();
      if (d > 190) fail('You lost the courier');
    } else if (st.type === 'race') {
      if (PS.dist2(p.pos, target) < 100) {
        raceI++; PS.Audio.chime();
        if (raceI >= racePts.length) { G.missionTimer = 0; completeStage(); }
        else { target = { x: racePts[raceI][0], z: racePts[raceI][1] }; G.marker = target; PS.Effects.setMarker(target.x, target.z, 0x3ecf5a); PS.HUD.setObjective(st.label + ' (' + raceI + '/' + racePts.length + ')'); }
      }
    } else if (st.type === 'collect') {
      var left = 0;
      crates.forEach(function (cr) {
        if (!cr.got) { left++; cr.mesh.rotation.y += dt * 2; if (PS.dist2(p.pos, cr.mesh.position) < 36) { cr.got = true; G.scene.remove(cr.mesh); PS.Audio.chime(); left--; } }
      });
      PS.HUD.setObjective(st.label + ' (' + (st.count - left) + '/' + st.count + ')');
      var first = crates.filter(function (c2) { return !c2.got; })[0];
      G.marker = first ? { x: first.mesh.position.x, z: first.mesh.position.z } : null;
      if (first) PS.Effects.setMarker(first.mesh.position.x, first.mesh.position.z, 0xffd23e);
      if (left === 0) completeStage();
    } else if (st.type === 'escort') {
      // escort car follows the player loosely toward target
      var e = escortCar;
      var dx = p.pos.x - e.mesh.position.x, dz = p.pos.z - e.mesh.position.z, dd = Math.sqrt(dx * dx + dz * dz);
      if (dd > 10) { e.mesh.position.x += (dx / dd) * 17 * dt; e.mesh.position.z += (dz / dd) * 17 * dt; e.mesh.rotation.y = Math.atan2(dx, dz); }
      if (PS.dist2(e.mesh.position, target) < 100) completeStage();
    }
  }
  return { init: init, start: start, update: update, current: current, isDone: function () { return done; }, index: function () { return idx; } };
})();
