// Planetarium.js
const canvas = document.getElementById('planetariumCanvas');
const renderer = new THREE.WebGLRenderer({ canvas });
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Load a texture for the earth
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('path_to_your_texture/earth_texture.jpg', () => {
    // Texture loaded, add the earth mesh
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshBasicMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Start the animation after the texture is loaded
    animate();
});

function animate() {
    requestAnimationFrame(animate);

    earth.rotation.y += 0.01;

    renderer.render(scene, camera);
}
