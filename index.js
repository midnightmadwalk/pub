// import { CharacterControls } from './characterControls';
import * as THREE from "three";
import { CameraHelper } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ============================================
// Basic Three.js setup
let threeCanvas = document.getElementById("three-canvas");
let scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

let { width: w, height: h } = threeCanvas.getBoundingClientRect();
renderer.setSize(w, h);
threeCanvas.appendChild(renderer.domElement);

// --------------------- UTILS

const W = "w";
const A = "a";
const S = "s";
const D = "d";
const SHIFT = "shift";
const DIRECTIONS = [W, A, S, D];

class CharacterControls {
    // state
    toggleRun = true;

    // temporary data
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuarternion = new THREE.Quaternion();
    cameraTarget = new THREE.Vector3();

    // constants
    fadeDuration = 0.2;
    runVelocity = 5;
    walkVelocity = 2;

    constructor(
        model,
        mixer,
        animationsMap,
        orbitControl,
        camera,
        currentAction,
    ) {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.currentAction = currentAction;
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play();
            }
        });
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.updateCameraTarget(0, 0);
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun;
    }

    update(delta, keysPressed) {
        const directionPressed = DIRECTIONS.some(
            (key) => keysPressed[key] == true,
        );

        var play = "";
        if (directionPressed && this.toggleRun) {
            play = "Run";
        } else if (directionPressed) {
            play = "Walk";
        } else {
            play = "Idle";
        }

        if (this.currentAction != play) {
            const toPlay = this.animationsMap.get(play);
            const current = this.animationsMap.get(this.currentAction);

            current.fadeOut(this.fadeDuration);
            toPlay.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = play;
        }

        this.mixer.update(delta);

        if (this.currentAction == "Run" || this.currentAction == "Walk") {
            // calculate towards camera direction
            var angleYCameraDirection = Math.atan2(
                this.camera.position.x - this.model.position.x,
                this.camera.position.z - this.model.position.z,
            );
            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed);

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(
                this.rotateAngle,
                angleYCameraDirection + directionOffset,
            );
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0;
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(
                this.rotateAngle,
                directionOffset,
            );

            // run/walk velocity
            const velocity =
                this.currentAction == "Run"
                    ? this.runVelocity
                    : this.walkVelocity;

            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta;
            const moveZ = this.walkDirection.z * velocity * delta;
            this.model.position.x += moveX;
            this.model.position.z += moveZ;
            this.updateCameraTarget(moveX, moveZ);
            // Update drone position to follow the character
            const offset = new THREE.Vector3(-20, 30, -40);
            // Distance behind the character
            drone.position.copy(this.model.position).add(offset);
            drone.rotation.copy(this.model.rotation); // Make the drone match the
        }

        // console.log(stairs[0].position.y, stairs[1].position.y, stairs[2].position.y, stairs[3].position.y)

        // (this.model.position.y)
        // this.model.position.y+=0.009;
        // this.model.position.x-=0.009;
        stairs.map((a) => {
            if (
                Math.abs(a.position.x - this.model.position.x) < 0.8 &&
                Math.abs(a.position.z - this.model.position.z) < 0.8 &&
                Math.abs(a.position.y - this.model.position.y) < 1
            ) {
                this.model.position.y = a.position.y;
                // this.model.position.x = a.position.x
                // this.model.position.z = a.position.z
                // console.log(Math.ceil(Math.max(a.position.y, this.model.position.y)))
            }
        });
    }

    updateCameraTarget(moveX, moveZ) {
        this.camera.position.x += moveX;

        this.camera.position.z += moveZ;

        // Update only the camera target (the position the camera looks at)
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.z = this.model.position.z;
        this.orbitControl.target = this.cameraTarget; // Orbit controls will update the camera view accordingly
    }

    directionOffset(keysPressed) {
        var directionOffset = 0; // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4; // w+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4; // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
            } else {
                directionOffset = Math.PI; // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2; // a
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2; // d
        }

        return directionOffset;
    }
}

// ==========================

// Load textures for the cube faces
const textureLoader_cube = new THREE.TextureLoader();
const textures = {
    front: textureLoader_cube.load("collage.jpg"),
    back: textureLoader_cube.load("collage.jpg"),
    top: textureLoader_cube.load("collage.jpg"),
    bottom: textureLoader_cube.load("collage.jpg"),
    left: textureLoader_cube.load("collage.jpg"), // Earth base (adjust if you want to change)
    right: textureLoader_cube.load("collage.jpg"), // Earth base (adjust if you want to change)
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
    // Set the skybox to a fixed position relative to the world
    cube.position.set(camera.position.x, camera.position.y, camera.position.z);
}

const earth = scene.getObjectByName("earth"); // Assuming earth is added with a name
if (earth) {
    earth.position.set(camera.position.x, -50, camera.position.z); // Keeping it below the camera
}

