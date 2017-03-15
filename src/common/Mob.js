'use strict';

const Serializer = require('incheon').serialize.Serializer;
const DynamicObject = require('incheon').serialize.DynamicObject;
const TwoVector = require('incheon').serialize.TwoVector;
const Utils = require('./Utils');
const Character = require('./Character');

class Mob extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            height: { type: Serializer.TYPES.INT32 },
            health: { type: Serializer.TYPES.INT32 },
            animations: { type: Serializer.TYPES.LIST, itemType: Serializer.TYPES.INT32 },
        }, super.netScheme);
    }

    toString() {
        return `Mob::${super.toString()} Height=${this.height}`;
    }

    get bendingAngleLocalMultiple() { return 0.0; }

    syncTo(other) {
        super.syncTo(other);
        this.height = other.height;
        this.health = other.health;
        this.animations = other.animations;
    }

    constructor(id, gameEngine, position, velocity, height, kind) {
        super(id, position, velocity);
        this.class = Mob;
        this.height = height;
        this.gameEngine = gameEngine;
        this.health = this.original_health = 10;
        this.attack = 9;
        this.shield = this.original_shield = 5;
        this.animations = [];
        this.maxDistanceToTarget = 18;
        this.aggresiveRange = 1000;


        this.running = {};
    }

    get maxSpeed() { return 0.05; }

    destroy() {
        if (this.fireLoop) {
            this.fireLoop.destroy();
        }
        if (this.onPreStep){
            this.gameEngine.removeListener('preStep', this.onPreStep);
            this.onPreStep = null;
        }
    }


    attachAI() {

        this.onPreStep = () => {
            this.steer();
        };

        this.gameEngine.on('preStep', this.onPreStep);

        let fireLoopTime = Math.round(250 + Math.random() * 100);
        this.fireLoop = this.gameEngine.timer.loop(fireLoopTime, () => {
            if (this.target && this.distanceToTargetSquared(this.target) < this.maxDistanceToTarget) {
                this.isAccelerating = false;
                console.log('Mob attacking target');
                this.gameEngine.attack(this, this.target);
            }
        });
    }

    shortestVector(p1, p2, wrapDist) {
        let d = Math.abs(p2 - p1);
        if (d > Math.abs(p2 + wrapDist - p1)) p2 += wrapDist;
        else if (d > Math.abs(p1 + wrapDist - p2)) p1 += wrapDist;
        return p2 - p1;
    }

    distanceToTargetSquared(target) {
        let dx = this.shortestVector(this.position.x, target.position.x, this.gameEngine.worldSettings.width);
        let dy = this.shortestVector(this.position.y, target.position.y, this.gameEngine.worldSettings.height);
        return dx * dx + dy * dy;
    }

    steer() {
        let closestTarget = null;
        let closestDistance2 = Infinity;
        for (let objId of Object.keys(this.gameEngine.world.objects)) {
            let obj = this.gameEngine.world.objects[objId];
            if (obj.class === Character) {
                let distance2 = this.distanceToTargetSquared(obj);
                if (distance2 < closestDistance2) {
                    closestTarget = obj;
                    closestDistance2 = distance2;
                }
            }
        }

        this.target = closestTarget;

        // Attack only if in range
        if (this.target && closestDistance2 < this.aggresiveRange && closestDistance2 > this.maxDistanceToTarget) {

            let newVX = this.shortestVector(this.position.x, this.target.position.x, this.gameEngine.worldSettings.width);
            let newVY = this.shortestVector(this.position.y, this.target.position.y, this.gameEngine.worldSettings.height);
            let angleToTarget = Math.atan2(newVX, newVY)/Math.PI* 180;
            angleToTarget *= -1;
            angleToTarget += 90; // game uses zero angle on the right, clockwise
            if (angleToTarget < 0) angleToTarget += 360;
            let turnRight = this.shortestVector(this.angle, angleToTarget, 360);

            if (turnRight > 4) {
                this.isRotatingRight = true;
            } else if (turnRight < -4) {
                this.isRotatingLeft = true;
            } else {
                this.isAccelerating = true;
            }

        }
    }
}

module.exports = Mob;
