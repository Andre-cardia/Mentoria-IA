import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { APEX_NAME, APEX_U, GALAXIES, galaxyCenterU } from '../lib/starRace';

// Cada pixel do cenário ocupa PIXEL × PIXEL pixels de tela: é isso, junto com
// `image-rendering: pixelated`, que dá o visual de jogo retrô.
const PIXEL = 3;
const SPACE = 0x05060d;
const MAX_LABELS = 6;

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

function buildStars() {
  const rand = seeded(7);
  const positions = [];
  for (let i = 0; i < 1400; i += 1) {
    const dir = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    dir.multiplyScalar(220 + rand() * 160);
    positions.push(dir.x, dir.y, dir.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.6, sizeAttenuation: false }));
}

function buildGalaxy(color, seed) {
  const rand = seeded(seed);
  const tint = new THREE.Color(color);
  const white = new THREE.Color(0xffffff);
  const positions = [];
  const colors = [];
  const radius = 24;
  for (let i = 0; i < 1600; i += 1) {
    const r = Math.pow(rand(), 0.7) * radius;
    const angle = r * 0.22 + (i % 3) * ((Math.PI * 2) / 3) + (rand() - 0.5) * 0.7;
    const thickness = (1 - r / radius) * 4 + 0.6;
    positions.push(Math.cos(angle) * r, (rand() - 0.5) * thickness, Math.sin(angle) * r);
    const c = white.clone().lerp(tint, Math.min(1, r / (radius * 0.25)));
    colors.push(c.r, c.g, c.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 2, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.85, depthWrite: false,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })));
  return group;
}

function buildApex() {
  const group = new THREE.Group();
  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(4.5, 0),
    new THREE.MeshBasicMaterial({ color: 0xffd34d }),
  );
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(8, 0.35, 4, 24),
    new THREE.MeshBasicMaterial({ color: 0xff8a3d }),
  );
  halo.rotation.x = Math.PI / 2.4;
  group.add(star, halo);
  group.userData = { star, halo };
  return group;
}

