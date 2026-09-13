/**
 * ZYNTIS GROUP — Tech-Organic Tree Procedural Voxel Generator
 * 
 * Visual Architecture:
 * - Primary structure: Sovereign & Luminous Gold bark + deeper bronze shading
 * - Refined Branch Hierarchy: Thick trunk -> moderately thick primary limbs ->
 *   substantially thinner secondary -> very thin tertiary -> delicate neural fibrils
 * - High-porosity crystalline AI system nodes (Agents, Workflows, CRMs, Databases)
 * - Fine 0.36 voxel resolution with zero-duplicate spatial hash rasterization
 */

export const VOXEL_TYPES = {
  TRUNK: 0,
  ROOT: 1,
  BRANCH_MAIN: 2,
  BRANCH_SUB: 3,
  BRANCH_FIBRIL: 4,
  CANOPY_LEAF: 5,
  GOLD_CORE: 6,
  CIRCUIT_VEIN: 7
};

// Rich Luxury Gold System (Gold bark + Bronze shading + Shimmering Champagne)
const PALETTE = {
  TRUNK: [0.82, 0.66, 0.28],         // Sovereign Gold bark
  TRUNK_DARK: [0.52, 0.40, 0.16],    // Bronze shaded crevices
  ROOT: [0.72, 0.55, 0.24],          // Deep amber gold root conduits
  BRANCH_MAIN: [0.86, 0.70, 0.30],   // Primary metallic gold
  BRANCH_SUB: [0.92, 0.76, 0.35],    // Secondary champagne gold
  BRANCH_FIBRIL: [0.96, 0.82, 0.42], // Delicate neural fibril
  CANOPY_LEAF: [0.94, 0.80, 0.40],   // Crystalline tech foliage
  GOLD_CORE: [1.0, 0.88, 0.36],      // Radiant AI node core
  CIRCUIT_VEIN: [0.98, 0.94, 0.82]   // White-champagne data conduit
};

