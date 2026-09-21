import * as THREE from './three.module.min.js';

const canvas = document.querySelector('#envelopeCanvas');
const stage = document.querySelector('#envelopeStage');
const windows = document.querySelectorAll('.envelope-window');
const revealEl = document.querySelector('#envelopeReveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && stage) {
  let width = stage.clientWidth, height = stage.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0, 9);

  const RED_DARK = 0x5c1a24, GOLD = 0xd5a25c;

  const envelope = new THREE.Group();
  scene.add(envelope);

  // Planar UV based on each triangle's own bounding box, so texture crops map cleanly.
  function tri(p1, p2, p3, material) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...p1, ...p2, ...p3]), 3));
    const xs = [p1[0], p2[0], p3[0]], ys = [p1[1], p2[1], p3[1]];
    const minX = Math.min(...xs), maxX = Math.max(...xs) || 1;
    const minY = Math.min(...ys), maxY = Math.max(...ys) || 1;
    const uv = new Float32Array([p1, p2, p3].flatMap(p => [
      (p[0] - minX) / (maxX - minX || 1),
      (p[1] - minY) / (maxY - minY || 1),
    ]));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
  }

  const border = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.9), new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide }));
  border.position.z = -0.03;
  envelope.add(border);

  // Texture the envelope with the real card artwork: bottom portion (the branding)
  // goes on the body, top portion (the gold chevron trim) goes on the flap, so the
  // closed envelope reads as the same card, split at the natural flap crease.
  const loader = new THREE.TextureLoader();
  const cardTexBase = loader.load('business-card.png');
  cardTexBase.colorSpace = THREE.SRGBColorSpace;

  const FLAP_FRACTION = 0.42; // top 42% of the artwork = the chevron trim area

  const bodyTex = cardTexBase.clone();
  bodyTex.needsUpdate = true;
  bodyTex.repeat.set(1, 1 - FLAP_FRACTION);
  bodyTex.offset.set(0, 0);

  const flapTex = cardTexBase.clone();
  flapTex.needsUpdate = true;
  flapTex.repeat.set(1, FLAP_FRACTION);
  flapTex.offset.set(0, 1 - FLAP_FRACTION);

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.7),
    new THREE.MeshBasicMaterial({ map: bodyTex, side: THREE.DoubleSide })
  );
  envelope.add(back);

  const sideMat = new THREE.MeshBasicMaterial({ color: RED_DARK, side: THREE.DoubleSide });
  envelope.add(tri([-2.1, 1.35, 0.01], [-2.1, -1.35, 0.01], [0, 0, 0.01], sideMat));
  envelope.add(tri([2.1, 1.35, 0.01], [2.1, -1.35, 0.01], [0, 0, 0.01], sideMat));
  envelope.add(tri([-2.1, -1.35, 0.02], [2.1, -1.35, 0.02], [0, 0, 0.02], new THREE.MeshBasicMaterial({ color: 0x481219, side: THREE.DoubleSide })));

  const flapHinge = new THREE.Group();
  flapHinge.position.set(0, 1.35, 0.03);
  envelope.add(flapHinge);
  const flapMat = new THREE.MeshBasicMaterial({ map: flapTex, side: THREE.DoubleSide });
  const flap = tri([-2.1, 0, 0], [2.1, 0, 0], [0, -1.35, 0], flapMat);
  flapHinge.add(flap);
  const seal = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide }));
  seal.position.set(0, -0.66, 0.01);
  flapHinge.add(seal);
  const sealMark = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.14, 24), new THREE.MeshBasicMaterial({ color: 0x7a2230, side: THREE.DoubleSide }));
  sealMark.position.set(0, -0.66, 0.02);
  flapHinge.add(sealMark);

  // Gold particle burst (soft-sprite technique shared in spirit with the hero background)
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = spriteCanvas.height = 64;
  const sctx = spriteCanvas.getContext('2d');
  const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,224,170,1)');
  grad.addColorStop(0.5, 'rgba(216,170,98,0.6)');
  grad.addColorStop(1, 'rgba(216,170,98,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);
  const spriteTex = new THREE.CanvasTexture(spriteCanvas);

  const PCOUNT = 50;
  const pPos = new Float32Array(PCOUNT * 3);
  const pVel = [];
  for (let i = 0; i < PCOUNT; i++) {
    pVel.push([(Math.random() - 0.5) * 3.2, Math.random() * 2 + 0.6, (Math.random() - 0.5) * 2.4]);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.26, map: spriteTex, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending });
  const burst = new THREE.Points(pGeo, pMat);
  envelope.add(burst);

  function resize() {
    width = stage.clientWidth; height = stage.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', resize);
  resize();

  function revealOverlay(delay) {
    setTimeout(() => revealEl && revealEl.classList.add('show'), delay);
    windows.forEach((w, i) => setTimeout(() => w.classList.add('show'), delay + 250 + i * 160));
  }

  // Mouse parallax: a gentle tilt toward the cursor, layered on top of whatever
  // the opening timeline is doing.
  let targetTiltX = 0, targetTiltY = 0, tiltX = 0, tiltY = 0;
  stage.addEventListener('pointermove', (e) => {
    if (reduceMotion) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    targetTiltY = x * 0.3;
    targetTiltX = y * -0.18;
  });
  stage.addEventListener('pointerleave', () => { targetTiltX = 0; targetTiltY = 0; });

  const OPEN_DELAY = 850, OPEN_DUR = 650, FLY_DUR = 900;

  if (reduceMotion) {
    envelope.position.set(0, 0.1, 0);
    envelope.rotation.set(0, 0, 0);
    envelope.scale.set(1, 1, 1);
    flapHinge.rotation.x = -2.55;
    renderer.render(scene, camera);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { revealOverlay(0); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    io.observe(stage);
  } else {
    envelope.position.set(-2.6, 0.3, 0);
    envelope.rotation.set(0.12, -0.75, 0.16);
    envelope.scale.set(0.55, 0.55, 0.55);
    renderer.render(scene, camera);

    const fromPos = envelope.position.clone();
    const fromRot = envelope.rotation.clone();
    const fromScale = envelope.scale.x;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

    let played = false, startTime = null, burstActive = false, burstStart = 0;

    function frame(now) {
      if (startTime === null) startTime = now;
      const t = now - startTime;

      const ft = Math.min(1, t / FLY_DUR);
      const fe = easeOutCubic(ft);
      envelope.position.set(
        fromPos.x + (0 - fromPos.x) * fe,
        fromPos.y + (0.1 - fromPos.y) * fe,
        0
      );
      const settledRotX = fromRot.x + (0 - fromRot.x) * fe;
      const settledRotY = fromRot.y + (0 - fromRot.y) * fe;
      const settledRotZ = fromRot.z + (0 - fromRot.z) * fe;
      const s = fromScale + (1 - fromScale) * fe;
      envelope.scale.set(s, s, s);

      if (t > OPEN_DELAY) {
        const ot = Math.min(1, (t - OPEN_DELAY) / OPEN_DUR);
        flapHinge.rotation.x = -easeOutBack(ot) * 2.55;
        if (ot >= 1 && !burstActive) { burstActive = true; burstStart = t; pMat.opacity = 1; }
      }

      if (burstActive) {
        const bt = (t - burstStart) / 1000;
        const arr = pGeo.attributes.position.array;
        for (let i = 0; i < PCOUNT; i++) {
          arr[i * 3] = pVel[i][0] * bt;
          arr[i * 3 + 1] = -0.6 + pVel[i][1] * bt - 0.5 * bt * bt;
          arr[i * 3 + 2] = pVel[i][2] * bt;
        }
        pGeo.attributes.position.needsUpdate = true;
        pMat.opacity = Math.max(0, 1 - bt / 1.4);
      }

      // Smoothed mouse-parallax tilt, layered on top of the settle/idle rotation.
      tiltX += (targetTiltX - tiltX) * 0.05;
      tiltY += (targetTiltY - tiltY) * 0.05;
      const idleBob = t > FLY_DUR ? Math.sin(t * 0.0016) * 0.05 : 0;
      const idleSway = t > FLY_DUR ? Math.sin(t * 0.0011) * 0.04 : 0;
      envelope.position.y = envelope.position.y + idleBob;
      envelope.rotation.set(settledRotX + tiltX, settledRotY + tiltY + idleSway, settledRotZ);

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !played) {
          played = true;
          requestAnimationFrame(frame);
          revealOverlay(OPEN_DELAY + OPEN_DUR - 150);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    io.observe(stage);
  }
}
