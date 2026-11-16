import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { APEX_NAME, APEX_U, GALAXIES, galaxyCenterU } from '../lib/starRace';
import { unlockedUpgradeIds } from '../lib/shipUpgrades';

const SPACE = 0x03040a;
const MAX_LABELS = 8;
const GALAXY_RADIUS = 26;

const ROUTE_POINTS = [
  [-120, 0, 12], [-60, 0, 0], [0, 10, -32], [60, 0, 0], [112, 8, 14],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));

// Gerador determinístico: o céu é o mesmo a cada visita.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function gaussian(rand) {
  return (rand() + rand() + rand() + rand() - 2) / 2;
}

// Ponto de luz macio, usado em estrelas, brilhos e rastros.
function glowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,.75)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,.18)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowSprite(texture, color, scale, opacity) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sprite.scale.setScalar(scale);
  return sprite;
}

function pointCloud(positions, colors, texture, size, opacity) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    size, map: texture, vertexColors: true, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
}

function buildStars(texture) {
  const rand = seeded(7);
  const palette = [0xffffff, 0xcfd8ff, 0xffe9c4, 0xa9c4ff].map((hex) => new THREE.Color(hex));
  const positions = [];
  const colors = [];
  for (let i = 0; i < 5200; i += 1) {
    const dir = new THREE.Vector3(gaussian(rand), gaussian(rand) * 0.7, gaussian(rand)).normalize();
    dir.multiplyScalar(260 + rand() * 340);
    positions.push(dir.x, dir.y, dir.z);
    const c = palette[Math.floor(rand() * palette.length)].clone().multiplyScalar(0.45 + rand() * 0.55);
    colors.push(c.r, c.g, c.b);
  }
  return pointCloud(positions, colors, texture, 2.4, 0.85);
}

function buildGalaxy(color, seed, texture) {
  const rand = seeded(seed);
  const tint = new THREE.Color(color);
  const core = new THREE.Color(0xfff4e0);
  const edge = tint.clone().multiplyScalar(0.45);
  const positions = [];
  const colors = [];
  const arms = 2;

  // Braços espirais
  for (let i = 0; i < 11000; i += 1) {
    const r = Math.pow(rand(), 0.62) * GALAXY_RADIUS;
    const k = r / GALAXY_RADIUS;
    const spread = 0.9 + k * 2.6;
    const angle = (i % arms) * ((Math.PI * 2) / arms) + r * 0.2;
    positions.push(
      Math.cos(angle) * r + gaussian(rand) * spread,
      gaussian(rand) * (1.3 - k) * 1.6,
      Math.sin(angle) * r + gaussian(rand) * spread,
    );
    const c = k < 0.3
      ? core.clone().lerp(tint, k / 0.3)
      : tint.clone().lerp(edge, (k - 0.3) / 0.7);
    c.multiplyScalar(0.55 + rand() * 0.45);
    colors.push(c.r, c.g, c.b);
  }
  // Bojo central
  for (let i = 0; i < 2400; i += 1) {
    const r = Math.pow(rand(), 1.6) * GALAXY_RADIUS * 0.3;
    const dir = new THREE.Vector3(gaussian(rand), gaussian(rand) * 0.6, gaussian(rand)).normalize();
    positions.push(dir.x * r, dir.y * r, dir.z * r);
    const c = core.clone().lerp(tint, Math.min(1, r / (GALAXY_RADIUS * 0.3)) * 0.6);
    colors.push(c.r, c.g, c.b);
  }

  const group = new THREE.Group();
  const disc = new THREE.Group(); // gira sobre o próprio eixo, já inclinado
  disc.add(pointCloud(positions, colors, texture, 0.7, 0.42));
  disc.add(glowSprite(texture, 0xfff1d6, 8, 0.7));
  disc.add(glowSprite(texture, tint, 30, 0.22));
  group.add(disc);
  group.userData = { disc };
  return group;
}

