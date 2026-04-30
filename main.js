import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import arrow from './arrow';
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true }); //antialias makes the edges sharper
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshNormalMaterial({ wireframe: true });
const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);
scene.add(arrow);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 10);
keyLight.position.set(0, 0.07, 1);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb7d9ff, 0.55);
fillLight.position.set(2, -0.4, -2);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffffff, 3);
backLight.position.set(-2.5, 1.2, -3);
scene.add(backLight);

const lowerFillLight = new THREE.DirectionalLight(0xffffff, 0.5);
lowerFillLight.position.set(0, -2.2, 1);
scene.add(lowerFillLight);

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, -0.15, 0);
controls.update();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  arrow.update(delta);
  controls.update();
  renderer.render(scene, camera);
}

animate();
