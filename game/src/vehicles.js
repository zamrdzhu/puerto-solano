// Puerto Solano - vehicles.js: low-poly car factory + traffic AI.
PS.Vehicles = (function () {
  function mat(c) { return new THREE.MeshLambertMaterial({ color: c }); }
  function makeCar(type, color) {
    var g = new THREE.Group();
    var bodyC = type === 'police' ? 0xf2f2f2 : color;
    var L = type === 'truck' ? 7.5 : 4.6, H = type === 'truck' ? 2.4 : 1.05;
    var body = new THREE.Mesh(new THREE.BoxGeometry(2, H, L), mat(bodyC));
    body.position.y = 0.75; g.add(body);
    if (type === 'police') { var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.4, L * 0.7), mat(0x1b3a6b)); stripe.position.y = 0.8; g.add(stripe); }
    if (type !== 'truck') {
      var cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, L * 0.45), mat(0x22303c));
      cab.position.set(0, 1.55, -0.2); g.add(cab);
    } else {
      var cab2 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 1.4), mat(0x33414e));
      cab2.position.set(0, 1.5, L / 2 - 0.8); g.add(cab2);
    }
    if (type === 'taxi') { var sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), mat(0xffe14d)); sign.position.set(0, 2.05, -0.2); g.add(sign); }
    if (type === 'police') {
      var bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.5), mat(0xff2222));
      bar.position.set(0, 2.0, -0.2); g.add(bar); g.userData.lightbar = bar;
    }
    var wheelG = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
    var wheelM = mat(0x14161a); g.userData.wheels = [];
    [[-1, L / 2 - 0.9], [1, L / 2 - 0.9], [-1, -L / 2 + 0.9], [1, -L / 2 + 0.9]].forEach(function (p) {
      var w = new THREE.Mesh(wheelG, wheelM);
      w.rotation.z = Math.PI / 2; w.position.set(p[0] * 1.0, 0.42, p[1]); g.add(w); g.userData.wheels.push(w);
    });
    var hl = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.25, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff6c9 }));
    hl.position.set(0, 0.85, L / 2 + 0.02); g.add(hl);
    return g;
  }
  // Traffic: cars follow road grid lines, turn at intersections, stop for others.
  function Traffic(scene, seed, count) {
    this.cars = [];
    var rng = PS.makeRng(seed);
    var types = ['sedan', 'sedan', 'taxi', 'truck'];
    for (var i = 0; i < count; i++) {
      var vertical = rng() > 0.5;
      var lane = -PS.CFG.world / 2 + PS.CFG.roadEvery / 2 + Math.floor(rng() * 8) * PS.CFG.roadEvery;
      var pos = (rng() - 0.5) * 500;
      var mesh = makeCar(types[i % 4], PS.CFG.carColors[Math.floor(rng() * 8)]);
      scene.add(mesh);
      this.cars.push({
        mesh: mesh, vertical: vertical, lane: lane + (rng() > 0.5 ? 3.5 : -3.5),
        t: pos, speed: 10 + rng() * 8, dir: rng() > 0.5 ? 1 : -1,
        health: 100, smoke: 0, parked: false
      });
    }
  }
  Traffic.prototype.update = function (dt) {
    var E = PS.CFG.roadEvery, W = PS.CFG.world / 2;
    for (var i = 0; i < this.cars.length; i++) {
      var c = this.cars[i]; if (c.parked) continue;
      // stop if a car is close ahead
      var slow = 1;
      for (var j = 0; j < this.cars.length; j++) {
        if (j === i) continue; var o = this.cars[j];
        var dx = o.mesh.position.x - c.mesh.position.x, dz = o.mesh.position.z - c.mesh.position.z;
        if (dx * dx + dz * dz < 64) slow = 0.25;
      }
      c.t += c.dir * c.speed * slow * dt;
      if (c.t > W - 20) { c.t = W - 20; c.dir = -1; }
      if (c.t < -W + 20) { c.t = -W + 20; c.dir = 1; }
      // occasionally turn at an intersection
      var near = Math.round((c.t + W - E / 2) / E);
      var node = -W + E / 2 + near * E;
      if (Math.abs(c.t - node) < 1.2 && ((i * 7 + near) % 5 === 0)) {
        var tmp = c.vertical; c.vertical = !tmp;
        var oldLane = c.lane; c.lane = node + (c.dir > 0 ? 3.5 : -3.5); c.t = oldLane;
      }
      if (c.vertical) { c.mesh.position.set(c.lane, 0, c.t); c.mesh.rotation.y = c.dir > 0 ? 0 : Math.PI; }
      else { c.mesh.position.set(c.t, 0, c.lane); c.mesh.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      if (c.smoke > 0 && PS.Effects) PS.Effects.smoke(c.mesh.position, dt);
    }
  };
  // Parked stealable cars near roads / marina / docks.
  function parked(scene, seed) {
    var rng = PS.makeRng(seed + 99); var list = [];
    var spots = [[46, 246], [86, 40], [-34, -40], [126, -120], [-114, 120], [206, 206], [-194, -34], [46, -194], [-34, 246], [166, 46]];
    spots.forEach(function (s, i) {
      var mesh = makeCar(i % 3 === 0 ? 'taxi' : 'sedan', PS.CFG.carColors[i % 8]);
      mesh.position.set(s[0], 0, s[1]); mesh.rotation.y = (i % 4) * Math.PI / 2;
      scene.add(mesh);
      list.push({ mesh: mesh, health: 100, smoke: 0, parked: true, speed: 0, angle: mesh.rotation.y, tires: 4 });
    });
    return list;
  }
  return { makeCar: makeCar, Traffic: Traffic, parked: parked };
})();
