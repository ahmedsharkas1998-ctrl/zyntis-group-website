/**
 * ZYNTIS GROUP — Three.js WebGL 3D Scene Controller
 * - Tech-Organic Voxel Tree with GPU-driven motion & golden wireframe energy
 * - Procedural Voxel Terrain with circuit/contour lines
 * - Atmospheric Golden Particles
 * - Scroll-driven 7-Waypoint Camera System
 * - Post-Processing: GTAO + Bloom + Luxury Black & Gold Color Grading
 * - Adaptive Performance & Compositor Pausing
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TechOrganicTreeGenerator } from './tree-generator.js';

/* =========================================================================
   Simplex Noise for Terrain
   ========================================================================= */
class SimplexNoise {
  constructor(seed = 42) {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      const t = this.p[i]; this.p[i] = this.p[j]; this.p[j] = t;
    }
    this.g = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  }
  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    let i1, j1; if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const gi = (a) => this.g[this.p[a] & 7];
    let n0 = 0, n1 = 0, n2 = 0;
    let tt = 0.5 - x0 * x0 - y0 * y0;
    if (tt > 0) { tt *= tt; const gg = gi(ii + this.p[jj]); n0 = tt * tt * (gg[0] * x0 + gg[1] * y0); }
    tt = 0.5 - x1 * x1 - y1 * y1;
    if (tt > 0) { tt *= tt; const gg = gi(ii + i1 + this.p[jj + j1]); n1 = tt * tt * (gg[0] * x1 + gg[1] * y1); }
    tt = 0.5 - x2 * x2 - y2 * y2;
    if (tt > 0) { tt *= tt; const gg = gi(ii + 1 + this.p[jj + 1]); n2 = tt * tt * (gg[0] * x2 + gg[1] * y2); }
    return 70 * (n0 + n1 + n2);
  }
}
const noise = new SimplexNoise(2026);
function fbm(x, y, oct = 4, lac = 2, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < oct; o++) { sum += amp * noise.noise2D(x * freq, y * freq); norm += amp; amp *= gain; freq *= lac; }
  return sum / norm;
}
const smoothstep = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };

/* =========================================================================
   Renderer / Scene / Camera
   ========================================================================= */
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const DPRCAP = (innerWidth <= 820) ? 1 : Math.min(devicePixelRatio || 1, 1.3);
let curDpr = DPRCAP;
const DPR_FLOOR = 0.9;

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(curDpr);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.16;
app.appendChild(renderer.domElement);

renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  console.warn('WebGL context lost.');
}, false);
renderer.domElement.addEventListener('webglcontextrestored', () => {
  console.info('WebGL context restored.');
}, false);

const scene = new THREE.Scene();

// Deep Obsidian Void Backdrop with Controlled Luminous Gold Horizon
let bgTop = '#040406', bgMid = '#07070b', bgBottom = '#0d0b07';
let bgGlow = '#c8a44e', bgGlowA = 0.20, bgGlowY = 1.0, bgGlowR = 0.55;
const bgCanvas = document.createElement('canvas');
const bgTex = new THREE.CanvasTexture(bgCanvas);
bgTex.colorSpace = THREE.SRGBColorSpace;

function rgbaOf(hex, a) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}

function drawBg() {
  const w = bgCanvas.width = 1024;
  const h = bgCanvas.height = Math.max(2, Math.round(1024 * innerHeight / innerWidth));
  const x = bgCanvas.getContext('2d');
  const lin = x.createLinearGradient(0, 0, 0, h);
  lin.addColorStop(0.0, bgTop);
  lin.addColorStop(0.5, bgMid);
  lin.addColorStop(1.0, bgBottom);
  x.fillStyle = lin;
  x.fillRect(0, 0, w, h);

  const gx = w * 0.5, gy = h * bgGlowY, gr = Math.hypot(w, h) * bgGlowR;
  const rad = x.createRadialGradient(gx, gy, 0, gx, gy, gr);
  rad.addColorStop(0.0, rgbaOf(bgGlow, bgGlowA));
  rad.addColorStop(0.45, rgbaOf(bgGlow, bgGlowA * 0.32));
  rad.addColorStop(1.0, rgbaOf(bgGlow, 0));
  x.globalCompositeOperation = 'lighter';
  x.fillStyle = rad;
  x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'source-over';
  bgTex.needsUpdate = true;
}
drawBg();
scene.background = bgTex;
scene.fog = new THREE.FogExp2(0x07070a, 0.0075);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 700);
camera.position.set(0, 26, 110);

/* =========================================================================
   Scroll-Driven Waypoints (7 Chapters)
   ========================================================================= */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

const waypoints = [
  { pos: V3(  0, 26, 110), tgt: V3(  0, 22, 0), wire: 1, front: 50 },  // 0: Hero — wide full tree view
  { pos: V3( 20, 32,  65), tgt: V3( -3, 24, 0), wire: 1, front: 50 },  // 1: The Problem — orbiting close, gold energy reveal
  { pos: V3(-26, 20,  46), tgt: V3(-16, 17, 0), wire: 1, front: 50 },  // 2: What We Believe — low grounded vantage, tree framed right
  { pos: V3(-16,  5,  28), tgt: V3(  0,  3, 0), wire: 1, front: 50 },  // 3: Step 01 Diagnose — roots & foundation
  { pos: V3(-16, 16,  34), tgt: V3(  0, 15, 0), wire: 1, front: 50 },  // 4: Step 02 Architect — mid-trunk & primary branch split
  { pos: V3(-15, 27,  46), tgt: V3(  0, 28, 0), wire: 1, front: 50 },  // 5: Step 03 Deploy — upper canopy intelligence
  { pos: V3( -5, 24,  98), tgt: V3(  0, 22, 0), wire: 1, front: 50 },  // 6: Step 04 Integrate — full tree harmonized
];

const camPos = waypoints[0].pos.clone();
const camTgt = waypoints[0].tgt.clone();
const wantPos = new THREE.Vector3();
const wantTgt = new THREE.Vector3();
let wantWire = 1, wantFront = 50;

const introFrom = V3(0, 48, 220);
let introStart = -1, introLockReleased = false;
const INTRO_DUR = 2700;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function scrollProgress() {
  const cs = document.getElementsByClassName('chapter');
  const lastTop = cs.length ? cs[cs.length - 1].offsetTop : innerHeight * (waypoints.length - 1);
  return lastTop > 0 ? clamp01(window.scrollY / lastTop) : 0;
}

