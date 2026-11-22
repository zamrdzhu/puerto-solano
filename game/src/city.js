// Puerto Solano - city.js: procedural port city on a road grid.
PS.City = (function () {
  var colliders = []; // {x,z,hw,hd}
  var lamps = [];
  function box(scene, mat, w, h, d, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); scene.add(m); return m;
  }
  function buildingTexture(rng, base) {
    var c = document.createElement('canvas'); c.width = 64; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 64, 128);
    for (var y = 8; y < 120; y += 12) for (var x = 6; x < 56; x += 12) {
      g.fillStyle = rng() > 0.45 ? '#ffe9a3' : '#2b3a4a'; g.fillRect(x, y, 7, 8);
    }
    var t = new THREE.CanvasTexture(c); return t;
  }
  function build(scene, seed) {
    var rng = PS.makeRng(seed || 7);
    var C = PS.CFG, W = C.world / 2;
    // Ground
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(C.world, C.world),
      new THREE.MeshLambertMaterial({ color: 0xb8b09a }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);
    // Roads: dark strips along grid lines + centre dashes
    var roadMat = new THREE.MeshLambertMaterial({ color: C.colors.road });
    var dashMat = new THREE.MeshBasicMaterial({ color: 0xf5d76e });
    var sideMat = new THREE.MeshLambertMaterial({ color: C.colors.sidewalk });
    for (var gx = -W + C.roadEvery / 2; gx < W; gx += C.roadEvery) {
      var rv = new THREE.Mesh(new THREE.PlaneGeometry(C.roadHalf * 2, C.world), roadMat);
      rv.rotation.x = -Math.PI / 2; rv.position.set(gx, 0.02, 0); scene.add(rv);
      var rh = new THREE.Mesh(new THREE.PlaneGeometry(C.world, C.roadHalf * 2), roadMat);
      rh.rotation.x = -Math.PI / 2; rh.position.set(0, 0.02, gx); scene.add(rh);
      for (var d = -W + 10; d < W - 5; d += 16) {
        box(scene, dashMat, 0.4, 0.02, 5, gx, 0.04, d);
        box(scene, dashMat, 5, 0.02, 0.4, d, 0.04, gx);
      }
    }
    // Buildings inside blocks
    var palette = ['#e8b4a0', '#d9d3c3', '#a8c8d8', '#f0d9a8', '#c9a8d8', '#e88ca0'];
    for (var bx = -W + C.roadEvery; bx < W - 20; bx += C.roadEvery) {
      for (var bz = -W + C.roadEvery; bz < W - 20; bz += C.roadEvery) {
        if (bz > C.beachZ - 60) continue; // keep beach strip clear
        var n = 1 + Math.floor(rng() * 2);
        for (var i = 0; i < n; i++) {
          var bw = 14 + rng() * 16, bd = 14 + rng() * 16, bh = 10 + rng() * 42;
          var x = bx + (rng() - 0.5) * 22, z = bz + (rng() - 0.5) * 22;
          var tex = buildingTexture(rng, palette[Math.floor(rng() * palette.length)]);
          var m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd),
            new THREE.MeshLambertMaterial({ map: tex }));
          m.position.set(x, bh / 2, z); scene.add(m);
          box(scene, new THREE.MeshLambertMaterial({ color: 0x666a70 }), bw + 1, 1, bd + 1, x, bh + 0.5, z);
          colliders.push({ x: x, z: z, hw: bw / 2, hd: bd / 2 });
        }
        // Palm trees + streetlights + props on block corners
        palm(scene, bx - 26, bz - 26, rng); palm(scene, bx + 26, bz + 26, rng);
        lamp(scene, bx - 30, bz); lamp(scene, bx + 30, bz);
        if (rng() > 0.5) prop(scene, bx + (rng() - 0.5) * 40, bz + (rng() - 0.5) * 40, rng);
      }
    }
    // Beach + animated water
    var sand = new THREE.Mesh(new THREE.PlaneGeometry(C.world, 70),
      new THREE.MeshLambertMaterial({ color: C.colors.sand }));
    sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.03, C.beachZ + 25); scene.add(sand);
    var water = new THREE.Mesh(new THREE.PlaneGeometry(C.world * 2, 300),
      new THREE.MeshPhongMaterial({ color: C.colors.water, transparent: true, opacity: 0.88, shininess: 90 }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, 0.25, C.beachZ + 190); scene.add(water);
    // Marina docks
    var dockMat = new THREE.MeshLambertMaterial({ color: 0x8a6a45 });
    for (var k = 0; k < 5; k++) box(scene, dockMat, 6, 1, 46, -120 + k * 55, 0.6, C.beachZ + 55);
    for (var b = 0; b < 8; b++) { // little boats
      var boat = box(scene, new THREE.MeshLambertMaterial({ color: PS.CFG.carColors[b % 8] }),
        4, 1.6, 9, -140 + b * 36, 0.9, C.beachZ + 62 + (b % 2) * 14);
      boat.rotation.y = (b % 3) * 0.2;
    }
    // Hill suburb marker: a few houses north-west
    for (var h = 0; h < 6; h++) {
      var hx = -260 + (h % 3) * 34, hz = -260 + Math.floor(h / 3) * 34;
      box(scene, new THREE.MeshLambertMaterial({ color: 0xf5efe0 }), 14, 7, 12, hx, 3.5, hz);
      colliders.push({ x: hx, z: hz, hw: 7, hd: 6 });
    }
    return { colliders: colliders, lamps: lamps, water: water };
  }
  function palm(scene, x, z, rng) {
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 7, 6),
      new THREE.MeshLambertMaterial({ color: PS.CFG.colors.trunk }));
    trunk.position.set(x, 3.5, z); trunk.rotation.z = (rng() - 0.5) * 0.2; scene.add(trunk);
    var leafMat = new THREE.MeshLambertMaterial({ color: PS.CFG.colors.palm });
    for (var i = 0; i < 5; i++) {
      var leaf = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.15, 1.1), leafMat);
      leaf.position.set(x, 7.2, z); leaf.rotation.y = i * 1.256; leaf.rotation.z = 0.45;
      leaf.translateX(2.2); scene.add(leaf);
    }
    colliders.push({ x: x, z: z, hw: 0.6, hd: 0.6 });
  }
  function lamp(scene, x, z) {
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 5),
      new THREE.MeshLambertMaterial({ color: 0x44484d }));
    pole.position.set(x, 3, z); scene.add(pole);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe9a3 }));
    bulb.position.set(x, 6.1, z); scene.add(bulb); lamps.push(bulb);
  }
  function prop(scene, x, z, rng) {
    var kinds = [0xc96f2e, 0x5b7a99, 0x777777];
    var m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6),
      new THREE.MeshLambertMaterial({ color: kinds[Math.floor(rng() * 3)] }));
    m.position.set(x, 0.8, z); m.rotation.y = rng() * 3; scene.add(m);
  }
  function collide(pos, r) {
    for (var i = 0; i < colliders.length; i++) {
      var c = colliders[i];
      var dx = pos.x - c.x, dz = pos.z - c.z;
      var px = c.hw + r - Math.abs(dx), pz = c.hd + r - Math.abs(dz);
      if (px > 0 && pz > 0) {
        if (px < pz) pos.x = c.x + (dx > 0 ? c.hw + r : -c.hw - r);
        else pos.z = c.z + (dz > 0 ? c.hd + r : -c.hd - r);
        return true;
      }
    }
    var W = PS.CFG.world / 2 - 4;
    pos.x = PS.clamp(pos.x, -W, W); pos.z = PS.clamp(pos.z, -W, PS.CFG.beachZ + 40);
    return false;
  }
  return { build: build, collide: collide, colliders: colliders, lamps: lamps };
})();