// CAMERA
// const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 3.82970197029123;
camera.position.y = 7.209891012098961;
camera.position.z = 8.167297687379282;

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true; // Smooth rotation
orbitControls.dampingFactor = 0.25; // Adjust smoothness of the rotation
orbitControls.rotateSpeed = 1.0; // Adjust the sensitivity of the rotation
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false; // Disable pan
orbitControls.enableRotate = false; // Disable angle movement
orbitControls.enableZoom = false; // Disable zoom with the scroll wheel
orbitControls.update(); // Update control

// LIGHTS
light();

// MODEL WITH ANIMATIONS
var characterControls;
new GLTFLoader().load(
    "Soldier.glb",
    function (gltf) {
        const model = gltf.scene;

        // Set the position of the model (for example, at x=5, y=0, z=1)
        model.position.set(5, 0, 1);

        // Rotate the model to face the reverse direction (180 degrees around the Y-axis)
        model.rotation.y = Math.PI; // 180 degrees in radians
        ``;
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
        gltfAnimations
            .filter((a) => a.name != "TPose")
            .forEach((a) => {
                animationsMap.set(a.name, mixer.clipAction(a));
            });

        // Initialize the character controls with the loaded model and animations
        characterControls = new CharacterControls(
            model,
            mixer,
            animationsMap,
            orbitControls,
            camera,
            "Idle",
        );
    },
    undefined,
    function (error) {
        console.error("An error occurred while loading the .glb file:", error);
    },
);

// Create the drone (a cube for simplicity)
const droneGeometry = new THREE.BoxGeometry(1, 1, 1); // Cube geometry
const droneMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Red color
const drone = new THREE.Mesh(droneGeometry, droneMaterial);
scene.add(drone);

// CONTROL KEYS
const keysPressed = {};
document.addEventListener(
    "keydown",
    (event) => {
        keyDisplayQueue.down(event.key);
        if (event.shiftKey && characterControls) {
            characterControls.switchRunToggle();
        } else {
            keysPressed[event.key.toLowerCase()] = true;
        }
    },
    false,
);
document.addEventListener(
    "keyup",
    (event) => {
        keyDisplayQueue.up(event.key);
        keysPressed[event.key.toLowerCase()] = false;
    },
    false,
);

const clock = new THREE.Clock();
// ANIMATE

animate2();

function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-60, 100, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
}

// Lighting
const sunlight = new THREE.DirectionalLight(0xffff00, 1.0);
sunlight.position.set(50, 50, 50);
sunlight.castShadow = true;
scene.add(sunlight);

// Tree trunk
const height = 60;
const steps = 120;
const trunkGeometry = new THREE.CylinderGeometry(1, 2, height, 16);
const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
trunk.position.y = height / 2;
scene.add(trunk);

// Load texture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("eq.png"); // Replace with the actual path to your texture file
const stepGeometry = new THREE.BoxGeometry(7, 0.8, 1); // Define the step geometry

// Step material with texture
const stepMaterial = new THREE.MeshLambertMaterial({
    map: texture, // Apply the texture to the material
    side: THREE.DoubleSide,
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
var isNearRing = false;
function createTextRing(stepIndex) {
    const angle = stepIndex * angleIncrement;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = heightIncrement * stepIndex;
    const geometry = new THREE.RingGeometry(2, 3, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x8a2be2,
        side: THREE.DoubleSide,
        transparent: true,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(x, y, z);

    scene.add(ring);

    ring.lookAt(camera.position);
    return { ring, x, y, z };
}

for (let i = 1; i < 6; i++) {
    rings.push(createTextRing(i * Math.floor(steps / 5)));
}
let justOutsideRing = false;

function animate2() {
    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }

    if ((rings, characterControls)) {
        rings.forEach(({ ring, x, y, z }, index) => {
            // ring.rotation.y += 0.01;

            // Check if the character is close enough to the portal ring
            const distance = characterControls.model.position.distanceTo(
                ring.position,
            );

            if (distance < 1) {
                isClimbing = false; // Finish climbing after specified duration
                hasScrolled = false;
                isNearRing = true;
                // Adjust the threshold as needed
                // Show the portal image if not already shown
                if (currentPortalIndex !== index) {
                    currentPortalIndex = index;
                    // Show the portal image and set the corresponding source
                    const portalImage = document.getElementById("portalImage");
                    portalImage.src = portalImages[index % portalImages.length]; // Ensure the image wraps around
                    const overlay = document.getElementById("overlay");
                    overlay.style.display = "block";

                    characterControls.model.position.add({
                        x: 0,

                        y: 0.5,

                        z: 0.5,
                    });
                }
            }
        });
    }

    // Hide the image after a certain time (e.g., 5 seconds)
    if (currentPortalIndex >= 0) {
        setTimeout(() => {
            document.getElementById("overlay").style.display = "none";
            currentPortalIndex = -1;
        }, 500); // Adjust the time as needed
    }

    // Log the current camera position
    renderer.render(scene, camera);
    requestAnimationFrame(animate2);
}
// Array of portal images
var portalImages = [
    "pictureok.jpg",
    "pictureok1.jpg",
    "pictureok2.jpg",
    "pictureok3.jpg",
    "pictureok4.jpg",
];
var currentPortalIndex = -1;

var isClimbing = false; // Flag to track if the character is climbing
let climbDirection = 0; // -1 for down, 1 for up
let climbDuration = 100; // Duration in seconds for the climb (adjust as needed)
let climbSpeed = 0.07; // Speed of climbing (adjust as needed)

let characterPosition = 0; // Track the current position of the character
let scrollAmount = 0;
var hasScrolled = false;

// Capture the first scroll event and start climbing automatically
window.addEventListener("wheel", (event) => {
    climbDirection = event.deltaY > 0 ? 1 : -1;
    if (isClimbing || hasScrolled) return;

    // Set hasScrolled to true to prevent further manual scrolling
    hasScrolled = true;

    // Prevent default scroll behavior
    event.preventDefault();

    // Start climbing the stairs automatically
    startClimbing();
});

// DOM Content Loaded Event
window.addEventListener("DOMContentLoaded", async (event) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    climbDirection = 1;
    if (isClimbing || hasScrolled) return; // Ignore scroll if already climbing or scrolled once

    // Set hasScrolled to true to prevent further manual scrolling
    // hasScrolled = true;

    // // Prevent default scroll behavior
    // event.preventDefault();

    // // Start climbing the stairs automatically
    // startClimbing();
});

let touchStartY = 0;

let touchEndY = 0;
document.addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0].clientY;
});