function sampleScrollCam() {
  const p = scrollProgress();
  const n = waypoints.length - 1;
  const seg = p * n;
  const i = Math.min(n - 1, Math.floor(seg));
  const f = easeInOut(clamp01(seg - i));
  wantPos.lerpVectors(waypoints[i].pos, waypoints[i + 1].pos, f);
  wantTgt.lerpVectors(waypoints[i].tgt, waypoints[i + 1].tgt, f);
  wantWire  = waypoints[i].wire  + (waypoints[i + 1].wire  - waypoints[i].wire)  * f;
  wantFront = waypoints[i].front + (waypoints[i + 1].front - waypoints[i].front) * f;
}

/* =========================================================================
   Lighting Setup — Warm Studio Key Light + Fill + Controlled Gold Energy Core
   ========================================================================= */
const key = new THREE.DirectionalLight(0xfff4d6, 2.4);
key.position.set(25, 55, 55);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.bias = -0.0005;
key.shadow.normalBias = 0.6;
const sc = key.shadow.camera;
sc.left = -85; sc.right = 85; sc.top = 85; sc.bottom = -85; sc.near = 1; sc.far = 260;
scene.add(key);

// Warm Front-Left Fill Light for dimensional modeling and edge visibility
const fillLight = new THREE.DirectionalLight(0xd4af55, 0.75);
fillLight.position.set(-35, 30, 45);
scene.add(fillLight);

// Top Rim Light to accentuate upper branches and canopy silhouette
const rimLight = new THREE.DirectionalLight(0xffdf88, 1.2);
rimLight.position.set(0, 50, -35);
scene.add(rimLight);

const hemi = new THREE.HemisphereLight(0x282635, 0x100e0a, 0.35);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0x997530, 0.26);
scene.add(ambient);

// Controlled Gold Power Source Light in front of tree base (warm, radiant, non-burning)
const baseLight = new THREE.PointLight(0xe8c65a, 20.0, 38, 1.9);
baseLight.position.set(0, 3.5, 8.5);
scene.add(baseLight);

// Mid-Trunk & Branch Structure Light (warm dimensional fill across canopy)
const midLight = new THREE.PointLight(0xd4af37, 18.0, 48, 1.9);
midLight.position.set(0, 18.0, 10.5);
scene.add(midLight);

/* =========================================================================
   Procedural Voxel Terrain (Circuit & Contour lines)
   ========================================================================= */
const VQ = (innerWidth <= 820) ? 2 : 1;
const V = 1.0 * VQ;
const rockCenters = [
  { x: -58, z:  -8, r: 21, h: 16 },
  { x:  63, z:   6, r: 18, h: 14 },
  { x:  30, z: -58, r: 16, h: 12 },
  { x: -42, z: -52, r: 15, h: 12 }
];

function sampleTerrain(wx, wz) {
  const d = Math.hypot(wx, wz);
  const mask = smoothstep(8, 55, d);
  let h = fbm(wx * 0.012, wz * 0.012, 4) * 8.5 * mask;
  h += fbm(wx * 0.045 + 10, wz * 0.045 - 7, 3) * 2.0 * mask;
  h += Math.sin(d * 0.085 - 0.5) * 2.2 * Math.exp(-d * 0.0045);
  return { h };
}

const terrainTop = new THREE.Color(0x191922);
const terrainDeep = new THREE.Color(0x0e0e14);
const tmpCol = new THREE.Color();

function buildZone(cell, rMin, rMax, maxFill, out) {
  const half = Math.ceil(rMax / cell) + 1;
  const N = half * 2 + 1;
  const lv = new Int16Array(N * N);
  const inMask = new Uint8Array(N * N);
  const id = (i, j) => i * N + j;

  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const wx = (i - half) * cell, wz = (j - half) * cell;
    const d = Math.hypot(wx, wz);
    if (d < rMin || d > rMax) continue;
    const s = sampleTerrain(wx, wz);
    lv[id(i, j)] = Math.round(s.h / cell);
    inMask[id(i, j)] = 1;
  }

  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (!inMask[id(i, j)]) continue;
    const L = lv[id(i, j)];
    let mn = L;
    if (i > 0 && inMask[id(i - 1, j)]) mn = Math.min(mn, lv[id(i - 1, j)]);
    if (i < N - 1 && inMask[id(i + 1, j)]) mn = Math.min(mn, lv[id(i + 1, j)]);
    if (j > 0 && inMask[id(i, j - 1)]) mn = Math.min(mn, lv[id(i, j - 1)]);
    if (j < N - 1 && inMask[id(i, j + 1)]) mn = Math.min(mn, lv[id(i, j + 1)]);
    const start = Math.max(Math.min(L, mn), L - maxFill);
    const wx = (i - half) * cell, wz = (j - half) * cell;

    for (let l = start; l <= L; l++) {
      out.pos.push(wx, l * cell, wz);
      const tt = Math.min(1, (L - l) / 4);
      tmpCol.copy(terrainTop).lerp(terrainDeep, tt);
      out.col.push(tmpCol.r, tmpCol.g, tmpCol.b);
    }
  }
}

const near = { pos: [], col: [] };
const far = { pos: [], col: [] };
const FAR_CELL = 2.9 * VQ;
buildZone(V, 0, 74, 6, near);
buildZone(FAR_CELL, 70, 210, 2, far);

const voxGeo = new RoundedBoxGeometry(0.96 * VQ, 0.96 * VQ, 0.96 * VQ, 1, 0.12 * VQ);
const voxGeoFar = new RoundedBoxGeometry(FAR_CELL * 0.96, FAR_CELL * 0.96, FAR_CELL * 0.96, 1, 0.12 * FAR_CELL);

function buildInstanced(geo, mat, pos, col) {
  const count = pos.length / 3;
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4();
  for (let k = 0; k < count; k++) {
    m.makeTranslation(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
    mesh.setMatrixAt(k, m);
  }
  if (col) mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(col), 3);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

const terrainMat = new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.94, metalness: 0.10, envMapIntensity: 0.3 });
const treeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.36, metalness: 0.46, envMapIntensity: 1.1 });

/* =========================================================================
   Voxel Motion & Gold Energy Shaders
   ========================================================================= */
