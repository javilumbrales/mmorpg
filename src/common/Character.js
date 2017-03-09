'use strict';

const Serializer = require('incheon').serialize.Serializer;
const DynamicObject = require('incheon').serialize.DynamicObject;
const ThreeVector = require('incheon').serialize.ThreeVector;
const Utils = require('./Utils');

class Character extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            health: { type: Serializer.TYPES.INT32 },
            shield: { type: Serializer.TYPES.INT32 },
            kind: { type: Serializer.TYPES.INT32 },
            animations: { type: Serializer.TYPES.LIST, itemType: Serializer.TYPES.INT32 },
        }, super.netScheme);
    }
     get z() { return this.position.z; }

    toString() {
        return `Player::Character::${super.toString()} Kind::${this.kind}`;
    }

    get bendingAngleLocalMultiple() { return 0.0; }

    syncTo(other) {
        super.syncTo(other);
        this.health = other.health;
        this.shield = other.shield;
        this.kind = other.kind;
        this.animations = other.animations;
    }

    constructor(id, gameEngine, position, velocity, kind) {
        super(id, position, velocity);
        this.class = Character;
        this.position = new ThreeVector(0, 0, 0);
        this.velocity = new ThreeVector(0, 0, 0);
        if (position) {
            this.position.copy(position);
        }
        if (velocity) {
            this.velocity.copy(position);
        }
        this.gameEngine = gameEngine;
        this.kind = kind;

        this.health = this.original_health = 100;
        this.shield = this.original_shield = 5;
        this.animations = [];
        this.maxDistanceToTarget = 3;

        this.skills = {
            '1':{'duration': 1, 'action': {'param': 'attack', 'act':10, 'deact':0}},
            '2':{'duration': 100, 'action': {'param': 'heal', 'act': 4, 'deact': 0}},
            '3':{'duration': 1000, 'action': {'param': 'shield', 'act': 4, 'deact': -4}},
        };

        this.running = {};
    };

    applySkill(id, activate) {
        let skill = this.skills[id]['action'];
        this[skill['param']] = this[skill['param']] + activate ? skill['act'] : skill['deact'];
    }

    destroy() {
        if (this.onPreStep){
            this.gameEngine.removeListener('preStep', this.onPreStep);
            this.onPreStep = null;
        }
    }

    get maxSpeed() { return 1.0; }
}

module.exports = Character;
