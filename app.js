const PALETTE = document.getElementById("palette");
const CLEAR_BUTTON = document.getElementById("clearProject");
const RESET_BUTTON = document.getElementById("resetCircuit");
const GRID_SIZE_SELECT = document.getElementById("gridSize");
const EXAMPLE_SELECT = document.getElementById("exampleSelect");
const LOAD_EXAMPLE_BTN = document.getElementById("loadExample");

const LAYER_COUNT = 8;
let gridSize = Number(GRID_SIZE_SELECT.value);
let selectedComponent = null;
let grid = [];
let powerGrid = [];
let clipboard = null;

let blockMeshes = {};
let textures = {};
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let groundMesh;

const COMPONENTS = [
  { id: "empty", label: "Clear", emoji: "⬜", description: "Empty", canRotate: false },
  { id: "redstone_dust", label: "Redstone Dust", emoji: "🟥", description: "Conducts power", canRotate: false },
  { id: "lever_off", label: "Lever Off", emoji: "⏸️", description: "Toggle input", canRotate: false },
  { id: "lever_on", label: "Lever On", emoji: "▶️", description: "Powered lever", canRotate: false },
  { id: "button_off", label: "Button Off", emoji: "🔲", description: "Pulse input", canRotate: false },
  { id: "button_on", label: "Button On", emoji: "🔳", description: "Pressed button", canRotate: false },
  { id: "torch", label: "Redstone Torch", emoji: "🟨", description: "Inverter", canRotate: false },
  { id: "comparator_n", label: "Comparator N", emoji: "🧭", description: "Comparator north", canRotate: true },
  { id: "comparator_e", label: "Comparator E", emoji: "🧭", description: "Comparator east", canRotate: true },
  { id: "comparator_s", label: "Comparator S", emoji: "🧭", description: "Comparator south", canRotate: true },
  { id: "comparator_w", label: "Comparator W", emoji: "🧭", description: "Comparator west", canRotate: true },
  { id: "solid_block", label: "Block", emoji: "🧱", description: "Building block", canRotate: false },
  { id: "piston_n", label: "Piston N", emoji: "⬇️", description: "Piston north", canRotate: true },
  { id: "piston_e", label: "Piston E", emoji: "⬅️", description: "Piston east", canRotate: true },
  { id: "piston_s", label: "Piston S", emoji: "⬆️", description: "Piston south", canRotate: true },
  { id: "piston_w", label: "Piston W", emoji: "➡️", description: "Piston west", canRotate: true },
  { id: "sticky_piston_n", label: "Sticky Piston N", emoji: "🟩", description: "Sticky piston north", canRotate: true },
  { id: "sticky_piston_e", label: "Sticky Piston E", emoji: "🟩", description: "Sticky piston east", canRotate: true },
  { id: "sticky_piston_s", label: "Sticky Piston S", emoji: "🟩", description: "Sticky piston south", canRotate: true },
  { id: "sticky_piston_w", label: "Sticky Piston W", emoji: "🟩", description: "Sticky piston west", canRotate: true },
  { id: "observer_n", label: "Observer N", emoji: "👁️", description: "Observer north", canRotate: true },
  { id: "observer_e", label: "Observer E", emoji: "👁️", description: "Observer east", canRotate: true },
  { id: "observer_s", label: "Observer S", emoji: "👁️", description: "Observer south", canRotate: true },
  { id: "observer_w", label: "Observer W", emoji: "👁️", description: "Observer west", canRotate: true },
  { id: "repeater_n", label: "Repeater N", emoji: "⬆️", description: "Repeater north", canRotate: true },
  { id: "repeater_e", label: "Repeater E", emoji: "➡️", description: "Repeater east", canRotate: true },
  { id: "repeater_s", label: "Repeater S", emoji: "⬇️", description: "Repeater south", canRotate: true },
  { id: "repeater_w", label: "Repeater W", emoji: "⬅️", description: "Repeater west", canRotate: true },
  { id: "lamp", label: "Redstone Lamp", emoji: "💡", description: "Output light", canRotate: false },
];