const fx = {
  uTime: { value: 0 },
  uIdleAmp: { value: 0.04 },
  uWindFreq: { value: 0.35 },
  uSwayAmp: { value: 0.45 },
  uCursor: { value: new THREE.Vector2(1e4, 1e4) },
  uCursorStr: { value: 0 },
  uCursorRad: { value: 18.0 },
  uCursorAmp: { value: 1.4 },
  uWire: { value: 1 },
  uWireBreath: { value: 0.65 }, // Slow, serene breathing (was 5.0)
  uWireColor: { value: new THREE.Color(0xe8c65a) }, // Luminous sovereign gold
  uWireFront: { value: 50.0 },
  uBuild: { value: 1 },
  uSparkProgress: { value: -1.0 },
  uSparkBranchAngle: { value: 0.0 },
  uSparkActive: { value: 0.0 },
  uScrollFlow: { value: 0.0 },
  uScrollDir: { value: 1.0 }
};

function patchVoxelMotion(mat, isTree = false) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = fx.uTime;
    shader.uniforms.uIdleAmp = fx.uIdleAmp;
    shader.uniforms.uWindFreq = fx.uWindFreq;
    shader.uniforms.uSwayAmp = fx.uSwayAmp;
    shader.uniforms.uCursor = fx.uCursor;
    shader.uniforms.uCursorStr = fx.uCursorStr;
    shader.uniforms.uCursorRad = fx.uCursorRad;
    shader.uniforms.uCursorAmp = fx.uCursorAmp;
    shader.uniforms.uWire = fx.uWire;
    shader.uniforms.uWireBreath = fx.uWireBreath;

    let vHead = `
      uniform float uTime;
      uniform float uIdleAmp;
      uniform float uWindFreq;
      uniform float uSwayAmp;
      uniform vec2 uCursor;
      uniform float uCursorStr;
      uniform float uCursorRad;
      uniform float uCursorAmp;
      uniform float uWire;
      uniform float uWireBreath;
    `;

    if (isTree) {
      shader.uniforms.uWireColor = fx.uWireColor;
      shader.uniforms.uWireFront = fx.uWireFront;
      shader.uniforms.uBuild = fx.uBuild;
      shader.uniforms.uSparkProgress = fx.uSparkProgress;
      shader.uniforms.uSparkBranchAngle = fx.uSparkBranchAngle;
      shader.uniforms.uSparkActive = fx.uSparkActive;
      shader.uniforms.uScrollFlow = fx.uScrollFlow;
      shader.uniforms.uScrollDir = fx.uScrollDir;
      vHead += `
        uniform vec3 uWireColor;
        uniform float uWireFront;
        uniform float uBuild;
        uniform float uSparkProgress;
        uniform float uSparkBranchAngle;
        uniform float uSparkActive;
        uniform float uScrollFlow;
        uniform float uScrollDir;
        varying vec3 vWLocal;
        varying float vWPhase;
        varying float vWInstY;
        varying vec3 vWInstPos;
      `;
    }

    const buildLine = isTree ? `
      float bvh = iPos.y / 48.0;
      float born = 1.0 - smoothstep(uBuild * 1.25 - 0.22, uBuild * 1.25, bvh);
      transformed.xyz *= born;
    ` : '';

    const phaseLine = isTree ? `
      vWPhase = iPos.x * 0.31 + iPos.z * 0.27 + iPos.y * 0.2;
      vWInstY = iPos.y;
      vWInstPos = iPos;
    ` : '';

    const localLine = isTree ? `vWLocal = position;` : '';

    shader.vertexShader = vHead + shader.vertexShader.replace(
      '#include <project_vertex>',
      `
      #ifdef USE_INSTANCING
        vec3 iPos = instanceMatrix[3].xyz;
        float crown = smoothstep(16.0, 46.0, iPos.y);

        // Calmer ambient ground drift (serene, not vibrating)
        float idle = sin(uTime * 0.45 + iPos.x * 0.35 + iPos.z * 0.30) * uIdleAmp;
        transformed.y += idle * (1.0 - 0.6 * crown);

        // Calmer tech-organic subtle sway (gentle breeze, not frantic)
        float reach = length(iPos.xz);
        float ph = uTime * uWindFreq + iPos.y * 0.08 + reach * 0.05;
        float sway = sin(ph) * uSwayAmp * crown * (0.25 + reach * 0.03);
        transformed.x += sway * 0.8;
        transformed.z += sway * 0.25;

        // Dynamic cursor wake on terrain and trunk base
        if (uCursorStr > 0.001) {
          float gate = 1.0 - smoothstep(6.0, 16.0, iPos.y);
          float cd = distance(iPos.xz, uCursor);
          float pool = smoothstep(uCursorRad, 0.0, cd);
          pool *= pool;
          transformed.y += pool * uCursorStr * uCursorAmp * gate;
        }
        ${buildLine}
        ${phaseLine}
      #endif
      ${localLine}
      #include <project_vertex>
      `
    );

    if (isTree) {
      shader.fragmentShader = `
        uniform float uTime;
        uniform float uWire;
        uniform float uWireBreath;
        uniform vec3 uWireColor;
        uniform float uWireFront;
        uniform float uSparkProgress;
        uniform float uSparkBranchAngle;
        uniform float uSparkActive;
        uniform float uScrollFlow;
        uniform float uScrollDir;
        varying vec3 vWLocal;
        varying float vWPhase;
        varying float vWInstY;
        varying vec3 vWInstPos;
      ` + shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `
        #include <opaque_fragment>
        // 1. Unified Tech-Organic Circuit & Energy Network
        if (uWire > 0.001) {
          // Normalized tree vertical height: -1.5 (roots) to 46.0 (canopy)
          float treeH = clamp((vWInstY - (-1.5)) / 47.5, 0.0, 1.0);

          // 5-Tier Vertical Energy Gradient (exact user specifications):
          // Bottom / Roots: 1.25 (controlled power source, strongest glow)
          // Lower trunk: ~0.88 (strong)
          // Middle trunk / major branches: ~0.60 (moderate)
          // Upper branches: ~0.42 (subtle)
          // Top of tree: 0.28 (delicate trace)
          float vertGrad = 1.25 - 0.97 * pow(treeH, 0.58);

          // Voxel cube edge detection for micro-circuit structure (anti-aliased across bevels)
          vec3 ap = abs(vWLocal);
          float mx = max(ap.x, max(ap.y, ap.z));
          float mn = min(ap.x, min(ap.y, ap.z));
          float md = ap.x + ap.y + ap.z - mx - mn;
          float edgeness = md / max(mx, 1e-4);
          float wire = smoothstep(0.28, 0.82, edgeness);

          // Serene, slow ambient breathing (calm idle: 0.72 rad/s)
          float breathe = 0.70 + 0.30 * sin(uTime * 0.72 + vWPhase * 0.45);

          // Tech-organic conduit veins along trunk & branch grain
          float branchAng = atan(vWInstPos.z, vWInstPos.x);
          float veinPattern = sin(branchAng * 6.0 + vWInstY * 0.38 + vWPhase * 0.4);
          float isVein = smoothstep(0.35, 0.85, veinPattern);

          // Continuous Upward Energy Flow:
          // Idle = slow, gentle upward current (speed 0.22)
          // Scroll = responsive acceleration (speed up to 1.15)
          float flowSpeed = 0.22 + uScrollFlow * 0.95;
          float branchDist = length(vWInstPos.xz);
          float pathDist = vWInstY + branchDist * 0.42;
          float flowPhase = (pathDist / 15.0) - (uTime * flowSpeed * uScrollDir) + (vWPhase * 0.18);
          float pulseWave = smoothstep(0.70, 0.98, sin(flowPhase * 6.28318));

          // 1. Luminous Gold Wireframe Edges (sharp micro-circuits)
          vec3 goldEdge = uWireColor * wire * (1.50 + 0.40 * breathe) * vertGrad;

          // 2. Flowing Champagne-Gold Data Veins (wood grain conduits)
          vec3 conduitCol = mix(vec3(0.95, 0.82, 0.40), vec3(1.0, 0.96, 0.86), isVein);
          vec3 veinEnergy = conduitCol * isVein * (0.80 + 0.35 * breathe) * vertGrad;

          // 3. Upward Energy Pulses (accelerates on scroll)
          vec3 pulseEnergy = mix(uWireColor, vec3(1.0, 0.98, 0.90), 0.6) * pulseWave * (0.50 + uScrollFlow * 1.10) * vertGrad;

          // 4. Controlled Living Base Energy Glow on Voxel Faces (subtle so metallic bark shading remains crisp)
          vec3 faceGlow = uWireColor * 0.05 * (0.8 + 0.2 * breathe) * vertGrad;

          // Combined controlled energy emission
          vec3 energyEmission = (goldEdge + veinEnergy + pulseEnergy + faceGlow) * uWire;

          gl_FragColor.rgb += energyEmission;
        }

        // 2. Controlled White Electrical Sparks (Traveling through limbs & branches)
        if (uSparkActive > 0.001) {
          float branchDist = length(vWInstPos.xz);
          float branchAng = atan(vWInstPos.z, vWInstPos.x);
          float angDelta = abs(branchAng - uSparkBranchAngle);
          if (angDelta > 3.14159) angDelta = 6.28318 - angDelta;

          // Electrical spark travels up from trunk split outward into canopy branches
          float sparkPos = uSparkProgress * 44.0;
          float sparkDist = abs((vWInstY + branchDist * 0.38) - sparkPos);

          if (sparkDist < 2.8 && angDelta < 1.15) {
            float sparkAmp = (1.0 - sparkDist / 2.8) * (1.0 - angDelta / 1.15) * uSparkActive;
            float jitter = sin(uTime * 45.0 + vWInstY * 18.0 + vWPhase * 8.0);
            if (jitter > -0.2) {
              // Brilliant white electrical spark with delicate gold corona
              vec3 sparkCol = mix(vec3(0.95, 0.92, 0.75), vec3(1.0, 1.0, 1.0), 0.85) * (1.8 + jitter * 0.6);
              float treeH = clamp((vWInstY - (-1.5)) / 47.5, 0.0, 1.0);
              float sparkVertGrad = 1.0 - 0.70 * pow(treeH, 0.58);
              gl_FragColor.rgb += sparkCol * sparkAmp * 0.85 * sparkVertGrad;
            }
          }
        }

        // 3. Dynamic Scroll Intelligence Flow (Illuminates additional branches upon scroll)
        if (uScrollFlow > 0.01) {
          float treeH = clamp((vWInstY - (-1.5)) / 47.5, 0.0, 1.0);
          float scrollVertGrad = 1.25 - 0.97 * pow(treeH, 0.58);
          float scrollWave = sin(vWInstY * 0.40 - uTime * 6.0 * uScrollDir + vWPhase * 0.6);
          float scrollPulse = smoothstep(0.82, 0.98, scrollWave);
          if (scrollPulse > 0.01) {
            vec3 activeCol = mix(vec3(0.96, 0.84, 0.40), vec3(1.0, 0.98, 0.92), scrollPulse);
            gl_FragColor.rgb += activeCol * scrollPulse * uScrollFlow * 0.70 * scrollVertGrad;
          }
        }
        `
      );
    }
  };
}

