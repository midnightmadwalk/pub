import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let threeCanvas = document.getElementById("three-canvas");
let scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.1,1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

let { width: w, height: h } = threeCanvas.getBoundingClientRect();
renderer.setSize(w, h);
threeCanvas.appendChild(renderer.domElement);

const W = "w";
const A = "a";
const S = "s";
const D = "d";
const DIRECTIONS = [W, A, S, D];

class CharacterControls {
    toggleRun = true;
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuarternion = new THREE.Quaternion();
    cameraTarget = new THREE.Vector3();
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
            var angleYCameraDirection = Math.atan2(
                this.camera.position.x - this.model.position.x,
                this.camera.position.z - this.model.position.z,
            );
            var directionOffset = this.directionOffset(keysPressed);
            this.rotateQuarternion.setFromAxisAngle(
                this.rotateAngle,
                angleYCameraDirection + directionOffset,
            );
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);
            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0;
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(
                this.rotateAngle,
                directionOffset,
            );
            const velocity =
                this.currentAction == "Run"
                    ? this.runVelocity
                    : this.walkVelocity;

            const moveX = this.walkDirection.x * velocity * delta;
            const moveZ = this.walkDirection.z * velocity * delta;
            this.model.position.x += moveX;
            this.model.position.z += moveZ;
            this.updateCameraTarget(moveX, moveZ);
            const offset = new THREE.Vector3(-20, 30, -40);
            drone.position.copy(this.model.position).add(offset);
            drone.rotation.copy(this.model.rotation);
        }
        stairs.map((a) => {
            if (
                Math.abs(a.position.x - this.model.position.x) < 0.8 &&
                Math.abs(a.position.z - this.model.position.z) < 0.8 &&
                Math.abs(a.position.y - this.model.position.y) < 1
            ) {
                this.model.position.y = a.position.y;
            }
        });
    }

    updateCameraTarget(moveX, moveZ) {
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.z = this.model.position.z;
        this.orbitControl.target = this.cameraTarget;
    }

    directionOffset(keysPressed) {
        var directionOffset = 0;
        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4;
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4;
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2;
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2;
            } else {
                directionOffset = Math.PI;
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2;
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2;
        }
        return directionOffset;
    }
}

const textureLoader_cube = new THREE.TextureLoader();
const textures = {
    front: textureLoader_cube.load("collage.jpg"),
    back: textureLoader_cube.load("collage.jpg"),
    top: textureLoader_cube.load("collage.jpg"),
    bottom: textureLoader_cube.load("collage.jpg"),
    left: textureLoader_cube.load("collage.jpg"),
    right: textureLoader_cube.load("collage.jpg"),
};

const cubeGeometry = new THREE.BoxGeometry(500, 500, 500);
const cubeMaterials = [
    new THREE.MeshBasicMaterial({ map: textures.front, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ map: textures.back, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ map: textures.top, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ map: textures.bottom, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ map: textures.left, side: THREE.BackSide }),
    new THREE.MeshBasicMaterial({ map: textures.right, side: THREE.BackSide }),
];

const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
cube.position.set(0, 0, 0);
scene.add(cube);

const earth = scene.getObjectByName("earth");
if (earth) {
    earth.position.set(camera.position.x, -50, camera.position.z);
}

camera.position.x = 3.82970197029123;
camera.position.y = 7.209891012098961;
camera.position.z = 8.167297687379282;
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.25;
orbitControls.rotateSpeed = 1.0;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.enableRotate = false;
orbitControls.enableZoom = false;
orbitControls.update();
light();

var characterControls;
new GLTFLoader().load(
    "Soldier.glb",
    function (gltf) {
        const model = gltf.scene;
        model.position.set(5, 0, 1);
        model.rotation.y = Math.PI;
        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
        });
        scene.add(model);
        const gltfAnimations = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map();
        gltfAnimations
            .filter((a) => a.name != "TPose")
            .forEach((a) => {
                animationsMap.set(a.name, mixer.clipAction(a));
            });
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

