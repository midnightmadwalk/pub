// import { CharacterControls } from './characterControls';
import * as THREE from 'three'
import { CameraHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ============================================
// Basic Three.js setup
let scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);



// --------------------- UTILS

const W = 'w';
const A = 'a';
const S = 's';
const D = 'd';
const SHIFT = 'shift';
const DIRECTIONS = [W, A, S, D];

class KeyDisplay {
    map = new Map();

    constructor() {
        const w = document.createElement("div");
        const a = document.createElement("div");
        const s = document.createElement("div");
        const d = document.createElement("div");
        const shift = document.createElement("div");

        this.map.set(W, w);
        this.map.set(A, a);
        this.map.set(S, s);
        this.map.set(D, d);
        this.map.set(SHIFT, shift);

        this.map.forEach((v, k) => {
            v.style.color = 'blue';
            v.style.fontSize = '50px';
            v.style.fontWeight = '800';
            v.style.position = 'absolute';
            v.textContent = k;
        });

        this.updatePosition();

        this.map.forEach((v, _) => {
            document.body.append(v);
        });

        // Listen for wheel events to simulate W (wheel up) and S (wheel down)
        this.listenWheel();
    }

    listenWheel() {
        window.addEventListener('wheel', (event) => {
            if (event.deltaY < 0) {
                // Wheel up: W key
                this.down(W);
                keysPressed[W] = true; // Set the key as pressed
                setTimeout(() => {
                    this.up(W);
                    keysPressed[W] = false; // Reset after 100ms
                }, 100); // Reset after 100ms
            } else if (event.deltaY > 0) {
                // Wheel down: S key
                this.down(S);
                keysPressed[S] = true;
                setTimeout(() => {
                    this.up(S);
                    keysPressed[S] = false; // Reset after 100ms
                }, 100);
            }
        });
    }
    
    updatePosition() {
        this.map.get(W).style.top = `${window.innerHeight - 150}px`;
        this.map.get(A).style.top = `${window.innerHeight - 100}px`;
        this.map.get(S).style.top = `${window.innerHeight - 100}px`;
        this.map.get(D).style.top = `${window.innerHeight - 100}px`;
        this.map.get(SHIFT).style.top = `${window.innerHeight - 100}px`;

        this.map.get(W).style.left = `${300}px`;
        this.map.get(A).style.left = `${200}px`;
        this.map.get(S).style.left = `${300}px`;
        this.map.get(D).style.left = `${400}px`;
        // this.map.get(SHIFT).style.left = `${50}px`;
    }

    down(key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'red';
        }
    }

    up(key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'blue';
        }
    }
}





class CharacterControls {



    // state
    toggleRun = true

    // temporary data
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion = new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()

    // constants
    fadeDuration = 0.2
    runVelocity = 5
    walkVelocity = 2