patchVoxelMotion(terrainMat, false);
patchVoxelMotion(treeMat, true);

const terrainMesh = buildInstanced(voxGeo, terrainMat, near.pos, near.col);
const terrainMeshFar = buildInstanced(voxGeoFar, terrainMat, far.pos, far.col);
scene.add(terrainMesh, terrainMeshFar);

/* =========================================================================
   Build Tech-Organic Tree Mesh
   ========================================================================= */
let treeMesh = null;
function buildTree() {
  const gen = new TechOrganicTreeGenerator({ voxelSize: 0.42, seed: 2026 });
  const treeData = gen.generate();
  const count = treeData.voxelCount;

  const cubeSize = treeData.voxelSize * 0.95;
  const treeGeo = new RoundedBoxGeometry(cubeSize, cubeSize, cubeSize, 1, cubeSize * 0.12);
  treeMesh = new THREE.InstancedMesh(treeGeo, treeMat, count);

  const m = new THREE.Matrix4();
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  for (let k = 0; k < count; k++) {
    dummy.position.set(
      treeData.positions[k * 3],
      treeData.positions[k * 3 + 1],
      treeData.positions[k * 3 + 2]
    );
    dummy.scale.setScalar(treeData.scales[k]);
    dummy.updateMatrix();
    treeMesh.setMatrixAt(k, dummy.matrix);

    col.setRGB(
      treeData.colors[k * 3],
      treeData.colors[k * 3 + 1],
      treeData.colors[k * 3 + 2]
    );
    treeMesh.setColorAt(k, col);
  }

  treeMesh.instanceMatrix.needsUpdate = true;
  if (treeMesh.instanceColor) treeMesh.instanceColor.needsUpdate = true;
  treeMesh.castShadow = true;
  treeMesh.receiveShadow = false;
  scene.add(treeMesh);
}
buildTree();