const EXAMPLES = [
  { name: "AND gate", description: "Two levers -> dust -> repeater -> lamp", pattern: [ { x: 4,y:7,id:"lever_on"}, {x:4,y:9,id:"lever_on"}, {x:5,y:7,id:"redstone_dust"}, {x:5,y:9,id:"redstone_dust"}, {x:6,y:8,id:"redstone_dust"}, {x:7,y:8,id:"repeater_e"}, {x:8,y:8,id:"redstone_dust"}, {x:9,y:8,id:"lamp"} ] },
  { name: "OR gate", description: "Two levers share lamp", pattern: [ {x:4,y:7,id:"lever_on"},{x:4,y:9,id:"lever_on"},{x:5,y:7,id:"redstone_dust"},{x:5,y:9,id:"redstone_dust"},{x:6,y:7,id:"redstone_dust"},{x:6,y:9,id:"redstone_dust"},{x:7,y:8,id:"redstone_dust"},{x:8,y:8,id:"lamp"}]},
  { name: "RS latch", description: "Cross-coupled torches and repeaters", pattern: [ {x:6,y:5,id:"torch"},{x:8,y:5,id:"torch"},{x:6,y:6,id:"redstone_dust"},{x:8,y:6,id:"redstone_dust"},{x:6,y:7,id:"repeater_s"},{x:8,y:7,id:"repeater_s"},{x:7,y:9,id:"lamp"},{x:5,y:7,id:"lever_off"},{x:9,y:7,id:"lever_off"}]},
  { name: "Piston push", description: "Lever powers piston to push block", pattern: [ {x:4,y:8,id:"lever_on"},{x:5,y:8,id:"redstone_dust"},{x:6,y:8,id:"piston_e"},{x:7,y:8,id:"solid_block"},{x:9,y:8,id:"lamp"},{x:8,y:8,id:"redstone_dust"}]},
  { name: "Sticky piston", description: "Sticky piston retracts block when unpowered", pattern: [ {x:4,y:8,id:"lever_on"},{x:5,y:8,id:"redstone_dust"},{x:6,y:8,id:"sticky_piston_e"},{x:7,y:8,id:"solid_block"},{x:9,y:8,id:"lamp"},{x:8,y:8,id:"redstone_dust"}]},
  { name: "Observer pulse", description: "Observer pulses when nearby block changes", pattern: [{x:4,y:8,id:"lever_on"},{x:5,y:8,id:"redstone_dust"},{x:6,y:8,id:"observer_e"},{x:7,y:8,id:"redstone_dust"},{x:8,y:8,id:"lamp"}]},
  { name: "Stacked dust lamp", description: "Place dust below a lamp to stack components vertically", pattern: [ { x: 6, y: 6, id: "redstone_dust" }, { x: 6, y: 6, z: 1, id: "lamp" } ] }
];

const DIRECTIONS = { n: {dx:0, dy:-1}, e: {dx:1, dy:0}, s: {dx:0, dy:1}, w: {dx:-1, dy:0} };
const REPEATER_INPUT = { repeater_n: "s", repeater_e: "w", repeater_s: "n", repeater_w: "e" };
const REPEATER_OUTPUT = { repeater_n: "n", repeater_e: "e", repeater_s: "s", repeater_w: "w" };
const COMPARATOR_INPUT = { comparator_n: "s", comparator_e: "w", comparator_s: "n", comparator_w: "e" };
const COMPARATOR_OUTPUT = { comparator_n: "n", comparator_e: "e", comparator_s: "s", comparator_w: "w" };
const SIDE_DIRECTIONS = { n: ["w","e"], e: ["n","s"], s: ["e","w"], w: ["s","n"] };
const PISTON_INPUT = { piston_n: "s", piston_e: "w", piston_s: "n", piston_w: "e", sticky_piston_n: "s", sticky_piston_e: "w", sticky_piston_s: "n", sticky_piston_w: "e" };
const PISTON_OUTPUT = { piston_n: "n", piston_e: "e", piston_s: "s", piston_w: "w", sticky_piston_n: "n", sticky_piston_e: "e", sticky_piston_s: "s", sticky_piston_w: "w" };
const OBSERVER_OUTPUT = { observer_n: "n", observer_e: "e", observer_s: "s", observer_w: "w" };

