import * as THREE from 'three';

const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshNormalMaterial({ wireframe: true });

const sphere = new THREE.Mesh(geometry, material);

export default sphere;