function pseudoNoise3D(x, y, z) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class TechOrganicTreeGenerator {
  constructor(options = {}) {
    this.voxelSize = options.voxelSize || 0.36; // Fine grid resolution for delicate branches
    this.seed = options.seed || 2026;
    this.rngState = this.seed;
    this.grid = new Map();
    this.clusters = [];
  }

  random() {
    this.rngState = (this.rngState * 9301 + 49297) % 233280;
    return this.rngState / 233280;
  }

  randomRange(min, max) {
    return min + this.random() * (max - min);
  }

  worldToGrid(x, y, z) {
    return [
      Math.round(x / this.voxelSize),
      Math.round(y / this.voxelSize),
      Math.round(z / this.voxelSize)
    ];
  }

  gridToWorld(gx, gy, gz) {
    return [
      gx * this.voxelSize,
      gy * this.voxelSize,
      gz * this.voxelSize
    ];
  }

  addVoxel(x, y, z, type, options = {}) {
    const [gx, gy, gz] = this.worldToGrid(x, y, z);
    const key = `${gx},${gy},${gz}`;
    const [wx, wy, wz] = this.gridToWorld(gx, gy, gz);

    const existing = this.grid.get(key);
    const priority = options.priority !== undefined ? options.priority : 0;
    if (existing && existing.priority >= priority) {
      return;
    }

    const color = options.color ? [...options.color] : this.getDefaultColor(type);
    const emissive = options.emissive ? [...options.emissive] : this.getDefaultEmissive(type);
    const scale = options.scale !== undefined ? options.scale : 1.0;
    const clusterId = options.clusterId !== undefined ? options.clusterId : -1;

    this.grid.set(key, {
      gx, gy, gz,
      x: wx, y: wy, z: wz,
      type,
      priority,
      color,
      emissive,
      scale,
      clusterId,
      isCanopy: type === VOXEL_TYPES.CANOPY_LEAF || type === VOXEL_TYPES.GOLD_CORE,
      isGold: true,
      isCore: type === VOXEL_TYPES.GOLD_CORE
    });
  }

  getDefaultColor(type) {
    switch (type) {
      case VOXEL_TYPES.TRUNK: return [...PALETTE.TRUNK];
      case VOXEL_TYPES.ROOT: return [...PALETTE.ROOT];
      case VOXEL_TYPES.BRANCH_MAIN: return [...PALETTE.BRANCH_MAIN];
      case VOXEL_TYPES.BRANCH_SUB: return [...PALETTE.BRANCH_SUB];
      case VOXEL_TYPES.BRANCH_FIBRIL: return [...PALETTE.BRANCH_FIBRIL];
      case VOXEL_TYPES.CIRCUIT_VEIN: return [...PALETTE.CIRCUIT_VEIN];
      case VOXEL_TYPES.CANOPY_LEAF: return [...PALETTE.CANOPY_LEAF];
      case VOXEL_TYPES.GOLD_CORE: return [...PALETTE.GOLD_CORE];
      default: return [0.85, 0.70, 0.30];
    }
  }

  getDefaultEmissive(type) {
    switch (type) {
      case VOXEL_TYPES.GOLD_CORE: return [1.2, 0.95, 0.38];
      case VOXEL_TYPES.CIRCUIT_VEIN: return [1.0, 0.95, 0.85];
      case VOXEL_TYPES.BRANCH_FIBRIL: return [0.35, 0.28, 0.12];
      case VOXEL_TYPES.CANOPY_LEAF: return [0.22, 0.18, 0.08];
      default: return [0.08, 0.06, 0.02];
    }
  }

  rasterizeDisk(cx, cy, cz, radius, type, priority, isHollow = false) {
    const rSteps = Math.ceil(radius / this.voxelSize);
    for (let ix = -rSteps; ix <= rSteps; ix++) {
      for (let iz = -rSteps; iz <= rSteps; iz++) {
        const distSq = (ix * this.voxelSize) ** 2 + (iz * this.voxelSize) ** 2;
        if (distSq <= radius * radius) {
          if (isHollow && distSq < (radius - this.voxelSize * 1.3) ** 2) continue;

          const isSurface = distSq >= (radius - this.voxelSize * 0.85) ** 2;
          let vType = type;
          let p = priority;
          let color = null;
          let emissive = null;

          // Natural bronze shading in deep crevices / core
          if (!isSurface) {
            color = [...PALETTE.TRUNK_DARK];
          }

          // Shimmering white-gold conduit along surface
          if (isSurface && pseudoNoise3D(cx + ix * 0.6, cy * 0.7, cz + iz * 0.6) > 0.88) {
            vType = VOXEL_TYPES.CIRCUIT_VEIN;
            p = priority + 2;
            color = [...PALETTE.CIRCUIT_VEIN];
            emissive = [1.1, 1.0, 0.85];
          }

          this.addVoxel(
            cx + ix * this.voxelSize,
            cy,
            cz + iz * this.voxelSize,
            vType,
            { priority: p, color, emissive }
          );
        }
      }
    }
  }

  // 1. Central Trunk: Thick base, tapering smoothly to Y=18
  generateTrunk() {
    const yStart = -1.5;
    const yEnd = 18.0;
    const totalHeight = yEnd - yStart;
    const steps = Math.ceil(totalHeight / (this.voxelSize * 0.8));

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const y = yStart + u * totalHeight;

      // Mathematical harmonic S-curve
      const cx = 0.85 * Math.sin(1.1 * Math.PI * u) - 0.35 * Math.sin(2.4 * Math.PI * u);
      const cz = 0.65 * Math.cos(0.9 * Math.PI * u) + 0.30 * Math.sin(1.8 * Math.PI * u);

      // Tapering: 2.2 at base down to 0.95 at top
      let radius = 0.95 + (2.2 - 0.95) * Math.pow(1.0 - u, 0.75);
      if (u < 0.14) {
        radius += Math.pow((0.14 - u) / 0.14, 2.0) * 1.1; // Base buttress flare
      }

      const isHollow = u > 0.16 && radius > 1.25;
      this.rasterizeDisk(cx, y, cz, radius, VOXEL_TYPES.TRUNK, 1, isHollow);
    }
  }

  // 2. Root Network: 6-8 roots spreading into terrain
  generateRoots() {
    const rootCount = Math.floor(this.randomRange(6, 8));
    const flareRadius = 2.4;

    for (let i = 0; i < rootCount; i++) {
      const baseAngle = (i / rootCount) * Math.PI * 2 + this.randomRange(-0.15, 0.15);
      const maxDistance = this.randomRange(11.0, 14.0);
      const rootSteps = 38;

      for (let s = 0; s <= rootSteps; s++) {
        const t = s / rootSteps;
        const angle = baseAngle + 0.28 * Math.sin(2.8 * Math.PI * t);
        const rDist = flareRadius + (maxDistance - flareRadius) * Math.pow(t, 0.85);

        const x = rDist * Math.cos(angle);
        const z = rDist * Math.sin(angle);
        const y = 0.8 * Math.pow(1.0 - t, 1.5) - 1.85 * Math.pow(t, 1.2) + 0.1 * Math.sin(3.5 * Math.PI * t);
        const thickness = 0.75 * Math.pow(1.0 - t, 0.75) + 0.15;

        this.rasterizeDisk(x, y, z, thickness, VOXEL_TYPES.ROOT, 1);
      }
    }
  }

  // 3. Canopy System: Strict branching hierarchy (Primary -> Secondary -> Tertiary -> Fibrils)
  generateCanopySystem() {
    const primaryCount = Math.floor(this.randomRange(7, 9));
    const branchForks = [];
    const clusterTips = [];

    for (let i = 0; i < primaryCount; i++) {
      const u = i / (primaryCount - 1);
      const startY = lerp(12.5, 17.8, u) + this.randomRange(-0.4, 0.4);

      const trunkU = (startY + 1.5) / 19.5;
      const startX = 0.85 * Math.sin(1.1 * Math.PI * trunkU);
      const startZ = 0.65 * Math.cos(0.9 * Math.PI * trunkU);
      const azimuth = i * 2.39996 + this.randomRange(-0.16, 0.16);

      // Primary branch: moderately thick (0.68 -> 0.34)
      const primaryResult = this.traceBranch({
        startX, startY, startZ,
        azimuth,
        elevation: this.randomRange(0.70, 0.88),
        length: this.randomRange(14.0, 18.0),
        startRadius: 0.68,
        endRadius: 0.34,
        type: VOXEL_TYPES.BRANCH_MAIN,
        phototropism: 0.48,
        curvature: 0.25,
        steps: 28
      });

      branchForks.push(primaryResult.midPoint);

      // Secondary branches: substantially thinner (0.30 -> 0.16)
      const secCount = Math.floor(this.randomRange(2, 4));
      for (let s = 0; s < secCount; s++) {
        const splitT = lerp(0.42, 0.86, s / (secCount - 1));
        const splitIdx = Math.floor(splitT * (primaryResult.path.length - 1));
        const splitNode = primaryResult.path[splitIdx];

        const secAzimuth = azimuth + (s % 2 === 0 ? 1 : -1) * this.randomRange(0.55, 0.85);
        const secResult = this.traceBranch({
          startX: splitNode.x,
          startY: splitNode.y,
          startZ: splitNode.z,
          azimuth: secAzimuth,
          elevation: this.randomRange(0.72, 0.95),
          length: this.randomRange(8.0, 11.5),
          startRadius: 0.30,
          endRadius: 0.16,
          type: VOXEL_TYPES.BRANCH_SUB,
          phototropism: 0.65,
          curvature: 0.32,
          steps: 20
        });

        branchForks.push(secResult.midPoint);

        // Tertiary twigs: very thin (0.15 -> 0.08) — single/double voxel path
        const tertCount = 2;
        for (let tr = 0; tr < tertCount; tr++) {
          const tertSplitIdx = Math.floor(lerp(0.5, 0.9, tr) * (secResult.path.length - 1));
          const tertNode = secResult.path[tertSplitIdx];
          const tertAzimuth = secAzimuth + (tr % 2 === 0 ? 1 : -1) * this.randomRange(0.6, 0.92);

          const tertResult = this.traceBranch({
            startX: tertNode.x,
            startY: tertNode.y,
            startZ: tertNode.z,
            azimuth: tertAzimuth,
            elevation: this.randomRange(0.82, 1.15),
            length: this.randomRange(5.0, 7.5),
            startRadius: 0.15,
            endRadius: 0.08,
            type: VOXEL_TYPES.BRANCH_FIBRIL,
            phototropism: 0.85,
            curvature: 0.40,
            steps: 15
          });

          // Quaternary neural fibril: fine single-voxel extension reaching out
          this.traceFibril(tertResult.tip, tertResult.tipDir, 3.2);

          clusterTips.push({ pos: tertResult.tip });
        }

        clusterTips.push({ pos: secResult.tip });
      }

      clusterTips.push({ pos: primaryResult.tip });
    }

    return { branchForks, clusterTips };
  }

  traceBranch(config) {
    const {
      startX, startY, startZ,
      azimuth, elevation, length,
      startRadius, endRadius,
      type, phototropism, curvature, steps
    } = config;

    const path = [];
    let curX = startX;
    let curY = startY;
    let curZ = startZ;

    let dirX = Math.sin(elevation) * Math.cos(azimuth);
    let dirY = Math.cos(elevation);
    let dirZ = Math.sin(elevation) * Math.sin(azimuth);

    const stepDist = length / steps;
    let midPoint = null;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      path.push({ x: curX, y: curY, z: curZ });

      if (s === Math.floor(steps * 0.5)) {
        midPoint = [curX, curY, curZ];
      }

      const radius = lerp(startRadius, endRadius, t);
      this.rasterizeDisk(curX, curY, curZ, radius, type, 1);

      dirY += phototropism * 0.035 * Math.pow(t, 1.2);
      dirX += curvature * 0.02 * Math.cos(azimuth + Math.PI * 0.5);
      dirZ += curvature * 0.02 * Math.sin(azimuth + Math.PI * 0.5);

      const len = Math.hypot(dirX, dirY, dirZ);
      dirX /= len;
      dirY /= len;
      dirZ /= len;

      curX += dirX * stepDist;
      curY += dirY * stepDist;
      curZ += dirZ * stepDist;
    }

    return {
      path,
      midPoint: midPoint || [curX, curY, curZ],
      tip: [curX, curY, curZ],
      tipDir: [dirX, dirY, dirZ]
    };
  }

  // 4. Delicate Neural Fibrils: Single-voxel fine axons
  traceFibril(startPos, dir, len) {
    const steps = Math.ceil(len / this.voxelSize);
    let [x, y, z] = startPos;
    let [dx, dy, dz] = dir;

    for (let s = 0; s < steps; s++) {
      x += dx * this.voxelSize * 0.9;
      y += (dy + 0.15) * this.voxelSize * 0.9;
      z += dz * this.voxelSize * 0.9;

      this.addVoxel(x, y, z, VOXEL_TYPES.BRANCH_FIBRIL, {
        priority: 2,
        scale: 0.85
      });
    }
  }

  // 5. Crystalline AI System Nodes: Delicate clusters (not heavy chunks)
  generateNodeClusters(branchForks, clusterTips) {
    let clusterId = 0;

    for (let i = 0; i < clusterTips.length; i++) {
      const tip = clusterTips[i];
      const voxelBudget = Math.floor(this.randomRange(180, 260)); // Delicate, porous cluster
      this.buildSemanticCluster({
        center: tip.pos,
        id: clusterId++,
        budget: voxelBudget,
        radius: this.randomRange(2.0, 2.8)
      });
    }

    for (let i = 0; i < branchForks.length; i++) {
      const fork = branchForks[i];
      const voxelBudget = Math.floor(this.randomRange(90, 140));
      this.buildSemanticCluster({
        center: fork,
        id: clusterId++,
        budget: voxelBudget,
        radius: this.randomRange(1.4, 2.0),
        isFork: true
      });
    }
  }

  buildSemanticCluster(config) {
    const { center, id, budget, radius, isFork } = config;
    const [cx, cy, cz] = center;

    this.clusters.push({ id, center: [cx, cy, cz], radius });

    let generated = 0;
    const coreRadius = isFork ? 0.55 : 0.75;

    // Glowing Gold Core
    const coreSteps = Math.ceil(coreRadius / this.voxelSize);
    for (let ix = -coreSteps; ix <= coreSteps; ix++) {
      for (let iy = -coreSteps; iy <= coreSteps; iy++) {
        for (let iz = -coreSteps; iz <= coreSteps; iz++) {
          const d = Math.hypot(ix, iy, iz) * this.voxelSize;
          if (d <= coreRadius) {
            this.addVoxel(
              cx + ix * this.voxelSize,
              cy + iy * this.voxelSize,
              cz + iz * this.voxelSize,
              VOXEL_TYPES.GOLD_CORE,
              {
                priority: 10,
                clusterId: id,
                scale: 1.05
              }
            );
            generated++;
          }
        }
      }
    }

    // High-porosity crystalline lattice around core
    const shellSteps = Math.ceil(radius / this.voxelSize);
    const stepSize = this.voxelSize;

    for (let ix = -shellSteps; ix <= shellSteps && generated < budget; ix++) {
      for (let iy = -shellSteps; iy <= shellSteps && generated < budget; iy++) {
        for (let iz = -shellSteps; iz <= shellSteps && generated < budget; iz++) {
          const distEuclid = Math.hypot(ix, iy, iz) * stepSize;
          const distManhattan = (Math.abs(ix) + Math.abs(iy) + Math.abs(iz)) * stepSize;
          const hybridDist = distEuclid * 0.65 + distManhattan * 0.35;

          if (hybridDist > coreRadius && hybridDist <= radius) {
            const noise = pseudoNoise3D(cx + ix * 0.75, cy + iy * 0.75, cz + iz * 0.75);
            // High porosity: creates airy crystalline constellation
            const lattice = ((ix + iy + iz) % 2 === 0) && noise > 0.46;

            if (lattice) {
              this.addVoxel(
                cx + ix * stepSize,
                cy + iy * stepSize,
                cz + iz * stepSize,
                VOXEL_TYPES.CANOPY_LEAF,
                {
                  priority: 3,
                  clusterId: id,
                  scale: 0.88
                }
              );
              generated++;
            }
          }
        }
      }
    }
  }

  generate() {
    this.grid.clear();
    this.clusters = [];
    this.rngState = this.seed;

    this.generateTrunk();
    this.generateRoots();
    const { branchForks, clusterTips } = this.generateCanopySystem();
    this.generateNodeClusters(branchForks, clusterTips);

    const count = this.grid.size;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const emissives = new Float32Array(count * 3);
    const types = new Uint8Array(count);
    const scales = new Float32Array(count);
    const clusterIds = new Int16Array(count);
    const flags = new Uint8Array(count);

    let i = 0;
    for (const voxel of this.grid.values()) {
      const idx3 = i * 3;
      positions[idx3 + 0] = voxel.x;
      positions[idx3 + 1] = voxel.y;
      positions[idx3 + 2] = voxel.z;

      colors[idx3 + 0] = voxel.color[0];
      colors[idx3 + 1] = voxel.color[1];
      colors[idx3 + 2] = voxel.color[2];

      emissives[idx3 + 0] = voxel.emissive[0];
      emissives[idx3 + 1] = voxel.emissive[1];
      emissives[idx3 + 2] = voxel.emissive[2];

      types[i] = voxel.type;
      scales[i] = voxel.scale;
      clusterIds[i] = voxel.clusterId;

      let flagMask = 0;
      if (voxel.isCanopy) flagMask |= 1;
      if (voxel.isGold) flagMask |= 2;
      if (voxel.isCore) flagMask |= 4;
      flags[i] = flagMask;

      i++;
    }

    return {
      voxelCount: count,
      voxelSize: this.voxelSize,
      positions,
      colors,
      emissives,
      types,
      scales,
      clusterIds,
      flags,
      clusters: this.clusters
    };
  }
}
