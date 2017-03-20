'use strict';

const Serializer = require('incheon').serialize.Serializer;
const DynamicObject = require('incheon').serialize.DynamicObject;
const TwoVector = require('incheon').serialize.TwoVector;
const Utils = require('./Utils');

class Character extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            height: { type: Serializer.TYPES.INT32 },
            health: { type: Serializer.TYPES.INT32 },
            shield: { type: Serializer.TYPES.INT32 },
            kind:   { type: Serializer.TYPES.INT32 },
            skills: { type: Serializer.TYPES.LIST, itemType: Serializer.TYPES.INT32 },
        }, super.netScheme);
    }

    toString() {
        return `Player::Character::${super.toString()} Height=${this.height} Kind=${this.kind}`;
    }

    get bendingAngleLocalMultiple() { return 0.0; }

    syncTo(other) {
        super.syncTo(other);
        this.height = other.height;
        this.health = other.health;
        this.shield = other.shield;
        this.kind = other.kind;
        this.skills = other.skills;
        console.log('syncTo', this.skills);
    }
    interpolate(nextObj, playPercentage, worldSettings) {
        super.interpolate(nextObj, playPercentage, worldSettings);
        this.skills = nextObj.skills;
    }

    constructor(id, gameEngine, position, velocity, height, kind) {
        super(id, position, velocity);
        this.class = Character;
        this.height = height

        this.gameEngine = gameEngine;
        this.kind = kind;

        this.health = this.original_health = 100;
        this.shield = this.original_shield = 5;
        this.attack = 10;
        this.skills = [];
        this.maxDistanceToTarget = 18;

        this.skillset = {
            '1':{'duration': 1, 'action': {'applicable': false, 'param': 'attack', 'act':10, 'deact':0}},
            '2':{'duration': 100, 'coolDown': 1000, 'action': {'applicable': true, 'param': 'health', 'act': 4, 'deact': 0}},
            '3':{'duration': 1000, 'coolDown': 10000, 'action': {'applicable': true, 'param': 'shield', 'act': 4, 'deact': -4}},
            '4':{'duration': 15, 'action': {'applicable': false, 'param': 'teleport', 'act':true, 'deact': false}},
        };

        this.running = {};
        this.coolDown = {};
    };

    destroy() {
        if (this.onPreStep){
            this.gameEngine.removeListener('preStep', this.onPreStep);
            this.onPreStep = null;
        }
    }

    get maxSpeed() { return 0.3; }

    processSkills() {
        for(var a = 0; a <this.skills.length; a++) {
            console.log(this.skills, this.running);
            this.running[this.skills[a]]--;
            if (this.running[this.skills[a]] <=0) {
                this.applySkill(this.skills[a], false);
                delete this.running[this.skills[a]];
                this.skills.splice(a, 1);
            }
        }
    }
    useSkill(id) {
        if(this.skills.indexOf(id) === -1) {
            this.skills.push(id);
        }
        this.running[id] = this.skillset[id]['duration'];
    }

    applySkill(id, activate) {
        let skill = this.skillset[id]['action'];
        if (!skill.applicable) {
            return;
        }
        console.log('applySkill before', this[skill['param']]);
        this[skill['param']] = this[skill['param']] + (activate ? skill['act'] : skill['deact']);
        console.log('applySkill after', this[skill['param']]);
    }

    gotoPlace(destination) {
        console.log(`Moving player ${this.id}  from ${this.position} to: ${destination}`);
        //this.moveToTarget(o);
        let direction = (new TwoVector(0,0)).copy(destination).subtract(this.position);
        //console.log('direction', direction);
        direction.normalize();
        let delta = direction.multiplyScalar(this.maxSpeed);
        let distanceToTarget = Utils.distance(new TwoVector(this.x, this.y), new TwoVector(destination.x, destination.y));
        console.log('direction', direction, 'delta', delta, 'distance to target', distanceToTarget);
        if (distanceToTarget < 1) {
            this.destination = null;
            this.velocity.set(0,0);
            console.log('Arrived to destination');
        } else {
            this.velocity.set(delta.x, delta.y);
        }
    }
}

module.exports = Character;