function rotateComponent(id) {
  const rotations = {
    "repeater_n": "repeater_e",
    "repeater_e": "repeater_s",
    "repeater_s": "repeater_w",
    "repeater_w": "repeater_n",
    "comparator_n": "comparator_e",
    "comparator_e": "comparator_s",
    "comparator_s": "comparator_w",
    "comparator_w": "comparator_n",
    "piston_n": "piston_e",
    "piston_e": "piston_s",
    "piston_s": "piston_w",
    "piston_w": "piston_n",
    "sticky_piston_n": "sticky_piston_e",
    "sticky_piston_e": "sticky_piston_s",
    "sticky_piston_s": "sticky_piston_w",
    "sticky_piston_w": "sticky_piston_n",
    "observer_n": "observer_e",
    "observer_e": "observer_s",
    "observer_s": "observer_w",
    "observer_w": "observer_n",
  };
  return rotations[id] || id;
}

function componentForId(id) {
  return COMPONENTS.find((c) => c.id === id) || COMPONENTS[0];
}

function makeGrid(size) {
  grid = Array.from({ length: LAYER_COUNT }, () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ id: "empty", timer: 0, extended: false }))
    )
  );

  powerGrid = Array.from({ length: LAYER_COUNT }, () =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => 0))
  );
}

function inBounds(x, y, z) {
  return z >= 0 && z < LAYER_COUNT && x >= 0 && y >= 0 && x < gridSize && y < gridSize;
}

function getBlock(z, x, y) {
  if (!inBounds(x, y, z)) return { id: "empty", timer: 0, extended: false };
  return grid[z][y][x] || { id: "empty", timer: 0, extended: false };
}

function getTopStack(x, y) {
  for (let z = LAYER_COUNT - 1; z >= 0; z--) {
    const block = getBlock(z, x, y);
    if (block.id && block.id !== "empty") {
      return { block, z };
    }
  }
  return { block: { id: "empty", timer: 0, extended: false }, z: 0 };
}

function getPower(z, x, y, powerRef) {
  if (!inBounds(x, y, z)) return 0;
  return powerRef[z][y][x] || 0;
}

function getTorchState(z, x, y, currentPowerGrid) {
  const found = getTopStack(x, y);
  if (found.z !== z || found.block.id !== "torch") return false;
  for (const d of Object.values(DIRECTIONS)) {
    const nx = x + d.dx;
    const ny = y + d.dy;
    if (!inBounds(nx, ny, z)) continue;
    if (getPower(z, nx, ny, currentPowerGrid) > 0) return false;
  }
  return true;
}

function repeaterInputPowered(z, x, y, currentPowerGrid) {
  const found = getTopStack(x, y);
  if (found.z !== z) return false;
  const id = found.block.id;
  if (!id.startsWith("repeater_")) return false;
  const input = REPEATER_INPUT[id];
  if (!input) return false;
  const d = DIRECTIONS[input];
  const nx = x + d.dx;
  const ny = y + d.dy;
  if (!inBounds(nx, ny, z)) return false;
  return getPower(z, nx, ny, currentPowerGrid) > 0;
}

function isPushableCell(cell) {
  if (!cell || cell.id === "empty" || cell.id === "solid_block") return false;
  if (cell.id.startsWith("piston_") || cell.id.startsWith("sticky_piston_") || cell.id.startsWith("observer_")) return false;
  if (cell.id === "piston_head") return false;
  return true;
}