const droneGeometry = new THREE.BoxGeometry(1, 1, 1);
const droneMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const drone = new THREE.Mesh(droneGeometry, droneMaterial);
scene.add(drone);

const keysPressed = {};
document.addEventListener(
    "keydown",
    (event) => {
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
        keysPressed[event.key.toLowerCase()] = false;
    },
    false,
);

const clock = new THREE.Clock();
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
const texture = textureLoader.load("eq.png");
const stepGeometry = new THREE.BoxGeometry(7, 0.8, 1);

const stepMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    side: THREE.DoubleSide,
});


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

var rings = [];
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

function animate2() {
    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }

    if ((rings, characterControls)) {
        rings.forEach(({ ring, x, y, z }, index) => {
            ring.rotation.y += 0.01;
            const distance = characterControls.model.position.distanceTo(
                ring.position,
            );

            if (distance < 1) {
                isClimbing = false;
                hasScrolled = false;
                if (currentPortalIndex !== index) {
                    currentPortalIndex = index;
                    const portalImage = document.getElementById("portalImage");
                    portalImage.src = portalImages[index % portalImages.length];
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
    renderer.render(scene, camera);
    requestAnimationFrame(animate2);
}

var portalImages = [
    "SWD1.jpg",
    "SWD2.jpg",
    "SWD3.jpg",
    "WABI1.jpg",
    "WABI2.jpg",
];
var currentPortalIndex = -1;

var isClimbing = false;
let climbDirection = 0;
let climbDuration = 100;
let climbSpeed = 0.07;

let characterPosition = 0;
let scrollAmount = 0;
var hasScrolled = false;

window.addEventListener("wheel", (event) => {
    climbDirection = event.deltaY > 0 ? 1 : -1;
    if (isClimbing || hasScrolled) return;
    hasScrolled = true;
    event.preventDefault();
    startClimbing();
});

window.addEventListener("DOMContentLoaded", async (event) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    climbDirection = 1;
    if (isClimbing || hasScrolled) return;

    hasScrolled = true;
    event.preventDefault();
    startClimbing();
});

let touchStartY = 0;

let touchEndY = 0;
document.addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0].clientY;
});

document.addEventListener("touchend", (event) => {
    touchEndY = event.changedTouches[0].clientY;
    climbDirection = touchStartY - touchEndY > 1 ? 1 : -1;
    if (isClimbing || hasScrolled) return;
    hasScrolled = true;
    event.preventDefault();
    startClimbing();
});

function startClimbing() {
    isClimbing = true;
    let startTime = Date.now();
    function climb() {
        let elapsedTime = (Date.now() - startTime) / 1000;

        if (
            !isClimbing ||
            elapsedTime >= climbDuration ||
            (climbDirection == -1 && characterControls.model.position.y < 1)
        ) {
            isClimbing = false;
            resetScrolling();
            keysPressed["w"] = false;
            keysPressed["s"] = false;
            return;
        }
        scrollAmount += climbSpeed * climbDirection;
        scrollAmount = Math.max(0, Math.min(scrollAmount, stairs.length - 1));
        characterPosition = Math.floor(scrollAmount);

        if (characterControls && stairs.length > 0) {
            const targetStep = stairs[characterPosition];
            const targetPosition = targetStep.position.clone();
            characterControls.model.position.lerp(targetPosition, 0.05);
            characterControls.model.position.set(
                targetStep.position.x,
                targetStep.position.y,
                targetStep.position.z,
            );
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
        updateCameraPosition();
        document.getElementById("overlay").style.display = "none";
        currentPortalIndex = -1;
        requestAnimationFrame(climb);
    }
    climb();
}

function updateCameraPosition() {
    const cameraOffset = new THREE.Vector3(0, 7, -5);
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
    camera.position.lerp(targetPosition, 0.05);
    const targetLookAt = characterControls.model.position.clone();
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt).add(camera.position);
    const smoothedLookAt = new THREE.Vector3().lerpVectors(
        currentLookAt,
        targetLookAt,
        0.05,
    );
    camera.lookAt(smoothedLookAt);
}

function resetScrolling() {
    hasScrolled = false;
}