function buildApex(texture) {
  const group = new THREE.Group();
  const star = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 1),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4 }),
  );
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.85 });
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.07, 8, 96), ringMaterial);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(9, 0.05, 8, 96), ringMaterial);
  ringA.rotation.x = Math.PI / 2.3;
  ringB.rotation.set(Math.PI / 1.8, 0.5, 0);
  group.add(star, ringA, ringB);
  group.add(glowSprite(texture, 0xfff3c4, 20, 1));
  group.add(glowSprite(texture, 0xff9a3d, 40, 0.3));
  group.add(glowSprite(texture, 0xff6a00, 90, 0.07));
  const light = new THREE.PointLight(0xffc27a, 900, 90);
  group.add(light);
  group.userData = { ringA, ringB };
  return group;
}

// ── Naves ────────────────────────────────────────────────────
// Quatro classes, uma por patente. São modeladas "em pé" (nariz em +Y) e
// deitadas no fim, para o nariz apontar para +Z (direção do voo).

/** Corpo de foguete: cilindro com nariz em ogiva, torneado. */
function rocketBody(radius, bottom, top, noseLength, material) {
  const points = [new THREE.Vector2(0, bottom), new THREE.Vector2(radius, bottom), new THREE.Vector2(radius, top)];
  const steps = 10;
  for (let i = 1; i <= steps; i += 1) {
    const k = i / steps;
    points.push(new THREE.Vector2(radius * Math.cos(k * Math.PI / 2) ** 0.8, top + noseLength * Math.sin(k * Math.PI / 2)));
  }
  return new THREE.Mesh(new THREE.LatheGeometry(points, 32), material);
}

function band(radius, y, height, material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, height, 32, 1, true), material);
  mesh.position.y = y;
  return mesh;
}

function engineBell(radius, y, material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius, radius * 1.5, 20, 1, true), material);
  mesh.position.y = y - radius * 0.75;
  return mesh;
}

/** Aleta de aço (nave das classes 3 e 4), presa na lateral do casco. */
function flap(width, height, x, y, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.04), material);
  mesh.position.set(x, y, 0);
  return mesh;
}