    constructor(model,
        mixer, animationsMap,
        orbitControl, camera,
        currentAction) {
        this.model = model
        this.mixer = mixer
        this.animationsMap = animationsMap
        this.currentAction = currentAction
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play()
            }
        })
        this.orbitControl = orbitControl
        this.camera = camera
        this.updateCameraTarget(0, 0)
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun
    }

    update(delta, keysPressed) {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)

        var play = '';
        if (directionPressed && this.toggleRun) {
            play = 'Run'
        } else if (directionPressed) {
            play = 'Walk'
        } else {
            play = 'Idle'
        }

        if (this.currentAction != play) {
            const toPlay = this.animationsMap.get(play)
            const current = this.animationsMap.get(this.currentAction)

            current.fadeOut(this.fadeDuration)
            toPlay.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = play
        }

        this.mixer.update(delta)

        if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
            // calculate towards camera direction
            var angleYCameraDirection = Math.atan2(
                (this.camera.position.x - this.model.position.x),
                (this.camera.position.z - this.model.position.z))
            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed)

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // run/walk velocity
            const velocity = this.currentAction == 'Run' ? this.runVelocity : this.walkVelocity

            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta
            this.model.position.x += moveX
            this.model.position.z += moveZ
            this.updateCameraTarget(moveX, moveZ)
                // Update drone position to follow the character
                const offset = new THREE.Vector3(-20, 30, -40); 
                // Distance behind the character
                drone.position.copy(this.model.position).add(offset);
                drone.rotation.copy(this.model.rotation); // Make the drone match the
        }

        // console.log(stairs[0].position.y, stairs[1].position.y, stairs[2].position.y, stairs[3].position.y)

        // console.log(this.model.position.y)
        // this.model.position.y+=0.009;
        // this.model.position.x-=0.009;
        stairs.map(a => {
            if (
                Math.abs(a.position.x - this.model.position.x) < 0.8
                && Math.abs(a.position.z - this.model.position.z) < 0.8
                && Math.abs(a.position.y - this.model.position.y) < 1
        ) {
            this.model.position.y = a.position.y
            // this.model.position.x = a.position.x
            // this.model.position.z = a.position.z
                // console.log(Math.ceil(Math.max(a.position.y, this.model.position.y)))
            }
        });

    }

    updateCameraTarget(moveX, moveZ) {
        // Remove the camera position update to keep the camera fixed
        this.camera.position.x += moveX ;
        this.camera.position.z += moveZ ;
    
        // Update only the camera target (the position the camera looks at)
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.z = this.model.position.z;
        this.orbitControl.target = this.cameraTarget; // Orbit controls will update the camera view accordingly
    }
    
    directionOffset(keysPressed) {
        var directionOffset = 0 // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }
}


// ==========================


// Load textures for the cube faces
const textureLoader_cube = new THREE.TextureLoader();
const textures = {
  front: textureLoader_cube.load('collage.jpg'),
  back: textureLoader_cube.load('collage.jpg'),
  top: textureLoader_cube.load('collage.jpg'),
  bottom: textureLoader_cube.load('collage.jpg'),
  left: textureLoader_cube.load('collage.jpg'), // Earth base (adjust if you want to change)
  right: textureLoader_cube.load('collage.jpg'), // Earth base (adjust if you want to change)
};

const cubeGeometry = new THREE.BoxGeometry(500, 500, 500); // Scale the cube to be large enough
const cubeMaterials = [
  new THREE.MeshBasicMaterial({ map: textures.front, side: THREE.BackSide }), // Front
  new THREE.MeshBasicMaterial({ map: textures.back, side: THREE.BackSide }), // Back
  new THREE.MeshBasicMaterial({ map: textures.top, side: THREE.BackSide }), // Top
  new THREE.MeshBasicMaterial({ map: textures.bottom, side: THREE.BackSide }), // Bottom
  new THREE.MeshBasicMaterial({ map: textures.left, side: THREE.BackSide }), // Left
  new THREE.MeshBasicMaterial({ map: textures.right, side: THREE.BackSide }), // Right
];

// Create the skybox
const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
cube.position.set(0, 0, 0); // Centered in the scene (but will surround the camera)
scene.add(cube);

// Update cube's position to always follow the camera
function updateSkyboxPosition() {
  cube.position.set(camera.position.x, camera.position.y, camera.position.z);
}

const earth = scene.getObjectByName('earth');  // Assuming earth is added with a name
if (earth) {
    earth.position.set(camera.position.x, -50, camera.position.z);  // Keeping it below the camera
}


console.log('ada')

// CAMERA
// const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 3.82970197029123;
camera.position.y = 7.209891012098961;
camera.position.z = 8.167297687379282;
console.log(camera.position.x)
console.log(camera.position.y)
console.log(camera.position.z)

