import * as THREE from 'three';

export class Collision {
  constructor(scene, character, floorHeight) {
    this.scene = scene;
    this.character = character;
    this.floorHeight = floorHeight;  // The height of the floor to align with the character
    this.staircase = [];
    this.trunk = null;
  }

  // Detect if the character is colliding with an object
  checkCollision(object) {
    const characterBox = new THREE.Box3().setFromObject(this.character);
    const objectBox = new THREE.Box3().setFromObject(object);
    
    return characterBox.intersectsBox(objectBox);
  }

  // Handle interaction when colliding with the trunk (e.g., no collision, block movement)
  handleTrunkCollision() {
    if (this.trunk && this.checkCollision(this.trunk)) {
      console.log("Character is colliding with the trunk.");
      // Prevent movement or stop character
      this.character.position.y = this.floorHeight + 0.5;  // Keep character above the trunk
    }
  }

  // Handle interaction when colliding with the staircase (e.g., allow climbing)
  handleStaircaseCollision() {
    this.staircase.forEach((step) => {
      if (this.checkCollision(step)) {
        console.log("Character is colliding with a staircase step.");
        // Enable climbing behavior, adjust character's vertical position
        this.character.position.y = step.position.y + 1;
      }
    });
  }

  // Update all collision checks
  update() {
    this.handleTrunkCollision();
    this.handleStaircaseCollision();
  }

  // Add the trunk object for collision
  addTrunk(trunk) {
    this.trunk = trunk;
  }

  // Add staircase steps for collision
  addStaircaseStep(step) {
    this.staircase.push(step);
  }
}
