'use strict';

const Serializer = require('incheon').serialize.Serializer;
const DynamicObject = require('incheon').serialize.DynamicObject;
const Point = require('incheon').Point;
const Utils = require('./Utils');

class Character extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            showThrust: { type: Serializer.TYPES.INT32 }
        }, super.netScheme);
    }

    toString() {
        return `${this.isBot?'Bot':'Player'}::Character::${super.toString()}`;
    }

    get bendingAngleLocalMultiple() { return 0.0; }

    copyFrom(sourceObj) {
        super.copyFrom(sourceObj);
        this.showThrust = sourceObj.showThrust;
    }

    syncTo(other) {
        super.syncTo(other);
        this.showThrust = other.showThrust;
    }

    constructor(id, gameEngine, x, y) {
        super(id, x, y);
        this.class = Character;
        this.gameEngine = gameEngine;
        this.showThrust = 0;
    };

    destroy() {
        if (this.fireLoop) {
            this.fireLoop.destroy();
        }
        if (this.onPreStep){
            this.gameEngine.removeListener('preStep', this.onPreStep);
            this.onPreStep = null;
        }
    }

    get maxSpeed() { return 3.0; }

    attachAI() {
        this.isBot = true;

        this.onPreStep = () => {
            this.steer();
        };

        this.gameEngine.on('preStep', this.onPreStep);

        let fireLoopTime = Math.round(250 + Math.random() * 100);
        this.fireLoop = this.gameEngine.timer.loop(fireLoopTime, () => {
            if (this.target && this.distanceToTarget(this.target) < 400) {
                this.gameEngine.makeMissile(this);
            }
        });
    }

    distanceToTarget(target) {
        let dx = this.x - target.x;
        let dy = this.y - target.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    steer() {
        let closestTarget = null;
        let closestDistance = Infinity;
        for (let objId of Object.keys(this.gameEngine.world.objects)) {
            let obj = this.gameEngine.world.objects[objId];
            let distance = this.distanceToTarget(obj);
            if (obj != this && distance < closestDistance) {
                closestTarget = obj;
                closestDistance = distance;
            }
        }
        this.target = closestTarget;

        if (this.target) {
            let desiredVelocity = new Point();
            desiredVelocity.copyFrom(this.target).subtract(this.x, this.y);
            let turnRight = -Utils.shortestArc(Math.atan2(desiredVelocity.y, desiredVelocity.x), Math.atan2(Math.sin(this.angle*Math.PI/180), Math.cos(this.angle*Math.PI/180)));

            if (turnRight > 0.05) {
                this.isRotatingRight = true;
            } else if (turnRight < -0.05) {
                this.isRotatingLeft = true;
            } else {
                this.isAccelerating = true;
                this.showThrust = 5;
            }

        }
    }
}

module.exports = Character;