/* =========================================================================
   Planted Sticks / Torches & Subtle Root Base Glow
   ========================================================================= */
function createRootHaloTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0.0, 'rgba(235, 180, 65, 0.45)');
  g.addColorStop(0.20, 'rgba(225, 160, 50, 0.28)');
  g.addColorStop(0.50, 'rgba(180, 115, 25, 0.10)');
  g.addColorStop(0.82, 'rgba(90, 50, 8, 0.02)');
  g.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// 1. Subtle Golden Glow around the roots / base of the tree
const rootHaloGeo = new THREE.PlaneGeometry(26, 26);
rootHaloGeo.rotateX(-Math.PI / 2);
const rootHaloTex = createRootHaloTex();
const rootHaloMat = new THREE.MeshBasicMaterial({
  map: rootHaloTex,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0.38
});
const rootHaloMesh = new THREE.Mesh(rootHaloGeo, rootHaloMat);
rootHaloMesh.position.set(0, -0.45, 0);
rootHaloMesh.onBeforeRender = function() {
  if (scene.overrideMaterial) rootHaloMesh.visible = false;
};
rootHaloMesh.onAfterRender = function() {
  rootHaloMesh.visible = true;
};
scene.add(rootHaloMesh);

// Ground-level subtle root warm uplight (gentle, grounded energy)
const rootBaseGlowLight = new THREE.PointLight(0xe8aa38, 11.0, 18, 2.0);
rootBaseGlowLight.position.set(0, 0.6, 0);
scene.add(rootBaseGlowLight);

// 2. Planted sticks/torches across the ground around the tree
const torchStickMat = new THREE.MeshStandardMaterial({
  color: 0x221a14,
  roughness: 0.85,
  metalness: 0.20
});
const torchCollarMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.35,
  metalness: 0.70
});
const torchEmberMat = new THREE.MeshStandardMaterial({
  color: 0xffd266,
  emissive: 0xff9922,
  emissiveIntensity: 3.2,
  roughness: 0.25,
  metalness: 0.10
});

// Naturally scattered positions across the entire landscape (inner roots, midground terraces, and distant ridges)
const TORCH_DEFS = [
  // --- Inner Sanctuary / Root Perimeter (r ~ 8 - 14) ---
  { x:  -7.2, z:   8.0, h: 3.1, rotX:  0.08, rotZ: -0.06, rotY:  0.4, light: true,  intensity: 5.2, phase: 0.0 },
  { x:   7.5, z:   7.2, h: 2.9, rotX:  0.06, rotZ:  0.09, rotY: -0.5, light: true,  intensity: 5.0, phase: 1.4 },
  { x: -11.5, z:   2.0, h: 3.3, rotX: -0.05, rotZ: -0.08, rotY:  0.8, light: false, intensity: 0,   phase: 2.7 },
  { x:  11.8, z:  -3.2, h: 3.0, rotX: -0.07, rotZ:  0.06, rotY: -0.9, light: true,  intensity: 4.8, phase: 4.1 },
  { x:  -8.0, z:  -8.5, h: 2.8, rotX: -0.08, rotZ: -0.05, rotY:  1.2, light: false, intensity: 0,   phase: 2.1 },
  { x:   8.2, z:  -8.8, h: 3.0, rotX: -0.06, rotZ:  0.08, rotY: -1.1, light: false, intensity: 0,   phase: 3.5 },
  { x:   0.5, z:  12.2, h: 3.3, rotX:  0.07, rotZ: -0.04, rotY:  0.2, light: true,  intensity: 5.2, phase: 5.2 },

  // --- Midground Terraces & Rolling Ground (r ~ 16 - 28) ---
  { x: -18.5, z:  10.5, h: 3.4, rotX:  0.09, rotZ: -0.07, rotY:  0.6, light: true,  intensity: 4.6, phase: 1.1 },
  { x: -15.2, z:  19.8, h: 3.6, rotX:  0.06, rotZ:  0.08, rotY: -0.4, light: false, intensity: 0,   phase: 2.9 },
  { x: -22.0, z:  -6.5, h: 3.2, rotX: -0.08, rotZ: -0.05, rotY:  1.0, light: false, intensity: 0,   phase: 4.4 },
  { x: -12.5, z: -18.0, h: 3.5, rotX: -0.06, rotZ:  0.07, rotY: -1.2, light: false, intensity: 0,   phase: 0.7 },
  { x:  16.5, z:  12.0, h: 3.3, rotX:  0.08, rotZ: -0.06, rotY:  0.5, light: true,  intensity: 4.8, phase: 3.8 },
  { x:  22.5, z:   6.0, h: 3.1, rotX: -0.05, rotZ:  0.09, rotY: -0.7, light: false, intensity: 0,   phase: 5.6 },
  { x:  18.0, z: -14.5, h: 3.4, rotX: -0.09, rotZ: -0.06, rotY:  1.3, light: false, intensity: 0,   phase: 1.8 },
  { x:  -3.5, z:  24.0, h: 3.7, rotX:  0.07, rotZ:  0.05, rotY:  0.3, light: false, intensity: 0,   phase: 3.2 },
  { x:   8.5, z:  22.5, h: 3.3, rotX:  0.05, rotZ: -0.08, rotY: -0.6, light: false, intensity: 0,   phase: 4.9 },
  { x:   2.0, z: -21.0, h: 3.0, rotX: -0.07, rotZ:  0.06, rotY: -1.0, light: false, intensity: 0,   phase: 0.3 },
  { x: -24.5, z:  15.0, h: 3.5, rotX:  0.08, rotZ: -0.05, rotY:  0.8, light: false, intensity: 0,   phase: 2.4 },

  // --- Outer Landscape Ridges & Distant Crests (r ~ 30 - 46) ---
  { x: -32.0, z:  18.0, h: 3.8, rotX:  0.10, rotZ: -0.08, rotY:  0.5, light: false, intensity: 0,   phase: 1.6 },
  { x: -28.5, z: -22.0, h: 3.6, rotX: -0.09, rotZ: -0.06, rotY:  1.1, light: false, intensity: 0,   phase: 3.7 },
  { x: -16.0, z:  34.0, h: 4.0, rotX:  0.08, rotZ:  0.07, rotY: -0.3, light: false, intensity: 0,   phase: 5.1 },
  { x:  12.0, z:  35.0, h: 3.8, rotX:  0.06, rotZ: -0.09, rotY:  0.4, light: false, intensity: 0,   phase: 0.9 },
  { x:  28.0, z:  22.0, h: 3.5, rotX:  0.07, rotZ:  0.06, rotY: -0.8, light: false, intensity: 0,   phase: 2.8 },
  { x:  34.0, z:  -8.0, h: 3.4, rotX: -0.06, rotZ:  0.08, rotY: -1.2, light: false, intensity: 0,   phase: 4.3 },
  { x:  26.0, z: -26.0, h: 3.6, rotX: -0.08, rotZ: -0.07, rotY:  1.4, light: false, intensity: 0,   phase: 1.2 },
  { x:  -5.0, z:  42.0, h: 4.2, rotX:  0.09, rotZ:  0.04, rotY:  0.2, light: false, intensity: 0,   phase: 3.4 },
  { x:   6.0, z: -36.0, h: 3.7, rotX: -0.07, rotZ:  0.05, rotY: -0.9, light: false, intensity: 0,   phase: 5.8 },
  { x: -38.0, z:  -2.0, h: 3.9, rotX: -0.08, rotZ: -0.08, rotY:  0.7, light: false, intensity: 0,   phase: 2.2 }
];

