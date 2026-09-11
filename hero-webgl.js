import * as THREE from './three.module.min.js';

const canvas = document.querySelector('#heroWebgl');
const stage = document.querySelector('#stage');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && stage && window.WebGLRenderingContext) {
  let width = stage.clientWidth, height = stage.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 14;

  // Soft round sprite for each particle, drawn once onto a small canvas.
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = spriteCanvas.height = 64;
  const sctx = spriteCanvas.getContext('2d');
  const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,224,170,1)');
  grad.addColorStop(0.4, 'rgba(216,170,98,0.7)');
  grad.addColorStop(1, 'rgba(216,170,98,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);
  const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

  const COUNT = reduceMotion ? 60 : 170;
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    speeds[i] = 0.15 + Math.random() * 0.35;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.42,
    map: spriteTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let targetRotX = 0, targetRotY = 0;
  stage.addEventListener('pointermove', (e) => {
    if (reduceMotion) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    targetRotY = x * 0.35;
    targetRotX = y * -0.2;
  });

  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', resize);
  resize();

  const posAttr = geometry.attributes.position;
  const clock = new THREE.Clock();

  function renderStatic() {
    renderer.render(scene, camera);
  }

  function animate() {
    if (reduceMotion) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    for (let i = 0; i < COUNT; i++) {
      let y = posAttr.getY(i) + speeds[i] * dt;
      if (y > 5.5) y = -5.5;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;

    points.rotation.y += (targetRotY - points.rotation.y) * 0.04;
    points.rotation.x += (targetRotX - points.rotation.x) * 0.04;
    points.rotation.z += dt * 0.015;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  if (reduceMotion) {
    renderStatic();
  } else {
    requestAnimationFrame(animate);
  }
}
