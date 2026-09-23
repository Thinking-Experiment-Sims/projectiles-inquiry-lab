/**
 * projectilesPhysics.test.js
 * 
 * Unit tests for 2D Kinematics and Intercept Engine:
 * - Vector decomposition (SOH CAHTOA)
 * - Feed the Monkey intercept theorem (free-fall drop equivalence)
 * - Mark Rober automated dartboard bullseye & ceiling clearance
 * - Classroom Cliff & Obstacle Building problem
 * - Horizontal projectile fall time and range
 * - Strobe points and T-Chart data generation
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const ProjectilesPhysics = require("../src/projectilesPhysics.js");

test("Vector decomposition (SOH CAHTOA) - 45 deg", () => {
  const d = ProjectilesPhysics.decomposeVelocity(10, 45);
  // From teacher's notes page 7 & 10: vx = 7.07 m/s, vy = 7.07 m/s
  assert.ok(Math.abs(d.vx - 7.071) < 0.01);
  assert.ok(Math.abs(d.vy - 7.071) < 0.01);
});

test("Vector decomposition - Classroom Cliff Problem (30 deg, 42 m/s)", () => {
  const d = ProjectilesPhysics.decomposeVelocity(42, 30);
  // From teacher's notes page 7, 8, 13:
  // vox = 42 * cos(30) = 36.37 m/s (approx 36.4 m/s in notes)
  // voy = 42 * sin(30) = 21.00 m/s
  assert.ok(Math.abs(d.vx - 36.373) < 0.01);
  assert.ok(Math.abs(d.vy - 21.000) < 0.001);
});

test("Vector decomposition - Mark Rober Dart (40 deg, 15 m/s)", () => {
  const d = ProjectilesPhysics.decomposeVelocity(15, 40);
  // vox = 15 * cos(40) = 11.49 m/s
  // voy = 15 * sin(40) = 9.64 m/s
  assert.ok(Math.abs(d.vx - 11.4907) < 0.01);
  assert.ok(Math.abs(d.vy - 9.6418) < 0.01);
});

test("Feed the Monkey Theorem - Aim directly at monkey guarantees hit at any speed", () => {
  // Cannon at (0, 0), Monkey at (25, 16)
  // Direct aim angle = atan2(16, 25) = 32.619 deg
  const dx = 25;
  const dy = 16;
  const directAngle = Math.atan2(dy, dx) * (180 / Math.PI);

  const testSpeeds = [18, 22, 26, 30, 40, 50];

  for (const speed of testSpeeds) {
    const res = ProjectilesPhysics.calculateMonkeyIntercept({
      x0: 0,
      y0: 0,
      xm: 25,
      ym: 16,
      v0: speed,
      thetaDeg: directAngle,
      g: 9.80,
      catchRadius: 0.50
    });

    assert.equal(res.isAimedAtMonkey, true);
    // The vertical deviation must be identically zero!
    assert.ok(Math.abs(res.verticalDeviation) < 1e-6, `Speed ${speed} m/s failed zero deviation`);
    assert.equal(res.isHit, true, `Speed ${speed} m/s failed hit`);
    // Both fell by the exact same drop distance
    assert.ok(Math.abs(res.dropDist - (0.5 * 9.80 * res.tIntercept * res.tIntercept)) < 1e-6);
  }
});

test("Feed the Monkey - Aiming above misses over monkey, aiming below misses under", () => {
  const directAngle = Math.atan2(16, 25) * (180 / Math.PI); // ~32.62 deg

  // Aim 10 deg above
  const resHigh = ProjectilesPhysics.calculateMonkeyIntercept({
    x0: 0,
    y0: 0,
    xm: 25,
    ym: 16,
    v0: 25,
    thetaDeg: directAngle + 10,
    g: 9.80,
    catchRadius: 0.40
  });
  assert.ok(resHigh.yBananaAtTime > resHigh.yMonkeyAtTime);
  assert.equal(resHigh.isHit, false);

  // Aim 10 deg below
  const resLow = ProjectilesPhysics.calculateMonkeyIntercept({
    x0: 0,
    y0: 0,
    xm: 25,
    ym: 16,
    v0: 25,
    thetaDeg: directAngle - 10,
    g: 9.80,
    catchRadius: 0.40
  });
  assert.ok(resLow.yBananaAtTime < resLow.yMonkeyAtTime);
  assert.equal(resLow.isHit, false);
});

test("Feed the Monkey - Zero gravity verification", () => {
  const directAngle = Math.atan2(16, 25) * (180 / Math.PI);
  const resZeroG = ProjectilesPhysics.calculateMonkeyIntercept({
    x0: 0,
    y0: 0,
    xm: 25,
    ym: 16,
    v0: 25,
    thetaDeg: directAngle,
    g: 0
  });

  // Drop distance in zero-g is 0
  assert.equal(resZeroG.dropDist, 0);
  assert.equal(resZeroG.yMonkeyAtTime, 16);
  assert.ok(Math.abs(resZeroG.yBananaAtTime - 16) < 1e-6);
});

test("Mark Rober Dartboard Problem - Worksheet Question 1 (Target Height H)", () => {
  // Mark Rober: x0 = 0, y0 = 1.8m, v0 = 15 m/s, alpha = 40 deg, xBoard = 5.0m, g = 10.0 m/s^2
  const sol = ProjectilesPhysics.calculateMarkRoberDartboard({
    x0: 0,
    y0: 1.80,
    xBoard: 5.0,
    v0: 15.0,
    alphaDeg: 40.0,
    g: 10.0,
    ceilingY: 7.0
  });

  // tBoard = 5.0 / (15 * cos(40)) = 0.4351 s
  assert.ok(Math.abs(sol.tBoard - 0.4351) < 0.002);

  // Target Height H = 1.8 + 15*sin(40)*(0.4351) - 0.5*10*(0.4351)^2 = 5.05m
  assert.ok(Math.abs(sol.targetHeightH - 5.05) < 0.02);
});

test("Mark Rober Dartboard Problem - Worksheet Question 2 (Max Height & Ceiling Clearance)", () => {
  const sol = ProjectilesPhysics.calculateMarkRoberDartboard({
    x0: 0,
    y0: 1.80,
    xBoard: 5.0,
    v0: 15.0,
    alphaDeg: 40.0,
    g: 10.0,
    ceilingY: 7.0
  });

  // Apex time = 15*sin(40)/10 = 0.964 s
  assert.ok(Math.abs(sol.tApex - 0.964) < 0.002);

  // Max height hmax = 1.8 + (15*sin(40))^2 / 20 = 6.45m
  assert.ok(Math.abs(sol.maxDartHeight - 6.45) < 0.02);

  // Default ceiling at 7.0m -> dart clears ceiling!
  assert.equal(sol.hitsCeiling, false);
  assert.equal(sol.apexExceedsCeiling, false);
  assert.ok(sol.ceilingMargin > 0.5);

  // If ceiling is low (e.g. 4.0m), dart hits ceiling before dartboard
  const solLowCeil = ProjectilesPhysics.calculateMarkRoberDartboard({
    x0: 0,
    y0: 1.80,
    xBoard: 5.0,
    v0: 15.0,
    alphaDeg: 40.0,
    g: 10.0,
    ceilingY: 4.0
  });
  assert.equal(solLowCeil.hitsCeiling, true);
  assert.equal(solLowCeil.apexExceedsCeiling, true);
  assert.ok(solLowCeil.tCeiling < solLowCeil.tBoard);
});

test("Classroom Notes Building Obstacle Problem (Pages 7-8 & 13-14)", () => {
  // Cliff h0 = 320m, v0 = 42 m/s, theta = 30 deg, g = 10 m/s^2
  // Obstacle building between x1 = 230m and x2 = 310m, height 70m
  const sol = ProjectilesPhysics.calculateBuildingObstacle({
    x0: 0,
    y0: 320,
    v0: 42.0,
    thetaDeg: 30.0,
    g: 10.0,
    x1: 230,
    x2: 310,
    bldgHeight: 70
  });

  // Part a) hmax in notes:
  // voy = 21 m/s, tup = 2.1 s, hmax = 320 + 21(2.1) - 0.5(10)(2.1)^2 = 342.05 m
  assert.ok(Math.abs(sol.tApex - 2.1) < 0.001);
  assert.ok(Math.abs(sol.maxH - 342.05) < 0.01);

  // Part b) At x = 310m:
  // vox = 36.37 m/s (36.4 in notes), t = 310 / 36.37 = 8.52 s
  // y(8.52s) = 320 + 21(8.52) - 5*(8.52)^2 approx 135.8 m (notes note ~144.5m with rough rounding)
  // In both cases, y > 70m => "If y > 70m, you don't touch the building"
  assert.ok(Math.abs(sol.t2 - 8.52) < 0.05);
  assert.ok(sol.y2 > 70.0);
  assert.ok(Math.abs(sol.y2 - 135.8) < 1.0);
  assert.equal(sol.clearsBuilding, true);
  assert.equal(sol.collisionType, "none");
});

test("Horizontal Projectile (Classroom Notes Page 5 & 11)", () => {
  // Free fall time depends only on height: t = sqrt(2*h/g)
  const h = 0.90; // 0.9m height
  const g = 9.80;
  const tFall = ProjectilesPhysics.calculateTimeOfFlight(h, 0, g, 0);
  assert.ok(Math.abs(tFall - Math.sqrt((2 * 0.9) / 9.8)) < 1e-6);

  // If distance = 18.3m, required vx = 18.3 / tFall
  const requiredVx = 18.3 / tFall;
  const range = ProjectilesPhysics.calculateRange(0, h, requiredVx, 0, g, 0);
  assert.ok(Math.abs(range - 18.3) < 0.001);
});

test("Strobe points generator creates equal time increments", () => {
  const traj = ProjectilesPhysics.generateTrajectory({
    x0: 0,
    y0: 10,
    v0: 20,
    thetaDeg: 45,
    g: 9.80,
    dt: 0.01
  });

  const strobes = ProjectilesPhysics.generateStrobePoints(traj.points, 0.10);
  assert.ok(strobes.length >= 5);
  // Consecutive strobes should have dt ~ 0.10
  assert.ok(Math.abs(strobes[1].t - strobes[0].t - 0.10) < 0.01);
  assert.ok(Math.abs(strobes[2].t - strobes[1].t - 0.10) < 0.01);
});

test("Cornell T-Chart data generation", () => {
  const tchart = ProjectilesPhysics.buildTChartData({
    x0: 0,
    y0: 1.8,
    v0: 15,
    thetaDeg: 40,
    g: 10,
    t: 0.435
  });

  assert.equal(tchart.horizontal.ax, 0);
  assert.equal(tchart.vertical.ay, -10);
  assert.ok(Math.abs(tchart.horizontal.current_x - (15 * Math.cos(40 * Math.PI / 180) * 0.435)) < 0.01);
  assert.ok(tchart.timeBridge.label.includes("universal link"));
});

test("Packet 6 #46 Box Rolling Drop", () => {
  // Box of height 2m, speed 5 m/s
  const res = ProjectilesPhysics.calculateBoxDrop({ y0: 2.0, v0: 5.0, g: 9.80 });
  // t = sqrt(4 / 9.8) = 0.638876 s
  assert.ok(Math.abs(res.tFall - 0.6389) < 0.001);
  // range = 5 * 0.6389 = 3.194 m
  assert.ok(Math.abs(res.range - 3.194) < 0.01);
});

test("Packet 6 #47 100m Cliff Cannonball Launch", () => {
  // Cliff 100m tall, lands 300m away
  const res = ProjectilesPhysics.calculate100mCliff({ y0: 100.0, targetRange: 300.0, g: 9.80 });
  // tFall = sqrt(200 / 9.8) = 4.5175 s
  assert.ok(Math.abs(res.tFall - 4.518) < 0.01);
  // v0 = 300 / 4.5175 = 66.41 m/s
  assert.ok(Math.abs(res.requiredV0 - 66.41) < 0.1);
});

test("Packet 6 #48 Soccer Player Kick", () => {
  // vx = 20 m/s, vy = 12 m/s
  const res = ProjectilesPhysics.calculateSoccerKick({ vx: 20.0, vy: 12.0, g: 9.80 });
  // launch speed = sqrt(20^2 + 12^2) = 23.32 m/s
  assert.ok(Math.abs(res.v0 - 23.32) < 0.02);
  // launch angle = arctan(12/20) = 30.96 deg
  assert.ok(Math.abs(res.thetaDeg - 30.96) < 0.05);
  // flight time = 2 * 12 / 9.8 = 2.449 s
  assert.ok(Math.abs(res.tFlight - 2.449) < 0.01);
  // range = 20 * 2.449 = 48.98 m
  assert.ok(Math.abs(res.range - 48.98) < 0.1);
});

test("Packet 6 #49 Tennis Serve Challenge", () => {
  // v0 = 40 m/s, y0 = 2.5m, net at 12m (height 0.92m), service line at 18.4m
  const res = ProjectilesPhysics.calculateTennisServe({
    y0: 2.50,
    v0: 40.0,
    thetaDeg: 0.0,
    g: 9.80,
    xNet: 12.0,
    hNet: 0.92,
    xCourt: 18.40
  });

  // Time to net = 12 / 40 = 0.30 s
  assert.equal(res.tNet, 0.30);
  // Height at net = 2.5 - 0.5 * 9.8 * 0.09 = 2.059 m
  assert.ok(Math.abs(res.yNet - 2.059) < 0.005);
  // Clears net (2.059 > 0.92)
  assert.equal(res.clearsNet, true);
  assert.ok(res.netClearanceMargin > 1.13);

  // Landing time = sqrt(5 / 9.8) = 0.7143 s
  assert.ok(Math.abs(res.tGround - 0.7143) < 0.002);
  // Landing distance = 40 * 0.7143 = 28.57 m
  assert.ok(Math.abs(res.xLand - 28.57) < 0.05);
  // Lands beyond 18.4m -> Long / Out! Invalid serve!
  assert.equal(res.inServiceCourt, false);
  assert.equal(res.isValidServe, false);
  assert.equal(res.faultReason, "long_out");
});