const torches = [];

function buildTorches() {
  TORCH_DEFS.forEach((def) => {
    const group = new THREE.Group();
    const groundY = sampleTerrain(def.x, def.z).h;
    group.position.set(def.x, groundY, def.z);
    group.rotation.set(def.rotX, def.rotY, def.rotZ);

    // Weathered bronze / dark wood planted stick
    const stickGeo = new THREE.CylinderGeometry(0.10, 0.16, def.h + 0.6, 6);
    stickGeo.translate(0, (def.h - 0.6) / 2, 0); // Base penetrates slightly into ground
    const stickMesh = new THREE.Mesh(stickGeo, torchStickMat);
    stickMesh.castShadow = true;
    stickMesh.receiveShadow = false;
    group.add(stickMesh);

    // Gold collar band at the torch neck
    const collarGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 6);
    collarGeo.translate(0, def.h - 0.12, 0);
    const collarMesh = new THREE.Mesh(collarGeo, torchCollarMat);
    group.add(collarMesh);

    // Glowing ember crystal tip
    const emberGeo = new THREE.OctahedronGeometry(0.24, 0);
    emberGeo.translate(0, def.h + 0.08, 0);
    const emberMesh = new THREE.Mesh(emberGeo, torchEmberMat);
    group.add(emberMesh);

    // Soft 3D volumetric ember glow aura
    const glowGeo = new THREE.SphereGeometry(0.38, 12, 8);
    glowGeo.translate(0, def.h + 0.10, 0);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffa436,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.onBeforeRender = function() {
      if (scene.overrideMaterial) glowMesh.visible = false;
    };
    glowMesh.onAfterRender = function() {
      glowMesh.visible = true;
    };
    group.add(glowMesh);

    // Atmospheric campfire point light
    let pLight = null;
    if (def.light) {
      pLight = new THREE.PointLight(0xffb242, def.intensity, 16, 2.0);
      pLight.position.set(def.x, groundY + def.h + 0.15, def.z);
      scene.add(pLight);
    }

    scene.add(group);
    torches.push({
      def,
      glowMesh,
      light: pLight,
      baseIntensity: def.intensity
    });
  });
}
buildTorches();

/* =========================================================================
   Atmosphere Particles (Rising Gold Motes)
   ========================================================================= */
const PCOUNT = 1300;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PCOUNT * 3);
const pPhase = new Float32Array(PCOUNT);
const pSpeed = new Float32Array(PCOUNT);
const pSize = new Float32Array(PCOUNT);

for (let i = 0; i < PCOUNT; i++) {
  pPos[i * 3]     = (Math.random() * 2 - 1) * 95;
  pPos[i * 3 + 1] = 2.0 + Math.random() * 75; // Elevated above root floor to eliminate campfire smoke
  pPos[i * 3 + 2] = (Math.random() * 2 - 1) * 95;
  pPhase[i] = Math.random() * Math.PI * 2;
  pSpeed[i] = 0.35 + Math.random() * 0.85;
  pSize[i]  = 0.8 + Math.random() * 2.0;
}

pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeed, 1));
pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));

const pMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: fx.uTime,
    uPixelScale: { value: 60 * DPRCAP },
    uColor: { value: new THREE.Color(0xe8c65a) }, // Gold
    uOpacity: { value: 0.26 },
  },
  vertexShader: `
    attribute float aPhase; attribute float aSpeed; attribute float aSize;
    uniform float uTime, uPixelScale;
    varying float vFade;
    void main(){
      vec3 p = position;
      float y = mod(p.y - 2.0 - uTime * 0.9 * aSpeed, 75.0);
      p.y = 2.0 + y;
      p.x += sin(uTime * 0.35 * aSpeed + aPhase) * 2.0;
      p.z += cos(uTime * 0.30 * aSpeed + aPhase * 1.3) * 2.0;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vFade = smoothstep(0.0, 7.0, y) * (1.0 - smoothstep(66.0, 75.0, y));
      gl_PointSize = aSize * uPixelScale / max(-mv.z, 1.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uColor; uniform float uOpacity;
    varying float vFade;
    void main(){
      float a = smoothstep(0.5, 0.0, length(gl_PointCoord - vec2(0.5)));
      gl_FragColor = vec4(uColor, a * a * uOpacity * vFade);
    }`,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const particles = new THREE.Points(pGeo, pMat);
particles.frustumCulled = false;
scene.add(particles);

/* =========================================================================
   Post-Processing Pipeline
   ========================================================================= */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(curDpr);
composer.addPass(new RenderPass(scene, camera));

const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
gtao.output = GTAOPass.OUTPUT.Default;
gtao.updateGtaoMaterial({ radius: 1.1, distanceExponent: 1, thickness: 1, scale: 1.45, samples: 10, distanceFallOff: 1 });
patchVoxelMotion(gtao.normalMaterial, true);
composer.addPass(gtao);