function buildShip(isCurrentUser) {
  const body = new THREE.MeshLambertMaterial({ color: isCurrentUser ? 0xff6a00 : 0xb8c2d6, flatShading: true });
  const dark = new THREE.MeshLambertMaterial({ color: isCurrentUser ? 0x7a2e00 : 0x55607a, flatShading: true });
  const group = new THREE.Group();

  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 4), body);
  hull.rotation.x = Math.PI / 2; // ponta para +Z, a direção do voo

  const wings = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 0.9), dark);
  wings.position.z = -0.7;

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.8), dark);
  fin.position.set(0, 0.4, -0.8);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 1.4, 4),
    new THREE.MeshBasicMaterial({ color: isCurrentUser ? 0xffd34d : 0x7dd3fc }),
  );
  flame.rotation.x = -Math.PI / 2;
  flame.position.z = -1.9;

  group.add(hull, wings, fin, flame);
  group.userData = { flame };
  if (isCurrentUser) group.scale.setScalar(1.7);
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
  const palette = {
    me:     ['#ff6a00', '#1a0a00'],
    racer:  ['rgba(10,14,28,.85)', '#e5eaf5'],
    galaxy: ['transparent', '#e5eaf5'],
  }[variant];
  Object.assign(el.style, {
    position: 'absolute', left: '0', top: '0', pointerEvents: 'none', whiteSpace: 'nowrap',
    fontFamily: 'Space Mono, monospace', fontWeight: '700',
    fontSize: variant === 'galaxy' ? '11px' : '10px',
    letterSpacing: variant === 'galaxy' ? '.12em' : '0',
    textTransform: variant === 'galaxy' ? 'uppercase' : 'none',
    padding: variant === 'galaxy' ? '0' : '2px 6px',
    background: palette[0], color: palette[1],
    textShadow: variant === 'galaxy' ? '0 0 6px #000, 0 0 2px #000' : 'none',
    willChange: 'transform',
  });
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
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    } catch {
      return undefined; // sem WebGL de fato: fica só o fundo, o resto da página segue
    }
    renderer.setPixelRatio(1);
    renderer.setClearColor(SPACE);
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' });
    canvas.setAttribute('aria-hidden', 'true');
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(40, 80, 60);
    scene.add(sun);
    scene.add(buildStars());

    const route = new THREE.CatmullRomCurve3(ROUTE_POINTS);
    const routeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route.getSpacedPoints(160)),
      new THREE.LineDashedMaterial({ color: 0x6b7aa8, dashSize: 2.5, gapSize: 2, transparent: true, opacity: 0.7 }),
    );
    routeLine.computeLineDistances();
    scene.add(routeLine);

    const labels = [];
    const addLabel = (text, variant, anchor, lift) => {
      const el = makeLabel(text, variant);
      overlay.appendChild(el);
      labels.push({ el, anchor, lift });
    };

    const galaxies = GALAXIES.map((galaxy, index) => {
      const group = buildGalaxy(galaxy.color, 11 + index * 17);
      group.position.copy(route.getPointAt(galaxyCenterU(index)));
      group.rotation.set(0.5 - index * 0.35, 0, 0.25 * (index - 1));
      scene.add(group);
      addLabel(galaxy.name, 'galaxy', group.position, 20);
      return group;
    });

    const apex = buildApex();
    apex.position.copy(route.getPointAt(APEX_U)).add(new THREE.Vector3(6, 3, 0));
    scene.add(apex);
    addLabel(APEX_NAME, 'galaxy', apex.position, 11);

    // Naves: cada uma na sua posição da rota, em "faixas" ao redor dela
    // para que alunos com o mesmo progresso não fiquem sobrepostos.
    const up = new THREE.Vector3(0, 1, 0);
    let myShip = null;
    let labelCount = 0;
    const ships = racers.map((racer, index) => {
      const u = THREE.MathUtils.clamp(racer.position.u, 0.02, 0.98);
      const center = route.getPointAt(u);
      const tangent = route.getTangentAt(u);
      const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const lift = new THREE.Vector3().crossVectors(side, tangent).normalize();
      const lane = racer.isCurrentUser ? 0 : 3 + (index % 5) * 1.7;
      const angle = index * 2.399963;
      const ship = buildShip(racer.isCurrentUser);
      ship.position.copy(center)
        .addScaledVector(side, Math.cos(angle) * lane)
        .addScaledVector(lift, Math.sin(angle) * lane);
      // Quem chegou ao ápice estaciona ao redor da estrela.
      if (racer.position.certified) ship.position.copy(apex.position).add(new THREE.Vector3(Math.cos(angle) * 11, Math.sin(angle) * 4, Math.sin(angle) * 11));
      ship.lookAt(ship.position.clone().add(tangent));
      ship.userData.baseY = ship.position.y;
      ship.userData.phase = index * 1.3;
      scene.add(ship);

      if (racer.isCurrentUser) {
        myShip = ship;
        addLabel('VOCÊ', 'me', ship.position, 3.4);
      } else if (labelCount < MAX_LABELS) {
        labelCount += 1;
        addLabel(racer.name, 'racer', ship.position, 3);
      }
      return ship;
    });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 900);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 12;
    controls.maxDistance = 260;

    const overview = { position: new THREE.Vector3(10, 95, 175), target: new THREE.Vector3(10, 2, -8) };
    function shipView() {
      if (!myShip) return overview;
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(myShip.quaternion);
      return {
        position: myShip.position.clone().addScaledVector(forward, -26).add(new THREE.Vector3(10, 13, 6)),
        target: myShip.position.clone().addScaledVector(forward, 8),
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
    flyTo(shipView(), true);
    apiRef.current = { showShip: () => flyTo(shipView()), showAll: () => flyTo(overview) };
    controls.addEventListener('start', () => { flight = null; });

    const size = new THREE.Vector2(1, 1);
    function resize() {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      size.set(width, height);
      renderer.setSize(Math.ceil(width / PIXEL), Math.ceil(height / PIXEL), false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    resize();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    observer?.observe(mount);

    const projected = new THREE.Vector3();
    function placeLabels() {
      for (const { el, anchor, lift } of labels) {
        projected.copy(anchor);
        projected.y += lift;
        projected.project(camera);
        const visible = projected.z < 1 && Math.abs(projected.x) < 1.05 && Math.abs(projected.y) < 1.05;
        el.style.display = visible ? 'block' : 'none';
        if (!visible) continue;
        const x = Math.round((projected.x * 0.5 + 0.5) * size.x);
        const y = Math.round((-projected.y * 0.5 + 0.5) * size.y);
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      }
    }

    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const clock = new THREE.Clock();
    let frame = 0;
    function tick() {
      frame = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      if (!calm) {
        galaxies.forEach((galaxy, index) => { galaxy.rotation.y = t * (0.05 + index * 0.012); });
        apex.userData.star.rotation.y = t * 0.8;
        apex.userData.halo.rotation.z = t * 0.4;
        ships.forEach((ship) => {
          ship.position.y = ship.userData.baseY + Math.sin(t * 1.6 + ship.userData.phase) * 0.35;
          ship.userData.flame.scale.y = 0.7 + Math.abs(Math.sin(t * 9 + ship.userData.phase)) * 0.6;
        });
      }
      if (flight) {
        camera.position.lerp(flight.position, 0.07);
        controls.target.lerp(flight.target, 0.07);
        if (camera.position.distanceTo(flight.position) < 0.4) flight = null;
      }
      controls.update();
      renderer.render(scene, camera);
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
      renderer.dispose();
      canvas.remove();
      labels.forEach(({ el }) => el.remove());
    };
  }, [racers, supported]);

  if (!supported) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center', color: '#c8d0e4', background: '#05060d', borderRadius: '12px', fontSize: '.95rem' }}>
        Seu navegador não conseguiu abrir o cenário 3D. Sua posição e o ranking seguem logo abaixo.
      </div>
    );
  }

  const hudButton = {
    fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '.06em',
    textTransform: 'uppercase', padding: '7px 10px', cursor: 'pointer',
    background: 'rgba(10,14,28,.85)', color: '#e5eaf5', border: '2px solid #6b7aa8', borderRadius: 0,
  };

  return (
    <div style={{ position: 'relative', height: 'min(62vh, 520px)', minHeight: '320px', background: '#05060d', border: '2px solid #1b2340', borderRadius: '12px', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'none' }} />
      <div ref={overlayRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '12px', bottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" style={hudButton} onClick={() => apiRef.current?.showShip()}>Minha nave</button>
        <button type="button" style={hudButton} onClick={() => apiRef.current?.showAll()}>Ver a rota inteira</button>
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', right: '12px', bottom: '14px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#8f9bbd' }}>
        arraste para girar · role para aproximar
      </div>
    </div>
  );
}
