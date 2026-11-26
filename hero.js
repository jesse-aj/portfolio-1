import * as THREE from 'three';

function createDotTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  grad.addColorStop(0, 'rgba(49, 93, 138, 0.8)');
  grad.addColorStop(0.35, 'rgba(49, 93, 138, 0.45)');
  grad.addColorStop(1, 'rgba(49, 93, 138, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(c);
  return texture;
}

function init3DBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    console.warn('WebGL unavailable, skipping 3D backdrop:', err);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf7f8fa, 0.045);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 8);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const keyLight = new THREE.DirectionalLight(0x7da8d6, 1.2);
  keyLight.position.set(5, 6, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
  rimLight.position.set(-5, -3, 2);
  scene.add(rimLight);

  // 1. Glowing 3D Dot Field (Constellation across full scroll depth)
  const dotTexture = createDotTexture();
  const dotCount = 1600;
  const positions = new Float32Array(dotCount * 3);
  const colors = new Float32Array(dotCount * 3);
  const accentColor = new THREE.Color('#315d8a');
  const mutedColor = new THREE.Color('#a9b5c3');

  for (let i = 0; i < dotCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 28;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 4;

    const c = Math.random() > 0.72 ? accentColor : mutedColor;
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.14,
    map: dotTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // 2. Hero 3D Centerpiece (nested wireframe + orbital rings)
  const heroGroup = new THREE.Group();
  const isMobile = () => window.innerWidth < 900;
  heroGroup.position.set(isMobile() ? 0 : 2.8, isMobile() ? 1.2 : 0, 0);

  const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xdbe3ec,
    metalness: 0.35,
    roughness: 0.4,
    flatShading: true,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  heroGroup.add(coreMesh);

  const wireGeo = new THREE.IcosahedronGeometry(1.45, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x315d8a,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const wireMesh = new THREE.Mesh(wireGeo, wireMat);
  heroGroup.add(wireMesh);

  const ringGeo1 = new THREE.TorusGeometry(2.05, 0.015, 16, 100);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0x315d8a,
    transparent: true,
    opacity: 0.45,
  });
  const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI * 0.35;
  ring1.rotation.y = Math.PI * 0.15;
  heroGroup.add(ring1);

  const ringGeo2 = new THREE.TorusGeometry(2.45, 0.012, 16, 100);
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: 0x9caec2,
    transparent: true,
    opacity: 0.18,
  });
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.x = -Math.PI * 0.28;
  ring2.rotation.z = Math.PI * 0.25;
  heroGroup.add(ring2);

  scene.add(heroGroup);

  // 3. Deeper scroll sculptures (seen as user scrolls down the page)
  const floatingShapes = [];
  const shapeConfigs = [
    { pos: [-3.5, -5.5, -2.5], scale: 0.9, color: 0x315d8a, opacity: 0.22 },
    { pos: [3.8, -10.5, -3.5], scale: 1.2, color: 0x9caec2, opacity: 0.2 },
    { pos: [-2.8, -15.5, -2.0], scale: 1.0, color: 0x315d8a, opacity: 0.2 },
  ];

  shapeConfigs.forEach((cfg) => {
    const geo = new THREE.OctahedronGeometry(cfg.scale, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      wireframe: true,
      transparent: true,
      opacity: cfg.opacity,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...cfg.pos);
    scene.add(mesh);
    floatingShapes.push(mesh);
  });

  // Mouse & Scroll state
  const targetMouse = { x: 0, y: 0 };
  const currentMouse = { x: 0, y: 0 };
  let scrollProgress = 0;
  let currentScroll = 0;

  window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  const updateScroll = () => {
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    scrollProgress = window.scrollY / maxScroll;
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    heroGroup.position.x = isMobile() ? 0 : 2.8;
  });

  const clock = new THREE.Clock();

  const animate = () => {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smoothly interpolate mouse & scroll
    currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
    currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;
    currentScroll += (scrollProgress - currentScroll) * 0.06;

    // Camera glides down & gently orbits with mouse
    camera.position.x = currentMouse.x * 0.8;
    camera.position.y = currentMouse.y * 0.5 - currentScroll * 16;
    camera.position.z = 8 - Math.sin(currentScroll * Math.PI) * 1.6;
    camera.lookAt(
      currentMouse.x * 0.25,
      -currentScroll * 16 + currentMouse.y * 0.15,
      0
    );

    // Hero centerpiece animation
    coreMesh.rotation.x = t * 0.22 + currentMouse.y * 0.35;
    coreMesh.rotation.y = t * 0.3 + currentMouse.x * 0.35;
    wireMesh.rotation.x = -t * 0.16 + currentMouse.y * 0.25;
    wireMesh.rotation.y = -t * 0.22 + currentMouse.x * 0.25;
    ring1.rotation.z = t * 0.25;
    ring2.rotation.y = -t * 0.2;
    heroGroup.position.y =
      (isMobile() ? 1.2 : 0) + Math.sin(t * 1.1) * 0.16;

    // Particle drift + subtle rotation with scroll
    particles.rotation.y = t * 0.025 + currentScroll * 0.6;
    particles.rotation.x = currentMouse.y * 0.08;

    // Floating scroll sculptures
    floatingShapes.forEach((shape, idx) => {
      shape.rotation.x = t * (0.2 + idx * 0.07);
      shape.rotation.y = t * (0.25 + idx * 0.05);
    });

    renderer.render(scene, camera);
  };

  animate();
}

function initPointerInteractions() {
  const heroContent = document.getElementById('hero-content');
  if (heroContent && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      if (window.scrollY > window.innerHeight) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      heroContent.style.transform =
        `perspective(1000px) rotateY(${nx * 2.5}deg) rotateX(${-ny * 2}deg)`;
    }, { passive: true });
  }

  const cards = document.querySelectorAll('.project-card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rx = ((y / rect.height) - 0.5) * -7;
      const ry = ((x / rect.width) - 0.5) * 7;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      card.style.transform =
        `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init3DBackground();
  initPointerInteractions();
});