function observerTriggered(z, x, y, currentPowerGrid, previousPowerGrid) {
  if (!previousPowerGrid) return false;
  for (const d of Object.values(DIRECTIONS)) {
    const nx = x + d.dx;
    const ny = y + d.dy;
    if (!inBounds(nx, ny, z)) continue;
    if (getPower(z, nx, ny, currentPowerGrid) !== getPower(z, nx, ny, previousPowerGrid)) {
      return true;
    }
  }
  return false;
}

function getEmitterPower(z, nx, ny, tx, ty, currentPowerGrid, previousPowerGrid) {
  const cell = getBlock(z, nx, ny);
  if (!cell) return 0;

  if (cell.id === "lever_on" || cell.id === "button_on") return 15;

  if (cell.id === "torch") {
    return getTorchState(z, nx, ny, currentPowerGrid) ? 15 : 0;
  }

  if (cell.id.startsWith("observer_")) {
    const outputDir = OBSERVER_OUTPUT[cell.id];
    if (!outputDir) return 0;
    const d = DIRECTIONS[outputDir];
    const outX = nx + d.dx;
    const outY = ny + d.dy;
    if (outX === tx && outY === ty && observerTriggered(z, nx, ny, currentPowerGrid, previousPowerGrid)) {
      return 15;
    }
    return 0;
  }

  if (cell.id.startsWith("comparator_")) {
    const outputDir = COMPARATOR_OUTPUT[cell.id];
    const inputDir = COMPARATOR_INPUT[cell.id];
    if (!outputDir || !inputDir) return 0;
    const outD = DIRECTIONS[outputDir];
    if (nx + outD.dx !== tx || ny + outD.dy !== ty) return 0;

    const baseDir = DIRECTIONS[inputDir];
    const inputX = nx + baseDir.dx;
    const inputY = ny + baseDir.dy;
    let mainPower = 0;
    if (inBounds(inputX, inputY, z)) {
      mainPower = getPower(z, inputX, inputY, currentPowerGrid);
    }

    const sideDirs = SIDE_DIRECTIONS[outputDir];
    let sidePower = 0;
    if (sideDirs) {
      for (const side of sideDirs) {
        const d = DIRECTIONS[side];
        const sx = nx + d.dx;
        const sy = ny + d.dy;
        if (!inBounds(sx, sy, z)) continue;
        sidePower = Math.max(sidePower, getPower(z, sx, sy, currentPowerGrid));
      }
    }

    const mode = cell.mode || "compare";
    if (mode === "subtract") {
      return Math.max(0, mainPower - sidePower);
    }
    return mainPower >= sidePower ? mainPower : 0;
  }

  if (cell.id.startsWith("repeater_")) {
    const outputDir = REPEATER_OUTPUT[cell.id];
    if (!outputDir) return 0;
    const d = DIRECTIONS[outputDir];
    if (nx + d.dx === tx && ny + d.dy === ty && repeaterInputPowered(z, nx, ny, currentPowerGrid)) {
      return 15;
    }
    return 0;
  }

  if (cell.id === "redstone_dust" || cell.id === "lamp") {
    return getPower(z, nx, ny, currentPowerGrid);
  }

  return 0;
}

