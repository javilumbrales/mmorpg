'use strict';

const Serializer = require('incheon').serialize.Serializer;
const DynamicObject = require('incheon').serialize.DynamicObject;
const Point = require('incheon').Point;
const Utils = require('./Utils');

class Character extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            health: { type: Serializer.TYPES.INT32 },
            animation: { type: Serializer.TYPES.INT32 },
            name: { type: Serializer.TYPES.LIST, itemType: Serializer.TYPES.INT32 },
        }, super.netScheme);
    }

    toString() {
        return `Player::Character::${super.toString()}`;
    }

    setName(str) {
        var buf = new ArrayBuffer(str.length*2);
        var bufView = new Uint16Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        this.name = bufView;
    }

    getName() {
        return String.fromCharCode.apply(null, this.name);
    }

    get bendingAngleLocalMultiple() { return 0.0; }

    copyFrom(sourceObj) {
        super.copyFrom(sourceObj);
        this.health = sourceObj.health;
        this.name = sourceObj.name;
    }

    syncTo(other) {
        super.syncTo(other);
        this.health = other.health;
        this.name = other.name;
    }

    constructor(id, gameEngine, name, x, y) {
        super(id, x, y);
        this.class = Character;
        this.gameEngine = gameEngine;
        name && this.setName(name);
        this.health = this.original_health = 100;
        this.shield = this.original_shield = 5;
        this.animation = 0;
        this.maxDistanceToTarget = 3;

        this.skills = {
            '1':{'duration': 100, 'action': {'health': 20}},
            '2':{'duration': 10, 'action': {'attack': 10}},
            '3':{'duration': 10000, 'action': {'shield': 4}},
        };
    };

    destroy() {
        if (this.onPreStep){
            this.gameEngine.removeListener('preStep', this.onPreStep);
            this.onPreStep = null;
        }
    }

    get maxSpeed() { return 1.0; }
}

module.exports = Character;
