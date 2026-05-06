import * as THREE from 'three';

const GEOJSON_URL = new URL('../media/world.geojson', import.meta.url);
const TEXTURE_WIDTH = 2048 * 2;
const TEXTURE_HEIGHT = 1024 * 2;
const OCEAN_COLOR = 'rgba(15, 23, 42, 0.18)';
const LAND_COLOR = 'rgb(255, 255, 255)';
const SPHERE_WIDTH_SEGMENTS = 80;
const SPHERE_HEIGHT_SEGMENTS = 80;
const INNER_SPHERE_SCALE = 0.98;
const INNER_SPHERE_COLOR = '#0f172a';
const INNER_SPHERE_OPACITY = 0.7;

const BORDER_COLOR = 'rgba(111, 116, 126, 0.55)';
const BORDER_WIDTH = 1;
const BORDER_DASH = [1, 4];

const geometry = new THREE.IcosahedronGeometry(1, SPHERE_WIDTH_SEGMENTS, SPHERE_HEIGHT_SEGMENTS);
const material = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
});

const globe = new THREE.Group();
const sphere = new THREE.Mesh(geometry, material);
const innerSphere = new THREE.Mesh(
  geometry.clone().scale(INNER_SPHERE_SCALE, INNER_SPHERE_SCALE, INNER_SPHERE_SCALE),
  new THREE.MeshBasicMaterial({
    color: INNER_SPHERE_COLOR,
    transparent: true,
    opacity: INNER_SPHERE_OPACITY,
  }),
);
const texture = createCanvasTexture();
const context = texture.image.getContext('2d');

globe.add(innerSphere);
globe.add(sphere);

let geoJsonData;

function createCanvasTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;

  const canvasTexture = new THREE.CanvasTexture(canvas);
  canvasTexture.colorSpace = THREE.SRGBColorSpace;

  return canvasTexture;
}

function lonToX(longitude) {
  return ((longitude + 180) / 360) * TEXTURE_WIDTH;
}

function latToY(latitude) {
  return ((90 - latitude) / 180) * TEXTURE_HEIGHT;
}

function drawRing(pathContext, ring) {
  if (!ring?.length) {
    return;
  }

  pathContext.moveTo(lonToX(ring[0][0]), latToY(ring[0][1]));

  for (let i = 1; i < ring.length; i += 1) {
    pathContext.lineTo(lonToX(ring[i][0]), latToY(ring[i][1]));
  }

  pathContext.closePath();
}

function tracePolygon(pathContext, polygon) {
  pathContext.beginPath();

  for (const ring of polygon) {
    drawRing(pathContext, ring);
  }
}

function fillPolygon(drawContext, polygon) {
  tracePolygon(drawContext, polygon);
  drawContext.fillStyle = LAND_COLOR;
  drawContext.fill();
}

function strokePolygon(drawContext, polygon) {
  tracePolygon(drawContext, polygon);
  drawContext.strokeStyle = BORDER_COLOR;
  drawContext.lineWidth = BORDER_WIDTH;
  drawContext.setLineDash(BORDER_DASH);
  drawContext.stroke();
}

function drawGeometry(drawContext, geometryData) {
  if (geometryData.type === 'Polygon') {
    fillPolygon(drawContext, geometryData.coordinates);
    strokePolygon(drawContext, geometryData.coordinates);
  }

  if (geometryData.type === 'MultiPolygon') {
    for (const polygon of geometryData.coordinates) {
      fillPolygon(drawContext, polygon);
      strokePolygon(drawContext, polygon);
    }
  }
}

function renderTexture() {
  if (!geoJsonData) {
    return;
  }

  context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  context.fillStyle = OCEAN_COLOR;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const features = geoJsonData.type === 'FeatureCollection' ? geoJsonData.features : [geoJsonData];

  for (const feature of features) {
    const geometryData = feature.geometry ?? feature;
    drawGeometry(context, geometryData);
  }

  texture.needsUpdate = true;
  material.map = texture;
  material.needsUpdate = true;
}

async function loadGeoJsonTexture() {
  const response = await fetch(GEOJSON_URL);
  geoJsonData = await response.json();
  renderTexture();
}

loadGeoJsonTexture().catch((error) => {
  console.warn('Failed to load GeoJSON texture', error);
});

export function latLonToDirection(lat, lon) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  const x = Math.cos(latRad) * Math.sin(lonRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.cos(lonRad);
  return new THREE.Vector3(x, y, z);
}

const marker = new THREE.Mesh(new THREE.SphereGeometry(0.02), new THREE.MeshBasicMaterial({ color: 'red' }));

export function setMarkerPosition(lat, lon, radius = 1.02) {
  marker.position.copy(latLonToDirection(lat, lon).multiplyScalar(radius));

  if (!marker.parent) {
    globe.add(marker);
  }
}

export default globe;