function applyPistons(currentPowerGrid) {
  let changed = false;

  for (let z = 0; z < LAYER_COUNT; z++) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = getBlock(z, x, y);
        if (!cell.id.startsWith("piston_") && !cell.id.startsWith("sticky_piston_")) continue;

        const inputDir = PISTON_INPUT[cell.id];
        const outputDir = PISTON_OUTPUT[cell.id];
        if (!inputDir || !outputDir) continue;

        const inD = DIRECTIONS[inputDir];
        const outD = DIRECTIONS[outputDir];
        const inX = x + inD.dx;
        const inY = y + inD.dy;
        const powered = inBounds(inX, inY, z) && getPower(z, inX, inY, currentPowerGrid) > 0;

        const outX = x + outD.dx;
        const outY = y + outD.dy;

        const top = getTopStack(x, y).block;
        if (powered) {
          if (!top.extended) {
            let canExtend = true;

            if (!inBounds(outX, outY, z)) {
              canExtend = false;
            } else {
              const targetTop = getTopStack(outX, outY).block;
              if (targetTop.id !== "empty") {
                if (isPushableCell(targetTop)) {
                  const out2X = outX + outD.dx;
                  const out2Y = outY + outD.dy;
                  if (!inBounds(out2X, out2Y, z) || getTopStack(out2X, out2Y).block.id !== "empty") {
                    canExtend = false;
                  }
                } else {
                  canExtend = false;
                }
              }
            }

            if (canExtend) {
              const outStackTop = getTopStack(outX, outY);
              const outTop = outStackTop.block;
              const outZ = outStackTop.z;
              if (outTop.id !== "empty") {
                const moveZ = outZ + 1;
                if (moveZ < LAYER_COUNT) {
                  grid[moveZ][outY][outX] = { ...outTop };
                  grid[outZ][outY][outX] = { id: "empty", timer: 0, extended: false };
                }
              }

              const headZ = getTopStack(outX, outY).z + 1;
              if (headZ < LAYER_COUNT) {
                grid[headZ][outY][outX] = { id: "piston_head", timer: 0, extended: false };
                grid[z][y][x].extended = true;
                changed = true;
              }
            }
          }
        } else if (top.extended) {
          const outTop = getTopStack(outX, outY);
          if (outTop.block.id === "piston_head" && inBounds(outX, outY, outTop.z)) {
            grid[outTop.z][outY][outX] = { id: "empty", timer: 0, extended: false };
            changed = true;
          }
          if (cell.id.startsWith("sticky_piston_")) {
            const out2X = outX + outD.dx;
            const out2Y = outY + outD.dy;
            if (inBounds(out2X, out2Y, z)) {
              const pullTop = getTopStack(out2X, out2Y);
              if (isPushableCell(pullTop.block)) {
                const targetTop = getTopStack(outX, outY);
                const targetZ = targetTop.z;
                if (targetZ < LAYER_COUNT - 1) {
                  grid[targetZ + 1][outY][outX] = { ...pullTop.block };
                  grid[pullTop.z][out2Y][out2X] = { id: "empty", timer: 0, extended: false };
                }
              }
            }
          }

          grid[z][y][x].extended = false;
          changed = true;
        }
      }
    }
  }

  return changed;
}

