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
            aggressive: { type: Serializer.TYPES.INT32 },
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
        this.aggressive = other.aggressive;
        this.animations = other.animations;
    }

    constructor(id, gameEngine, position, velocity, height, aggressive) {
        super(id, position, velocity);
        this.class = Mob;
        this.gameEngine = gameEngine;
        this.height = height;
        this.aggressive = aggressive ? 1 : 0;
        this.health = this.original_health = 10;
        this.attack = 9;
        this.shield = this.original_shield = 5;
        this.animations = [];
        this.maxDistanceToTarget = 10;
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

        let fireLoopTime = Math.round(50 + Math.random() * 100);
        this.fireLoop = this.gameEngine.timer.loop(fireLoopTime, () => {
            if (this.target && this.distanceToTargetSquared(this.target) < this.maxDistanceToTarget) {
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

    getTarget() {
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

        // Attack only if in range
        return closestDistance2 < this.aggresiveRange ?  closestTarget : null;
    }

    steer() {

        if (this.aggressive) {
            this.target = this.target || this.getTarget();
        }

        if (this.target) {

            this.calc(this.position, this.target.position);
        }
    }
    truncate(vector,  max) {
        var i ;

        i = max / vector.length();
        i = i < 1.0 ? i : 1.0;

        vector.multiplyScalar(i);
        return vector;
    }

    distance(targeta, targetb) {
        let dx = targeta.x - targetb.x;
        let dy = targeta.y - targetb.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calc(position, target) {
        var d = this.distance(position, target);
        if (d < 1) {
            //console.log(d, 'Arrived');
            return
        }
        var currentVelocity = this.currentVelocity || new TwoVector(0,0);

        let max_velocity = 1;
        let max_force = 0.5;
        let max_speed = 1;
        let mass = 2;

        let dvelocity = (new TwoVector(0,0)).copy(target).subtract(position);
        dvelocity.normalize();
        let desired_velocity = dvelocity.multiplyScalar(max_velocity);

        let steering = desired_velocity.subtract(currentVelocity);

        //console.log('p', position, 't', target, 'v', currentVelocity, 'dv', desired_velocity, 's', steering);

        // Make sure doesn't go beyond the max_force
        steering = this.truncate(steering, max_force);

        // Objet mass should have an inpact
        steering = steering.multiplyScalar(1/mass);

        // Make sure it doesn't go faster than allowed
        currentVelocity = this.truncate(currentVelocity.add(steering), max_speed);
        position = position.add(currentVelocity);

        //console.log('p', position, 'v', currentVelocity);
        console.log("Mob position:", position, "Target position:", target);
    }
}

    module.exports = Mob;