document.addEventListener("touchend", (event) => {
    touchEndY = event.changedTouches[0].clientY;
    climbDirection = touchStartY - touchEndY > 1 ? 1 : -1;
    if (isClimbing || hasScrolled) return; // Ignore scroll if already climbing or scrolled once

    // Set hasScrolled to true to prevent further manual scrolling
    hasScrolled = true;

    // Determine scroll direction

    // Prevent default scroll behavior
    event.preventDefault();

    // Start climbing the stairs automatically
    startClimbing();
});

// Function to start the climbing process automatically
function startClimbing() {
    isClimbing = true;
    let startTime = Date.now();

    // Function to animate the character's climb
    function climb() {
        let elapsedTime = (Date.now() - startTime) / 1000; // Time elapsed in seconds

        if (
            !isClimbing ||
            elapsedTime >= climbDuration ||
            (climbDirection == -1 && characterControls.model.position.y < 1)
        ) {
            isClimbing = false; // Finish climbing after specified duration
            resetScrolling(); // Allow user to scroll again after auto-climb finishes
            keysPressed["w"] = false;
            keysPressed["s"] = false;
            return; // Stop the climbing animation
        }

        // Update scroll amount based on climb speed and direction
        scrollAmount += climbSpeed * climbDirection;

        // Ensure within bounds of stairs array length
        scrollAmount = Math.max(0, Math.min(scrollAmount, stairs.length - 1));

        characterPosition = Math.floor(scrollAmount); // Update character position index

        if (characterControls && stairs.length > 0) {
            const targetStep = stairs[characterPosition];
            const targetPosition = targetStep.position.clone();
            characterControls.model.position.lerp(targetPosition, 0.05);

            // Update character position to match current step's position
            characterControls.model.position.set(
                targetStep.position.x,
                targetStep.position.y,
                targetStep.position.z,
            );

            // Adjust rotation direction based on climb direction
            if (climbDirection === -1) {
                keysPressed["s"] = true;
                characterControls.model.rotation.set(
                    targetStep.rotation.x,
                    targetStep.rotation.y,
                    targetStep.rotation.z,
                );
            } else {
                keysPressed["w"] = true;
                characterControls.model.rotation.set(
                    targetStep.rotation.x,
                    targetStep.rotation.y + Math.PI,
                    targetStep.rotation.z,
                );
            }
        }

        // Programmatically update camera position to follow character
        updateCameraPosition();

        // Continue animating
        requestAnimationFrame(climb);
    }
    ``;
    // Start the climbing loop
    climb();
}

function updateCameraPosition() {
    const cameraOffset = new THREE.Vector3(0, 7, -5);

    // Calculate the target position behind the character
    let cameraAngle =
        climbDirection > 0
            ? new THREE.Vector3(0, 1, 2)
            : new THREE.Vector3(-1, 0, -2);
    const targetPosition = characterControls.model.position
        .clone()
        .add(
            cameraAngle
                .applyQuaternion(characterControls.model.quaternion)
                .normalize()
                .multiplyScalar(cameraOffset.length()),
        );

    // Smoothly interpolate the camera position
    camera.position.lerp(targetPosition, 0.05);

    // Calculate the target look-at position (character's position)
    const targetLookAt = characterControls.model.position.clone();

    // Smoothly interpolate the "look-at" direction
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt).add(camera.position); // Convert to world coordinates
    const smoothedLookAt = new THREE.Vector3().lerpVectors(
        currentLookAt,
        targetLookAt,
        0.05,
    );

    // Update the camera orientation
    camera.lookAt(smoothedLookAt);
}

// To reset scroll state and allow manual scrolling again (if needed)
function resetScrolling() {
    hasScrolled = false;
}