function simulate() {
  const previousPowerGrid = powerGrid.map((layer) => layer.map((row) => row.slice()));

  powerGrid = Array.from({ length: LAYER_COUNT }, () =>
    Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => 0))
  );

  let steps = 0;
  let changed = true;

  while (changed && steps < 90) {
    changed = false;
    const nextGrid = powerGrid.map((layer) => layer.map((row) => row.slice()));

    for (let z = 0; z < LAYER_COUNT; z++) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const cell = getBlock(z, x, y);
          let computedPower = 0;

          if (cell.id === "lever_on" || cell.id === "button_on") computedPower = 15;

          if (cell.id === "torch") computedPower = getTorchState(z, x, y, powerGrid) ? 15 : 0;

          if (cell.id.startsWith("repeater_")) computedPower = repeaterInputPowered(z, x, y, powerGrid) ? 15 : 0;

          if (cell.id === "redstone_dust" || cell.id === "lamp" || cell.id === "torch") {
            for (const d of Object.values(DIRECTIONS)) {
              const nx = x + d.dx;
              const ny = y + d.dy;
              if (!inBounds(nx, ny, z)) continue;
              const emitter = getEmitterPower(z, nx, ny, x, y, powerGrid, previousPowerGrid);
              const transmitted = cell.id === "redstone_dust" ? Math.max(0, emitter - 1) : emitter;
              computedPower = Math.max(computedPower, transmitted);
            }
            for (const nz of [z - 1, z + 1]) {
              if (!inBounds(x, y, nz)) continue;
              const emitter = getEmitterPower(nz, x, y, x, y, powerGrid, previousPowerGrid);
              const transmitted = cell.id === "redstone_dust" ? Math.max(0, emitter - 1) : emitter;
              computedPower = Math.max(computedPower, transmitted);
            }
          }

          if (cell.id === "lever_off" || cell.id === "button_off" || cell.id === "empty" || cell.id === "solid_block") computedPower = 0;

          if (computedPower !== powerGrid[z][y][x]) {
            nextGrid[z][y][x] = computedPower;
            changed = true;
          }
        }
      }
    }

    powerGrid = nextGrid;
    steps++;

    for (let z = 0; z < LAYER_COUNT; z++) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const cell = getBlock(z, x, y);
          if (cell.id === "button_on") {
            cell.timer = (cell.timer || 4) - 1;
            if (cell.timer <= 0) {
              grid[z][y][x] = { id: "button_off", timer: 0, extended: false };
              changed = true;
            }
          }
        }
      }
    }

    if (applyPistons(powerGrid)) changed = true;
  }

  renderScene();
}

function initThreeJS() {
  const canvas = document.getElementById('threeCanvas');
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x0b1019);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(10, 10, 10);
  camera.lookAt(0, 0, 0);

  controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Load textures from GitHub
  const textureLoader = new THREE.TextureLoader();
  textures = {
    redstone_dust_dot: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/redstone_dust_dot.png'),
    redstone_dust_line0: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/redstone_dust_line0.png'),
    redstone_dust_line1: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/redstone_dust_line1.png'),
    lever_off: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/lever.png'),
    lever_on: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/lever.png'),
    button_off: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/stone_button.png'),
    button_on: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/stone_button.png'),
    torch: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/redstone_torch_off.png'),
    torch_on: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/redstone_torch.png'),
    repeater: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/repeater.png'),
    comparator: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/comparator.png'),
    observer: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/observer_front.png'),
    lamp: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/redstone_lamp.png'),
    lamp_on: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/redstone_lamp_on.png'),
    solid_block: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/stone.png'),
    piston: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/piston_side.png'),
    sticky_piston: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/piston_side.png'),
    piston_head: textureLoader.load('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/26.1/assets/minecraft/textures/block/piston_top_normal.png'),
  };

  // Add ground plane
  const groundGeometry = new THREE.PlaneGeometry(gridSize * 2, gridSize * 2);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // brown
  groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(0, -0.5, 0);
  scene.add(groundMesh);

  // Add ambient light

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  // Mouse event listeners
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function renderScene() {
  // Clear existing meshes
  for (const mesh of Object.values(blockMeshes)) {
    scene.remove(mesh);
  }
  blockMeshes = {};

  const geometry = new THREE.BoxGeometry(1, 1, 1);

  for (let z = 0; z < LAYER_COUNT; z++) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = getBlock(z, x, y);
        if (cell.id === "empty") continue;

        let materialKey = cell.id;
        if (cell.id === "torch" && getPower(z, x, y, powerGrid) > 0) materialKey = "torch_on";
        if (cell.id === "lamp" && getPower(z, x, y, powerGrid) > 0) materialKey = "lamp_on";
        if (cell.id.startsWith("lever_")) materialKey = "lever_off"; // simplify
        if (cell.id.startsWith("button_")) materialKey = "button_off";
        if (cell.id.startsWith("repeater_")) materialKey = "repeater";
        if (cell.id.startsWith("comparator_")) materialKey = "comparator";
        if (cell.id.startsWith("observer_")) materialKey = "observer";
        if (cell.id.startsWith("piston_")) materialKey = "piston";
        if (cell.id.startsWith("sticky_piston_")) materialKey = "sticky_piston";

        // Special handling for redstone dust connections
        if (cell.id === "redstone_dust") {
          let mask = 0;
          if (getBlock(z, x, y-1).id === "redstone_dust") mask |= 1; // north
          if (getBlock(z, x+1, y).id === "redstone_dust") mask |= 2; // east
          if (getBlock(z, x, y+1).id === "redstone_dust") mask |= 4; // south
          if (getBlock(z, x-1, y).id === "redstone_dust") mask |= 8; // west
          if ((mask & 5) === 5) { // north and south
            materialKey = "redstone_dust_line0";
          } else if ((mask & 10) === 10) { // east and west
            materialKey = "redstone_dust_line1";
          } else {
            materialKey = "redstone_dust_dot";
          }
        }

        let materialOptions;
        materialOptions = { map: textures[materialKey] || textures.solid_block };
        const material = new THREE.MeshLambertMaterial(materialOptions);
        if (getPower(z, x, y, powerGrid) > 0) {
          material.emissive = new THREE.Color(0xff6600);
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x - gridSize / 2, z, y - gridSize / 2);
        mesh.userData = { x, y, z };
        scene.add(mesh);
        blockMeshes[`${x}-${y}-${z}`] = mesh;

        // Add piston head if extended
        if ((cell.id.startsWith("piston_") || cell.id.startsWith("sticky_piston_")) && cell.extended) {
          const dir = PISTON_OUTPUT[cell.id];
          const dx = DIRECTIONS[dir].dx;
          const dy = DIRECTIONS[dir].dy;
          const headX = x + dx;
          const headY = y + dy;
          const headZ = z;
          if (inBounds(headX, headY, headZ)) {
            const headMaterial = new THREE.MeshLambertMaterial({ map: textures.piston_head });
            const headMesh = new THREE.Mesh(geometry, headMaterial);
            headMesh.position.set(headX - gridSize / 2, headZ, headY - gridSize / 2);
            headMesh.userData = { x: headX, y: headY, z: headZ };
            scene.add(headMesh);
            blockMeshes[`head-${headX}-${headY}-${headZ}`] = headMesh;
          }
        }
      }
    }
  }
}

