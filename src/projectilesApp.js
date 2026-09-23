/**
 * projectilesApp.js
 * 
 * Interactive controller and canvas renderer for The Thinking Experiment:
 * Projectiles: Target Intercept & Kinematics Studio.
 * 
 * Design System Compliance:
 * - Primary Teal: #0f7e9b
 * - Accent Amber: #d67b19
 * - Pure White & Surface: #ffffff, rgba(255, 255, 255, 0.96)
 * - Strict prohibition: Zero purple or gold.
 */

(function () {
  "use strict";

  // DOM Elements
  const canvas = document.getElementById("simCanvas");
  const ctx = canvas.getContext("2d");
  const canvasViewport = document.getElementById("canvasViewport");

  // Playback Buttons
  const btnFire = document.getElementById("btnFire");
  const btnFireText = document.getElementById("btnFireText");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const btnReset = document.getElementById("btnReset");
  const btnQuickModeAction = document.getElementById("btnQuickModeAction");
  const speedPills = document.querySelectorAll(".speed-pill");

  // Toggles
  const toggleTargetLine = document.getElementById("toggleTargetLine");
  const toggleStrobes = document.getElementById("toggleStrobes");
  const toggleVectors = document.getElementById("toggleVectors");
  const toggleGrid = document.getElementById("toggleGrid");
  const toggleZeroG = document.getElementById("toggleZeroG");
  const toggleAudio = document.getElementById("toggleAudio");

  // Guide Drawer
  const btnToggleGuide = document.getElementById("btnToggleGuide");
  const btnCloseGuide = document.getElementById("btnCloseGuide");
  const activityGuide = document.getElementById("activityGuide");

  // Status Banner
  const lockBanner = document.getElementById("lockBanner");
  const lockBannerBadge = document.getElementById("lockBannerBadge");
  const lockBannerText = document.getElementById("lockBannerText");
  const lockBannerSub = document.getElementById("lockBannerSub");

  // Telemetry Console
  const teleTime = document.getElementById("teleTime");
  const telePos = document.getElementById("telePos");
  const teleVel = document.getElementById("teleVel");
  const teleSpeed = document.getElementById("teleSpeed");
  const teleTargetY = document.getElementById("teleTargetY");
  const teleDrop = document.getElementById("teleDrop");

  // Mode Nav Pills
  const modePillBtns = document.querySelectorAll(".mode-pill-btn");
  const modeControlPanels = {
    monkey: document.getElementById("controls-monkey"),
    "mark-rober": document.getElementById("controls-mark-rober"),
    classroom: document.getElementById("controls-classroom"),
    sandbox: document.getElementById("controls-sandbox")
  };

  // Subtabs in Right Column
  const tabPills = document.querySelectorAll(".tab-pill");
  const subtabContents = {
    controls: document.getElementById("subtab-controls"),
    math: document.getElementById("subtab-math"),
    tchart: document.getElementById("subtab-tchart"),
    logger: document.getElementById("subtab-logger")
  };

  // Preset Pills Container
  const presetPillsContainer = document.getElementById("presetPillsContainer");

  // Sound Engine
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    playLaunch() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    }
    playHit() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    }
    playMiss() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    }
  }

  const sfx = new SoundFX();

  // App State
  const state = {
    mode: "monkey",
    isRunning: false,
    isPaused: false,
    hasEnded: false,
    simTime: 0,
    playbackSpeed: 1.0,

    // Toggles
    showTargetLine: true,
    showStrobes: true,
    showVectors: true,
    showGrid: false,
    showZeroG: false,

    // Mode 1: Monkey
    monkey: {
      x0: 0,
      y0: 0,
      v0: 26.0,
      thetaDeg: 32.6,
      xm: 25.0,
      ym: 16.0,
      g: 9.80,
      monkeyY: 16.0,
      bananaPos: { x: 0, y: 0 },
      isCaught: false,
      hitResult: null
    },

    // Mode 2: Mark Rober
    markRober: {
      x0: 0,
      y0: 1.8,
      v0: 15.0,
      alphaDeg: 40.0,
      xBoard: 5.0,
      boardY: 1.8,
      ceilingY: 7.0,
      g: 10.0,
      dartPos: { x: 0, y: 1.8 },
      hitResult: null
    },

    // Mode 3: Classroom Notes
    classroom: {
      x0: 0,
      y0: 320,
      v0: 42.0,
      thetaDeg: 30.0,
      g: 10.0,
      x1: 230,
      x2: 310,
      bldgHeight: 70,
      projPos: { x: 0, y: 320 },
      hitResult: null
    },

    // Mode 4: Sandbox
    sandbox: {
      x0: 0,
      y0: 10.0,
      v0: 25.0,
      thetaDeg: 45.0,
      g: 9.80,
      targetX: 50.0,
      targetY: 0.0,
      projPos: { x: 0, y: 10.0 },
      hitResult: null
    },

    trials: []
  };

  let currentTrajectory = [];
  let currentStrobes = [];
  let currentZeroGTrajectory = [];

  // ==========================================================================
  // Math Renderer Helper (KaTeX + Pure Typographic HTML Fallback)
  // ==========================================================================

  function renderMathBlock(container, latexString, htmlFallback) {
    if (!container) return;
    if (window.katex && typeof window.katex.render === "function") {
      try {
        window.katex.render(latexString, container, {
          displayMode: true,
          throwOnError: false
        });
        return;
      } catch (e) {
        console.warn("KaTeX error, falling back to HTML:", e);
      }
    }
    container.innerHTML = htmlFallback;
  }

  // ==========================================================================
  // Viewport & Coordinate Transforms
  // ==========================================================================

  function resizeCanvas() {
    const rect = canvasViewport.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width;
    const displayHeight = displayWidth * (9 / 16);

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    render();
  }

  window.addEventListener("resize", resizeCanvas);

  function getViewportBounds() {
    const rect = canvasViewport.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    let worldXMin = -2;
    let worldXMax = 35;
    let worldYMin = -1;
    let worldYMax = 25;

    if (state.mode === "monkey") {
      worldXMin = -3;
      worldXMax = Math.max(state.monkey.xm + 7, 34);
      worldYMin = -1.5;
      worldYMax = Math.max(state.monkey.ym + 5, 23);
    } else if (state.mode === "mark-rober") {
      worldXMin = -1.5;
      worldXMax = Math.max(state.markRober.xBoard + 3, 9);
      worldYMin = -0.5;
      worldYMax = Math.max(state.markRober.ceilingY + 1.2, 9.2);
    } else if (state.mode === "classroom") {
      worldXMin = -25;
      worldXMax = 410;
      worldYMin = -20;
      worldYMax = 380;
    } else if (state.mode === "sandbox") {
      worldXMin = -4;
      worldXMax = 75;
      worldYMin = -4;
      worldYMax = 50;
    }

    const padding = 42;
    const availW = w - padding * 2;
    const availH = h - padding * 2;

    const scaleX = availW / (worldXMax - worldXMin);
    const scaleY = availH / (worldYMax - worldYMin);
    const scale = Math.min(scaleX, scaleY);

    return {
      w,
      h,
      worldXMin,
      worldXMax,
      worldYMin,
      worldYMax,
      scale,
      originX: padding - worldXMin * scale,
      originY: h - padding + worldYMin * scale
    };
  }

  function worldToScreen(wx, wy, bounds) {
    return {
      x: bounds.originX + wx * bounds.scale,
      y: bounds.originY - wy * bounds.scale
    };
  }

  function screenToWorld(sx, sy, bounds) {
    return {
      x: (sx - bounds.originX) / bounds.scale,
      y: (bounds.originY - sy) / bounds.scale
    };
  }

  // ==========================================================================
  // Physics Computation
  // ==========================================================================

  function refreshCurrentPhysics() {
    if (state.mode === "monkey") {
      const m = state.monkey;
      const directAim = Math.atan2(m.ym - m.y0, m.xm - m.x0) * (180 / Math.PI);

      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: m.x0,
        y0: m.y0,
        v0: m.v0,
        thetaDeg: m.thetaDeg,
        g: m.g,
        groundY: 0,
        dt: 0.01,
        maxT: 15
      });
      currentTrajectory = trajRes.points;
      currentStrobes = ProjectilesPhysics.generateStrobePoints(currentTrajectory, 0.10);

      if (state.showZeroG) {
        const zg = ProjectilesPhysics.generateTrajectory({
          x0: m.x0,
          y0: m.y0,
          v0: m.v0,
          thetaDeg: m.thetaDeg,
          g: 0,
          groundY: -100,
          dt: 0.02,
          maxT: 5
        });
        currentZeroGTrajectory = zg.points;
      }

      m.hitResult = ProjectilesPhysics.calculateMonkeyIntercept({
        x0: m.x0,
        y0: m.y0,
        xm: m.xm,
        ym: m.ym,
        v0: m.v0,
        thetaDeg: m.thetaDeg,
        g: m.g,
        catchRadius: 0.65
      });

    } else if (state.mode === "mark-rober") {
      const mr = state.markRober;
      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: mr.x0,
        y0: mr.y0,
        v0: mr.v0,
        thetaDeg: mr.alphaDeg,
        g: mr.g,
        ceilingY: mr.ceilingY,
        groundY: 0,
        dt: 0.005,
        maxT: 10
      });
      currentTrajectory = trajRes.points;
      currentStrobes = ProjectilesPhysics.generateStrobePoints(currentTrajectory, 0.05);

      mr.hitResult = ProjectilesPhysics.calculateMarkRoberDartboard({
        x0: mr.x0,
        y0: mr.y0,
        xBoard: mr.xBoard,
        v0: mr.v0,
        alphaDeg: mr.alphaDeg,
        g: mr.g,
        ceilingY: mr.ceilingY
      });

    } else if (state.mode === "classroom") {
      const cp = state.classroom;
      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: cp.x0,
        y0: cp.y0,
        v0: cp.v0,
        thetaDeg: cp.thetaDeg,
        g: cp.g,
        groundY: 0,
        obstacle: { x1: cp.x1, x2: cp.x2, height: cp.bldgHeight },
        dt: 0.02,
        maxT: 25
      });
      currentTrajectory = trajRes.points;
      currentStrobes = ProjectilesPhysics.generateStrobePoints(currentTrajectory, 0.50);

      cp.hitResult = ProjectilesPhysics.calculateBuildingObstacle({
        x0: cp.x0,
        y0: cp.y0,
        v0: cp.v0,
        thetaDeg: cp.thetaDeg,
        g: cp.g,
        x1: cp.x1,
        x2: cp.x2,
        bldgHeight: cp.bldgHeight
      });

    } else if (state.mode === "sandbox") {
      const sb = state.sandbox;
      const trajRes = ProjectilesPhysics.generateTrajectory({
        x0: sb.x0,
        y0: sb.y0,
        v0: sb.v0,
        thetaDeg: sb.thetaDeg,
        g: sb.g,
        groundY: 0,
        dt: 0.01,
        maxT: 20
      });
      currentTrajectory = trajRes.points;
      currentStrobes = ProjectilesPhysics.generateStrobePoints(currentTrajectory, 0.15);
    }

    updatePedagogyCards();
  }

  // ==========================================================================
  // Simulation Loop
  // ==========================================================================

  let lastTimestamp = null;

  function runSimulationLoop(timestamp) {
    if (!state.isRunning) return;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const realDt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (!state.isPaused) {
      stepSimulation(realDt * state.playbackSpeed);
    }

    render();

    if (state.isRunning) {
      requestAnimationFrame(runSimulationLoop);
    }
  }

  function stepSimulation(dt) {
    state.simTime += dt;
    const t = state.simTime;

    if (state.mode === "monkey") {
      const m = state.monkey;
      const decomp = ProjectilesPhysics.decomposeVelocity(m.v0, m.thetaDeg);
      const pos = ProjectilesPhysics.getPositionAtTime({
        x0: m.x0,
        y0: m.y0,
        vx: decomp.vx,
        vy: decomp.vy,
        g: m.g,
        t: t
      });
      m.bananaPos = pos;
      m.monkeyY = Math.max(0, m.ym - 0.5 * m.g * t * t);

      const tHit = m.hitResult.tIntercept;
      if (t >= tHit && !state.hasEnded) {
        state.hasEnded = true;
        if (m.hitResult.isHit) {
          m.isCaught = true;
          sfx.playHit();
          setBanner("hit", "INTERCEPT HIT", `🎉 Monkey caught the banana at t = ${tHit.toFixed(2)}s, elevation = ${m.hitResult.yMonkeyAtTime.toFixed(2)}m!`);
          logTrial("Feed the Monkey", m.v0, m.thetaDeg, tHit, m.xm, m.hitResult.yMonkeyAtTime, "CAUGHT");
        } else {
          sfx.playMiss();
          const dev = m.hitResult.verticalDeviation.toFixed(2);
          const dir = m.bananaPos.y > m.monkeyY ? "above" : "below";
          setBanner("miss", "MISSED TARGET", `Banana passed ${dev}m ${dir} the falling monkey.`);
          logTrial("Feed the Monkey", m.v0, m.thetaDeg, tHit, m.bananaPos.x, m.bananaPos.y, `MISS (${dir})`);
        }
        pauseSimulation();
      } else if (pos.y <= 0 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setBanner("miss", "GROUND IMPACT", `Banana struck the ground before reaching monkey.`);
        logTrial("Feed the Monkey", m.v0, m.thetaDeg, t, pos.x, 0, "GROUND HIT");
        pauseSimulation();
      }

    } else if (state.mode === "mark-rober") {
      const mr = state.markRober;
      const decomp = ProjectilesPhysics.decomposeVelocity(mr.v0, mr.alphaDeg);
      const pos = ProjectilesPhysics.getPositionAtTime({
        x0: mr.x0,
        y0: mr.y0,
        vx: decomp.vx,
        vy: decomp.vy,
        g: mr.g,
        t: t
      });
      mr.dartPos = pos;

      const targetH = mr.hitResult.targetHeightH;
      const tBoard = mr.hitResult.tBoard;
      const progress = Math.min(1, t / tBoard);
      mr.boardY = mr.y0 + (targetH - mr.y0) * progress;

      if (mr.hitResult.hitsCeiling && t >= mr.hitResult.tCeiling && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setBanner("miss", "CEILING HIT", `💥 Dart collided with workshop ceiling at x = ${mr.hitResult.xCeiling.toFixed(1)}m!`);
        logTrial("Mark Rober", mr.v0, mr.alphaDeg, mr.hitResult.tCeiling, mr.hitResult.xCeiling, mr.ceilingY, "CEILING HIT");
        pauseSimulation();
      } else if (t >= tBoard && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playHit();
        setBanner("hit", "BULLSEYE HIT", `🎯 Perfect Bullseye! Dartboard caught dart at height H = ${targetH.toFixed(2)}m (t = ${tBoard.toFixed(2)}s)!`);
        logTrial("Mark Rober", mr.v0, mr.alphaDeg, tBoard, mr.xBoard, targetH, "BULLSEYE");
        pauseSimulation();
      }

    } else if (state.mode === "classroom") {
      const cp = state.classroom;
      const decomp = ProjectilesPhysics.decomposeVelocity(cp.v0, cp.thetaDeg);
      const pos = ProjectilesPhysics.getPositionAtTime({
        x0: cp.x0,
        y0: cp.y0,
        vx: decomp.vx,
        vy: decomp.vy,
        g: cp.g,
        t: t
      });
      cp.projPos = pos;

      const hit = cp.hitResult;
      if (hit.collisionType !== "none" && t >= hit.collisionT && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setBanner("miss", "BUILDING COLLISION", `Crashed into building ${hit.collisionType === "roof" ? "roof" : "front wall"} at x = ${hit.collisionX.toFixed(1)}m!`);
        logTrial("Classroom", cp.v0, cp.thetaDeg, hit.collisionT, hit.collisionX, hit.collisionY, "BUILDING HIT");
        pauseSimulation();
      } else if (pos.x >= cp.x2 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playHit();
        setBanner("hit", "CLEARED BUILDING", `Cleared Building! Height at far edge was ${hit.y2.toFixed(1)}m (cleared ${cp.bldgHeight}m roof by ${(hit.y2 - cp.bldgHeight).toFixed(1)}m)!`);
        logTrial("Classroom", cp.v0, cp.thetaDeg, t, pos.x, pos.y, "CLEARED");
        pauseSimulation();
      } else if (pos.y <= 0 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playMiss();
        setBanner("miss", "GROUND IMPACT", `Landed on ground at x = ${pos.x.toFixed(1)}m.`);
        logTrial("Classroom", cp.v0, cp.thetaDeg, t, pos.x, 0, "GROUND HIT");
        pauseSimulation();
      }

    } else if (state.mode === "sandbox") {
      const sb = state.sandbox;
      const decomp = ProjectilesPhysics.decomposeVelocity(sb.v0, sb.thetaDeg);
      const pos = ProjectilesPhysics.getPositionAtTime({
        x0: sb.x0,
        y0: sb.y0,
        vx: decomp.vx,
        vy: decomp.vy,
        g: sb.g,
        t: t
      });
      sb.projPos = pos;

      if (pos.y <= 0 && !state.hasEnded) {
        state.hasEnded = true;
        sfx.playHit();
        setBanner("ready", "FLIGHT COMPLETE", `Landed at x = ${pos.x.toFixed(1)}m, flight time = ${t.toFixed(2)}s.`);
        logTrial("Sandbox", sb.v0, sb.thetaDeg, t, pos.x, 0, "LANDED");
        pauseSimulation();
      }
    }

    updateTelemetryHUD();
  }

  function fireSimulation() {
    if (state.isRunning && state.isPaused) {
      resumeSimulation();
      return;
    }

    resetSimulation();
    state.isRunning = true;
    state.isPaused = false;
    state.hasEnded = false;
    lastTimestamp = null;

    btnFire.disabled = true;
    btnPause.disabled = false;
    setBanner("running", "IN FLIGHT", "Projectile is in motion. Tracking telemetry...");
    sfx.playLaunch();
    requestAnimationFrame(runSimulationLoop);
  }

  function pauseSimulation() {
    state.isPaused = true;
    btnPause.innerHTML = '<span>▶</span> Resume';
    btnFire.disabled = false;
    btnFireText.textContent = "Relaunch";
  }

  function resumeSimulation() {
    state.isPaused = false;
    btnPause.innerHTML = '<span>❚❚</span> Pause';
    lastTimestamp = null;
    requestAnimationFrame(runSimulationLoop);
  }

  function stepForward() {
    if (!state.isRunning) {
      state.isRunning = true;
      state.isPaused = true;
      btnPause.disabled = false;
      btnPause.innerHTML = '<span>▶</span> Resume';
    }
    stepSimulation(0.05);
    render();
  }

  function resetSimulation() {
    state.isRunning = false;
    state.isPaused = false;
    state.hasEnded = false;
    state.simTime = 0;
    lastTimestamp = null;

    btnFire.disabled = false;
    btnPause.disabled = true;
    btnPause.innerHTML = '<span>❚❚</span> Pause';
    btnFireText.textContent = state.mode === "mark-rober" ? "Throw Dart" : "Fire Cannon";

    if (state.mode === "monkey") {
      state.monkey.bananaPos = { x: state.monkey.x0, y: state.monkey.y0 };
      state.monkey.monkeyY = state.monkey.ym;
      state.monkey.isCaught = false;
      setBanner("ready", "FEED THE MONKEY", "Aim directly along line of sight. Both will drop by ½gt²!");
    } else if (state.mode === "mark-rober") {
      state.markRober.dartPos = { x: state.markRober.x0, y: state.markRober.y0 };
      state.markRober.boardY = state.markRober.y0;
      setBanner("ready", "MARK ROBER DARTBOARD", "Release dart to see motorized board slide along vertical track to intercept!");
    } else if (state.mode === "classroom") {
      state.classroom.projPos = { x: state.classroom.x0, y: state.classroom.y0 };
      setBanner("ready", "CLASSROOM NOTES", "Launch from 320m cliff over 70m building. Watch horizontal & vertical kinematics!");
    } else if (state.mode === "sandbox") {
      state.sandbox.projPos = { x: state.sandbox.x0, y: state.sandbox.y0 };
      setBanner("ready", "FREE SANDBOX", "Adjust velocity, launch angle, and platform height freely.");
    }

    refreshCurrentPhysics();
    updateTelemetryHUD();
    render();
  }

  function setBanner(type, badgeText, message) {
    lockBanner.className = `lock-banner ${type}`;
    lockBannerBadge.textContent = badgeText;
    lockBannerText.textContent = message;
    lockBannerSub.textContent = type.toUpperCase();
  }

  // ==========================================================================
  // HUD Telemetry & Cornell T-Chart Reactive UI
  // ==========================================================================

  function updateTelemetryHUD() {
    const t = state.simTime;
    teleTime.textContent = t.toFixed(2) + " s";

    let pos = { x: 0, y: 0 };
    let v0 = 20, thetaDeg = 45, g = 9.80;

    if (state.mode === "monkey") {
      pos = state.monkey.bananaPos;
      v0 = state.monkey.v0;
      thetaDeg = state.monkey.thetaDeg;
      g = state.monkey.g;
      teleTargetY.textContent = state.monkey.monkeyY.toFixed(1) + " m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(2) + " m";
    } else if (state.mode === "mark-rober") {
      pos = state.markRober.dartPos;
      v0 = state.markRober.v0;
      thetaDeg = state.markRober.alphaDeg;
      g = state.markRober.g;
      teleTargetY.textContent = state.markRober.boardY.toFixed(2) + " m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(2) + " m";
    } else if (state.mode === "classroom") {
      pos = state.classroom.projPos;
      v0 = state.classroom.v0;
      thetaDeg = state.classroom.thetaDeg;
      g = state.classroom.g;
      teleTargetY.textContent = state.classroom.bldgHeight.toFixed(0) + " m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(1) + " m";
    } else {
      pos = state.sandbox.projPos;
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
      teleTargetY.textContent = "0.0 m";
      teleDrop.textContent = (0.5 * g * t * t).toFixed(2) + " m";
    }

    telePos.textContent = `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) m`;

    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const vel = ProjectilesPhysics.getVelocityAtTime({
      vx: decomp.vx,
      vy: decomp.vy,
      g: g,
      t: t
    });

    teleVel.textContent = `(${vel.vx.toFixed(1)}, ${vel.vy.toFixed(1)}) m/s`;
    teleSpeed.textContent = vel.speed.toFixed(1) + " m/s";

    // Update live evaluation values in Cornell T-Chart
    const tcSubX = document.getElementById("tcSubX");
    const tcSubVy = document.getElementById("tcSubVy");
    const tcSubY = document.getElementById("tcSubY");
    if (tcSubX) tcSubX.textContent = `x = ${pos.x.toFixed(1)} m`;
    if (tcSubVy) tcSubVy.textContent = `vᵧ = ${vel.vy.toFixed(1)} m/s`;
    if (tcSubY) tcSubY.textContent = `y = ${pos.y.toFixed(1)} m`;
  }

  // ==========================================================================
  // Beautiful Math Solution Card (Fixed KaTeX + Clean Stacked Fractions)
  // ==========================================================================

  function updatePedagogyCards() {
    let v0 = 26, thetaDeg = 32.6, g = 9.80, x0 = 0, y0 = 0;

    if (state.mode === "monkey") {
      v0 = state.monkey.v0;
      thetaDeg = state.monkey.thetaDeg;
      g = state.monkey.g;
      x0 = state.monkey.x0;
      y0 = state.monkey.y0;

      const mathContainer = document.getElementById("mathCardContent");
      const m = state.monkey;
      const res = m.hitResult;
      const directDeg = res ? res.directAimAngleDeg.toFixed(1) : "32.6";
      const tInt = res ? res.tIntercept.toFixed(2) : "1.00";
      const drop = res ? res.dropDist.toFixed(2) : "4.90";
      const yCatch = res ? res.yMonkeyAtTime.toFixed(2) : "11.10";

      const htmlContent = `
        <div class="math-title">
          <span>🐵 Feed the Monkey: Free-Fall Intercept Proof</span>
          <span class="lab-badge" style="font-size: 0.72rem;">Gizmo Activity</span>
        </div>
        
        <p style="font-size: 0.8rem; color: var(--muted); margin-bottom: 0.5rem;">
          1. Direct Line-of-Sight Aim Angle (<span class="math-expr">θ<sub>aim</sub></span>):
        </p>
        <div class="math-eq-row">
          <span class="math-expr">tan(θ)</span> = 
          <span class="fraction"><span class="num">y<sub>m</sub> - y<sub>0</sub></span><span class="den">x<sub>m</sub> - x<sub>0</sub></span></span> = 
          <span class="fraction"><span class="num">${m.ym.toFixed(1)} - ${m.y0.toFixed(1)}</span><span class="den">${m.xm.toFixed(1)} - ${m.x0.toFixed(1)}</span></span> &implies; 
          <span class="math-eval-tag">θ = ${directDeg}°</span>
        </div>

        <p style="font-size: 0.8rem; color: var(--muted); margin-bottom: 0.5rem;">
          2. Equal Vertical Drop Below Line-of-Sight (<span class="math-expr">Δy</span>):
        </p>
        <div class="math-eq-row">
          <span class="math-expr">t<sub>intercept</sub></span> = 
          <span class="fraction"><span class="num">Δx</span><span class="den">v<sub>0</sub>·cos(θ)</span></span> = 
          <span class="math-eval-tag">${tInt} s</span>
        </div>
        <div class="math-eq-row">
          <span class="math-expr">Δy<sub>drop</sub></span> = 
          <span class="fraction"><span class="num">1</span><span class="den">2</span></span>·g·t² = 
          <span class="fraction"><span class="num">1</span><span class="den">2</span></span>·(${g.toFixed(1)})·(${tInt})² = 
          <span class="math-eval-tag">${drop} m</span>
        </div>

        <div class="status-badge-inline safe" style="width: 100%; justify-content: center; margin-top: 0.4rem;">
          ${res && res.isAimedAtMonkey ? `🎯 Aimed directly: Banana & Monkey both drop by ${drop}m &rarr; GUARANTEED HIT at ${yCatch}m!` : `⚠️ Not aimed directly (${thetaDeg.toFixed(1)}° vs ${directDeg}°). Misses target.`}
        </div>
      `;
      if (mathContainer) mathContainer.innerHTML = htmlContent;

    } else if (state.mode === "mark-rober") {
      v0 = state.markRober.v0;
      thetaDeg = state.markRober.alphaDeg;
      g = state.markRober.g;
      x0 = state.markRober.x0;
      y0 = state.markRober.y0;

      const mathContainer = document.getElementById("mathCardContent");
      const mr = state.markRober;
      const res = mr.hitResult;

      const tBoard = res ? res.tBoard.toFixed(3) : "0.435";
      const targetH = res ? res.targetHeightH.toFixed(2) : "5.05";
      const tApex = res ? res.tApex.toFixed(3) : "0.964";
      const hMax = res ? res.maxDartHeight.toFixed(2) : "6.45";
      const vx = res ? res.vx.toFixed(2) : "11.49";
      const vy = res ? res.vy.toFixed(2) : "9.64";

      const htmlContent = `
        <div class="math-title">
          <span>🎯 Mark Rober Automated Dartboard Solution</span>
          <span class="lab-badge" style="font-size: 0.72rem;">Worksheet Problems</span>
        </div>

        <p style="font-size: 0.8rem; font-weight: 700; color: var(--ink); margin-bottom: 0.35rem;">
          Question 1: What height H must the target bullseye be to guarantee a hit?
        </p>
        <div class="math-eq-row">
          <span class="math-expr">t</span> = 
          <span class="fraction"><span class="num">x</span><span class="den">v<sub>0</sub>·cos(α)</span></span> = 
          <span class="fraction"><span class="num">${mr.xBoard.toFixed(1)} m</span><span class="den">${vx} m/s</span></span> = 
          <span class="math-eval-tag">t = ${tBoard} s</span>
        </div>
        <div class="math-eq-row">
          <span class="math-expr">H</span> = 
          h<sub>0</sub> + v<sub>0y</sub>·t - <span class="fraction"><span class="num">1</span><span class="den">2</span></span>·g·t² = 
          ${mr.y0.toFixed(1)} + (${vy})·(${tBoard}) - 0.5·(${g.toFixed(1)})·(${tBoard})² = 
          <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">H = ${targetH} m</span>
        </div>

        <p style="font-size: 0.8rem; font-weight: 700; color: var(--ink); margin-top: 0.65rem; margin-bottom: 0.35rem;">
          Question 2: What is the maximum height h<sub>max</sub> the dart will reach?
        </p>
        <div class="math-eq-row">
          <span class="math-expr">h<sub>max</sub></span> = 
          h<sub>0</sub> + <span class="fraction"><span class="num">v<sub>0y</sub>²</span><span class="den">2g</span></span> = 
          ${mr.y0.toFixed(1)} + <span class="fraction"><span class="num">(${vy})²</span><span class="den">2·(${g.toFixed(1)})</span></span> = 
          <span class="math-eval-tag">h<sub>max</sub> = ${hMax} m</span>
          <span style="font-size: 0.78rem; color: var(--muted); margin-left: 0.5rem;">(at t<sub>apex</sub> = ${tApex} s)</span>
        </div>

        <div class="status-badge-inline ${res && res.hitsCeiling ? 'warn' : 'safe'}" style="width: 100%; justify-content: center; margin-top: 0.4rem;">
          ${res && res.hitsCeiling ? `⚠️ Workshop Ceiling Hit! Roof at ${mr.ceilingY.toFixed(1)}m intercepts dart at x = ${res.xCeiling.toFixed(1)}m!` : `✅ Workshop Ceiling at ${mr.ceilingY.toFixed(1)}m > ${hMax}m &rarr; Safe clearance!`}
        </div>
      `;
      if (mathContainer) mathContainer.innerHTML = htmlContent;

    } else if (state.mode === "classroom") {
      v0 = state.classroom.v0;
      thetaDeg = state.classroom.thetaDeg;
      g = state.classroom.g;
      x0 = state.classroom.x0;
      y0 = state.classroom.y0;

      const mathContainer = document.getElementById("mathCardContent");
      const cp = state.classroom;
      const res = cp.hitResult;

      const maxH = res ? res.maxH.toFixed(2) : "342.05";
      const tApex = res ? res.tApex.toFixed(2) : "2.10";
      const t2 = res ? res.t2.toFixed(2) : "8.52";
      const y2 = res ? res.y2.toFixed(1) : "135.8";
      const vx = res ? res.vx.toFixed(1) : "36.4";
      const vy = res ? res.vy.toFixed(1) : "21.0";

      const htmlContent = `
        <div class="math-title">
          <span>📋 Classroom Notes: Cliff &amp; Building Obstacle (p. 7–8, 13–14)</span>
          <span class="lab-badge" style="font-size: 0.72rem;">GoodNotes Lecture</span>
        </div>

        <p style="font-size: 0.8rem; font-weight: 700; color: var(--ink); margin-bottom: 0.35rem;">
          Part a) Maximum Height (<span class="math-expr">h<sub>max</sub></span>):
        </p>
        <div class="math-eq-row">
          <span class="math-expr">h<sub>max</sub></span> = 
          y<sub>0</sub> + <span class="fraction"><span class="num">v<sub>0y</sub>²</span><span class="den">2g</span></span> = 
          ${cp.y0} + <span class="fraction"><span class="num">(${vy})²</span><span class="den">2·(${g.toFixed(1)})</span></span> = 
          <span class="math-eval-tag">342.05 m</span>
          <span style="font-size: 0.78rem; color: var(--muted); margin-left: 0.5rem;">(t<sub>up</sub> = ${tApex} s)</span>
        </div>

        <p style="font-size: 0.8rem; font-weight: 700; color: var(--ink); margin-top: 0.65rem; margin-bottom: 0.35rem;">
          Part b) Building Clearance Check (at far edge x = ${cp.x2} m):
        </p>
        <div class="math-eq-row">
          <span class="math-expr">t</span> = 
          <span class="fraction"><span class="num">Δx</span><span class="den">v<sub>x</sub></span></span> = 
          <span class="fraction"><span class="num">${cp.x2} m</span><span class="den">${vx} m/s</span></span> = 
          <span class="math-eval-tag">t = ${t2} s</span>
        </div>
        <div class="math-eq-row">
          <span class="math-expr">y(t)</span> = 
          ${cp.y0} + (${vy})·(${t2}) - <span class="fraction"><span class="num">1</span><span class="den">2</span></span>·(${g.toFixed(1)})·(${t2})² = 
          <span class="math-eval-tag" style="background: var(--primary-teal-light); color: var(--primary-teal-dark);">y = ${y2} m</span>
        </div>

        <div class="status-badge-inline ${res && res.clearsBuilding ? 'safe' : 'warn'}" style="width: 100%; justify-content: center; margin-top: 0.4rem;">
          ${res && res.clearsBuilding ? `✅ y = ${y2}m > ${cp.bldgHeight}m: Projectile clears building roof by ${(y2 - cp.bldgHeight).toFixed(1)}m!` : `❌ Building collision: Strikes ${res ? res.collisionType : 'wall'}!`}
        </div>
      `;
      if (mathContainer) mathContainer.innerHTML = htmlContent;

    } else {
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
      x0 = state.sandbox.x0;
      y0 = state.sandbox.y0;

      const mathContainer = document.getElementById("mathCardContent");
      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const tFlight = ProjectilesPhysics.calculateTimeOfFlight(y0, decomp.vy, g, 0);
      const range = (decomp.vx * tFlight).toFixed(1);
      const maxH = ProjectilesPhysics.calculateMaxHeight(y0, decomp.vy, g).toFixed(1);

      const htmlContent = `
        <div class="math-title">
          <span>🧪 Free Sandbox Kinematics Equations</span>
          <span class="lab-badge" style="font-size: 0.72rem;">Ideal Physics</span>
        </div>
        <div class="math-eq-row">
          <span>v<sub>0x</sub> = ${decomp.vx.toFixed(2)} m/s &bull; v<sub>0y</sub> = ${decomp.vy.toFixed(2)} m/s</span>
        </div>
        <div class="math-eq-row">
          <span>Total Flight Time: <strong>${tFlight.toFixed(2)} s</strong> &bull; Range: <strong>${range} m</strong></span>
        </div>
        <div class="math-eq-row">
          <span>Max Apex Height: <strong>${maxH} m</strong></span>
        </div>
      `;
      if (mathContainer) mathContainer.innerHTML = htmlContent;
    }

    // Update Cornell T-Chart
    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const tcVx = document.getElementById("tcVx");
    const tcAy = document.getElementById("tcAy");
    const sohCalcVx = document.getElementById("sohCalcVx");
    const sohCalcVy = document.getElementById("sohCalcVy");

    if (tcVx) tcVx.textContent = decomp.vx.toFixed(1);
    if (tcAy) tcAy.textContent = (-g).toFixed(1);
    if (sohCalcVx) sohCalcVx.textContent = `${v0.toFixed(1)} · cos(${thetaDeg.toFixed(1)}°) = ${decomp.vx.toFixed(2)} m/s`;
    if (sohCalcVy) sohCalcVy.textContent = `${v0.toFixed(1)} · sin(${thetaDeg.toFixed(1)}°) = ${decomp.vy.toFixed(2)} m/s`;
  }

  // ==========================================================================
  // Canvas Rendering Pipeline (Laboratory Quality Vector Graphics)
  // ==========================================================================

  function render() {
    const rect = canvasViewport.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const bounds = getViewportBounds();

    drawBackground(bounds, w, h);

    if (state.mode === "monkey") {
      drawMonkeyScene(bounds);
    } else if (state.mode === "mark-rober") {
      drawMarkRoberScene(bounds);
    } else if (state.mode === "classroom") {
      drawClassroomScene(bounds);
    } else if (state.mode === "sandbox") {
      drawSandboxScene(bounds);
    }

    drawTrajectories(bounds);
    drawProjectileAndVectors(bounds);
  }

  function drawBackground(b, w, h) {
    // Sky gradient matching The Thinking Experiment theme
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#ffffff");
    sky.addColorStop(1, "#f4f9fb");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Metric Grid
    if (state.showGrid) {
      ctx.strokeStyle = "#e1ebf0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const xStep = state.mode === "classroom" ? 50 : 5;
      const yStep = state.mode === "classroom" ? 50 : 5;

      for (let wx = 0; wx <= b.worldXMax; wx += xStep) {
        const p1 = worldToScreen(wx, b.worldYMin, b);
        const p2 = worldToScreen(wx, b.worldYMax, b);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      for (let wy = 0; wy <= b.worldYMax; wy += yStep) {
        const p1 = worldToScreen(b.worldXMin, wy, b);
        const p2 = worldToScreen(b.worldXMax, wy, b);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }

    // Ground line & floor hatch
    const gL = worldToScreen(b.worldXMin, 0, b);
    const gR = worldToScreen(b.worldXMax, 0, b);
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gL.x, gL.y);
    ctx.lineTo(gR.x, gR.y);
    ctx.stroke();

    ctx.fillStyle = "#eaf2f5";
    ctx.fillRect(gL.x, gL.y, gR.x - gL.x, h - gL.y);

    // Graduation ticks along ground
    ctx.strokeStyle = "#a9c4cf";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const tickStep = state.mode === "classroom" ? 50 : 5;
    for (let wx = 0; wx <= b.worldXMax; wx += tickStep) {
      const p = worldToScreen(wx, 0, b);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + 6);
    }
    ctx.stroke();
  }

  function drawMonkeyScene(b) {
    const m = state.monkey;
    const treeX = worldToScreen(m.xm, 0, b).x;
    const treeBase = worldToScreen(m.xm, 0, b).y;
    const branchTop = worldToScreen(m.xm, m.ym, b).y;

    // Tree Trunk
    ctx.fillStyle = "#7a4e2d";
    ctx.fillRect(treeX - 10, branchTop - 12, 20, treeBase - branchTop + 12);

    // Branch
    ctx.fillStyle = "#5a3820";
    ctx.beginPath();
    ctx.roundRect(treeX - 45, branchTop - 14, 65, 14, 4);
    ctx.fill();

    // Foliage
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.arc(treeX + 10, branchTop - 32, 36, 0, Math.PI * 2);
    ctx.arc(treeX - 20, branchTop - 40, 28, 0, Math.PI * 2);
    ctx.arc(treeX + 35, branchTop - 24, 26, 0, Math.PI * 2);
    ctx.fill();

    // Monkey
    const monkPt = worldToScreen(m.xm, m.monkeyY, b);
    drawMonkeySprite(monkPt.x - 14, monkPt.y, m.isCaught);

    // Initial branch reference marker
    if (state.simTime > 0) {
      ctx.strokeStyle = "rgba(18, 49, 64, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(treeX - 40, branchTop);
      ctx.lineTo(treeX + 40, branchTop);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Cannon
    const canPt = worldToScreen(m.x0, m.y0, b);
    drawCannonSprite(canPt.x, canPt.y, m.thetaDeg);

    // Line of Sight
    if (state.showTargetLine) {
      const aimPt = worldToScreen(m.xm, m.ym, b);
      ctx.strokeStyle = "#d67b19";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(canPt.x, canPt.y);
      ctx.lineTo(aimPt.x, aimPt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target reticle
      ctx.strokeStyle = "#d67b19";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(aimPt.x, aimPt.y, 8, 0, Math.PI * 2);
      ctx.moveTo(aimPt.x - 12, aimPt.y);
      ctx.lineTo(aimPt.x + 12, aimPt.y);
      ctx.moveTo(aimPt.x, aimPt.y - 12);
      ctx.lineTo(aimPt.x, aimPt.y + 12);
      ctx.stroke();
    }
  }

  function drawMonkeySprite(x, y, isCaught) {
    ctx.save();
    ctx.translate(x, y);

    // Body
    ctx.fillStyle = "#7a4e2d";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = "#b88a65";
    ctx.beginPath();
    ctx.ellipse(0, 3, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#7a4e2d";
    ctx.beginPath();
    ctx.arc(0, -18, 12, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.arc(-12, -19, 5, 0, Math.PI * 2);
    ctx.arc(12, -19, 5, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = "#b88a65";
    ctx.beginPath();
    ctx.ellipse(0, -16, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(-3, -18, 2, 0, Math.PI * 2);
    ctx.arc(3, -18, 2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = "#123140";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -14, isCaught ? 5 : 3.5, 0, Math.PI);
    ctx.stroke();

    // Arms
    ctx.strokeStyle = "#7a4e2d";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (isCaught) {
      ctx.moveTo(-11, -5);
      ctx.lineTo(-2, 4);
      ctx.moveTo(11, -5);
      ctx.lineTo(2, 4);
    } else {
      ctx.moveTo(-11, -5);
      ctx.lineTo(-16, -20);
      ctx.moveTo(11, -5);
      ctx.lineTo(16, -20);
    }
    ctx.stroke();

    if (isCaught) {
      // Banana
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.arc(0, 6, 9, 0.4, 2.7);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = "#d67b19";
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCannonSprite(x, y, angleDeg) {
    ctx.save();
    ctx.translate(x, y);

    // Pedestal
    ctx.fillStyle = "#0f7e9b";
    ctx.beginPath();
    ctx.arc(0, 0, 16, Math.PI, 0);
    ctx.fill();

    // Barrel
    ctx.rotate(-angleDeg * (Math.PI / 180));
    ctx.fillStyle = "#095f76";
    ctx.beginPath();
    ctx.roundRect(-6, -9, 42, 18, [0, 5, 5, 0]);
    ctx.fill();

    // Amber muzzle ring
    ctx.strokeStyle = "#d67b19";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(33, -9);
    ctx.lineTo(33, 9);
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMarkRoberScene(b) {
    const mr = state.markRober;

    // Workshop Ceiling
    const cL = worldToScreen(b.worldXMin, mr.ceilingY, b);
    const cR = worldToScreen(b.worldXMax, mr.ceilingY, b);
    ctx.strokeStyle = "#4b6570";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cL.x, cL.y);
    ctx.lineTo(cR.x, cR.y);
    ctx.stroke();

    ctx.fillStyle = "#e2eef3";
    ctx.fillRect(cL.x, 0, cR.x - cL.x, cL.y);
    ctx.fillStyle = "#123140";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`WORKSHOP CEILING (${mr.ceilingY.toFixed(1)}m)`, cL.x + 20, cL.y - 8);

    // Mark Rober Figure
    const markBase = worldToScreen(mr.x0, 0, b);
    const markHand = worldToScreen(mr.x0, mr.y0, b);
    drawMarkRoberFigure(markBase.x, markBase.y, markHand.y);

    // Vertical Linear Actuator Track
    const trackX = worldToScreen(mr.xBoard, 0, b).x;
    const trackBottom = worldToScreen(mr.xBoard, 0, b).y;
    const trackTop = worldToScreen(mr.xBoard, mr.ceilingY, b).y;

    ctx.fillStyle = "#a9c4cf";
    ctx.fillRect(trackX - 6, trackTop, 4, trackBottom - trackTop);
    ctx.fillRect(trackX + 2, trackTop, 4, trackBottom - trackTop);

    // Sliding Motorized Dartboard
    const boardPt = worldToScreen(mr.xBoard, mr.boardY, b);
    drawDartboard(boardPt.x, boardPt.y);
  }

  function drawMarkRoberFigure(baseX, baseY, handY) {
    ctx.save();
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY - 12);
    ctx.lineTo(baseX, handY + 12);
    ctx.moveTo(baseX, baseY - 12);
    ctx.lineTo(baseX - 8, baseY);
    ctx.moveTo(baseX, baseY - 12);
    ctx.lineTo(baseX + 6, baseY);
    ctx.stroke();

    ctx.strokeStyle = "#d67b19";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(baseX, handY + 14);
    ctx.lineTo(baseX + 14, handY);
    ctx.stroke();

    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(baseX, handY - 6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawDartboard(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Carriage backplate
    ctx.fillStyle = "#123140";
    ctx.fillRect(-14, -26, 10, 52);

    // Outer board rim
    ctx.fillStyle = "#123140";
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Double ring
    ctx.fillStyle = "#e6f4f8";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();

    // Bullseye
    ctx.fillStyle = "#d67b19";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawClassroomScene(b) {
    const cp = state.classroom;

    // 1. Cliff Platform (x0, y0)
    const cliffEdge = worldToScreen(cp.x0, cp.y0, b);
    const cliffBase = worldToScreen(cp.x0, 0, b);
    const screenLeft = worldToScreen(b.worldXMin, 0, b).x;

    ctx.fillStyle = "#e2eef3";
    ctx.fillRect(screenLeft, cliffEdge.y, cliffEdge.x - screenLeft + 8, cliffBase.y - cliffEdge.y);
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenLeft, cliffEdge.y);
    ctx.lineTo(cliffEdge.x, cliffEdge.y);
    ctx.lineTo(cliffEdge.x, cliffBase.y);
    ctx.stroke();

    ctx.fillStyle = "#0f7e9b";
    ctx.font = "bold 12px 'IBM Plex Sans', sans-serif";
    ctx.fillText(`CLIFF h₀ = ${cp.y0}m`, cliffEdge.x - 105, cliffEdge.y - 12);

    // 2. Obstacle Building
    const bldgL = worldToScreen(cp.x1, cp.bldgHeight, b);
    const bldgR = worldToScreen(cp.x2, 0, b);
    const bldgW = bldgR.x - bldgL.x;
    const bldgH = bldgR.y - bldgL.y;

    ctx.fillStyle = "#f0f8fa";
    ctx.fillRect(bldgL.x, bldgL.y, bldgW, bldgH);
    ctx.strokeStyle = "#0f7e9b";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bldgL.x, bldgL.y, bldgW, bldgH);

    // Windows
    ctx.fillStyle = "#0f7e9b";
    const winW = 6, winH = 8, gapX = 14, gapY = 16;
    for (let wx = bldgL.x + 10; wx < bldgL.x + bldgW - 8; wx += gapX) {
      for (let wy = bldgL.y + 12; wy < bldgR.y - 10; wy += gapY) {
        ctx.fillRect(wx, wy, winW, winH);
      }
    }

    ctx.fillStyle = "#123140";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`BUILDING (${cp.bldgHeight}m)`, bldgL.x + 6, bldgL.y - 8);

    // Launcher
    drawCannonSprite(cliffEdge.x, cliffEdge.y, cp.thetaDeg);
  }

  function drawSandboxScene(b) {
    const sb = state.sandbox;
    const canPt = worldToScreen(sb.x0, sb.y0, b);

    if (sb.y0 > 0) {
      const gPt = worldToScreen(sb.x0, 0, b);
      ctx.fillStyle = "#e6f4f8";
      ctx.fillRect(canPt.x - 20, canPt.y, 40, gPt.y - canPt.y);
      ctx.strokeStyle = "#0f7e9b";
      ctx.lineWidth = 2;
      ctx.strokeRect(canPt.x - 20, canPt.y, 40, gPt.y - canPt.y);
    }

    drawCannonSprite(canPt.x, canPt.y, sb.thetaDeg);
  }

  function drawTrajectories(b) {
    if (!currentTrajectory || currentTrajectory.length < 2) return;

    if (state.showZeroG && currentZeroGTrajectory.length > 1) {
      ctx.strokeStyle = "rgba(18, 49, 64, 0.25)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      for (let i = 0; i < currentZeroGTrajectory.length; i++) {
        const pt = worldToScreen(currentZeroGTrajectory[i].x, currentZeroGTrajectory[i].y, b);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = "rgba(15, 126, 155, 0.88)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < currentTrajectory.length; i++) {
      const pt = worldToScreen(currentTrajectory[i].x, currentTrajectory[i].y, b);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    if (state.showStrobes && currentStrobes.length > 0) {
      for (let i = 0; i < currentStrobes.length; i++) {
        const st = currentStrobes[i];
        const sPt = worldToScreen(st.x, st.y, b);

        ctx.fillStyle = "#d67b19";
        ctx.beginPath();
        ctx.arc(sPt.x, sPt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (state.mode === "monkey") {
          const m = state.monkey;
          const drop = 0.5 * m.g * st.t * st.t;
          const monkY = Math.max(0, m.ym - drop);
          const mPt = worldToScreen(m.xm, monkY, b);

          ctx.fillStyle = "#0f7e9b";
          ctx.beginPath();
          ctx.arc(mPt.x, mPt.y, 4, 0, Math.PI * 2);
          ctx.fill();

          if (i % 2 === 0 && st.t <= m.hitResult.tIntercept) {
            ctx.strokeStyle = "rgba(214, 123, 25, 0.2)";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(sPt.x, sPt.y);
            ctx.lineTo(mPt.x, mPt.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }
  }

  function drawProjectileAndVectors(b) {
    let p = { x: 0, y: 0 };
    let v0 = 20, thetaDeg = 45, g = 9.80;

    if (state.mode === "monkey") {
      p = state.monkey.bananaPos;
      v0 = state.monkey.v0;
      thetaDeg = state.monkey.thetaDeg;
      g = state.monkey.g;
    } else if (state.mode === "mark-rober") {
      p = state.markRober.dartPos;
      v0 = state.markRober.v0;
      thetaDeg = state.markRober.alphaDeg;
      g = state.markRober.g;
    } else if (state.mode === "classroom") {
      p = state.classroom.projPos;
      v0 = state.classroom.v0;
      thetaDeg = state.classroom.thetaDeg;
      g = state.classroom.g;
    } else {
      p = state.sandbox.projPos;
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
    }

    const scrPt = worldToScreen(p.x, p.y, b);

    if (state.mode === "monkey") {
      ctx.save();
      ctx.translate(scrPt.x, scrPt.y);
      ctx.rotate(state.simTime * 8);
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (state.mode === "mark-rober") {
      ctx.save();
      ctx.translate(scrPt.x, scrPt.y);
      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const vel = ProjectilesPhysics.getVelocityAtTime({ vx: decomp.vx, vy: decomp.vy, g: g, t: state.simTime });
      ctx.rotate(-vel.angleDeg * (Math.PI / 180));
      ctx.fillStyle = "#123140";
      ctx.fillRect(-13, -2.5, 26, 5);
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.moveTo(-13, -7);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-13, 7);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = "#d67b19";
      ctx.beginPath();
      ctx.arc(scrPt.x, scrPt.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (state.showVectors && state.isRunning) {
      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const vel = ProjectilesPhysics.getVelocityAtTime({
        vx: decomp.vx,
        vy: decomp.vy,
        g: g,
        t: state.simTime
      });

      const vScale = state.mode === "classroom" ? 0.75 : 2.4;
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x + vel.vx * vScale, scrPt.y, "#0f7e9b", 2);
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x, scrPt.y - vel.vy * vScale, "#d67b19", 2);
      drawArrow(ctx, scrPt.x, scrPt.y, scrPt.x + vel.vx * vScale, scrPt.y - vel.vy * vScale, "#095f76", 2.5);
    }
  }

  function drawArrow(ctx, fromX, fromY, toX, toY, color, width) {
    const headLen = 7;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // ==========================================================================
  // Presets Bar Population per Mode
  // ==========================================================================

  function updatePresetBar() {
    if (!presetPillsContainer) return;
    presetPillsContainer.innerHTML = "";

    if (state.mode === "monkey") {
      btnQuickModeAction.innerHTML = "<span>🎯</span> Auto-Aim Directly";
      btnQuickModeAction.style.display = "inline-flex";

      addPresetPill("Gizmo Classic (26 m/s)", true, () => {
        state.monkey.v0 = 26.0;
        state.monkey.xm = 25.0;
        state.monkey.ym = 16.0;
        state.monkey.thetaDeg = 32.6;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("Slow Feed (18 m/s)", false, () => {
        state.monkey.v0 = 18.0;
        state.monkey.xm = 25.0;
        state.monkey.ym = 16.0;
        state.monkey.thetaDeg = 32.6;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("High Fast Feed (40 m/s)", false, () => {
        state.monkey.v0 = 40.0;
        state.monkey.xm = 25.0;
        state.monkey.ym = 16.0;
        state.monkey.thetaDeg = 32.6;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("Zero-Gravity (g = 0)", false, () => {
        state.monkey.g = 0;
        document.getElementById("simGravity").value = "0.00";
        state.showZeroG = true;
        toggleZeroG.classList.add("active");
        syncSliders();
        resetSimulation();
      });

    } else if (state.mode === "mark-rober") {
      btnQuickModeAction.innerHTML = "<span>📐</span> Load Worksheet Setup";
      btnQuickModeAction.style.display = "inline-flex";

      addPresetPill("Worksheet Default (15 m/s, 40°)", true, () => {
        state.markRober.v0 = 15.0;
        state.markRober.alphaDeg = 40.0;
        state.markRober.xBoard = 5.0;
        state.markRober.ceilingY = 7.0;
        state.markRober.g = 10.0;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("Low Ceiling Test (5.5m)", false, () => {
        state.markRober.v0 = 15.0;
        state.markRober.alphaDeg = 40.0;
        state.markRober.xBoard = 5.0;
        state.markRober.ceilingY = 5.5;
        state.markRober.g = 10.0;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("Long Throw (10m Board)", false, () => {
        state.markRober.v0 = 20.0;
        state.markRober.alphaDeg = 45.0;
        state.markRober.xBoard = 10.0;
        state.markRober.ceilingY = 8.5;
        state.markRober.g = 10.0;
        syncSliders();
        resetSimulation();
      });

    } else if (state.mode === "classroom") {
      btnQuickModeAction.innerHTML = "<span>🏔️</span> Notes: Cliff & Building";
      btnQuickModeAction.style.display = "inline-flex";

      addPresetPill("Cliff & 70m Building (p. 7-8, 13-14)", true, () => {
        state.classroom.y0 = 320;
        state.classroom.v0 = 42.0;
        state.classroom.thetaDeg = 30.0;
        state.classroom.x1 = 230;
        state.classroom.x2 = 310;
        state.classroom.bldgHeight = 70;
        state.classroom.g = 10.0;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("Shark Pool Launch (p. 5, 11)", false, () => {
        state.classroom.y0 = 0.9;
        state.classroom.v0 = 42.7;
        state.classroom.thetaDeg = 0.0;
        state.classroom.x1 = 18.0;
        state.classroom.x2 = 19.0;
        state.classroom.bldgHeight = 0.2;
        state.classroom.g = 9.8;
        syncSliders();
        resetSimulation();
      });

    } else {
      btnQuickModeAction.style.display = "none";
      addPresetPill("45° Maximum Range", true, () => {
        state.sandbox.v0 = 25.0;
        state.sandbox.thetaDeg = 45.0;
        state.sandbox.y0 = 0;
        syncSliders();
        resetSimulation();
      });
      addPresetPill("Elevated Launch (15m, 30°)", false, () => {
        state.sandbox.v0 = 25.0;
        state.sandbox.thetaDeg = 30.0;
        state.sandbox.y0 = 15.0;
        syncSliders();
        resetSimulation();
      });
    }
  }

  function addPresetPill(text, isActive, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `preset-pill ${isActive ? 'active' : ''}`;
    btn.textContent = text;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      onClick();
    });
    presetPillsContainer.appendChild(btn);
  }

  function syncSliders() {
    if (state.mode === "monkey") {
      const m = state.monkey;
      document.getElementById("monkeyV0").value = m.v0;
      document.getElementById("monkeyV0Val").textContent = m.v0.toFixed(1) + " m/s";
      document.getElementById("monkeyAngle").value = m.thetaDeg;
      document.getElementById("monkeyAngleVal").textContent = m.thetaDeg.toFixed(1) + "°";
      document.getElementById("monkeyDist").value = m.xm;
      document.getElementById("monkeyDistVal").textContent = m.xm.toFixed(1) + " m";
      document.getElementById("monkeyHeight").value = m.ym;
      document.getElementById("monkeyHeightVal").textContent = m.ym.toFixed(1) + " m";
      document.getElementById("cannonHeight").value = m.y0;
      document.getElementById("cannonHeightVal").textContent = m.y0.toFixed(1) + " m";
    } else if (state.mode === "mark-rober") {
      const mr = state.markRober;
      document.getElementById("roberV0").value = mr.v0;
      document.getElementById("roberV0Val").textContent = mr.v0.toFixed(1) + " m/s";
      document.getElementById("roberAngle").value = mr.alphaDeg;
      document.getElementById("roberAngleVal").textContent = mr.alphaDeg.toFixed(1) + "°";
      document.getElementById("roberBoardX").value = mr.xBoard;
      document.getElementById("roberBoardXVal").textContent = mr.xBoard.toFixed(1) + " m";
      document.getElementById("roberCeiling").value = mr.ceilingY;
      document.getElementById("roberCeilingVal").textContent = mr.ceilingY.toFixed(1) + " m";
      document.getElementById("roberReleaseY").value = mr.y0;
      document.getElementById("roberReleaseYVal").textContent = mr.y0.toFixed(1) + " m";
      document.getElementById("roberGravity").value = mr.g.toFixed(2);
    } else if (state.mode === "classroom") {
      const cp = state.classroom;
      document.getElementById("classV0").value = cp.v0;
      document.getElementById("classV0Val").textContent = cp.v0.toFixed(1) + " m/s";
      document.getElementById("classAngle").value = cp.thetaDeg;
      document.getElementById("classAngleVal").textContent = cp.thetaDeg.toFixed(1) + "°";
      document.getElementById("classCliffH").value = cp.y0;
      document.getElementById("classCliffHVal").textContent = cp.y0.toFixed(0) + " m";
      document.getElementById("classBldgH").value = cp.bldgHeight;
      document.getElementById("classBldgHVal").textContent = cp.bldgHeight.toFixed(0) + " m";
      document.getElementById("classBldgX1").value = cp.x1;
      document.getElementById("classBldgX1Val").textContent = cp.x1.toFixed(0) + " m";
      document.getElementById("classBldgW").value = cp.x2 - cp.x1;
      document.getElementById("classBldgWVal").textContent = (cp.x2 - cp.x1).toFixed(0) + " m";
    }
  }

  // ==========================================================================
  // Mouse & Touch Interactivity (Canvas Dragging)
  // ==========================================================================

  function setupCanvasDrag() {
    let activeDrag = null;

    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    canvas.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      onPointerDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (activeDrag) {
        const touch = e.touches[0];
        onPointerMove({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, { passive: false });

    window.addEventListener("touchend", onPointerUp);

    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const bounds = getViewportBounds();
      const world = screenToWorld(sx, sy, bounds);

      if (state.mode === "monkey") {
        const m = state.monkey;
        if (Math.hypot(world.x - m.xm, world.y - m.ym) < 2.5) {
          activeDrag = "monkeyTarget";
          canvas.style.cursor = "grabbing";
          return;
        }
        if (Math.hypot(world.x - m.x0, world.y - m.y0) < 3.0) {
          activeDrag = "cannonAngle";
          canvas.style.cursor = "grabbing";
          return;
        }
      } else if (state.mode === "mark-rober") {
        const mr = state.markRober;
        if (Math.hypot(world.x - mr.xBoard, world.y - mr.boardY) < 2.0) {
          activeDrag = "dartboard";
          canvas.style.cursor = "grabbing";
          return;
        }
        if (Math.hypot(world.x - mr.x0, world.y - mr.y0) < 2.5) {
          activeDrag = "roberAngle";
          canvas.style.cursor = "grabbing";
          return;
        }
      }
    }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const bounds = getViewportBounds();
      const world = screenToWorld(sx, sy, bounds);

      if (!activeDrag) {
        if (state.mode === "monkey") {
          const m = state.monkey;
          if (Math.hypot(world.x - m.xm, world.y - m.ym) < 2.5 || Math.hypot(world.x - m.x0, world.y - m.y0) < 3.0) {
            canvas.style.cursor = "grab";
          } else {
            canvas.style.cursor = "crosshair";
          }
        }
        return;
      }

      if (activeDrag === "monkeyTarget") {
        const newX = Math.max(15, Math.min(40, Math.round(world.x)));
        const newY = Math.max(6, Math.min(25, Number(world.y.toFixed(1))));
        state.monkey.xm = newX;
        state.monkey.ym = newY;
        syncSliders();
        resetSimulation();
      } else if (activeDrag === "cannonAngle") {
        const dx = world.x - state.monkey.x0;
        const dy = world.y - state.monkey.y0;
        let deg = Math.atan2(dy, dx) * (180 / Math.PI);
        deg = Math.max(-10, Math.min(75, Number(deg.toFixed(1))));
        state.monkey.thetaDeg = deg;
        syncSliders();
        resetSimulation();
      } else if (activeDrag === "dartboard") {
        const newX = Math.max(3, Math.min(15, Number(world.x.toFixed(1))));
        state.markRober.xBoard = newX;
        syncSliders();
        resetSimulation();
      } else if (activeDrag === "roberAngle") {
        const dx = world.x - state.markRober.x0;
        const dy = world.y - state.markRober.y0;
        let deg = Math.atan2(dy, dx) * (180 / Math.PI);
        deg = Math.max(10, Math.min(75, Number(deg.toFixed(1))));
        state.markRober.alphaDeg = deg;
        syncSliders();
        resetSimulation();
      }
    }

    function onPointerUp() {
      if (activeDrag) {
        activeDrag = null;
        canvas.style.cursor = "crosshair";
      }
    }
  }

  // ==========================================================================
  // Trials Logger & CSV
  // ==========================================================================

  function logTrial(mode, v0, theta, tHit, finalX, finalY, result) {
    const trial = {
      id: state.trials.length + 1,
      mode: mode,
      v0: v0.toFixed(1),
      theta: theta.toFixed(1),
      tHit: tHit.toFixed(2),
      finalX: finalX.toFixed(1),
      finalY: finalY.toFixed(1),
      result: result
    };
    state.trials.push(trial);
    updateTrialTable();
  }

  function updateTrialTable() {
    const tbody = document.getElementById("trialLogBody");
    if (!tbody) return;

    if (state.trials.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--subtle); padding:1rem;">No trials logged yet. Fire a projectile!</td></tr>';
      return;
    }

    tbody.innerHTML = state.trials.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.mode}</td>
        <td>${t.v0}</td>
        <td>${t.theta}°</td>
        <td>${t.tHit}</td>
        <td>${t.finalX}</td>
        <td>${t.finalY}</td>
        <td style="font-weight:700; color:${t.result.includes('CAUGHT') || t.result.includes('BULLSEYE') || t.result.includes('CLEARED') ? 'var(--success)' : 'var(--error)'};">${t.result}</td>
      </tr>
    `).join("");
  }

  function exportCSV() {
    if (state.trials.length === 0) {
      alert("No trial data to export yet. Please launch a projectile first!");
      return;
    }
    const headers = ["Trial", "Mode", "v0 (m/s)", "Angle (deg)", "Flight Time (s)", "Final x (m)", "Final y (m)", "Result"];
    const rows = state.trials.map(t => [t.id, t.mode, t.v0, t.theta, t.tHit, t.finalX, t.finalY, `"${t.result}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "projectile_motion_trials.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================================================
  // Student Challenge
  // ==========================================================================

  function setupChallenge() {
    const btnCheck = document.getElementById("btnCheckChallenge");
    const feedback = document.getElementById("challengeFeedback");
    const btnNew = document.getElementById("btnNewChallenge");

    btnCheck.addEventListener("click", () => {
      const selected = document.querySelector('input[name="predChoice"]:checked');
      if (!selected) return;

      if (selected.value === "direct") {
        feedback.style.display = "block";
        feedback.style.background = "var(--success-bg)";
        feedback.style.color = "var(--success)";
        feedback.style.border = "1px solid var(--success-border)";
        feedback.innerHTML = "<strong>✅ Correct!</strong> Because gravity accelerates both objects downward at the identical rate (<em>a</em><sub>y</sub> = &minus;<em>g</em>), both drop the exact same vertical distance (<span class=\"fraction\"><span class=\"num\">1</span><span class=\"den\">2</span></span><em>g</em><em>t</em>&sup2;) from the line of sight. Aiming directly at the monkey guarantees an intercept at any launch speed!";
      } else {
        feedback.style.display = "block";
        feedback.style.background = "var(--error-bg)";
        feedback.style.color = "var(--error)";
        feedback.style.border = "1px solid var(--error-border)";
        feedback.innerHTML = "<strong>❌ Incorrect:</strong> Because gravity begins pulling both objects downward the moment the cannon fires, aiming directly along the line of sight causes the two vertical drops to cancel out!";
      }
    });

    btnNew.addEventListener("click", () => {
      feedback.style.display = "none";
      const speeds = [18.0, 22.0, 26.0, 30.0, 35.0, 42.0];
      const s = speeds[Math.floor(Math.random() * speeds.length)];
      state.monkey.v0 = s;
      syncSliders();
      document.getElementById("challengePrompt").textContent = `If launch speed is set to ${s.toFixed(1)} m/s, where should you aim to feed the falling monkey?`;
      resetSimulation();
    });
  }

  // ==========================================================================
  // Initialization & Event Binding
  // ==========================================================================

  function initUI() {
    // Mode Switcher
    modePillBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        modePillBtns.forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        state.mode = btn.dataset.mode;

        // Switch control panels
        Object.keys(modeControlPanels).forEach(k => {
          if (k === state.mode) {
            modeControlPanels[k].style.display = "block";
            modeControlPanels[k].classList.add("active");
          } else {
            modeControlPanels[k].style.display = "none";
            modeControlPanels[k].classList.remove("active");
          }
        });

        updatePresetBar();
        resetSimulation();
      });
    });

    // Subtabs in right column
    tabPills.forEach(pill => {
      pill.addEventListener("click", () => {
        tabPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");

        const target = pill.dataset.subtab;
        Object.keys(subtabContents).forEach(k => {
          if (k === target) {
            subtabContents[k].style.display = "block";
            subtabContents[k].classList.add("active");
          } else {
            subtabContents[k].style.display = "none";
            subtabContents[k].classList.remove("active");
          }
        });
      });
    });

    // Activity Guide Drawer Toggle
    btnToggleGuide.addEventListener("click", () => {
      const isOpen = activityGuide.classList.contains("open");
      activityGuide.classList.toggle("open", !isOpen);
      btnToggleGuide.setAttribute("aria-expanded", String(!isOpen));
      btnToggleGuide.textContent = isOpen ? "📘 Guided Activities & How-To" : "✖ Hide Guide";
    });

    btnCloseGuide.addEventListener("click", () => {
      activityGuide.classList.remove("open");
      btnToggleGuide.setAttribute("aria-expanded", "false");
      btnToggleGuide.textContent = "📘 Guided Activities & How-To";
    });

    // Quick Action button in controls bar
    btnQuickModeAction.addEventListener("click", () => {
      if (state.mode === "monkey") {
        const m = state.monkey;
        const directDeg = Math.atan2(m.ym - m.y0, m.xm - m.x0) * (180 / Math.PI);
        m.thetaDeg = parseFloat(directDeg.toFixed(1));
        syncSliders();
        resetSimulation();
      } else if (state.mode === "mark-rober") {
        state.markRober.v0 = 15.0;
        state.markRober.alphaDeg = 40.0;
        state.markRober.xBoard = 5.0;
        state.markRober.ceilingY = 7.0;
        state.markRober.g = 10.0;
        syncSliders();
        resetSimulation();
      } else if (state.mode === "classroom") {
        state.classroom.y0 = 320;
        state.classroom.v0 = 42.0;
        state.classroom.thetaDeg = 30.0;
        state.classroom.x1 = 230;
        state.classroom.x2 = 310;
        state.classroom.bldgHeight = 70;
        state.classroom.g = 10.0;
        syncSliders();
        resetSimulation();
      }
    });

    // Playback Buttons
    btnFire.addEventListener("click", fireSimulation);
    btnPause.addEventListener("click", () => {
      if (state.isRunning) {
        if (state.isPaused) resumeSimulation();
        else pauseSimulation();
      }
    });
    btnStep.addEventListener("click", stepForward);
    btnReset.addEventListener("click", resetSimulation);

    // Speed Pills
    speedPills.forEach(sp => {
      sp.addEventListener("click", () => {
        speedPills.forEach(p => p.classList.remove("active"));
        sp.classList.add("active");
        state.playbackSpeed = parseFloat(sp.dataset.speed);
      });
    });

    // Floating Toggles
    toggleTargetLine.addEventListener("click", () => {
      state.showTargetLine = !state.showTargetLine;
      toggleTargetLine.classList.toggle("active", state.showTargetLine);
      render();
    });
    toggleStrobes.addEventListener("click", () => {
      state.showStrobes = !state.showStrobes;
      toggleStrobes.classList.toggle("active", state.showStrobes);
      render();
    });
    toggleVectors.addEventListener("click", () => {
      state.showVectors = !state.showVectors;
      toggleVectors.classList.toggle("active", state.showVectors);
      render();
    });
    toggleGrid.addEventListener("click", () => {
      state.showGrid = !state.showGrid;
      toggleGrid.classList.toggle("active", state.showGrid);
      render();
    });
    toggleZeroG.addEventListener("click", () => {
      state.showZeroG = !state.showZeroG;
      toggleZeroG.classList.toggle("active", state.showZeroG);
      refreshCurrentPhysics();
      render();
    });
    toggleAudio.addEventListener("click", () => {
      sfx.enabled = !sfx.enabled;
      toggleAudio.classList.toggle("active", sfx.enabled);
      toggleAudio.textContent = sfx.enabled ? "🔊 Audio" : "🔇 Muted";
    });

    // Sliders Event Binding
    const bindSlider = (id, valId, obj, key, unit, decimals = 1) => {
      const slider = document.getElementById(id);
      const display = document.getElementById(valId);
      if (!slider) return;
      slider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        obj[key] = val;
        if (display) display.textContent = `${val.toFixed(decimals)} ${unit}`;
        resetSimulation();
      });
    };

    bindSlider("monkeyV0", "monkeyV0Val", state.monkey, "v0", "m/s");
    bindSlider("monkeyAngle", "monkeyAngleVal", state.monkey, "thetaDeg", "°");
    bindSlider("monkeyDist", "monkeyDistVal", state.monkey, "xm", "m", 1);
    bindSlider("monkeyHeight", "monkeyHeightVal", state.monkey, "ym", "m", 1);
    bindSlider("cannonHeight", "cannonHeightVal", state.monkey, "y0", "m", 1);

    document.getElementById("simGravity").addEventListener("change", (e) => {
      state.monkey.g = parseFloat(e.target.value);
      resetSimulation();
    });

    bindSlider("roberV0", "roberV0Val", state.markRober, "v0", "m/s");
    bindSlider("roberAngle", "roberAngleVal", state.markRober, "alphaDeg", "°");
    bindSlider("roberBoardX", "roberBoardXVal", state.markRober, "xBoard", "m");
    bindSlider("roberCeiling", "roberCeilingVal", state.markRober, "ceilingY", "m");
    bindSlider("roberReleaseY", "roberReleaseYVal", state.markRober, "y0", "m");

    document.getElementById("roberGravity").addEventListener("change", (e) => {
      state.markRober.g = parseFloat(e.target.value);
      resetSimulation();
    });

    bindSlider("classV0", "classV0Val", state.classroom, "v0", "m/s", 0);
    bindSlider("classAngle", "classAngleVal", state.classroom, "thetaDeg", "°", 0);
    bindSlider("classCliffH", "classCliffHVal", state.classroom, "y0", "m", 0);
    bindSlider("classBldgH", "classBldgHVal", state.classroom, "bldgHeight", "m", 0);
    bindSlider("classBldgX1", "classBldgX1Val", state.classroom, "x1", "m", 0);
    bindSlider("classBldgW", "classBldgWVal", state.classroom, "bldgWidth", "m", 0);

    bindSlider("sbV0", "sbV0Val", state.sandbox, "v0", "m/s");
    bindSlider("sbAngle", "sbAngleVal", state.sandbox, "thetaDeg", "°");
    bindSlider("sbY0", "sbY0Val", state.sandbox, "y0", "m", 0);
    bindSlider("sbGravity", "sbGravityVal", state.sandbox, "g", "m/s²");

    // Table actions
    document.getElementById("btnClearLog").addEventListener("click", () => {
      state.trials = [];
      updateTrialTable();
    });
    document.getElementById("btnExportCsv").addEventListener("click", exportCSV);

    setupCanvasDrag();
    setupChallenge();
    updatePresetBar();
  }

  function init() {
    initUI();
    resizeCanvas();
    resetSimulation();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
