// Puerto Solano - audio.js: pure WebAudio engine, sirens, radio, SFX. No files.
PS.Audio = (function () {
  var ctx = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null;
  var radioTimer = 0, station = 0, radioOn = true, step = 0;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      engineOsc = ctx.createOscillator(); engineGain = ctx.createGain();
      engineOsc.type = 'sawtooth'; engineGain.gain.value = 0;
      engineOsc.connect(engineGain); engineGain.connect(ctx.destination); engineOsc.start();
      sirenOsc = ctx.createOscillator(); sirenGain = ctx.createGain();
      sirenOsc.type = 'triangle'; sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain); sirenGain.connect(ctx.destination); sirenOsc.start();
      return true;
    } catch (e) { return false; }
  }
  function beep(freq, dur, type, vol, slide) {
    if (!ensure()) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, ctx.currentTime + dur);
    g.gain.value = vol || 0.08;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  }
  function noise(dur, vol) {
    if (!ensure()) return;
    var len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var g = ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(ctx.destination); src.start();
  }
  function update(dt, speed, wanted, driving) {
    if (!ctx) return;
    if (engineGain) engineGain.gain.value = driving ? 0.03 + Math.abs(speed) * 0.0012 : 0;
    if (engineOsc) engineOsc.frequency.value = 55 + Math.abs(speed) * 3.2;
    if (sirenGain) sirenGain.gain.value = wanted > 0 ? 0.018 : 0;
    if (sirenOsc) sirenOsc.frequency.value = 660 + Math.sin(performance.now() * 0.006) * 180;
    // Procedural radio: chord + bass loop per station.
    if (radioOn && driving) {
      radioTimer -= dt;
      if (radioTimer <= 0) {
        radioTimer = 0.24; step++;
        var st = PS.RADIO[station], deg = st.mode[step % st.mode.length];
        var f = st.root * Math.pow(2, deg / 12);
        beep(f / 2, 0.22, 'triangle', 0.05);
        if (step % 4 === 0) beep(f, 0.5, 'sine', 0.035);
      }
    }
  }
  return {
    ensure: ensure, update: update,
    shot: function () { noise(0.12, 0.25); beep(180, 0.08, 'square', 0.1, 60); },
    thud: function () { noise(0.15, 0.2); beep(70, 0.15, 'sine', 0.15, 40); },
    chime: function () { beep(880, 0.15, 'sine', 0.1); setTimeout(function () { beep(1320, 0.25, 'sine', 0.1); }, 110); },
    click: function () { beep(1200, 0.05, 'square', 0.05); },
    cash: function () { beep(990, 0.1, 'square', 0.07); setTimeout(function () { beep(1480, 0.2, 'square', 0.07); }, 90); },
    cycleRadio: function () { station = (station + 1) % PS.RADIO.length; return PS.RADIO[station].name; },
    stationName: function () { return PS.RADIO[station].name; }
  };
})();