function onMouseDown(event) {
  const canvas = document.getElementById('threeCanvas');
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...Object.values(blockMeshes), groundMesh]);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    let x, y, z;
    if (intersect.object === groundMesh) {
      // Place on ground
      x = Math.floor(intersect.point.x + gridSize / 2);
      y = Math.floor(intersect.point.z + gridSize / 2);
      z = 0;
    } else {
      // Place on top of existing block
      x = intersect.object.userData.x;
      y = intersect.object.userData.y;
      z = intersect.object.userData.z;
    }

    if (event.button === 0) { // left click
      if (event.shiftKey) {
        // Rotate top component
        const topStack = getTopStack(x, y);
        if (topStack.block.id !== "empty") {
          const rotatedId = rotateComponent(topStack.block.id);
          if (rotatedId !== topStack.block.id) {
            grid[topStack.z][y][x] = { ...topStack.block, id: rotatedId };
            simulate();
          }
        }
      } else {
        if (selectedComponent.id === "empty") {
          removeComponent(x, y);
        } else {
          placeComponent(x, y, selectedComponent);
        }
      }
    } else if (event.button === 2) { // right click
      removeComponent(x, y);
    }
  }
}

function placeComponent(x, y, component) {
  if (!inBounds(x, y, 0)) return;
  const topStack = getTopStack(x, y);
  let targetZ = topStack.z;
  if (topStack.block.id !== "empty") targetZ = topStack.z + 1;
  if (targetZ >= LAYER_COUNT) return;

  const base = { id: component.id, timer: 0, extended: false };
  if (component.id === "button_on") base.timer = 4;
  if (component.id === "button_off") base.timer = 0;

  grid[targetZ][y][x] = base;
  simulate();
}

