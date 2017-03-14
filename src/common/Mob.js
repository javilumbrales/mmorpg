'use strict';

const Serializer = require('incheon').serialize.Serializer;
const DynamicObject = require('incheon').serialize.DynamicObject;
const TwoVector = require('incheon').serialize.TwoVector;
const Utils = require('./Utils');

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
        this.height = height

        this.gameEngine = gameEngine;

        this.health = this.original_health = 10;
        this.attack = 5;
        this.shield = this.original_shield = 5;
        this.animations = [];
        this.maxDistanceToTarget = 10;

        this.running = {};
    };


    destroy() {
        if (this.onPreStep){
            this.gameEngine.removeListener('preStep', this.onPreStep);
            this.onPreStep = null;
        }
    }

    get maxSpeed() { return 1.0; }
}

module.exports = Mob;
