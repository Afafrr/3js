import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import arrow from './models/arrow';
import cube from './models/cube';
import sphereGeo, { latLonToDirection, setMarkerPosition } from './models/sphere-geojson';

const DEFAULT_MARKER_RADIUS = 1.02;
const FOCUS_ANIMATION_DURATION_MS = 1200;
const FOCUS_EASING = TWEEN.Easing.Cubic.InOut;

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const FALLBACK_UP = new THREE.Vector3(0, 0, 1);
const PARALLEL_THRESHOLD = 0.999;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const viewer = document.getElementById('viewer');

function getContainerSize() {
  if (!viewer) {
    return {
      width: window.innerWidth,
      height: Math.max(window.innerHeight, 1),
    };
  }

  return {
    width: Math.max(viewer.clientWidth, 1),
    height: Math.max(viewer.clientHeight, 1),
  };
}

const { width: initialWidth, height: initialHeight } = getContainerSize();
const camera = new THREE.PerspectiveCamera(75, initialWidth / initialHeight, 0.1, 1000);
camera.position.set(0, 0.55, 2.5);

const renderer = new THREE.WebGLRenderer({ antialias: true }); //antialias makes the edges sharper
viewer.appendChild(renderer.domElement);

// const obj = arrow;
// const obj = cube;
const obj = sphereGeo;
obj.rotation.y = 1.4;

scene.add(obj);

//lights
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
  const { width, height } = getContainerSize();

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

onResize();
window.addEventListener('resize', onResize);
if (viewer && 'ResizeObserver' in window) {
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(viewer);
}
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, -0.15, 0);
controls.update();
const timer = new THREE.Timer();
timer.connect(document);
const tweenGroup = new TWEEN.Group();
let focusTween = null;

function getSafeUpReference(forward) {
  return Math.abs(forward.dot(WORLD_UP)) > PARALLEL_THRESHOLD ? FALLBACK_UP : WORLD_UP;
}

function makeOrientationBasis(forward) {
  const upReference = getSafeUpReference(forward);
  const right = new THREE.Vector3().crossVectors(upReference, forward).normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();

  return new THREE.Matrix4().makeBasis(right, up, forward);
}

function getFocusTargetQuaternion(fromForward, toForward) {
  // Build two orientation frames and compute the delta quaternion between them.
  const fromBasis = makeOrientationBasis(fromForward);
  const toBasis = makeOrientationBasis(toForward);

  const fromQuaternion = new THREE.Quaternion().setFromRotationMatrix(fromBasis);
  const toQuaternion = new THREE.Quaternion().setFromRotationMatrix(toBasis);
  return toQuaternion.multiply(fromQuaternion.invert()).normalize();
}

function startFocusTween(targetQuaternion) {
  focusTween?.stop();

  const startQuaternion = obj.quaternion.clone().normalize();
  const tweenState = { progress: 0 };

  // Slerp keeps angular velocity smooth and avoids interpolation artifacts.
  focusTween = new TWEEN.Tween(tweenState, tweenGroup)
    .to({ progress: 1 }, FOCUS_ANIMATION_DURATION_MS)
    .easing(FOCUS_EASING)
    .onUpdate(() => {
      obj.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, tweenState.progress);
    })
    .onComplete(() => {
      obj.quaternion.copy(targetQuaternion);
      focusTween = null;
    })
    .onStop(() => {
      focusTween = null;
    })
    .start(TWEEN.now());
}

function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const delta = timer.getDelta();

  obj.update?.(delta);
  tweenGroup.update(TWEEN.now());
  controls.update();
  renderer.render(scene, camera);
}

animate();

export function focusCity(lat, lon, radius = DEFAULT_MARKER_RADIUS) {
  const direction = latLonToDirection(lat - 10, lon - 5);
  setMarkerPosition(lat, lon, radius);

  const fromForward = direction.clone().normalize();
  const toForward = new THREE.Vector3().subVectors(camera.position, obj.position).normalize();

  if (fromForward.lengthSq() <= 0 || toForward.lengthSq() <= 0) {
    return direction;
  }

  const targetQuaternion = getFocusTargetQuaternion(fromForward, toForward);
  startFocusTween(targetQuaternion);

  return direction;
}
