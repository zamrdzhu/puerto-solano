// Puerto Solano - police.js: 5-star SPPD wanted system, pursuit, roadblocks, spikes, helicopter.
PS.Police = (function () {
  var scene = null, player = null;
  var stars = 0, hiddenT = 0, busted = 0;
  var cruisers = [], heli = null, heliLight = null, blocks = [], spikeHitDone = false;
  function init(s, p) { scene = s; player = p; }
  function crime(kind) {
    var add = { theft: 1, hit: 1, shot: 1, mission: 2 }[kind] || 1;
    setStars(stars + add);
  }
  function setStars(n) {
    stars = PS.clamp(n, 0, 5); hiddenT = 0;
    spawnNeeded();
  }
  function getStars() { return stars; }
  function spawnNeeded() {
    if (!scene) return;
    var want = stars === 0 ? 0 : 1 + stars; // cruisers scale with heat
    while (cruisers.length < want) {
      var mesh = PS.Vehicles.makeCar('police', 0xffffff);
      var a = Math.random() * Math.PI * 2, d = 55 + Math.random() * 25;
      mesh.position.set(player.pos.x + Math.sin(a) * d, 0, player.pos.z + Math.cos(a) * d);
      scene.add(mesh);
      cruisers.push({ mesh: mesh, speed: 0, angle: 0, health: 100, tires: 4, parked: false });
    }
    while (cruisers.length > want) { var c = cruisers.pop(); scene.remove(c.mesh); }
    if (stars >= 4 && !heli) {
      heli = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 6), new THREE.MeshLambertMaterial({ color: 0x1b3a6b }));
      heli.add(body);
      var rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.1, 0.6), new THREE.MeshLambertMaterial({ color: 0x222222 }));
      rotor.position.y = 1.2; heli.add(rotor); heli.userData.rotor = rotor;
      heliLight = new THREE.Mesh(new THREE.CylinderGeometry(1, 5, 16, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xfff6c9, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
      heliLight.position.y = -8.5; heli.add(heliLight);
      heli.position.set(player.pos.x, 26, player.pos.z); scene.add(heli);
    }
    if (stars < 4 && heli) { scene.remove(heli); heli = null; }
    if (stars >= 3 && blocks.length === 0) makeRoadblock();
    if (stars < 3) { blocks.forEach(function (b) { scene.remove(b.mesh); }); blocks = []; }
  }
  function makeRoadblock() {
    // Two cruisers parked across the road ahead of the player + spike strip.
    var ahead = player.car ? (player.car.angle || 0) : player.angle;
    var bx = player.pos.x + Math.sin(ahead) * 55, bz = player.pos.z + Math.cos(ahead) * 55;
    for (var i = -1; i <= 1; i += 2) {
      var mesh = PS.Vehicles.makeCar('police', 0xffffff);
      mesh.position.set(bx + Math.cos(ahead) * i * 3.4, 0, bz - Math.sin(ahead) * i * 3.4);
      mesh.rotation.y = ahead + Math.PI / 2; scene.add(mesh);
      blocks.push({ mesh: mesh, spike: false });
      PS.City.colliders.push({ x: mesh.position.x, z: mesh.position.z, hw: 2.2, hd: 1.2 });
    }
    var strip = new THREE.Mesh(new THREE.BoxGeometry(11, 0.12, 1.1), new THREE.MeshLambertMaterial({ color: 0x888888 }));
    strip.position.set(bx, 0.08, bz + 4); scene.add(strip);
    blocks.push({ mesh: strip, spike: true });
  }
  function update(dt) {
    if (!player) return;
    // Pursuit: steer cruisers at the player, ram on contact.
    cruisers.forEach(function (c) {
      var dx = player.pos.x - c.mesh.position.x, dz = player.pos.z - c.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      var target = Math.atan2(dx, dz);
      var diff = target - c.angle;
      while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
      c.angle += PS.clamp(diff, -1.7 * dt, 1.7 * dt);
      var top = 34 + stars * 2.4;
      c.speed = PS.lerp(c.speed, dist > 7 ? top : 0, dt * 0.8);
      c.mesh.position.x += Math.sin(c.angle) * c.speed * dt;
      c.mesh.position.z += Math.cos(c.angle) * c.speed * dt;
      PS.City.collide(c.mesh.position, 1.6);
      c.mesh.rotation.y = c.angle;
      if (c.mesh.userData.lightbar) c.mesh.userData.lightbar.material.color.setHex(Math.sin(performance.now() * 0.02) > 0 ? 0xff2222 : 0x2266ff);
      if (dist < 4 && player.car && Math.abs(player.speed) > 6) { PS.Audio.thud(); }
      // Spike strips: driving over one blows tires.
      blocks.forEach(function (b) {
        if (b.spike && player.car && !spikeHitDone) {
          var sx = player.pos.x - b.mesh.position.x, sz = player.pos.z - b.mesh.position.z;
          if (sx * sx + sz * sz < 30) {
            player.car.tires = 2; spikeHitDone = true;
            PS.HUD && PS.HUD.banner('TIRES BLOWN! Handling wrecked - swap cars or wait it out');
            PS.Audio.thud();
            setTimeout(function () { spikeHitDone = false; if (player.car) player.car.tires = 4; }, 20000);
          }
        }
      });
    });
    if (heli) {
      heli.position.x = PS.lerp(heli.position.x, player.pos.x, dt * 0.7);
      heli.position.z = PS.lerp(heli.position.z, player.pos.z, dt * 0.7);
      heli.userData.rotor.rotation.y += dt * 22;
    }
    // Sight + decay + busted meter
    var seen = false;
    cruisers.forEach(function (c) { if (PS.dist2(c.mesh.position, player.pos) < 3600) seen = true; });
    if (heli) seen = true;
    if (stars > 0) {
      if (seen) hiddenT = 0; else { hiddenT += dt; if (hiddenT > PS.CFG.wantedDecay) { setStars(stars - 1); hiddenT = 0; } }
      var nearSlow = false;
      cruisers.forEach(function (c) { if (PS.dist2(c.mesh.position, player.pos) < 100) nearSlow = true; });
      var speedNow = player.car ? Math.abs(player.speed) : 0;
      if (nearSlow && speedNow < 3) { busted += dt; if (busted > 2.6) { busted = 0; PS.Game && PS.Game.busted(); } }
      else busted = Math.max(0, busted - dt * 1.4);
    } else busted = 0;
  }
  function clear() { setStars(0); busted = 0; }
  return { init: init, crime: crime, setStars: setStars, getStars: getStars, update: update, clear: clear, cruisers: function () { return cruisers; }, bustedAmount: function () { return busted / 2.6; }, hasHeli: function () { return !!heli; } };
})();