const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.52, 0.40, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// Luxury Black & Gold Color Grade Pass
const ColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uBrightness: { value: 0.02 },
    uContrast: { value: 1.10 },
    uSaturation: { value: 1.15 },
    uDuotone: { value: 0.45 },
    uShadow: { value: new THREE.Color(0x060608) },     // Obsidian void shadow
    uHighlight: { value: new THREE.Color(0xf5eedc) },  // Champagne gold highlight
    uAberration: { value: 0.022 }
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uBrightness, uContrast, uSaturation, uDuotone, uAberration;
    uniform vec3 uShadow, uHighlight;
    varying vec2 vUv;
    vec3 toS(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c)); }
    void main() {
      vec2 dir = vUv - 0.5;
      vec2 off = dir * dot(dir, dir) * uAberration;
      float a = texture2D(tDiffuse, vUv).a;
      vec3 col = vec3(
        texture2D(tDiffuse, vUv - off).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv + off).b
      );
      col += uBrightness;
      col = (col - 0.5) * uContrast + 0.5;
      float l = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
      vec3 desat = mix(vec3(l), col, uSaturation);
      vec3 duo = mix(toS(uShadow), toS(uHighlight), l);
      col = mix(desat, duo, uDuotone);
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), a);
    }`
};
const gradePass = new ShaderPass(ColorGradeShader);
composer.addPass(gradePass);

/* =========================================================================
   Mouse Hover & Raycasted Wake
   ========================================================================= */
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const pointer = new THREE.Vector2(0, 0);
let pointerActive = false;
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hit = new THREE.Vector3();
const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _up = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
let parX = 0, parY = 0;

if (canHover) {
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / innerHeight) * 2 + 1;
    pointerActive = true;
  }, { passive: true });
}

function updatePointer() {
  if (!canHover) return;
  let hit = false;
  if (pointerActive) {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(groundPlane, _hit)) {
      fx.uCursor.value.x += (_hit.x - fx.uCursor.value.x) * 0.2;
      fx.uCursor.value.y += (_hit.z - fx.uCursor.value.y) * 0.2;
      hit = true;
    }
  }
  const tStr = (pointerActive && hit) ? 1 : 0;
  fx.uCursorStr.value += (tStr - fx.uCursorStr.value) * 0.08;
  const tpx = pointerActive ? pointer.x * 3.2 : 0;
  const tpy = pointerActive ? pointer.y * 3.2 : 0;
  parX += (tpx - parX) * 0.06;
  parY += (tpy - parY) * 0.06;
}

/* =========================================================================
   Resize Handler & Layout Positions
   ========================================================================= */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  drawBg();
});

const vignetteEl = document.querySelector('.vignette');
const chapterEls = document.querySelectorAll('.chapter');
const lastChapterEl = chapterEls[chapterEls.length - 1];
const navbarEl = document.querySelector('.navbar');

let _capTop = 1e9, _lastChTop = 1e9, _ftTop = 1e9, _navH = 70;
function recalcTops() {
  const c = document.getElementById('capabilities'); if (c) _capTop = c.offsetTop;
  if (lastChapterEl) _lastChTop = lastChapterEl.offsetTop;
  const f = document.getElementById('footer'); if (f) _ftTop = f.offsetTop;
  if (navbarEl) _navH = navbarEl.offsetHeight;
}
window.addEventListener('load', recalcTops);
window.addEventListener('resize', recalcTops);

let _fixedShown = true;
let _tickRunning = true;
function toggleFixed() {
  const show = window.scrollY < _capTop + 100;
  if (show === _fixedShown) return;
  _fixedShown = show;
  const d = show ? '' : 'none';
  app.style.display = d;
  if (vignetteEl) vignetteEl.style.display = d;
  if (show && !_tickRunning) {
    _tickRunning = true;
    lastFrame = performance.now();
    requestAnimationFrame(tick);
  }
}
window.addEventListener('scroll', toggleFixed, { passive: true });

/* =========================================================================
   Animation & Render Loop (with Adaptive DPR & Tree Energy Pulses)
   ========================================================================= */
const clock = new THREE.Clock();
let lastHz = -1;
let lastFrame = -1, adaptSlow = 0;
const FRAME_MS = 1000 / 60;

let lastScrollY = window.scrollY;
let lastScrollTime = performance.now();
let scrollVelocity = 0;

let nextSparkTime = performance.now() + 2500;
let sparkStartTime = -1;
const SPARK_DURATION = 620;

function tick(now) {
  if (!_fixedShown) {
    _tickRunning = false;
    return;
  }
  requestAnimationFrame(tick);
  if (document.hidden) return;

  if (window.lenis) window.lenis.raf(now);

  const frameInterval = lastFrame >= 0 ? now - lastFrame : FRAME_MS;
  if (lastFrame >= 0 && frameInterval < FRAME_MS - 0.5) return;
  lastFrame = now;

  // Scroll Velocity & Direction Tracking for Living Tree Energy Flow
  const dt = Math.max(0.001, (now - lastScrollTime) / 1000);
  const curScrollY = window.scrollY;
  const dy = curScrollY - lastScrollY;
  lastScrollY = curScrollY;
  lastScrollTime = now;

  const rawVel = dy / dt;
  scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, rawVel, 0.18);
  const absVel = Math.abs(scrollVelocity);
  const targetFlow = Math.min(1.0, absVel / 1500.0);
  fx.uScrollFlow.value = THREE.MathUtils.lerp(fx.uScrollFlow.value, targetFlow, 0.12);
  if (absVel > 25) {
    fx.uScrollDir.value = scrollVelocity > 0 ? 1.0 : -1.0;
  }

  // Intermittent White Electrical / Lightning Energy Pulses
  // Idle = calm, infrequent pulses (6.5s to 9.5s)
  // Scroll = responsive activation with higher frequency traveling through branches
  if (sparkStartTime < 0) {
    if (now > nextSparkTime || (absVel > 250 && Math.random() < 0.035)) {
      sparkStartTime = now;
      fx.uSparkActive.value = 1.0;
      fx.uSparkProgress.value = 0.0;
      fx.uSparkBranchAngle.value = (Math.random() - 0.5) * Math.PI * 2;
    }
  } else {
    const elapsed = now - sparkStartTime;
    const progress = elapsed / SPARK_DURATION;
    if (progress < 1.0) {
      fx.uSparkProgress.value = Math.pow(progress, 0.65);
      fx.uSparkActive.value = 1.0 - Math.pow(progress, 3.0);
    } else {
      fx.uSparkActive.value = 0.0;
      fx.uSparkProgress.value = -1.0;
      sparkStartTime = -1;
      const cooldown = THREE.MathUtils.lerp(6500, 2200, targetFlow);
      nextSparkTime = now + cooldown + Math.random() * 2800;
    }
  }

  // Adaptive Performance: downscale if GPU struggles
  if (introLockReleased) {
    if (frameInterval > 22) adaptSlow++; else adaptSlow = Math.max(0, adaptSlow - 2);
    if (adaptSlow > 15) {
      if (curDpr > DPR_FLOOR) {
        curDpr = Math.max(DPR_FLOOR, curDpr - 0.2);
        renderer.setPixelRatio(curDpr);
        renderer.setSize(innerWidth, innerHeight);
        composer.setPixelRatio(curDpr);
      } else if (gtao.enabled) {
        gtao.enabled = false;
      } else if (bloom.enabled) {
        bloom.enabled = false;
      }
      adaptSlow = 0;
    }
  }

  fx.uTime.value = clock.getElapsedTime();
  const tTime = fx.uTime.value;

  // Gentle, atmospheric root base glow and torch breathing
  rootHaloMat.opacity = 0.34 + 0.06 * Math.sin(tTime * 0.72);
  rootBaseGlowLight.intensity = 11.0 * (0.92 + 0.08 * Math.sin(tTime * 0.72));

  for (let i = 0; i < torches.length; i++) {
    const tor = torches[i];
    const ph = tor.def.phase;
    // Soft, organic campfire ember flicker (restrained hearth rhythm)
    const flicker = 0.88 + 0.10 * Math.sin(tTime * 3.2 + ph) + 0.04 * Math.sin(tTime * 7.1 + ph * 1.7);
    tor.glowMesh.material.opacity = 0.65 * flicker;
    if (tor.light) {
      tor.light.intensity = tor.baseIntensity * flicker;
    }
  }

  updatePointer();

  // Intro or Scroll-Driven Camera
  if (introStart < 0) {
    camPos.copy(introFrom);
    camTgt.copy(waypoints[0].tgt);
    fx.uBuild.value = 0;
    fx.uWire.value = 1;
    fx.uWireFront.value = 0;
  } else {
    const tI = performance.now() - introStart;
    const introT = clamp01(tI / INTRO_DUR);
    if (introT < 1) {
      camPos.lerpVectors(introFrom, waypoints[0].pos, easeOutCubic(introT));
      camTgt.copy(waypoints[0].tgt);
      const build = clamp01(tI / 2000);
      fx.uBuild.value = build;
      fx.uWire.value = 1;
      fx.uWireFront.value = 50;
    } else {
      if (!introLockReleased) {
        introLockReleased = true;
        if (window.lenis) window.lenis.start();
        document.body.style.overflow = '';
      }
      fx.uBuild.value = 1;
      sampleScrollCam();
      camPos.lerp(wantPos, 0.085);
      camTgt.lerp(wantTgt, 0.085);
      fx.uWire.value = 1.0;
      fx.uWireFront.value = 50.0;
    }
  }

  _fwd.subVectors(camTgt, camPos).normalize();
  _right.crossVectors(_fwd, WORLD_UP).normalize();
  _up.crossVectors(_right, _fwd).normalize();
  camera.position.copy(camPos).addScaledVector(_right, parX).addScaledVector(_up, parY);

  const minCamY = sampleTerrain(camera.position.x, camera.position.z).h + 5.0;
  if (camera.position.y < minCamY) camera.position.y = minCamY;
  camera.lookAt(camTgt);

  // Smooth scroll glass navbar and depth transition
  const hz = clamp01((window.scrollY - _lastChTop) / innerHeight);
  if (navbarEl) {
    navbarEl.classList.toggle('scrolled', window.scrollY > 40);
    const ft = document.getElementById('footer');
    if (ft) {
      const navH = _navH, ftTop = _ftTop - window.scrollY;
      navbarEl.style.transform = ftTop < navH ? 'translateY(' + (ftTop - navH) + 'px)' : '';
    }
  }

  if (hz !== lastHz) {
    lastHz = hz;
    const sc = 1 - 0.12 * clamp01(hz / 0.6);
    const awayPx = -0.5 * innerHeight * clamp01((hz - 0.4) / 0.6);
    const tf = hz > 0 ? `translateY(${awayPx.toFixed(1)}px) scale(${sc.toFixed(3)})` : '';
    app.style.transform = tf;
    if (vignetteEl) vignetteEl.style.transform = tf;
    if (lastChapterEl) {
      lastChapterEl.style.transformOrigin = '50% ' + (window.scrollY - _lastChTop).toFixed(0) + 'px';
      lastChapterEl.style.transform = tf;
    }
  }

  if (window.scrollY < _capTop && !document.hidden) {
    composer.render();
    if (!window.__zyntisReady) {
      window.__zyntisReady = true;
      window.dispatchEvent(new Event('zyntis:ready'));
    }
  }
}
requestAnimationFrame(tick);

/* =========================================================================
   Preloader Sequence & Shimmer Mask
   ========================================================================= */
window.scrollTo(0, 0);
document.body.style.overflow = 'hidden';

const loaderEl = document.getElementById('loader');

function revealMask() {
  if (!loaderEl) return;
  loaderEl.style.transition = 'opacity 0.8s ease, visibility 0.8s ease';
  loaderEl.style.opacity = '0';
  setTimeout(() => {
    loaderEl.style.visibility = 'hidden';
  }, 820);
}

function fillLogo(done) {
  const logo = loaderEl && loaderEl.querySelector('.ld-logo');
  const start = performance.now();
  const MIN = 800, MAX = 6000;
  let sceneOK = !!window.__zyntisReady;
  if (!sceneOK) window.addEventListener('zyntis:ready', () => { sceneOK = true; }, { once: true });

  function frame(now) {
    const el = now - start;
    const target = sceneOK || el >= MIN ? 1 : Math.min(0.9, el / 1600);
    const a = target * 110 - 5;
    const m = `linear-gradient(90deg, #000 ${a}%, transparent ${a + 5}%)`;
    if (logo) {
      logo.style.webkitMaskImage = m;
      logo.style.maskImage = m;
    }
    if ((sceneOK && el >= MIN) || el >= MAX) {
      setTimeout(done, 120);
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

fillLogo(() => {
  revealMask();
  introStart = performance.now();
  if (window.typeHero) window.typeHero();
});
