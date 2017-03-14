'use strict';

const GameEngine = require('incheon').GameEngine;
const TwoVector = require('incheon').serialize.TwoVector;
const Character = require('./Character');
const NPC = require('./NPC');
const Mob = require('./Mob');
const Timer = require('./Timer');


class MMORPGGameEngine extends GameEngine {

    start() {
        let that = this;
        super.start();

        this.timer = new Timer();
        this.timer.play();
        this.on('server__postStep', ()=>{
            this.timer.tick();
            for (let objId of Object.keys(this.world.objects)) {
                let o = this.world.objects[objId];
                if (o.animations && o.animations.length) {
                    for(var a = 0; a <o.animations.length; a++) {
                        o.running[o.animations[a]]--;
                        if (o.running[o.animations[a]] <=0) {
                            o.applySkill(o.animations[a], false);
                            delete o.running[o.animations[a]];
                            o.animations.splice(a, 1);
                        }
                    }
                }
                if (o.destination) {
                    console.log(`Moving player ${o.id}  from ${o.position} to: ${o.destination}`);
                    this.moveToTarget(o);
                }
            }
        });

        this.worldSettings = {
            worldWrap: true,
            width: 500,
            height: 500
        };
        this.Epsilon = 0.1;
        this.animations = {
            'attack': 1,
            'heal': 2,
            'shield': 3,
            'teleport': 4
        };

        this.on('server__inputReceived', (data)=>{


        let playerCharacter = this.getPlayerCharacter(data.playerId);

        if (playerCharacter) {
            let inputData = data.input, id;
            switch (inputData.input) {
                case 'move':
                    console.log("Player moving to", inputData);
                    playerCharacter._lastDistance = Number.POSITIVE_INFINITY;
                    playerCharacter.destination = new TwoVector(inputData.options.destination.x, inputData.options.destination.z);
                    break;
                case 'attack':
                    id = this.animations[inputData.input];
                    if (playerCharacter.target && playerCharacter.id != playerCharacter.target) {
                        let attackTarget = this.world.objects[playerCharacter.target];
                        if (attackTarget) {
                            let distanceToTarget = this.distance(new TwoVector(playerCharacter.x, playerCharacter.y), new TwoVector(attackTarget.x, attackTarget.y));
                            console.log('Player position:', playerCharacter.x, playerCharacter.height, playerCharacter.y);
                            console.log('Target position:', attackTarget.x, attackTarget.height, attackTarget.y);
                            if (distanceToTarget < playerCharacter.maxDistanceToTarget) {
                                let damage = (playerCharacter.attack - attackTarget.shield);
                                attackTarget.health -= damage;
                                console.log('attacking target!', attackTarget.health, attackTarget.original_health);
                                this.emit('attacking', { "msg": 'Attacking ' + attackTarget.name + ' damage done ' + damage});
                                if (attackTarget.health <= 0) {
                                    playerCharacter.target = null;
                                    this.emit('killed', { "character": attackTarget });
                                }
                            } else {
                                console.log('cannot attack target!', distanceToTarget);
                                this.emit('attacking', { "msg": 'Target too far ' + distanceToTarget});
                            }
                        }
                    }
                    break;
                case 'shield':
                    id = this.animations[inputData.input];
                    playerCharacter.animations.push(id);
                    console.log('activating ' + inputData.input);
                    if (playerCharacter.shield == playerCharacter.original_shield) {
                        playerCharacter.applySkill(id, true);
                    }
                    playerCharacter.running[id] = playerCharacter.skills[id]['duration'];
                    break;
                case 'heal':
                    id = this.animations[inputData.input];
                    playerCharacter.animations.push(id);
                    console.log('activating ' + inputData.input);
                    if (playerCharacter.health < playerCharacter.original_health) {
                        playerCharacter.applySkill(id, true);
                    }
                    playerCharacter.running[id] = playerCharacter.skills[id]['duration'];
                    console.log(playerCharacter.skills[id], playerCharacter.running[id]);
                    break;
                case 'target':
                    console.log('new target', inputData.options);
                    playerCharacter.target = inputData.options.id;
                    break;

                case 'teleport':
                    console.log('teleporting player', inputData);
                    let telep = this.getPlayerCharacter(inputData.options.playerId);
                    if (telep) {
                        id = this.animations[inputData.input];
                        telep.position.x = inputData.options.destination.x;
                        telep.position.y = inputData.options.destination.z;
                        telep.height = inputData.options.destination.z;
                        telep.animations.push(id);
                        telep.running[id] = telep.skills[id]['duration'];
                        console.log('found player animation started', telep.position, telep);
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

        //this.on('postStep', this.afterStep.bind(this));
    };

    moveToTarget(obj) {
        obj.isMoving = true;
        // Compute direction
        //console.log('moveToTarget from:', obj.position, 'to', obj.destination);
        let direction = (new TwoVector(0,0)).copy(obj.destination).subtract(obj.position);
        //console.log('direction', direction);
        direction.normalize();
        //console.log('direction normalized', direction);
        this.moveInDirecton(obj, direction);
    }


    distance(targeta, targetb) {
        let dx = targeta.x - targetb.x;
        let dy = targeta.y - targetb.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    moveInDirecton(obj, direction) {
        // If a destination has been set and the character has not been stopped
        if (obj.isMoving && obj.destination) {
            // Compute distance to destination
            var distance = this.distance(new TwoVector(obj.x, obj.y), obj.destination);
            // Change destination if th distance is increasing (should not)
            if (distance < this.Epsilon || distance > obj._lastDistance) {
                // Set the minion position to the curent destination
                obj.position = obj.destination;

                // Destination has been reached
                obj.isMoving = false;
                console.log('Arrived to destination!');
                obj.destination = null;
                if (!obj.destinations) {
                    // Animate the character in idle animation
                    // Call function when final destination is reached
                }
                else {
                    obj.destination = obj.destinations.shift();
                    this.moveToTarget(obj);
                }
            }
            else {
                obj._lastDistance = distance;
                // Add direction to the position
                let delta = direction.multiplyScalar(obj.maxSpeed);
                //obj.mesh.position.addInPlace(delta);
                //console.log('gameengine:', direction, distance, delta);

                //let velocityAndGravity = delta.add(new BABYLON.Vector3(0, -9, 0));

                //console.log(velocityAndGravity);
                //obj.mesh.moveWithCollisions(velocityAndGravity);
                obj.position.x += delta.x;
                obj.position.y += delta.y;
                //obj.position.z += delta.z;
                console.log('moved to', obj.x, obj.height, obj.y);
            }
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

        return {
            "x": Math.floor(Math.random()*(this.worldSettings.width-200) / 2),
            "y": 0,
            "z": Math.floor(Math.random()*(this.worldSettings.height-200) / 2)
        };

    }

    makeMob(name) {

        console.log('makeMob', name);
        let cords = this.getRandCoords()

        // todo playerId should be called ownerId
        let mob = new Mob(++this.world.idCount, this, new TwoVector(cords['x'], cords['z']), null, cords['y']);
        mob.name = name;
        this.addObjectToWorld(mob);
        console.log(`Mob added: ${mob.toString()}`);
    }

    makeNpc(name) {

        console.log('makeNPC', name);
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