// RENDERER
// const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true; // Smooth rotation
orbitControls.dampingFactor = 0.25; // Adjust smoothness of the rotation
orbitControls.rotateSpeed = 1.0; // Adjust the sensitivity of the rotation
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false; // Disable pan
orbitControls.enableZoom = false; // Disable zoom with the scroll wheel
orbitControls.update(); // Update control



// LIGHTS
light()


// MODEL WITH ANIMATIONS
var characterControls;
new GLTFLoader().load('models/Soldier.glb', function (gltf) {
    const model = gltf.scene;

    // Set the position of the model (for example, at x=5, y=0, z=1)
    model.position.set(5, 0, 1);

    // Rotate the model to face the reverse direction (180 degrees around the Y-axis)
    model.rotation.y = Math.PI;  // 180 degrees in radians

    // Set shadow properties
    model.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
    });

    // Add the model to the scene
    scene.add(model);

    // Handle animations
    const gltfAnimations = gltf.animations;
    const mixer = new THREE.AnimationMixer(model);
    const animationsMap = new Map();
    gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
        animationsMap.set(a.name, mixer.clipAction(a));
    });

    // Initialize the character controls with the loaded model and animations
    characterControls = new CharacterControls(model, mixer, animationsMap, orbitControls, camera, 'Idle');
}, undefined, function (error) {
    console.error('An error occurred while loading the .glb file:', error);
});


// Create the drone (a cube for simplicity)
const droneGeometry = new THREE.BoxGeometry(1, 1, 1); // Cube geometry
const droneMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Red color
const drone = new THREE.Mesh(droneGeometry, droneMaterial);
scene.add(drone);


// CONTROL KEYS
const keysPressed = {}
const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    keyDisplayQueue.down(event.key)
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        (keysPressed)[event.key.toLowerCase()] = true
    }
}, false);
document.addEventListener('keyup', (event) => {
    keyDisplayQueue.up(event.key);
    (keysPressed)[event.key.toLowerCase()] = false
}, false);

const clock = new THREE.Clock();
// ANIMATE


document.body.appendChild(renderer.domElement);
animate2();

function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(- 60, 100, - 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
}

// Lighting
const sunlight = new THREE.DirectionalLight(0xFFFF00, 1.0);
sunlight.position.set(50, 50, 50);
sunlight.castShadow = true;
scene.add(sunlight);

// Tree trunk
const height = 60;
const steps = 120;
const trunkGeometry = new THREE.CylinderGeometry(1, 2, height, 16);
const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
trunk.position.y = height / 2;
scene.add(trunk);

// Load texture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('eq.png'); // Replace with the actual path to your texture file
const stepGeometry = new THREE.BoxGeometry(7, 0.8, 1); // Define the step geometry

// Step material with texture
const stepMaterial = new THREE.MeshLambertMaterial({ 
    map: texture,  // Apply the texture to the material
    side: THREE.DoubleSide
});

// Create the spiral staircase with textured steps
const radius = 5;
const angleIncrement = Math.PI / 15;
const heightIncrement = height / steps;
let stairs = [];
for (let i = 0; i < steps; i++) {
    const angle = i * angleIncrement;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = heightIncrement * i;

    const step = new THREE.Mesh(stepGeometry, stepMaterial);
    step.position.set(x, y, z);
    step.rotation.y = -angle;

    stairs.push(step);
    scene.add(step);


    
}


// Portal rings
var rings = [];
function createTextRing(stepIndex) {
    const angle = stepIndex * angleIncrement;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = heightIncrement * stepIndex;
    const geometry = new THREE.RingGeometry(2, 3, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x8A2BE2, side: THREE.DoubleSide, transparent: true });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(x, y, z);

    scene.add(ring);

    ring.lookAt(camera.position);
    return { ring, x, y, z };
}

for (let i = 1; i < 6; i++) {
    rings.push(createTextRing(i * Math.floor(steps / 5)));
}