function buildShip(racer, texture) {
  const isCurrentUser = Boolean(racer.isCurrentUser);
  const shipClass = racer.rank?.shipClass ?? 1;
  const upgrades = new Set(unlockedUpgradeIds(racer.modulesCompleted));
  const accent = isCurrentUser ? 0xff6a00 : 0x9aa3b5;

  const white = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, metalness: 0.35, roughness: 0.42 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 0.55, roughness: 0.32, emissive: 0x2a2f3a, emissiveIntensity: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x14171d, metalness: 0.5, roughness: 0.6, side: THREE.DoubleSide });
  const trim = new THREE.MeshStandardMaterial({
    color: accent, metalness: 0.6, roughness: 0.35, emissive: accent, emissiveIntensity: isCurrentUser ? 0.55 : 0.05,
  });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9ae4f, metalness: 0.9, roughness: 0.25, emissive: 0x6b4a10, emissiveIntensity: 0.35 });

  const rocket = new THREE.Group();
  // Medidas que os acessórios usam para se encaixar em qualquer classe.
  let spec;

  if (shipClass === 1 || shipClass === 2) {
    const r = 0.24;
    spec = { r, bottom: -1.6, top: 1.0, tip: 1.95, outer: r, finY: 0.55, engineYs: [[0, 0]] };
    rocket.add(rocketBody(r, -1.6, 0.35, 0, white));          // primeiro estágio
    rocket.add(band(r, 0.43, 0.2, dark));                      // interestágio
    rocket.add(rocketBody(r, 0.5, 1.0, 0, white));             // segundo estágio
    rocket.add(rocketBody(r * 1.22, 1.0, 1.35, 0.6, white));   // coifa
    rocket.add(band(r, -0.6, 0.06, trim), band(r * 1.22, 1.1, 0.05, trim));
    rocket.add(engineBell(r * 0.8, -1.6, dark));
    if (shipClass === 2) {
      // Dois propulsores laterais, com nariz próprio.
      for (const side of [-1, 1]) {
        const booster = new THREE.Group();
        booster.add(rocketBody(r, -1.6, 0.1, 0.5, white), band(r, -0.6, 0.06, trim), engineBell(r * 0.8, -1.6, dark));
        booster.position.x = side * r * 2.08;
        rocket.add(booster);
        const strut = new THREE.Mesh(new THREE.BoxGeometry(r * 0.4, 0.05, 0.05), dark);
        strut.position.set(side * r * 1.04, -0.2, 0);
        rocket.add(strut, strut.clone().translateY(-1.0));
      }
      spec.outer = r * 3.08;
      spec.engineYs = [[0, 0], [-r * 2.08, 0], [r * 2.08, 0]];
    }
  } else {
    const r = 0.34;
    const hasBooster = shipClass === 4;
    const shipBottom = hasBooster ? -0.35 : -1.5;
    const top = hasBooster ? 1.45 : 0.85;
    const bottom = hasBooster ? -2.5 : -1.5;
    spec = { r, bottom, top, tip: top + 0.95, outer: r, finY: hasBooster ? -0.6 : top - 0.25, engineYs: [[0, 0]] };
    rocket.add(rocketBody(r, shipBottom, top, 0.95, steel));
    // Aletas: duas pequenas perto do nariz, duas grandes na base da nave.
    for (const side of [-1, 1]) {
      rocket.add(flap(0.3, 0.42, side * (r + 0.13), top + 0.12, dark));
      rocket.add(flap(0.46, 0.7, side * (r + 0.21), shipBottom + 0.4, dark));
    }
    rocket.add(band(r, top - 0.1, 0.05, trim));
    if (hasBooster) {
      rocket.add(rocketBody(r, -2.5, -0.45, 0, steel));       // propulsor
      rocket.add(band(r, -0.4, 0.14, dark));                   // anel de separação
      rocket.add(band(r, -1.4, 0.05, trim), band(r, -2.3, 0.3, dark));
    }
    rocket.add(engineBell(r * 0.9, bottom, dark));
    // Janelas da cabine, no dorso.
    const glass = new THREE.MeshStandardMaterial({ color: 0x0c1830, metalness: 0.9, roughness: 0.1, emissive: 0x1d4f8f, emissiveIntensity: 0.6 });
    const windowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), glass);
    windowMesh.scale.set(1.6, 1, 0.5);
    windowMesh.position.set(0, top + 0.3, -r * 0.82);
    rocket.add(windowMesh);
  }

  // ── Acessórios (um a cada conjunto de módulos concluídos) ──
  const { r, bottom, top, tip, outer, finY } = spec;
  if (upgrades.has('antenna')) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), dark);
    mast.rotation.x = Math.PI / 2;
    mast.position.set(0, top - 0.35, -(r + 0.2));
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), white);
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0, top - 0.35, -(r + 0.3));
    rocket.add(mast, dish);
  }
  if (upgrades.has('gridfins')) {
    for (let i = 0; i < 4; i += 1) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.2), dark);
      const angle = Math.PI / 4 + i * Math.PI / 2;
      fin.position.set(Math.cos(angle) * (r + 0.11), finY, Math.sin(angle) * (r + 0.11));
      fin.rotation.y = -angle;
      rocket.add(fin);
    }
  }
  if (upgrades.has('legs')) {
    for (let i = 0; i < 4; i += 1) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.07), dark);
      const angle = Math.PI / 4 + i * Math.PI / 2;
      leg.position.set(Math.cos(angle) * (r + 0.12), bottom + 0.2, Math.sin(angle) * (r + 0.12));
      leg.rotation.y = -angle;
      leg.rotation.z = -0.38;
      rocket.add(leg);
    }
  }
  if (upgrades.has('solar')) {
    const cell = new THREE.MeshStandardMaterial({ color: 0x10244d, metalness: 0.8, roughness: 0.3, emissive: 0x16357a, emissiveIntensity: 0.5 });
    const y = (bottom + top) / 2 + 0.2;
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.34, 0.02), cell);
      panel.position.set(side * (outer + 0.5), y, 0);
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), dark);
      strut.position.set(side * (outer + 0.07), y, 0);
      rocket.add(panel, strut);
    }
  }
  if (upgrades.has('shield')) {
    // Meia-casca escura no ventre.
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 1.035, r * 1.035, top - bottom - 0.3, 24, 1, true, -Math.PI / 2, Math.PI), dark,
    );
    shell.position.y = (bottom + top) / 2 + 0.1;
    rocket.add(shell);
  }
  if (upgrades.has('engines')) {
    for (let i = 0; i < 3; i += 1) {
      const angle = i * Math.PI * 2 / 3;
      const bell = engineBell(r * 0.38, bottom, dark);
      bell.position.x = Math.cos(angle) * r * 0.62;
      bell.position.z = Math.sin(angle) * r * 0.62;
      rocket.add(bell);
    }
  }
  if (upgrades.has('lights')) {
    const lights = [[0xff3b3b, -(outer + 0.03), 0], [0x3bff7a, outer + 0.03, 0]];
    for (const [color, x] of lights) {
      const light = glowSprite(texture, color, 0.5, 0.95);
      light.position.set(x, bottom + 0.9, 0);
      rocket.add(light);
    }
    const noseLight = glowSprite(texture, 0xffffff, 0.45, 0.9);
    noseLight.position.y = tip + 0.02;
    rocket.add(noseLight);
  }
  if (upgrades.has('command') || shipClass === 4) {
    // Faixas douradas: acabamento de comando (e marca da patente Master).
    rocket.add(band(r, top - 0.22, 0.07, gold), band(r, bottom + 0.55, 0.07, gold));
  }

  // Propulsão: um jato por motor principal.
  const engineColor = isCurrentUser ? 0xffb347 : 0xdfe9ff;
  const boost = upgrades.has('engines') ? 1.35 : 1;
  const engineSize = (shipClass >= 3 ? 2.2 : 1.7) * boost;
  const trails = [];
  const engines = [];
  for (const [x] of spec.engineYs) {
    const trail = new THREE.Mesh(
      new THREE.ConeGeometry(r * 0.75 * boost, 4.5, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: engineColor, transparent: true, opacity: 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    trail.rotation.z = Math.PI; // ponta para trás
    trail.position.set(x, bottom - 2.5, 0);
    const engine = glowSprite(texture, engineColor, engineSize, 0.9);
    engine.position.set(x, bottom - 0.35, 0);
    rocket.add(trail, engine);
    trails.push(trail);
    engines.push(engine);
  }

  rocket.rotation.x = Math.PI / 2; // deita: nariz para +Z
  if (shipClass === 4) rocket.scale.setScalar(0.85);

  const group = new THREE.Group();
  group.add(rocket);
  group.userData = { trails, engines, engineSize };

  if (isCurrentUser) {
    group.scale.setScalar(1.6);
    group.add(glowSprite(texture, 0xff6a00, 5, 0.12));
  }
  return group;
}

function hasWebGL() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

function makeLabel(text, variant) {
  const el = document.createElement('div');
  el.textContent = text;
  const base = {
    position: 'absolute', left: '0', top: '0', pointerEvents: 'none', whiteSpace: 'nowrap',
    fontFamily: 'Space Grotesk, sans-serif', willChange: 'transform',
  };
  const tag = {
    fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '.14em',
    textTransform: 'uppercase', padding: '3px 7px',
  };
  const variants = {
    me: { ...tag, fontWeight: '700', background: '#ff6a00', color: '#140800' },
    racer: {
      ...tag, background: 'rgba(5,7,13,.7)', color: '#d7dcea',
      border: '1px solid rgba(255,255,255,.22)',
    },
    galaxy: {
      fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: '700', letterSpacing: '.28em',
      textTransform: 'uppercase', color: 'rgba(240,244,255,.9)', textShadow: '0 1px 10px rgba(0,0,0,.9)',
    },
  };
  Object.assign(el.style, base, variants[variant]);
  return el;
}

/**
 * Cenário 3D da Corrida Estelar. Só desenha: os dados chegam prontos em `racers`
 * (ver buildRacers em lib/starRace.js). Decorativo para leitores de tela — a
 * posição do aluno é descrita em texto pela página.
 */
export default function StarRace({ racers = [] }) {
  const mountRef = useRef(null);
  const overlayRef = useRef(null);
  const apiRef = useRef(null);
  const [supported] = useState(hasWebGL);

  useEffect(() => {
    const mount = mountRef.current;
    const overlay = overlayRef.current;
    if (!supported || !mount || !overlay) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      return undefined; // sem WebGL de fato: fica só o fundo, o resto da página segue
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(SPACE);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
    canvas.setAttribute('aria-hidden', 'true');
    mount.appendChild(canvas);

    const texture = glowTexture();
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1030, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(40, 80, 60);
    scene.add(sun);
    scene.add(buildStars(texture));

    // Névoas distantes, para o fundo não ser preto chapado.
    [[-260, 60, -320, 0x3b5bdb, 420], [280, -40, -300, 0x4a5a8a, 460]]
      .forEach(([x, y, z, color, scale]) => {
        const haze = glowSprite(texture, color, scale, 0.045);
        haze.position.set(x, y, z);
        scene.add(haze);
      });

    const route = new THREE.CatmullRomCurve3(ROUTE_POINTS);
    scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(route, 320, 0.09, 8),
      new THREE.MeshBasicMaterial({ color: 0x8ea2ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }),
    ));

    const labels = [];
    const addLabel = (text, variant, anchor, lift) => {
      const el = makeLabel(text, variant);
      overlay.appendChild(el);
      labels.push({ el, anchor, lift });
    };

    const galaxies = GALAXIES.map((galaxy, index) => {
      const group = buildGalaxy(galaxy.color, 11 + index * 17, texture);
      // O disco fica abaixo da rota: as naves sobrevoam a galáxia em vez de atravessar o núcleo.
      group.position.copy(route.getPointAt(galaxyCenterU(index))).add(new THREE.Vector3(0, -9, -4));
      group.rotation.set(0.62 + index * 0.08, 0, 0.22 * (index - 1));
      scene.add(group);
      addLabel(galaxy.name, 'galaxy', group.position, 26);
      return group;
    });

    const apex = buildApex(texture);
    apex.position.copy(route.getPointAt(APEX_U)).add(new THREE.Vector3(6, 3, 0));
    scene.add(apex);
    addLabel(APEX_NAME, 'galaxy', apex.position, 13);

    // Naves: cada uma na sua posição da rota, em "faixas" ao redor dela
    // para que alunos com o mesmo progresso não fiquem sobrepostos.
    const up = new THREE.Vector3(0, 1, 0);
    let myShip = null;
    let myU = 0;
    let labelCount = 0;
    const ships = racers.map((racer, index) => {
      const u = THREE.MathUtils.clamp(racer.position.u, 0.02, 0.98);
      const center = route.getPointAt(u);
      const tangent = route.getTangentAt(u);
      const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const lift = new THREE.Vector3().crossVectors(side, tangent).normalize();
      const lane = racer.isCurrentUser ? 0 : 3.2 + (index % 5) * 1.8;
      const angle = index * 2.399963;
      const ship = buildShip(racer, texture);
      ship.position.copy(center)
        .addScaledVector(side, Math.cos(angle) * lane)
        .addScaledVector(lift, Math.sin(angle) * lane * 0.6);
      // Quem chegou ao ápice estaciona ao redor da estrela.
      if (racer.position.certified) {
        ship.position.copy(apex.position).add(new THREE.Vector3(Math.cos(angle) * 12, Math.sin(angle) * 4, Math.sin(angle) * 12));
      }
      ship.lookAt(ship.position.clone().add(tangent));
      ship.userData.base = ship.position.clone();
      ship.userData.phase = index * 1.3;
      scene.add(ship);

      if (racer.isCurrentUser) {
        myShip = ship;
        myU = u;
        addLabel(`VOCÊ ${'★'.repeat(racer.rank?.stars ?? 1)}`, 'me', ship.position, 4.2);
      } else if (labelCount < MAX_LABELS) {
        labelCount += 1;
        addLabel(`${racer.name} ${'★'.repeat(racer.rank?.stars ?? 1)}`, 'racer', ship.position, 2.4);
      }
      return ship;
    });

    // Trecho já percorrido pelo aluno, aceso em laranja.
    if (myShip && myU > 0.03) {
      const traveled = new THREE.CatmullRomCurve3(
        Array.from({ length: 80 }, (_, i) => route.getPointAt(0.02 + ((myU - 0.02) * i) / 79)),
      );
      scene.add(new THREE.Mesh(
        new THREE.TubeGeometry(traveled, 200, 0.08, 8),
        new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
      ));
    }

    const camera = new THREE.PerspectiveCamera(48, 1, 0.3, 1600);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 9;
    controls.maxDistance = 520;

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.78);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // Em telas estreitas a câmera recua para a rota inteira caber.
    function overviewView() {
      const target = new THREE.Vector3(8, -2, -10);
      const reach = Math.max(1, 1.75 / camera.aspect);
      return { position: target.clone().add(new THREE.Vector3(0, 105, 185).multiplyScalar(reach)), target };
    }
    function shipView() {
      if (!myShip) return overviewView();
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(myShip.quaternion);
      return {
        position: myShip.userData.base.clone().addScaledVector(forward, -19).add(new THREE.Vector3(7, 8, 5)),
        target: myShip.userData.base.clone().addScaledVector(forward, 10),
      };
    }
    let flight = null; // transição de câmera em andamento
    function flyTo(view, instant = false) {
      if (instant) {
        camera.position.copy(view.position);
        controls.target.copy(view.target);
        flight = null;
        return;
      }
      flight = { ...view };
    }
    const size = new THREE.Vector2(1, 1);
    function resize() {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      size.set(width, height);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    resize();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    observer?.observe(mount);

    flyTo(shipView(), true);
    apiRef.current = { showShip: () => flyTo(shipView()), showAll: () => flyTo(overviewView()) };
    controls.addEventListener('start', () => { flight = null; });

    const projected = new THREE.Vector3();
    function placeLabels() {
      for (const { el, anchor, lift } of labels) {
        projected.copy(anchor);
        projected.y += lift;
        projected.project(camera);
        const visible = projected.z < 1 && Math.abs(projected.x) < 1.05 && Math.abs(projected.y) < 1.05;
        el.style.display = visible ? 'block' : 'none';
        if (!visible) continue;
        const x = (projected.x * 0.5 + 0.5) * size.x;
        const y = (-projected.y * 0.5 + 0.5) * size.y;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      }
    }

    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const clock = new THREE.Clock();
    let frame = 0;
    function tick() {
      frame = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      if (!calm) {
        galaxies.forEach((galaxy, index) => { galaxy.userData.disc.rotation.y = t * (0.035 + index * 0.008); });
        apex.userData.ringA.rotation.z = t * 0.35;
        apex.userData.ringB.rotation.z = -t * 0.22;
        ships.forEach((ship) => {
          const { base, phase, trails, engines, engineSize } = ship.userData;
          ship.position.y = base.y + Math.sin(t * 1.3 + phase) * 0.28;
          const pulse = 0.85 + Math.sin(t * 11 + phase) * 0.15;
          trails.forEach((trail) => trail.scale.set(1, pulse, 1));
          engines.forEach((engine) => engine.scale.setScalar(engineSize * pulse));
        });
      }
      if (flight) {
        camera.position.lerp(flight.position, 0.06);
        controls.target.lerp(flight.target, 0.06);
        if (camera.position.distanceTo(flight.position) < 0.4) flight = null;
      }
      controls.update();
      composer.render();
      placeLabels();
    }
    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      controls.dispose();
      apiRef.current = null;
      scene.traverse((node) => {
        const object = /** @type {THREE.Mesh} */ (node);
        object.geometry?.dispose?.();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose?.();
      });
      texture.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      canvas.remove();
      labels.forEach(({ el }) => el.remove());
    };
  }, [racers, supported]);

  if (!supported) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center', color: '#c8d0e4', background: '#03040a', borderRadius: '16px', fontSize: '.95rem' }}>
        Seu navegador não conseguiu abrir o cenário 3D. Sua posição e o ranking seguem logo abaixo.
      </div>
    );
  }

  const hudButton = {
    fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: 700,
    letterSpacing: '.16em', textTransform: 'uppercase',
    padding: '9px 14px', cursor: 'pointer', borderRadius: 0,
    background: 'rgba(5,7,13,.65)', color: '#f2f4f8',
    border: '1px solid rgba(255,255,255,.35)',
  };

  return (
    <div style={{
      position: 'relative', height: 'min(66vh, 580px)', minHeight: '340px',
      background: '#03040a', overflow: 'hidden',
    }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'none' }} />
      {/* Escurece as bordas para dar profundidade */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)' }} />
      <div ref={overlayRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '16px', bottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" style={hudButton} onClick={() => apiRef.current?.showShip()}>Minha nave</button>
        <button type="button" style={hudButton} onClick={() => apiRef.current?.showAll()}>Ver a rota inteira</button>
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', right: '16px', bottom: '20px', fontFamily: 'Space Mono, monospace', fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(220,228,245,.5)' }}>
        Arraste para girar · role para aproximar
      </div>
    </div>
  );
}
