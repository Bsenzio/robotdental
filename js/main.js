import * as THREE from 'three';

/*
  OptanAR interactive architecture visualization.

  Visual concept:
  XR VIEWER -> OPTANAR -> AI / SENSOR DATA -> DYNAMIC XR MARKERS

  The scene is intentionally abstract so it communicates the architecture
  without pretending to show a literal hardware design.
*/

const container = document.getElementById('three-scene');

if (container) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070c, 0.045);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.5, 8.5);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // ---------- Lights ----------
  const ambient = new THREE.AmbientLight(0xffffff, 1.1);
  scene.add(ambient);

  const cyanLight = new THREE.PointLight(0x64e9ff, 35, 18);
  cyanLight.position.set(-3, 1.5, 3);
  scene.add(cyanLight);

  const purpleLight = new THREE.PointLight(0x9d7cff, 30, 18);
  purpleLight.position.set(3, -1.5, 2);
  scene.add(purpleLight);

  // ---------- Central OptanAR node ----------
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.95, 2),
    new THREE.MeshStandardMaterial({
      color: 0x07141a,
      emissive: 0x64e9ff,
      emissiveIntensity: 1.5,
      metalness: 0.55,
      roughness: 0.22,
      transparent: true,
      opacity: 0.95
    })
  );
  scene.add(core);

  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.16, 2)),
    new THREE.LineBasicMaterial({
      color: 0x64e9ff,
      transparent: true,
      opacity: 0.6
    })
  );
  scene.add(wire);

  // ---------- Surrounding processing rings ----------
  const rings = [];
  [1.45, 1.75, 2.05].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.012 + index * 0.004, 12, 100),
      new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? 0x64e9ff : 0x9d7cff,
        transparent: true,
        opacity: 0.25
      })
    );
    ring.rotation.x = Math.PI / 2 + index * 0.4;
    ring.rotation.y = index * 0.7;
    scene.add(ring);
    rings.push(ring);
  });

  // ---------- XR viewer representation ----------
  const viewerGroup = new THREE.Group();

  const viewerBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.48, 0.48),
    new THREE.MeshStandardMaterial({
      color: 0x151c28,
      metalness: 0.65,
      roughness: 0.3
    })
  );

  const lensMaterial = new THREE.MeshBasicMaterial({
    color: 0x64e9ff,
    transparent: true,
    opacity: 0.45
  });

  const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), lensMaterial);
  const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), lensMaterial);
  lensL.position.set(-0.25, 0, 0.25);
  lensR.position.set(0.25, 0, 0.25);

  viewerGroup.add(viewerBody, lensL, lensR);
  viewerGroup.position.set(-3.0, 0.8, 0);
  viewerGroup.rotation.y = -0.35;
  scene.add(viewerGroup);

  // ---------- Data source nodes ----------
  const sourcePositions = [
    new THREE.Vector3(3.0, 1.5, 0),
    new THREE.Vector3(3.2, -0.2, 0),
    new THREE.Vector3(2.7, -1.7, 0)
  ];

  const sourceGroups = [];

  sourcePositions.forEach((position, index) => {
    const group = new THREE.Group();

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 16, 16),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? 0x9d7cff : 0x64e9ff
      })
    );

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.28, 32),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? 0x9d7cff : 0x64e9ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );

    group.add(sphere, halo);
    group.position.copy(position);
    scene.add(group);
    sourceGroups.push(group);
  });

  // ---------- Data lines ----------
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x64e9ff,
    transparent: true,
    opacity: 0.23
  });

  function makeLine(a, b) {
    const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
    const line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
    return line;
  }

  const lines = [];
  sourcePositions.forEach(p => lines.push(makeLine(p, new THREE.Vector3(0, 0, 0))));
  lines.push(makeLine(new THREE.Vector3(-2.45, 0.8, 0), new THREE.Vector3(0, 0, 0)));

  // ---------- Moving data particles ----------
  const particleGeometry = new THREE.SphereGeometry(0.035, 8, 8);
  const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x64e9ff });

  const particles = [];

  function createParticle(start, end, offset) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.userData = {
      start: start.clone(),
      end: end.clone(),
      progress: offset
    };
    scene.add(particle);
    particles.push(particle);
  }

  sourcePositions.forEach((p, i) => {
    for (let j = 0; j < 4; j++) {
      createParticle(p, new THREE.Vector3(0, 0, 0), (j / 4) + i * 0.08);
    }
  });

  // ---------- Dynamic marker particles leaving the core ----------
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0x9d7cff
  });

  for (let i = 0; i < 20; i++) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 8, 8),
      markerMaterial
    );

    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 1.6;

    marker.userData = {
      angle,
      radius,
      speed: 0.15 + Math.random() * 0.25,
      y: (Math.random() - 0.5) * 2.8
    };

    scene.add(marker);
    particles.push(marker);
  }

  // ---------- Mouse interaction ----------
  const pointer = { x: 0, y: 0 };

  container.addEventListener('pointermove', (event) => {
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  });

  // ---------- Animation ----------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    core.rotation.x = elapsed * 0.15;
    core.rotation.y = elapsed * 0.22;
    wire.rotation.x = -elapsed * 0.12;
    wire.rotation.y = -elapsed * 0.18;

    rings.forEach((ring, i) => {
      ring.rotation.z += 0.0015 + i * 0.0007;
      ring.rotation.x += 0.0006;
    });

    viewerGroup.position.y = 0.8 + Math.sin(elapsed * 1.1) * 0.12;

    sourceGroups.forEach((group, i) => {
      group.position.x = sourcePositions[i].x + Math.sin(elapsed * 1.3 + i) * 0.08;
      group.position.y = sourcePositions[i].y + Math.cos(elapsed * 1.2 + i) * 0.08;
      group.rotation.z = elapsed * 0.6;
    });

    // Particles entering OptanAR.
    particles.forEach((particle, i) => {
      if (particle.userData.start) {
        particle.userData.progress = (particle.userData.progress + 0.006) % 1;
        particle.position.lerpVectors(
          particle.userData.start,
          particle.userData.end,
          particle.userData.progress
        );
      } else {
        const u = particle.userData;
        u.angle += u.speed * 0.004;
        particle.position.set(
          Math.cos(u.angle) * u.radius,
          u.y + Math.sin(elapsed * 0.7 + i) * 0.12,
          Math.sin(u.angle) * u.radius
        );
      }
    });

    // Gentle mouse parallax.
    scene.rotation.y += ((pointer.x * 0.18) - scene.rotation.y) * 0.025;
    scene.rotation.x += ((pointer.y * 0.10) - scene.rotation.x) * 0.025;

    renderer.render(scene, camera);
  }

  animate();

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener('resize', resize);
}