function animate2() {
    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }

    if (rings, characterControls) {
        rings.forEach(({ ring, x, y, z }, index) => {
            ring.rotation.y += 0.01;

            // Check if the character is close enough to the portal ring
            const distance = characterControls.model.position.distanceTo(new THREE.Vector3(x, y, z));

            if (distance < 2) { // Adjust the threshold as needed
                // Show the portal image if not already shown
                if (currentPortalIndex !== index) {
                    currentPortalIndex = index;
                    // Show the portal image and set the corresponding source
                    const portalImage = document.getElementById('portalImage');
                    portalImage.src = portalImages[index % portalImages.length]; // Ensure the image wraps around
                    const overlay = document.getElementById('overlay');
                    overlay.style.display = 'block';
                }
            }
        });
    }

    // Hide the image after a certain time (e.g., 5 seconds)
    if (currentPortalIndex >= 0) {
        setTimeout(() => {
            document.getElementById('overlay').style.display = 'none';
            currentPortalIndex = -1;
        }, 500); // Adjust the time as needed
    }

    // Log the current camera position
    renderer.render(scene, camera);
    requestAnimationFrame(animate2);
}
// Array of portal images
var portalImages = [

    'pictureok.jpg'
];



// Scroll and animation control
let characterPosition = 0;
let scrollAmount = 0;
let touchStartY = 0;
let hasBlinked = false;
var currentPortalIndex = -1;
const overlay = document.getElementById('overlay');
let oldDeltaY = 0;
window.addEventListener('wheel', (event) => {
    // Determine scroll direction
    const scrollDirection = event.deltaY > 0 ? 1 : -1;

    // Update the scrollAmount based on wheel direction
    scrollAmount += event.deltaY * 0.01;
    scrollAmount = Math.max(0, Math.min(scrollAmount, stairs.length - 1)); // Clamp to stairs
    characterPosition = scrollAmount;

    if (characterControls) {
        const targetStep = stairs[Math.floor(characterPosition)];

        // Update character position to match the current step's position
        characterControls.model.position.set(targetStep.position.x, targetStep.position.y, targetStep.position.z);

        // Adjust rotation direction: face the correct direction based on scroll
        if (scrollDirection === -1) {
            // Scrolling down: face forward
            characterControls.model.rotation.set(targetStep.rotation.x, targetStep.rotation.y, targetStep.rotation.z);
        } else {
            // Scrolling up: face backward (rotate 180 degrees on Y-axis)
            characterControls.model.rotation.set(targetStep.rotation.x, targetStep.rotation.y + Math.PI, targetStep.rotation.z);
        }

        // Drone follows the character from behind, maintain a fixed offset
// Camera follow settings for climbing up and down (same for both)
const cameraOffset = new THREE.Vector3(0, 5, -10); // Adjust Y for height, Z for distance behind

// Modify the character update function
characterControls.updateCameraTarget = function() {
    // Calculate offset position behind the character
    const behindPosition = new THREE.Vector3(0, 0, 1); // Point behind
    behindPosition.applyQuaternion(this.model.quaternion).normalize(); // Rotate behind point with character's rotation
    behindPosition.multiplyScalar(cameraOffset.length()); // Scale to desired distance
    behindPosition.add(this.model.position); // Move to behind character

    // Set camera position and look at character
    camera.position.lerp(behindPosition, 0.05); // Smoothly follow with linear interpolation
    camera.lookAt(this.model.position.x, this.model.position.y + 2, this.model.position.z); // Adjust Y for eye level
};


        // Camera looks at the character to keep them in view
        camera.lookAt(characterControls.model.position); // Always look at the character
    }
});

// window.addEventListener('DOMContentLoaded', async () => {
//     // Wait for 1 second
//     await new Promise((resolve) => setTimeout(resolve, 1000));
    
//     // Scroll smoothly to 500 pixels down the page
//     window.scrollTo({
//         top: 500,
//         behavior: 'smooth'
//     });
    
//     console.log('Scrolling to 500 pixels down the page');
// });