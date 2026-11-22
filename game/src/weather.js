// Puerto Solano - weather.js: day cycle, sky, rain, fog.
PS.Weather = (function () {
  var hour = 17.4; // golden hour by default
  var state = 'clear'; // clear | rain | fog
  var sun = null, hemi = null, rainPts = null, sceneRef = null;
  var skyTop = new THREE.Color(), tmp = new THREE.Color();
  function init(scene) {
    sceneRef = scene;
    sun = new THREE.DirectionalLight(0xffe0b0, 1.05);
    sun.position.set(80, 120, 40); scene.add(sun);
    hemi = new THREE.HemisphereLight(0xbfe3ff, 0x8a7a5a, 0.55); scene.add(hemi);
    scene.fog = new THREE.Fog(0xf2c99a, 180, 620);
    // Rain: line segments recycled above the camera focus.
    var g = new THREE.BufferGeometry();
    var arr = new Float32Array(600 * 3);
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    rainPts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaaccee, size: 0.7, transparent: true, opacity: 0.7 }));
    rainPts.visible = false; scene.add(rainPts);
    apply();
  }
  function setHour(h) { hour = h; apply(); }
  function setState(s) { state = s; apply(); }
  function apply() {
    if (!sceneRef) return;
    var day = Math.sin(((hour - 6) / 12) * Math.PI); // 0 night .. 1 noon
    day = PS.clamp(day, 0, 1);
    var golden = PS.clamp(1 - Math.abs(hour - 17.6) / 2.2, 0, 1);
    skyTop.setHex(0x2a4a7f).lerp(tmp.setHex(0x87c5eb), day);
    if (golden > 0.3) skyTop.lerp(tmp.setHex(0xff9a5c), golden * 0.45);
    sceneRef.background = skyTop;
    if (sun) {
      sun.intensity = 0.25 + day * 0.9;
      sun.color.setHex(golden > 0.4 ? 0xffb066 : 0xfff2d8);
      var ang = ((hour - 6) / 12) * Math.PI;
      sun.position.set(Math.cos(ang) * 140, Math.max(14, Math.sin(ang) * 150), 60);
    }
    if (hemi) hemi.intensity = 0.25 + day * 0.4;
    if (sceneRef.fog) {
      sceneRef.fog.color.copy(skyTop);
      sceneRef.fog.near = state === 'fog' ? 30 : 180;
      sceneRef.fog.far = state === 'fog' ? 190 : (state === 'rain' ? 420 : 620);
    }
    if (rainPts) rainPts.visible = state === 'rain';
    PS.City.lamps.forEach(function (l) { l.material.color.setHex(day < 0.35 ? 0xffd76e : 0xffe9a3); });
  }
  function update(dt, focus) {
    hour += dt * 0.012; if (hour >= 24) hour -= 24;
    if (Math.random() < dt * 0.004) setState(['clear', 'clear', 'rain', 'fog'][Math.floor(Math.random() * 4)]);
    apply();
    if (rainPts && rainPts.visible && focus) {
      var a = rainPts.geometry.attributes.position.array;
      for (var i = 0; i < a.length; i += 3) {
        a[i + 1] -= dt * 55;
        if (a[i + 1] < 0) { a[i] = focus.x + (Math.random() - 0.5) * 90; a[i + 1] = 32 + Math.random() * 10; a[i + 2] = focus.z + (Math.random() - 0.5) * 90; }
      }
      rainPts.geometry.attributes.position.needsUpdate = true;
    }
  }
  return { init: init, update: update, setHour: setHour, setState: setState, get: function () { return { hour: hour, state: state }; } };
})();
