'use strict';

const GameEngine = require('incheon').GameEngine;
const TwoVector = require('incheon').serialize.TwoVector;
const Character = require('./Character');
const NPC = require('./NPC');
const Mob = require('./Mob');
const Timer = require('./Timer');
const Utils = require('./Utils');


class MMORPGGameEngine extends GameEngine {

    start() {
        let that = this;
        super.start();

        this.timer = new Timer();
        this.timer.play();
        this.worldSettings = {
            worldWrap: false,
            width: 500,
            height: 500
        };
        this.Epsilon = 0.1;
        this.skills = {
            'attack': 1,
            'heal': 2,
            'shield': 3,
            'teleport': 4
        };


        this.on('server__postStep', ()=>{
            this.timer.tick();
            for (let objId of Object.keys(this.world.objects)) {
                let o = this.world.objects[objId];
                if (o.skills && o.skills.length) {
                    o.processSkills();
                }
                if (o.destination) {
                    o.gotoPlace(o.destination);
                }
            }
        });

        this.on('server__inputReceived', (data)=>{

        let playerCharacter = this.getPlayerCharacter(data.playerId);

        if (playerCharacter) {
            let inputData = data.input, id;
            switch (inputData.input) {
                case 'move':
                    playerCharacter.destination = new TwoVector(inputData.options.destination.x, inputData.options.destination.z);
                    playerCharacter.height = inputData.options.destination.y;
                    break;

                case 'attack':
                    id = this.skills[inputData.input];
                    if (playerCharacter.target && playerCharacter.id != playerCharacter.target) {
                        let attackTarget = this.world.objects[playerCharacter.target];
                        if (attackTarget) {
                            this.attack(playerCharacter, attackTarget);
                        }
                    }
                    break;

                case 'shield':
                    id = this.skills[inputData.input];
                    console.log('activating ' + inputData.input);
                    if (playerCharacter.shield == playerCharacter.original_shield) {
                        playerCharacter.applySkill(id, true);
                    }
                    playerCharacter.useSkill(id);
                    break;

                case 'heal':
                    id = this.skills[inputData.input];
                    console.log('activating ' + inputData.input);
                    if (playerCharacter.health < playerCharacter.original_health) {
                        playerCharacter.applySkill(id, true);
                    }
                    playerCharacter.useSkill(id);
                    break;

                case 'target':
                    console.log('new target', inputData.options);
                    playerCharacter.target = inputData.options.id;
                    break;

                case 'teleport':
                    console.log('teleporting player', inputData);
                    let telep = this.getPlayerCharacter(inputData.options.playerId);
                    if (telep) {
                        id = this.skills[inputData.input];
                        telep.teleport = inputData.options.destination;
                        telep.useSkill(id);
                        telep.position = new TwoVector(telep.teleport.x, telep.teleport.z);
                        telep.height = telep.teleport.y;
                        console.log('Teleporting player to ', telep.position, telep.height);
                        this.emit('teleporting', {"playerId": telep.playerId, "destination": telep.teleport});
                        console.log('teleporting', { "playerId": telep.playerId, "destination": telep.teleport});
                        telep.teleport = null;
                    } else {
                        console.log(inputData.options['playerId'], ' not found');
                    }
                    break;

                default:
                    console.log('uknown action', inputData.input);
            }
        }
        });

        this.on('collisionStart', function(e) {
            let collisionObjects = Object.keys(e).map(k => e[k]);
            let character = collisionObjects.find(o => o.class === Character);
            let missile = null; //collisionObjects.find(o => o.class === Missile);

            if (!character || !missile)
                return;

            //if (missile.shipOwnerId !== character.id) {
            //    that.destroyMissile(missile.id);
            //    that.emit('missileHit', { missile, character });
            //}
        });
    };

    attack(a, t) {

        t = this.world.objects[t.id];
        if (!t) {
            console.log('Attempting to attack a non existing object, unsetting target');
            a.target = null;
            return;
        }
        let distanceToTarget = Utils.distance(new TwoVector(a.x, a.y), new TwoVector(t.x, t.y));
        console.log('Attacker position:', a.x, a.height, a.y);
        console.log('Target position:', t.x, t.height, t.y);
        if (distanceToTarget < a.maxDistanceToTarget) {
            let damage = (a.attack - t.shield);
            t.health -= damage;

            // Mobs auto-defend from attack
            if (t.class == Mob && !t.target) {
                t.target = a;
            }
            console.log('attacking target!', t.health, t.original_health);
            this.emit('attacking', { "msg": 'Attacking ' + t.name + ' damage done ' + damage});
            if (t.health <= 0 && !t.killed) {
                a.target = null;
                t.killed = true;
                setTimeout((evt)=> {
                    this.emit('killed', { "object": t });
                }, 1000);
            }
        } else {
            console.log('cannot attack target!', distanceToTarget);
            this.emit('attacking', { "msg": 'Target too far ' + distanceToTarget});
        }
    }

    getPlayerCharacter(playerId) {
        let playerCharacter;
        for (let objId in this.world.objects) {
            let o = this.world.objects[objId];
            if (o.playerId == playerId && o.class == Character) {
                playerCharacter = o;
                break;
            }
        }
        return playerCharacter;
    }

    processInput(inputData, playerId) {

        super.processInput(inputData, playerId);
    };

    getRandCoords() {
        //y: 2 (ground = -1, height of mesh / 2 = 3.5. need to assign the middle so that it isn't rendered under/above the ground
        return {
            "x": Math.floor(Math.random()*(this.worldSettings.width-200) / 2),
            "y": 2,
            "z": Math.floor(Math.random()*(this.worldSettings.height-200) / 2)
        };

    }

    makeMob(name, aggressive) {

        let cords = this.getRandCoords()

        // todo playerId should be called ownerId
        let mob = new Mob(++this.world.idCount, this, new TwoVector(cords['x'], cords['z']), null, cords['y'], aggressive);
        mob.name = name;
        mob.attachAI();
        this.addObjectToWorld(mob);
        console.log(`Mob added: ${mob.toString()}`);
    }

    makeNpc(name) {

        let cords = this.getRandCoords()

        // todo playerId should be called ownerId
        let npc = new NPC(++this.world.idCount, this, new TwoVector(cords['x'], cords['z']), null, cords['y']);
        npc.name = name;
        this.addObjectToWorld(npc);
        console.log(`NPC added: ${npc.toString()}`);
    }

    /**
     * Makes a new character, places it randomly and adds it to the game world
     * @return {Character} the added Character object
     */
    makeCharacter(playerId, name, kind) {
        console.log('makeCharacter', kind);
        let cords = this.getRandCoords()

        // todo playerId should be called ownerId
        let character = new Character(++this.world.idCount, this, new TwoVector(cords['x'], cords['z']), null, cords['y'], kind);
        character.name = name;
        character.playerId = playerId;
        this.addObjectToWorld(character);
        console.log(`Character added: ${character.toString()}`);

        return character;
    };
}

module.exports = MMORPGGameEngine;
