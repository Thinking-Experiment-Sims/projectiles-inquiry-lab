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
  const btnAutoFitZoom = document.getElementById("btnAutoFitZoom");

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

    // Mode 3: Classroom & Packet 6 Problems
    classroom: {
      problemType: "cliff-building", // "cliff-building", "tennis", "soccer", "box-drop", "cliff-100m"
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
      const cp = state.classroom;
      const decomp = ProjectilesPhysics.decomposeVelocity(cp.v0, cp.thetaDeg);
      const tFlight = ProjectilesPhysics.calculateTimeOfFlight(cp.y0, decomp.vy, cp.g, 0);
      const xLand = cp.x0 + decomp.vx * tFlight;
      const tApex = decomp.vy > 0 ? decomp.vy / cp.g : 0;
      const maxH = cp.y0 + decomp.vy * tApex - 0.5 * cp.g * tApex * tApex;

      const objMaxX = Math.max(cp.x0, cp.x2 || 0, xLand, 4.0);
      const objMaxY = Math.max(cp.y0, cp.bldgHeight || 0, maxH, 2.0);

      const marginX = objMaxX * 0.12;
      const marginY = objMaxY * 0.14;

      worldXMin = -Math.max(marginX, 0.4);
      worldXMax = objMaxX + Math.max(marginX, 0.8);
      worldYMin = -Math.max(marginY * 0.5, 0.3);
      worldYMax = objMaxY + Math.max(marginY, 0.5);
    } else if (state.mode === "sandbox") {
      const sb = state.sandbox;
      const decomp = ProjectilesPhysics.decomposeVelocity(sb.v0, sb.thetaDeg);
      const tFlight = ProjectilesPhysics.calculateTimeOfFlight(sb.y0, decomp.vy, sb.g, 0);
      const xLand = sb.x0 + decomp.vx * tFlight;
      const tApex = decomp.vy > 0 ? decomp.vy / sb.g : 0;
      const maxH = sb.y0 + decomp.vy * tApex - 0.5 * sb.g * tApex * tApex;

      const objMaxX = Math.max(sb.x0, sb.targetX || 0, xLand, 10.0);
      const objMaxY = Math.max(sb.y0, maxH, 5.0);

      const marginX = objMaxX * 0.10;
      const marginY = objMaxY * 0.14;

      worldXMin = -Math.max(marginX, 1.0);
      worldXMax = objMaxX + Math.max(marginX, 2.0);
      worldYMin = -Math.max(marginY * 0.4, 0.5);
      worldYMax = objMaxY + Math.max(marginY, 1.0);
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

  // ==========================================================================
  // KaTeX Vector Typesetting & Collapsible Step Card Builders
  // ==========================================================================

  function katex(latex, display = false) {
    if (window.katex && typeof window.katex.renderToString === "function") {
      try {
        return window.katex.renderToString(latex, { displayMode: display, throwOnError: false });
      } catch (e) {
        return latex;
      }
    }
    return latex;
  }

  function buildStepCard(stepNum, title, badge, desc, rows, isAccent = false, isAccentDark = false) {
    const accentClass = isAccent ? " accent-amber" : (isAccentDark ? " accent-dark" : "");
    const rowHtml = rows.map(r => `
      <div class="math-step-row">
        ${r.label ? `<span class="math-step-label">${r.label}</span>` : ""}
        <div class="math-step-math">${r.math}</div>
      </div>
    `).join("");

    return `
      <div class="math-step-card${accentClass}">
        <div class="math-step-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="math-step-title">
            <span class="step-num-badge">${stepNum}</span>
            <span>${title}</span>
            ${badge ? `<span class="lab-badge">${badge}</span>` : ""}
          </div>
          <span class="math-step-chevron">▼</span>
        </div>
        <div class="math-step-body">
          ${desc ? `<div class="math-step-desc">${desc}</div>` : ""}
          ${rowHtml}
        </div>
      </div>
    `;
  }

  function updatePedagogyCards() {
    let v0 = 26, thetaDeg = 32.6, g = 9.80, x0 = 0, y0 = 0;
    const mathContainer = document.getElementById("mathCardContent");
    if (!mathContainer) return;

    if (state.mode === "monkey") {
      v0 = state.monkey.v0;
      thetaDeg = state.monkey.thetaDeg;
      g = state.monkey.g;
      x0 = state.monkey.x0;
      y0 = state.monkey.y0;

      const m = state.monkey;
      const res = m.hitResult;
      const directDeg = res ? res.directAimAngleDeg.toFixed(1) : "32.6";
      const tInt = res ? res.tIntercept.toFixed(2) : "1.00";
      const drop = res ? res.dropDist.toFixed(2) : "4.90";
      const yCatch = res ? res.yMonkeyAtTime.toFixed(2) : "11.10";

      const step1 = buildStepCard(
        1, "Step 1: Direct Line-of-Sight Aim Geometry", "Targeting Ray",
        "Aim the cannon barrel directly along the straight sightline connecting the cannon origin to the monkey.",
        [
          {
            label: "Trigonometric Sightline Angle",
            math: katex(`\\tan(\\theta) = \\frac{y_{\\text{monkey}} - y_0}{x_{\\text{monkey}} - x_0}`)
          },
          {
            label: "Numerical Evaluation",
            math: `${katex(`\\tan(\\theta) = \\frac{${m.ym.toFixed(1)} - ${m.y0.toFixed(1)}}{${m.xm.toFixed(1)} - ${m.x0.toFixed(1)}} \\implies \\theta_{\\text{aim}} = ${directDeg}^\\circ`)} <span class="math-eval-tag">Aim: ${directDeg}°</span>`
          }
        ]
      );

      const step2 = buildStepCard(
        2, "Step 2: Time as Bridge (Horizontal Motion, aₓ = 0)", "Flight Time",
        "Horizontal velocity is constant. Solve for time to reach the monkey's x-coordinate.",
        [
          {
            label: "Horizontal Position Law",
            math: katex(`x(t) = x_0 + v_{0x} t = x_0 + v_0 \\cos(\\theta) t \\implies t_{\\text{intercept}} = \\frac{x_{\\text{monkey}} - x_0}{v_0 \\cos(\\theta)}`)
          },
          {
            label: "Time to Intercept",
            math: `${katex(`t_{\\text{intercept}} = \\frac{${(m.xm - m.x0).toFixed(1)}\\text{ m}}{(${m.v0.toFixed(1)}\\text{ m/s}) \\cos(${thetaDeg.toFixed(1)}^\\circ)} = ${tInt}\\text{ s}`)} <span class="math-eval-tag">${tInt} s</span>`
          }
        ],
        true
      );

      const step3 = buildStepCard(
        3, "Step 3: Synchronized Vertical Free-Fall Drop (aᵧ = -g)", "Equal Drop Proof",
        "Both the projectile and the monkey accelerate downward under gravity from the instant of firing.",
        [
          {
            label: "Vertical Positions from Line of Sight",
            math: katex(`y_{\\text{banana}}(t) = y_{\\text{sight}}(t) - \\frac{1}{2}gt^2, \\quad y_{\\text{monkey}}(t) = y_{m,0} - \\frac{1}{2}gt^2`)
          },
          {
            label: "Identical Drop Distance",
            math: `${katex(`\\Delta y_{\\text{drop}} = \\frac{1}{2}gt^2 = 0.5 \\cdot (${g.toFixed(1)}\\text{ m/s}^2) \\cdot (${tInt}\\text{ s})^2 = ${drop}\\text{ m}`)} <span class="math-eval-tag">${drop} m</span>`
          },
          {
            label: "Intercept Collision Altitude",
            math: `${katex(`y_{\\text{catch}} = ${m.ym.toFixed(1)} - ${drop} = ${yCatch}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--primary-teal-light); color: var(--primary-teal-dark);">Catch y = ${yCatch} m</span>`
          }
        ],
        false, true
      );

      mathContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">🐵 Feed the Monkey: First-Principles Proof</span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
          </div>
        </div>
        ${step1}
        ${step2}
        ${step3}
        <div class="status-badge-inline ${res && res.isAimedAtMonkey ? 'safe' : 'warn'}" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
          ${res && res.isAimedAtMonkey ? `🎯 Direct Aim Confirmed (${thetaDeg.toFixed(1)}°): Banana & Monkey meet at y = ${yCatch}m for ANY launch speed!` : `⚠️ Misaligned Aim (${thetaDeg.toFixed(1)}° vs ${directDeg}°). The banana will miss the falling monkey.`}
        </div>
      `;

    } else if (state.mode === "mark-rober") {
      v0 = state.markRober.v0;
      thetaDeg = state.markRober.alphaDeg;
      g = state.markRober.g;
      x0 = state.markRober.x0;
      y0 = state.markRober.y0;

      const mr = state.markRober;
      const res = mr.hitResult;
      const tBoard = res ? res.tBoard.toFixed(3) : "0.435";
      const targetH = res ? res.targetHeightH.toFixed(2) : "5.05";
      const tApex = res ? res.tApex.toFixed(3) : "0.964";
      const hMax = res ? res.maxDartHeight.toFixed(2) : "6.45";
      const vx = res ? res.vx.toFixed(2) : "11.49";
      const vy = res ? res.vy.toFixed(2) : "9.64";

      const step1 = buildStepCard(
        1, "Step 1: Velocity Decomposition (SOH CAHTOA)", "Initial Components",
        "Decompose initial launch speed into independent horizontal and vertical velocity components.",
        [
          {
            label: "Trigonometric Decomposition",
            math: katex(`v_{0x} = v_0 \\cos(\\alpha), \\quad v_{0y} = v_0 \\sin(\\alpha)`)
          },
          {
            label: "Numerical Components",
            math: `${katex(`v_{0x} = (${mr.v0.toFixed(1)}) \\cos(${thetaDeg.toFixed(1)}^\\circ) = ${vx}\\text{ m/s}, \\quad v_{0y} = (${mr.v0.toFixed(1)}) \\sin(${thetaDeg.toFixed(1)}^\\circ) = ${vy}\\text{ m/s}`)}`
          }
        ]
      );

      const step2 = buildStepCard(
        2, "Step 2: Time to Dartboard (Horizontal Motion, aₓ = 0)", "Time to Wall",
        "Horizontal velocity is unaccelerated. Find travel time to the wall at x = 5.0 m.",
        [
          {
            label: "Horizontal Kinematic Law",
            math: katex(`x(t) = x_0 + v_{0x} t \\implies t = \\frac{x_{\\text{board}} - x_0}{v_{0x}}`)
          },
          {
            label: "Numerical Travel Time",
            math: `${katex(`t = \\frac{${mr.xBoard.toFixed(1)}\\text{ m} - ${mr.x0.toFixed(1)}\\text{ m}}{${vx}\\text{ m/s}} = ${tBoard}\\text{ s}`)} <span class="math-eval-tag">${tBoard} s</span>`
          }
        ]
      );

      const step3 = buildStepCard(
        3, "Step 3: Target Height H (Worksheet Question 1)", "Motorized Target",
        "Evaluate vertical position equation at t = t_board to determine where the target carriage must intercept the dart.",
        [
          {
            label: "Vertical Position Law",
            math: katex(`H = y(t_{\\text{board}}) = y_0 + v_{0y} t_{\\text{board}} - \\frac{1}{2}g t_{\\text{board}}^2`)
          },
          {
            label: "Numerical Substitution",
            math: `${katex(`H = ${mr.y0.toFixed(1)} + (${vy})(${tBoard}) - 0.5(${g.toFixed(1)})(${tBoard})^2 = ${targetH}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">H = ${targetH} m</span>`
          }
        ],
        true
      );

      const step4 = buildStepCard(
        4, "Step 4: Maximum Height & Ceiling Clearance (Worksheet Question 2)", "Apex Process",
        "Determine maximum peak altitude when vertical velocity momentarily drops to zero (vᵧ = 0), and verify ceiling clearance.",
        [
          {
            label: "Part A: Time to Apex (from vᵧ = 0)",
            math: `${katex(`v_y(t) = v_{0y} - g t \\implies 0 = ${vy} - (${g.toFixed(1)}) t_{\\text{apex}} \\implies t_{\\text{apex}} = \\frac{${vy}}{${g.toFixed(1)}} = ${tApex}\\text{ s}`)} <span class="math-eval-tag">${tApex} s</span>`
          },
          {
            label: "Part B: Maximum Apex Altitude",
            math: `${katex(`h_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g} = ${mr.y0.toFixed(1)} + \\frac{(${vy})^2}{2(${g.toFixed(1)})} = ${hMax}\\text{ m}`)} <span class="math-eval-tag">${hMax} m</span>`
          },
          {
            label: "Part C: Ceiling Clearance Margin",
            math: `${katex(`\\text{Ceiling: } ${mr.ceilingY.toFixed(1)}\\text{ m} \\quad \\text{vs} \\quad h_{\\text{max}} = ${hMax}\\text{ m} \\implies \\text{Margin} = ${(mr.ceilingY - parseFloat(hMax)).toFixed(2)}\\text{ m}`)}`
          }
        ],
        false, true
      );

      mathContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">🎯 Mark Rober Dartboard: Step Derivations</span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
          </div>
        </div>
        ${step1}
        ${step2}
        ${step3}
        ${step4}
        <div class="status-badge-inline ${res && res.hitsCeiling ? 'warn' : 'safe'}" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
          ${res && res.hitsCeiling ? `⚠️ Ceiling Collision: Roof at ${mr.ceilingY.toFixed(1)}m intercepts dart at x = ${res.xCeiling.toFixed(1)}m!` : `✅ Safe Workshop Clearance: Ceiling at ${mr.ceilingY.toFixed(1)}m > ${hMax}m!`}
        </div>
      `;

    } else if (state.mode === "classroom") {
      v0 = state.classroom.v0;
      thetaDeg = state.classroom.thetaDeg;
      g = state.classroom.g;
      x0 = state.classroom.x0;
      y0 = state.classroom.y0;

      const cp = state.classroom;
      const type = cp.problemType || "cliff-building";

      if (type === "tennis") {
        const tNet = (cp.x1 / (cp.v0 || 1)).toFixed(3);
        const yNet = (cp.y0 - 0.5 * cp.g * parseFloat(tNet) * parseFloat(tNet)).toFixed(3);
        const tGround = Math.sqrt((2 * cp.y0) / cp.g).toFixed(3);
        const xLand = (cp.v0 * parseFloat(tGround)).toFixed(2);
        const clearsNet = parseFloat(yNet) > cp.bldgHeight;
        const inCourt = parseFloat(xLand) <= cp.x2;

        const step1 = buildStepCard(
          1, "Step 1: Given Values & Horizontal Launch", "Initial State",
          `Horizontal serve at contact height y₀ = ${cp.y0.toFixed(1)} m at speed v₀ = ${cp.v0.toFixed(1)} m/s.`,
          [
            {
              label: "Velocity Components (θ = 0°)",
              math: katex(`v_{0x} = v_0 \\cos(0^\\circ) = ${cp.v0.toFixed(1)}\\text{ m/s}, \\quad v_{0y} = v_0 \\sin(0^\\circ) = 0\\text{ m/s}`)
            }
          ]
        );

        const step2 = buildStepCard(
          2, "Step 2: Condition 1 — Net Clearance at x_net = 12.0 m", "Net Height: 0.92 m",
          "Find time to reach the net and evaluate ball height.",
          [
            {
              label: "Time to Net",
              math: `${katex(`t_{\\text{net}} = \\frac{x_{\\text{net}}}{v_{0x}} = \\frac{${cp.x1.toFixed(1)}}{${cp.v0.toFixed(1)}} = ${tNet}\\text{ s}`)} <span class="math-eval-tag">${tNet} s</span>`
            },
            {
              label: "Ball Height at Net",
              math: `${katex(`y_{\\text{net}} = y_0 - \\frac{1}{2}g t_{\\text{net}}^2 = ${cp.y0.toFixed(1)} - 0.5(${cp.g.toFixed(1)})(${tNet})^2 = ${yNet}\\text{ m}`)} <span class="math-eval-tag">${yNet} m</span>`
            },
            {
              label: "Net Clearance Comparison",
              math: `${katex(`y_{\\text{net}} = ${yNet}\\text{ m} > ${cp.bldgHeight.toFixed(2)}\\text{ m} \\implies \\text{Margin} = +${(parseFloat(yNet) - cp.bldgHeight).toFixed(2)}\\text{ m}`)} <span class="math-eval-tag" style="color: var(--success);">Net Cleared!</span>`
            }
          ]
        );

        const step3 = buildStepCard(
          3, "Step 3: Condition 2 — Service Court Landing (x ≤ 18.4 m)", "Court Boundary",
          "Solve for total time to reach the ground and calculate landing position.",
          [
            {
              label: "Ground Flight Time",
              math: `${katex(`0 = y_0 - \\frac{1}{2}gt^2 \\implies t_{\\text{ground}} = \\sqrt{\\frac{2y_0}{g}} = \\sqrt{\\frac{2(${cp.y0.toFixed(1)})}{${cp.g.toFixed(1)}}} = ${tGround}\\text{ s}`)} <span class="math-eval-tag">${tGround} s</span>`
            },
            {
              label: "Landing Distance",
              math: `${katex(`x_{\\text{land}} = v_{0x} t_{\\text{ground}} = (${cp.v0.toFixed(1)})(${tGround}) = ${xLand}\\text{ m}`)} <span class="math-eval-tag">${xLand} m</span>`
            },
            {
              label: "Service Box Comparison",
              math: `${katex(`x_{\\text{land}} = ${xLand}\\text{ m} > ${cp.x2.toFixed(1)}\\text{ m (Service line)} \\implies \\text{Over by } ${(parseFloat(xLand) - cp.x2).toFixed(1)}\\text{ m}`)} <span class="math-eval-tag" style="color: var(--error);">LONG / OUT</span>`
            }
          ],
          true
        );

        mathContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">🎾 Tennis Serve: Full Clearance Analysis</span>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
              <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
            </div>
          </div>
          ${step1}
          ${step2}
          ${step3}
          <div class="status-badge-inline ${clearsNet && inCourt ? 'safe' : 'warn'}" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            ${clearsNet && inCourt ? '✅ Valid Serve: Clears net and lands inside service court!' : '❌ INVALID SERVE: Clears net successfully, but ball is LONG / OUT!'}
          </div>
        `;
        return;
      }

      if (type === "box-drop") {
        const tFall = Math.sqrt((2 * cp.y0) / cp.g).toFixed(3);
        const range = (cp.v0 * parseFloat(tFall)).toFixed(2);

        const step1 = buildStepCard(
          1, "Step 1: Given Values & Motion Independence", "Horizontal Launch",
          `Ball rolls horizontally off desk (y₀ = ${cp.y0.toFixed(1)} m) at speed v₀ = ${cp.v0.toFixed(1)} m/s.`,
          [
            {
              label: "Components",
              math: katex(`v_{0x} = ${cp.v0.toFixed(1)}\\text{ m/s}, \\quad v_{0y} = 0\\text{ m/s}, \\quad a_x = 0, \\quad a_y = -${cp.g.toFixed(1)}\\text{ m/s}^2`)
            }
          ]
        );

        const step2 = buildStepCard(
          2, "Step 2: Fall Time from Vertical Free Fall (y = 0)", "Flight Time",
          "Vertical free fall alone dictates time of flight.",
          [
            {
              label: "Position Equation",
              math: `${katex(`0 = y_0 - \\frac{1}{2}gt^2 \\implies t_{\\text{fall}} = \\sqrt{\\frac{2y_0}{g}} = \\sqrt{\\frac{2(${cp.y0.toFixed(1)})}{${cp.g.toFixed(1)}}} = ${tFall}\\text{ s}`)} <span class="math-eval-tag">${tFall} s</span>`
            }
          ]
        );

        const step3 = buildStepCard(
          3, "Step 3: Horizontal Landing Distance from Desk Base", "Range Solution",
          "Time connects horizontal velocity to ground range.",
          [
            {
              label: "Range Equation",
              math: `${katex(`x = v_{0x} t_{\\text{fall}} = (${cp.v0.toFixed(1)})(${tFall}) = ${range}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">x = ${range} m</span>`
            }
          ],
          true
        );

        mathContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">📦 Box Roll-Off: Kinematic Derivation</span>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
              <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
            </div>
          </div>
          ${step1}
          ${step2}
          ${step3}
          <div class="status-badge-inline safe" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            ✅ Landing Distance: Ball lands ${range} m from the base of the desk!
          </div>
        `;
        return;
      }

      if (type === "soccer") {
        const vx = 20.0, vy = 12.0;
        const v0Calc = Math.hypot(vx, vy).toFixed(2);
        const thetaCalc = (Math.atan2(vy, vx) * (180 / Math.PI)).toFixed(1);
        const tApex = (vy / cp.g).toFixed(2);
        const tFlight = (2 * vy / cp.g).toFixed(2);
        const maxH = (0.5 * vy * parseFloat(tApex)).toFixed(2);
        const range = (vx * parseFloat(tFlight)).toFixed(1);

        const step1 = buildStepCard(
          1, "Step 1: Launch Speed & Angle from Velocity Components", "Vector Inversion",
          "Given initial components: v₀ₓ = 20.0 m/s and v₀ᵧ = 12.0 m/s.",
          [
            {
              label: "Speed and Angle",
              math: `${katex(`v_0 = \\sqrt{v_{0x}^2 + v_{0y}^2} = \\sqrt{20^2 + 12^2} = ${v0Calc}\\text{ m/s}, \\quad \\theta = \\arctan\\left(\\frac{12}{20}\\right) = ${thetaCalc}^\\circ`)}`
            }
          ]
        );

        const step2 = buildStepCard(
          2, "Step 2: Time to Apex & Maximum Altitude (vᵧ = 0)", "Apex Derivation",
          "Vertical velocity ceases at the peak altitude.",
          [
            {
              label: "Rise Time & Apex Height",
              math: `${katex(`t_{\\text{apex}} = \\frac{v_{0y}}{g} = \\frac{12.0}{${cp.g.toFixed(1)}} = ${tApex}\\text{ s}, \\quad h_{\\text{max}} = \\frac{v_{0y}^2}{2g} = ${maxH}\\text{ m}`)}`
            }
          ]
        );

        const step3 = buildStepCard(
          3, "Step 3: Total Flight Time & Range Downfield", "Range Solution",
          "By parabolic symmetry over level ground, flight time is 2 × t_apex.",
          [
            {
              label: "Flight Time & Range",
              math: `${katex(`t_{\\text{flight}} = 2 t_{\\text{apex}} = ${tFlight}\\text{ s}, \\quad x = v_{0x} t_{\\text{flight}} = (20.0)(${tFlight}) = ${range}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">Range = ${range} m</span>`
            }
          ],
          true
        );

        mathContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">⚽ Soccer Kick: Full Solution</span>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
              <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
            </div>
          </div>
          ${step1}
          ${step2}
          ${step3}
          <div class="status-badge-inline safe" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            ✅ Solved: v₀ = ${v0Calc} m/s at θ = ${thetaCalc}°, flying a total range of ${range} m!
          </div>
        `;
        return;
      }

      if (type === "cliff-100m") {
        const tFall = Math.sqrt((2 * 100) / cp.g).toFixed(3);
        const reqV0 = (300 / parseFloat(tFall)).toFixed(2);

        const step1 = buildStepCard(
          1, "Step 1: Given Values & Target Range", "Setup",
          "Cliff height y₀ = 100.0 m, target range x = 300.0 m, fired horizontally (v₀ᵧ = 0).",
          [
            {
              label: "Given State",
              math: katex(`y_0 = 100.0\\text{ m}, \\quad x_{\\text{target}} = 300.0\\text{ m}, \\quad v_{0y} = 0\\text{ m/s}`)
            }
          ]
        );

        const step2 = buildStepCard(
          2, "Step 2: Fall Time from 100m Height", "Vertical Fall",
          "Time in air depends solely on vertical cliff height and gravity.",
          [
            {
              label: "Fall Duration",
              math: `${katex(`0 = y_0 - \\frac{1}{2}gt^2 \\implies t_{\\text{flight}} = \\sqrt{\\frac{2(100.0)}{${cp.g.toFixed(1)}}} = ${tFall}\\text{ s}`)} <span class="math-eval-tag">${tFall} s</span>`
            }
          ]
        );

        const step3 = buildStepCard(
          3, "Step 3: Required Initial Speed v₀", "Speed Solution",
          "Calculate horizontal velocity necessary to travel 300 m during flight time.",
          [
            {
              label: "Required Velocity",
              math: `${katex(`v_{0x} = \\frac{x_{\\text{target}}}{t_{\\text{flight}}} = \\frac{300.0\\text{ m}}{${tFall}\\text{ s}} = ${reqV0}\\text{ m/s}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">Required v₀ = ${reqV0} m/s</span>`
            }
          ],
          true
        );

        mathContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">⛰️ 100m Cliff Launch: Required Velocity</span>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
              <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
            </div>
          </div>
          ${step1}
          ${step2}
          ${step3}
          <div class="status-badge-inline safe" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            ✅ Required Launch Velocity: v₀ = ${reqV0} m/s guarantees hitting the 300m target!
          </div>
        `;
        return;
      }

      // Default: Classroom Notes Cliff & 70m Building
      const res = cp.hitResult;
      const maxH = res ? res.maxH.toFixed(2) : "342.05";
      const tApex = res ? res.tApex.toFixed(2) : "2.10";
      const t2 = res ? res.t2.toFixed(2) : "8.52";
      const y2 = res ? res.y2.toFixed(1) : "135.8";
      const vx = res ? res.vx.toFixed(1) : "36.4";
      const vy = res ? res.vy.toFixed(1) : "21.0";

      const step1 = buildStepCard(
        1, "Step 1: Velocity Decomposition (SOH CAHTOA)", "Components",
        `Fired from cliff (y₀ = ${cp.y0} m) at speed v₀ = ${cp.v0.toFixed(1)} m/s at angle θ = ${cp.thetaDeg.toFixed(1)}°.`,
        [
          {
            label: "Trigonometric Components",
            math: katex(`v_{0x} = v_0 \\cos(\\theta) = (${cp.v0.toFixed(1)}) \\cos(${cp.thetaDeg.toFixed(1)}^\\circ) = ${vx}\\text{ m/s}, \\quad v_{0y} = (${cp.v0.toFixed(1)}) \\sin(${cp.thetaDeg.toFixed(1)}^\\circ) = ${vy}\\text{ m/s}`)
          }
        ]
      );

      const step2 = buildStepCard(
        2, "Step 2: Maximum Height h_max (vᵧ = 0 at Peak)", "Apex",
        "Vertical velocity ceases at apex: vᵧ(t_apex) = 0.",
        [
          {
            label: "Apex Rise Time & Height",
            math: `${katex(`t_{\\text{apex}} = \\frac{v_{0y}}{g} = \\frac{${vy}}{${cp.g.toFixed(1)}} = ${tApex}\\text{ s}, \\quad h_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g} = ${cp.y0} + \\frac{(${vy})^2}{2(${cp.g.toFixed(1)})} = ${maxH}\\text{ m}`)} <span class="math-eval-tag">Apex = ${maxH} m</span>`
          }
        ]
      );

      const step3 = buildStepCard(
        3, `Step 3: Time as Bridge to Far Wall (x₂ = ${cp.x2} m)`, "Bridge Time",
        "Horizontal velocity is constant. Find flight time to reach the far obstacle edge.",
        [
          {
            label: "Travel Time to Far Wall",
            math: `${katex(`t_2 = \\frac{x_2 - x_0}{v_{0x}} = \\frac{${cp.x2} - 0}{${vx}} = ${t2}\\text{ s}`)} <span class="math-eval-tag">${t2} s</span>`
          }
        ],
        true
      );

      const step4 = buildStepCard(
        4, "Step 4: Building Roof Clearance Check", "Roof Clearance",
        `Evaluate vertical position at t = ${t2} s and compare with building height (${cp.bldgHeight} m).`,
        [
          {
            label: "Vertical Position at Far Edge",
            math: `${katex(`y(t_2) = y_0 + v_{0y} t_2 - \\frac{1}{2}g t_2^2 = ${cp.y0} + (${vy})(${t2}) - 0.5(${cp.g.toFixed(1)})(${t2})^2 = ${y2}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--primary-teal-light); color: var(--primary-teal-dark);">y = ${y2} m</span>`
          },
          {
            label: "Roof Clearance Margin",
            math: `${katex(`y(${t2}\\text{ s}) = ${y2}\\text{ m} > ${cp.bldgHeight}\\text{ m} \\implies \\text{Roof Clearance} = +${(parseFloat(y2) - cp.bldgHeight).toFixed(1)}\\text{ m}`)} <span class="math-eval-tag" style="color: var(--success);">SAFE!</span>`
          }
        ],
        false, true
      );

      mathContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">📋 Classroom Notes: Cliff &amp; 70m Building</span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
          </div>
        </div>
        ${step1}
        ${step2}
        ${step3}
        ${step4}
        <div class="status-badge-inline ${res && res.clearsBuilding ? 'safe' : 'warn'}" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
          ${res && res.clearsBuilding ? `✅ Projectile Clears Building: Passes ${cp.x2}m edge at altitude y = ${y2}m (> ${cp.bldgHeight}m roof)!` : `❌ Building Collision: Strikes ${res ? res.collisionType : 'wall'}!`}
        </div>
      `;

    } else {
      v0 = state.sandbox.v0;
      thetaDeg = state.sandbox.thetaDeg;
      g = state.sandbox.g;
      x0 = state.sandbox.x0;
      y0 = state.sandbox.y0;

      const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
      const tFlight = ProjectilesPhysics.calculateTimeOfFlight(y0, decomp.vy, g, 0);
      const range = (decomp.vx * tFlight).toFixed(1);
      const tApex = (decomp.vy > 0 ? decomp.vy / g : 0).toFixed(2);
      const maxH = ProjectilesPhysics.calculateMaxHeight(y0, decomp.vy, g).toFixed(1);

      const step1 = buildStepCard(
        1, "Step 1: Velocity Decomposition (SOH CAHTOA)", "Components",
        "Resolve 2D launch velocity into perpendicular components.",
        [
          {
            label: "Trigonometric Components",
            math: katex(`v_{0x} = (${v0.toFixed(1)}) \\cos(${thetaDeg.toFixed(1)}^\\circ) = ${decomp.vx.toFixed(2)}\\text{ m/s}, \\quad v_{0y} = (${v0.toFixed(1)}) \\sin(${thetaDeg.toFixed(1)}^\\circ) = ${decomp.vy.toFixed(2)}\\text{ m/s}`)
          }
        ]
      );

      const step2 = buildStepCard(
        2, "Step 2: Peak Altitude & Rise Time (vᵧ = 0)", "Apex",
        "Calculate rise time and maximum height reached.",
        [
          {
            label: "Apex Rise Time & Altitude",
            math: `${katex(`t_{\\text{apex}} = \\frac{v_{0y}}{g} = ${tApex}\\text{ s}, \\quad h_{\\text{max}} = y_0 + \\frac{v_{0y}^2}{2g} = ${maxH}\\text{ m}`)} <span class="math-eval-tag">Apex = ${maxH} m</span>`
          }
        ]
      );

      const step3 = buildStepCard(
        3, "Step 3: Total Flight Time & Range", "Ground Impact",
        "Solve for total time until ground landing (y = 0) and total horizontal range.",
        [
          {
            label: "Flight Time & Range",
            math: `${katex(`t_{\\text{flight}} = ${tFlight.toFixed(2)}\\text{ s}, \\quad \\text{Range } x = v_{0x} t_{\\text{flight}} = ${range}\\text{ m}`)} <span class="math-eval-tag" style="background: var(--accent-amber-light); color: var(--accent-amber-dark);">${range} m</span>`
          }
        ],
        true
      );

      mathContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.4rem;">
          <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary-teal-dark);">🧪 Free Sandbox: Kinematic Derivation</span>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnExpandAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Expand All</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCollapseAllMath" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Collapse All</button>
          </div>
        </div>
        ${step1}
        ${step2}
        ${step3}
      `;
    }

    // Attach listeners for Expand All / Collapse All in math panel
    const btnExpand = document.getElementById("btnExpandAllMath");
    const btnCollapse = document.getElementById("btnCollapseAllMath");
    if (btnExpand) btnExpand.onclick = () => document.querySelectorAll(".math-step-card").forEach(c => c.classList.add("open"));
    if (btnCollapse) btnCollapse.onclick = () => document.querySelectorAll(".math-step-card").forEach(c => c.classList.remove("open"));

    // Update Cornell T-Chart
    const decomp = ProjectilesPhysics.decomposeVelocity(v0, thetaDeg);
    const tcVx = document.getElementById("tcVx");
    const tcAy = document.getElementById("tcAy");
    const sohCalcVx = document.getElementById("sohCalcVx");
    const sohCalcVy = document.getElementById("sohCalcVy");
    const tcSubX = document.getElementById("tcSubX");
    const tcSubVy = document.getElementById("tcSubVy");
    const tcSubY = document.getElementById("tcSubY");

    if (tcVx) tcVx.textContent = decomp.vx.toFixed(1);
    if (tcAy) tcAy.textContent = (-g).toFixed(1);
    if (sohCalcVx) sohCalcVx.textContent = `${v0.toFixed(1)} · cos(${thetaDeg.toFixed(1)}°) = ${decomp.vx.toFixed(2)} m/s`;
    if (sohCalcVy) sohCalcVy.textContent = `${v0.toFixed(1)} · sin(${thetaDeg.toFixed(1)}°) = ${decomp.vy.toFixed(2)} m/s`;
    if (tcSubX) tcSubX.textContent = `x = ${x0.toFixed(1)} + (${decomp.vx.toFixed(1)})·t`;
    if (tcSubVy) tcSubVy.textContent = `vᵧ = ${decomp.vy.toFixed(1)} - (${g.toFixed(1)})·t`;
    if (tcSubY) tcSubY.textContent = `y = ${y0.toFixed(1)} + (${decomp.vy.toFixed(1)})·t - ${(0.5 * g).toFixed(1)}·t²`;
  }

  // ==========================================================================
  // Inquiry Scenario Card & Pedagogical Problem Prompts
  // ==========================================================================

  function updateInquiryScenarioCard(mode, presetKey = "") {
    const titleEl = document.getElementById("inquiryTitle");
    const tagEl = document.getElementById("inquiryTag");
    const narrativeEl = document.getElementById("inquiryNarrative");
    const listEl = document.getElementById("inquiryQuestionsList");
    if (!titleEl || !tagEl || !narrativeEl || !listEl) return;

    if (mode === "monkey") {
      titleEl.innerHTML = "🐵 Feed the Monkey: Free-Fall Intercept Challenge";
      tagEl.textContent = "Target Intercept";
      narrativeEl.innerHTML = "A hungry monkey hangs from a tree branch at horizontal distance <var>x<sub>m</sub></var> and height <var>y<sub>m</sub></var>. A zookeeper aims a cannon directly along the visual line of sight and fires a banana with launch speed <var>v₀</var>. The exact millisecond the cannon fires, the monkey lets go and drops vertically in free fall.";
      listEl.innerHTML = `
        <li><strong>(a) Aim Direction:</strong> Where must the cannon be aimed (above, directly at, or below the monkey) to ensure the banana intercepts the falling monkey before reaching the ground?</li>
        <li><strong>(b) Speed Invariance:</strong> How does changing the launch velocity <var>v₀</var> affect whether an intercept occurs (assuming the banana reaches distance <var>x<sub>m</sub></var> prior to ground impact)?</li>
        <li><strong>(c) Deflection from Sight Line:</strong> In time <var>t</var>, how far do both the banana and monkey fall below the straight unaccelerated line of sight? (Recall <var>&Delta;y = &frac12;gt&sup2;</var>).</li>
        <li><strong>(d) Minimum Catch Velocity:</strong> Calculate the minimum initial speed <var>v₀</var> needed so the intercept occurs at or above ground level (<var>y &ge; 0</var>).</li>
      `;
    } else if (mode === "mark-rober") {
      titleEl.innerHTML = "🎯 Mark Rober's Dartboard Kinematics Challenge";
      tagEl.textContent = "Clearance & Intercept";
      narrativeEl.innerHTML = "A player tosses a dart from release height <var>y₀</var> at launch speed <var>v₀</var> and angle <var>&alpha;</var> toward a target dartboard at horizontal distance <var>x<sub>board</sub></var>. A low ceiling / overhead obstacle stands at height <var>H<sub>ceiling</sub></var>.";
      listEl.innerHTML = `
        <li><strong>(a) Low Ceiling Clearance:</strong> Does the dart clear the low overhead ceiling beam at its trajectory apex, or does it strike the obstacle? Calculate peak altitude <var>y<sub>max</sub></var>.</li>
        <li><strong>(b) Dartboard Impact Height:</strong> At what exact height <var>y</var> does the dart impact the dartboard located at <var>x = x<sub>board</sub></var>?</li>
        <li><strong>(c) Impact Velocity &amp; Penetration Angle:</strong> What are the velocity components <var>v<sub>x</sub></var> and <var>v<sub>y</sub></var> upon striking the board, and at what angle does the dart arrive?</li>
        <li><strong>(d) Optimum Launch Angle:</strong> What launch angle maximizes the target height or ensures safe ceiling clearance?</li>
      `;
    } else if (mode === "classroom") {
      const pType = presetKey || (state.classroom ? state.classroom.problemType : "cliff-building");
      if (pType === "tennis") {
        titleEl.innerHTML = "🎾 Tennis Flat Serve Net Clearance";
        tagEl.textContent = "Horizontal Launch";
        narrativeEl.innerHTML = "A tennis player strikes a horizontal serve (<var>&theta; = 0&deg;</var>) from baseline height <var>y₀ = 2.50&text; m</var> at speed <var>v₀ = 40.0&text; m/s</var>. The net is <var>12.0&text; m</var> away with height <var>0.92&text; m</var>, and the service box boundary is <var>18.4&text; m</var> from the server.";
        listEl.innerHTML = `
          <li><strong>(a) Net Clearance:</strong> Does the tennis ball clear the 0.92 m net at distance <var>x = 12.0&text; m</var>? Calculate the vertical clearance margin.</li>
          <li><strong>(b) Service Box Landing:</strong> Does the serve land within the legal service box boundary (<var>x &le; 18.4&text; m</var>)? What is its exact court impact distance?</li>
          <li><strong>(c) Impact Velocity:</strong> Find the magnitude and direction of the velocity vector when the ball hits the court surface.</li>
        `;
      } else if (pType === "soccer") {
        titleEl.innerHTML = "⚽ Soccer Free Kick over Defensive Wall";
        tagEl.textContent = "Angled Projection";
        narrativeEl.innerHTML = "A soccer player takes a free kick from ground level (<var>y₀ = 0</var>) at initial speed <var>v₀ = 23.3&text; m/s</var> at an elevation angle of <var>&theta; = 31.0&deg;</var>. A defensive wall of height <var>2.44&text; m</var> stands between <var>x = 49.0&text; m</var> and <var>52.0&text; m</var>.";
        listEl.innerHTML = `
          <li><strong>(a) Defensive Wall Clearance:</strong> Does the ball clear the top of the defensive wall? Calculate the height of the ball at <var>x = 49.0&text; m</var> and <var>x = 52.0&text; m</var>.</li>
          <li><strong>(b) Total Range &amp; Hang Time:</strong> How long does the ball remain airborne, and at what horizontal distance does it hit the ground?</li>
          <li><strong>(c) Peak Height:</strong> What is the maximum altitude reached by the soccer ball above the pitch?</li>
        `;
      } else if (pType === "box-drop") {
        titleEl.innerHTML = "📦 Tabletop Roll-Off Kinematics";
        tagEl.textContent = "Horizontal Launch";
        narrativeEl.innerHTML = "A laboratory block slides horizontally off the flat edge of a table at height <var>y₀ = 2.00&text; m</var> with speed <var>v₀ = 5.00&text; m/s</var> (<var>&theta; = 0&deg;</var>).";
        listEl.innerHTML = `
          <li><strong>(a) Time in Free Fall:</strong> Calculate the time required for the block to fall from the tabletop to the floor (<var>y = 0</var>).</li>
          <li><strong>(b) Horizontal Displacement:</strong> How far from the edge of the table (<var>&Delta;x</var>) does the block land?</li>
          <li><strong>(c) Impact Velocity:</strong> Determine the final velocity vector (magnitude and angle below horizontal) immediately prior to landing.</li>
        `;
      } else if (pType === "cliff-100m") {
        titleEl.innerHTML = "⛰️ 100m Elevated Cliff Launch (Target Range)";
        tagEl.textContent = "Target Range";
        narrativeEl.innerHTML = "A projectile is launched horizontally from the edge of a vertical cliff of height <var>y₀ = 100&text; m</var> toward a target placed on the ground at horizontal distance <var>x = 300&text; m</var>.";
        listEl.innerHTML = `
          <li><strong>(a) Free Fall Duration:</strong> How long does it take for any object dropped or horizontally fired from <var>100&text; m</var> to hit the ground?</li>
          <li><strong>(b) Required Launch Speed:</strong> What horizontal launch velocity <var>v₀</var> must be imparted to hit the target at <var>x = 300&text; m</var>?</li>
          <li><strong>(c) Final Velocity at Impact:</strong> Compute the impact speed and angle with the ground upon target contact.</li>
        `;
      } else {
        titleEl.innerHTML = "🏔️ Cliff Launch over Obstacle Building";
        tagEl.textContent = "Classroom Problem";
        narrativeEl.innerHTML = "A projectile is launched from the top edge of a <var>320&text; m</var> cliff at speed <var>v₀ = 42.0&text; m/s</var> angled at <var>&theta; = 30.0&deg;</var> above horizontal. Standing between <var>x = 230&text; m</var> and <var>x = 310&text; m</var> is a building of height <var>70.0&text; m</var>.";
        listEl.innerHTML = `
          <li><strong>(a) Peak Altitude &amp; Rise Time:</strong> What is the maximum height reached by the projectile above the ground, and at what time is apex achieved?</li>
          <li><strong>(b) Obstacle Clearance:</strong> Does the projectile clear the roof of the building at its front face (<var>x = 230&text; m</var>) and back face (<var>x = 310&text; m</var>)? Calculate clearance heights.</li>
          <li><strong>(c) Total Flight Time:</strong> Solve the quadratic position equation for total time of flight until ground impact (<var>y = 0</var>).</li>
          <li><strong>(d) Final Impact Velocity &amp; Range:</strong> Determine the horizontal range and the speed and angle upon ground landing.</li>
        `;
      }
    } else {
      titleEl.innerHTML = "🧪 2D Projectile Kinematics Sandbox";
      tagEl.textContent = "Exploration";
      narrativeEl.innerHTML = "Explore arbitrary 2D projectile trajectories with custom initial launch velocity <var>v₀</var>, angle <var>&theta;</var>, initial height <var>y₀</var>, and gravitational acceleration <var>g</var>.";
      listEl.innerHTML = `
        <li><strong>(a) Angle of Maximum Range:</strong> Investigate how the launch angle <var>&theta;</var> maximizing range shifts from <var>45&deg;</var> when launch height <var>y₀ &gt; 0</var>.</li>
        <li><strong>(b) Independence of Components:</strong> Observe how horizontal velocity <var>v<sub>x</sub></var> remains strictly constant while vertical velocity <var>v<sub>y</sub></var> decreases linearly at rate <var>-g</var>.</li>
        <li><strong>(c) Parabolic Path Equation:</strong> Verify the trajectory equation <var>y(x) = y₀ + x\tan\theta - \frac{g x²}{2 v₀² \cos²\theta}</var> by inspecting coordinates along the path.</li>
      `;
    }
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
      drawBanana(ctx, 0, 7, 0.25, 0.75);
    }

    ctx.restore();
  }

  function drawBanana(ctx, cx, cy, angleRad, scale) {
    scale = scale || 1.0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad || 0);
    ctx.scale(scale, scale);

    // Outer Crescent Body
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.bezierCurveTo(-6, 9, 8, 9, 16, -2);
    ctx.lineTo(17, -1);
    ctx.bezierCurveTo(8, 4.5, -6, 4.5, -16, -5);
    ctx.closePath();

    // Vibrant Yellow-Amber Peel Gradient
    const grad = ctx.createLinearGradient(-16, 0, 16, 0);
    grad.addColorStop(0, "#e8a817");
    grad.addColorStop(0.45, "#f5c531");
    grad.addColorStop(1, "#d67b19");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = "#b06210";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3D Banana Longitudinal Ridge
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.bezierCurveTo(-5, 6, 7, 6, 15, -2);
    ctx.strokeStyle = "#e09310";
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Stem at base (Greenish-Brown)
    ctx.fillStyle = "#5c4015";
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.lineTo(-20, -7);
    ctx.lineTo(-20, -9);
    ctx.lineTo(-15, -7);
    ctx.closePath();
    ctx.fill();

    // Blossom tip (Dark Brown)
    ctx.fillStyle = "#382307";
    ctx.beginPath();
    ctx.arc(17, -1, 1.8, 0, Math.PI * 2);
    ctx.fill();

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
    const type = cp.problemType || "cliff-building";

    if (type === "tennis") {
      // 1. Tennis Court Ground
      const cL = worldToScreen(b.worldXMin, 0, b);
      const cR = worldToScreen(b.worldXMax, 0, b);
      ctx.fillStyle = "#e8f4f0";
      ctx.fillRect(cL.x, cL.y, cR.x - cL.x, b.h - cL.y);

      // Baseline & Service Line Markers
      const basePt = worldToScreen(0, 0, b);
      const netPt = worldToScreen(12.0, 0, b);
      const netTop = worldToScreen(12.0, 0.92, b);
      const servPt = worldToScreen(18.4, 0, b);

      // Court Lines
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(basePt.x, basePt.y);
      ctx.lineTo(servPt.x + 60, basePt.y);
      ctx.stroke();

      // Net Posts and Mesh
      ctx.strokeStyle = "#0f7e9b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(netPt.x, netPt.y);
      ctx.lineTo(netTop.x, netTop.y);
      ctx.stroke();

      // Net mesh pattern
      ctx.fillStyle = "rgba(15, 126, 155, 0.15)";
      ctx.fillRect(netTop.x - 3, netTop.y, 6, netPt.y - netTop.y);
      ctx.strokeStyle = "#123140";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(netTop.x - 6, netTop.y);
      ctx.lineTo(netTop.x + 6, netTop.y);
      ctx.stroke();

      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("NET (0.92m)", netTop.x - 28, netTop.y - 8);

      // Service Line boundary
      ctx.strokeStyle = "#d67b19";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(servPt.x, servPt.y);
      ctx.lineTo(servPt.x, servPt.y - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#d67b19";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText("SERVICE LINE (18.4m)", servPt.x - 50, servPt.y - 45);

      // Server position & launcher
      const canPt = worldToScreen(cp.x0, cp.y0, b);
      drawCannonSprite(canPt.x, canPt.y, cp.thetaDeg);
      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(`SERVE CONTACT (h₀ = ${cp.y0}m)`, canPt.x - 20, canPt.y - 12);
      return;
    }

    if (type === "box-drop") {
      // Cubical box: 2m wide, 2m tall
      const boxEdge = worldToScreen(cp.x0, cp.y0, b);
      const boxBase = worldToScreen(cp.x0, 0, b);
      const boxLeft = worldToScreen(cp.x0 - 2.0, cp.y0, b);

      ctx.fillStyle = "#e2eef3";
      ctx.fillRect(boxLeft.x, boxEdge.y, boxEdge.x - boxLeft.x, boxBase.y - boxEdge.y);
      ctx.strokeStyle = "#0f7e9b";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(boxLeft.x, boxEdge.y, boxEdge.x - boxLeft.x, boxBase.y - boxEdge.y);

      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("BOX (2m × 2m)", boxLeft.x + 8, boxEdge.y + 24);

      drawCannonSprite(boxEdge.x, boxEdge.y, cp.thetaDeg);
      return;
    }

    if (type === "soccer") {
      // Soccer pitch ground
      const cL = worldToScreen(b.worldXMin, 0, b);
      const cR = worldToScreen(b.worldXMax, 0, b);
      ctx.fillStyle = "#e6f5ee";
      ctx.fillRect(cL.x, cL.y, cR.x - cL.x, b.h - cL.y);

      // Goal at range ~49m
      const goalPt = worldToScreen(49.0, 0, b);
      const goalTop = worldToScreen(49.0, 2.44, b);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3.5;
      ctx.strokeRect(goalPt.x, goalTop.y, 25, goalPt.y - goalTop.y);

      ctx.fillStyle = "#0f7e9b";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("SOCCER GOAL (49m)", goalPt.x - 30, goalTop.y - 8);

      const canPt = worldToScreen(cp.x0, cp.y0, b);
      drawCannonSprite(canPt.x, canPt.y, cp.thetaDeg);
      return;
    }

    // Default: Cliff & Building (or 100m cliff)
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
    ctx.fillText(`CLIFF h₀ = ${cp.y0}m`, cliffEdge.x - 90, cliffEdge.y - 12);

    if (cp.bldgHeight > 0 && cp.x2 > cp.x1) {
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
    } else if (type === "cliff-100m") {
      const tgt = worldToScreen(300, 0, b);
      ctx.strokeStyle = "#d67b19";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tgt.x, tgt.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#d67b19";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText("TARGET (300m)", tgt.x - 35, tgt.y - 14);
    }

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
      drawBanana(ctx, scrPt.x, scrPt.y, state.simTime * 8, 0.95);
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

      addPresetPill("Cliff & 70m Building (Lecture Notes)", true, () => {
        state.classroom.problemType = "cliff-building";
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

      addPresetPill("🎾 Tennis Serve Challenge", false, () => {
        state.classroom.problemType = "tennis";
        state.classroom.y0 = 2.5;
        state.classroom.v0 = 40.0;
        state.classroom.thetaDeg = 0.0;
        state.classroom.x1 = 12.0;
        state.classroom.x2 = 18.4;
        state.classroom.bldgHeight = 0.92;
        state.classroom.g = 9.8;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("⚽ Soccer Kick (20 & 12 m/s)", false, () => {
        state.classroom.problemType = "soccer";
        state.classroom.y0 = 0.0;
        state.classroom.v0 = 23.3;
        state.classroom.thetaDeg = 31.0;
        state.classroom.x1 = 49.0;
        state.classroom.x2 = 52.0;
        state.classroom.bldgHeight = 2.44;
        state.classroom.g = 9.8;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("📦 Box Roll-Off (2m, 5 m/s)", false, () => {
        state.classroom.problemType = "box-drop";
        state.classroom.y0 = 2.0;
        state.classroom.v0 = 5.0;
        state.classroom.thetaDeg = 0.0;
        state.classroom.x1 = 0.0;
        state.classroom.x2 = 0.0;
        state.classroom.bldgHeight = 0.0;
        state.classroom.g = 9.8;
        syncSliders();
        resetSimulation();
      });

      addPresetPill("⛰️ 100m Cliff Launch (300m range)", false, () => {
        state.classroom.problemType = "cliff-100m";
        state.classroom.y0 = 100.0;
        state.classroom.v0 = 66.4;
        state.classroom.thetaDeg = 0.0;
        state.classroom.x1 = 0.0;
        state.classroom.x2 = 0.0;
        state.classroom.bldgHeight = 0.0;
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
    if (btnAutoFitZoom) {
      btnAutoFitZoom.addEventListener("click", () => {
        resizeCanvas();
        render();
      });
    }

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
