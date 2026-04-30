import * as THREE from 'three';

const topLeft = new THREE.Vector3(-0.82, 0, 0);
const topRight = new THREE.Vector3(0.78, 0.42, 0);
const lowerTip = new THREE.Vector3(0, -0.98, 0);
const topEdgeAngle = Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x);

const frontRidge = new THREE.Vector3(-0.1, -0.2, 0.46);
const backRidge = new THREE.Vector3(-0.1, -0.2, -0.46);
const notchValley = new THREE.Vector3(-0.1, -0.2, 0);

const vertices = [];
const normals = [];
const indices = [];

function pushVertex(vertex, normal) {
  vertices.push(vertex.x, vertex.y, vertex.z);
  normals.push(normal.x, normal.y, normal.z);
  return vertices.length / 3 - 1;
}

function addFacet(a, b, c) {
  const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();

  const start = vertices.length / 3;
  pushVertex(a, normal);
  pushVertex(b, normal);
  pushVertex(c, normal);
  indices.push(start, start + 1, start + 2);
}

addFacet(topLeft, topRight, frontRidge);
addFacet(topRight, lowerTip, frontRidge);
addFacet(lowerTip, topRight, backRidge);
addFacet(topRight, topLeft, backRidge);

addFacet(topLeft, frontRidge, notchValley);
addFacet(frontRidge, lowerTip, notchValley);
addFacet(lowerTip, backRidge, notchValley);
addFacet(backRidge, topLeft, notchValley);

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
geometry.setIndex(indices);
geometry.computeBoundingSphere();

const material = new THREE.MeshStandardMaterial({
  color: 0xefefef,
  roughness: 0.12,
  metalness: 0.88,
  side: THREE.DoubleSide,
  flatShading: true,
});

const mesh = new THREE.Mesh(geometry, material);
mesh.rotation.z = -topEdgeAngle;
const initialRotationY = mesh.rotation.y;

mesh.update = (delta) => {
  const rotationOffset =
    THREE.MathUtils.euclideanModulo(mesh.rotation.y - initialRotationY + Math.PI, Math.PI * 2) - Math.PI;
  const speedBlend = Math.pow((1 - Math.cos(rotationOffset)) / 2, 1.4);
  const rotationSpeed = 0.08 + speedBlend * 2;

  mesh.rotation.y += rotationSpeed * delta;
};

const edges = new THREE.EdgesGeometry(geometry, 15);
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0x171717,
  transparent: true,
  opacity: 0.75,
});
const wireframe = new THREE.LineSegments(edges, lineMaterial);
// mesh.add(wireframe);

export default mesh;