function removeComponent(x, y) {
  if (!inBounds(x, y, 0)) return;
  const topStack = getTopStack(x, y);
  const z = topStack.z;
  if (topStack.block.id === "empty") return;
  grid[z][y][x] = { id: "empty", timer: 0, extended: false };
  simulate();
}

function loadExample(name) {
  const example = EXAMPLES.find((e) => e.name === name);
  if (!example) return;
  makeGrid(gridSize);
  for (const item of example.pattern) {
    let z = Math.min(LAYER_COUNT - 1, Number.isFinite(item.z) ? item.z : getTopStack(item.x, item.y).z + 1);
    if (!inBounds(item.x, item.y, z)) continue;
    const timer = item.id === "button_on" ? 4 : 0;
    grid[z][item.y][item.x] = { id: item.id, timer, extended: false };
  }
  simulate();
}

CLEAR_BUTTON.addEventListener("click", () => { makeGrid(gridSize); simulate(); });
RESET_BUTTON.addEventListener("click", () => simulate());

GRID_SIZE_SELECT.addEventListener("change", () => {
  gridSize = Number(GRID_SIZE_SELECT.value);
  makeGrid(gridSize);
  simulate();
});

const COPY_BUTTON = document.getElementById("copyBlueprint");
const PASTE_BUTTON = document.getElementById("pasteBlueprint");

COPY_BUTTON.addEventListener("click", () => {
  clipboard = JSON.stringify(grid);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(clipboard).catch(() => console.warn("Clipboard write failed; internal backup only."));
  }
  alert("Blueprint saved (clipboard data in memory). Use Paste to restore.");
});

PASTE_BUTTON.addEventListener("click", () => {
  if (!clipboard) {
    alert("No blueprint copied yet.");
    return;
  }

  try {
    const parsed = JSON.parse(clipboard);
    if (parsed && Array.isArray(parsed) && parsed.length === LAYER_COUNT) {
      grid = parsed;
      simulate();
      alert("Blueprint pasted.");
    }
  } catch (err) {
    console.error(err);
    alert("Invalid blueprint data.");
  }
});

LOAD_EXAMPLE_BTN.addEventListener("click", () => {
  const selection = EXAMPLE_SELECT.value;
  if (selection) loadExample(selection);
});

function renderPalette() {
  PALETTE.innerHTML = "";
  COMPONENTS.forEach((component) => {
    const button = document.createElement("button");
    button.className = "palette-button";
    button.dataset.componentId = component.id;
    if (component.id === selectedComponent?.id) button.classList.add("selected");
    button.innerHTML = `${component.emoji} ${component.label}`;
    button.title = component.description;
    button.addEventListener("click", () => {
      selectedComponent = component;
      renderPalette();
    });
    PALETTE.appendChild(button);
  });
}

function renderExamples() {
  EXAMPLE_SELECT.innerHTML = "";
  EXAMPLES.forEach((example) => {
    const option = document.createElement("option");
    option.value = example.name;
    option.textContent = `${example.name} - ${example.description}`;
    EXAMPLE_SELECT.appendChild(option);
  });
}

function rotateComponent(component) {
  if (!component?.canRotate) return component;
  const order = ["repeater_n", "repeater_e", "repeater_s", "repeater_w", "piston_n", "piston_e", "piston_s", "piston_w", "sticky_piston_n", "sticky_piston_e", "sticky_piston_s", "sticky_piston_w", "observer_n", "observer_e", "observer_s", "observer_w", "comparator_n", "comparator_e", "comparator_s", "comparator_w"];
  const index = order.indexOf(component.id);
  if (index === -1) return component;
  return componentForId(order[(index + 1) % order.length]);
}

makeGrid(gridSize);
selectedComponent = COMPONENTS[1];
renderPalette();
renderExamples();
initThreeJS();
simulate();
