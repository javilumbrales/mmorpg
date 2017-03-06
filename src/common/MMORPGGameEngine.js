'use strict';

const GameEngine = require('incheon').GameEngine;
const Point = require('incheon').Point;
const Missile= require('./Missile');
const Character = require('./Character');
const Timer = require('./Timer');


class MMORPGGameEngine extends GameEngine {

    start() {
        let that = this;
        this.Epsilon = 0.1;
        super.start();

        this.timer = new Timer();
        this.timer.play();
        this.on('server__postStep', ()=>{
            this.timer.tick();
        });

        this.worldSettings = {
            worldWrap: true,
            width: 500,
            height: 500
        };

        this.on('collisionStart', function(e) {
            let collisionObjects = Object.keys(e).map(k => e[k]);
            let character = collisionObjects.find(o => o.class === Character);
            let missile = collisionObjects.find(o => o.class === Missile);

            if (!character || !missile)
                return;

            if (missile.shipOwnerId !== character.id) {
                that.destroyMissile(missile.id);
                that.emit('missileHit', { missile, character });
            }
        });

        this.on('postStep', this.afterStep.bind(this));
    };

    /**
     * Disable animations after the step
     */
    afterStep(postStepEv) {
        if (postStepEv.isReenact)
            return;

        for (let objId of Object.keys(this.world.objects)) {
            let o = this.world.objects[objId];
            if (Number.isInteger(o.animation) && o.animation == 20) {
                //o.animation = 0;
            }
            if (o.destination) {
                this.moveToTarget(o);
            }
        }
    }

    moveToTarget(obj) {

        //var movementVector=(new Point(target.x,target.y)).subtract(obj.x,obj.y);
        //movementVector.setMagnitude(obj.maxSpeed);
        //this.moveInDirecton(obj, movementVector);

        obj.isMoving = true;
        // Compute direction
        let direction = (new Point()).copyFrom(obj.destination).subtract(obj.x, obj.y);
        direction.normalize();
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
            var distance = this.distance(new Point(obj.x, obj.y), obj.destination);
            // Change destination if th distance is increasing (should not)
            if (distance < this.Epsilon || distance > obj._lastDistance) {
                // Set the minion position to the curent destination
                obj.x = obj.destination.x;
                obj.y = obj.destination.y;

                // Destination has been reached
                obj.isMoving = false;
                console.log('arrived!');
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
                let delta = direction.multiply(obj.maxSpeed, obj.maxSpeed);
                //obj.mesh.position.addInPlace(delta);
                //console.log('gameengine:', direction, distance, delta);

                //let velocityAndGravity = delta.add(new BABYLON.Vector3(0, -9, 0));

                //console.log(velocityAndGravity);
                //obj.mesh.moveWithCollisions(velocityAndGravity);
                obj.x += delta.x;
                obj.y += delta.y;
            }
        }
    }

    processInput(inputData, playerId) {

        super.processInput(inputData, playerId);

        // get the player ship tied to the player socket
        let playerCharacter;

        for (let objId in this.world.objects) {
            let o = this.world.objects[objId];
            if (o.playerId == playerId && o.class == Character) {
                playerCharacter = o;
                break;
            }
        }

        if (playerCharacter) {
            if (inputData.input == 'up') {
                //playerCharacter.isAccelerating = true;
                playerCharacter.y += 1;
            } else if (inputData.input == 'heal') {
                if (playerCharacter.health < playerCharacter.original_health) {
                    playerCharacter.health += playerCharacter.skills[1]['action']['health'];
                }
                playerCharacter.animation = 1;
                setTimeout(function() {playerCharacter.animation = 0;}.bind(this), playerCharacter.skills[1]['duration']);
                console.log('healing', playerCharacter.health, playerCharacter.animation);
            } else if (inputData.input == 'attack') {
                if (playerCharacter.target && playerCharacter.id != playerCharacter.target) {
                    playerCharacter.animation = 2;
                    let attackTarget = this.world.objects[playerCharacter.target];
                    if (attackTarget) {
                        let distanceToTarget = this.distance(new Point(playerCharacter.x, playerCharacter.y), new Point(attackTarget.x, attackTarget.y));
                        if (distanceToTarget < playerCharacter.maxDistanceToTarget) {
                            attackTarget.health -= (playerCharacter.skills[2]['action']['attack'] - attackTarget.shield);
                            console.log('attacking target!', attackTarget.health, attackTarget.original_health);
                            if (attackTarget.health <= 0) {
                                playerCharacter.target = null;
                                this.emit('killed', { "character": attackTarget });
                            }
                        }
                    }
                    setTimeout(function() {playerCharacter.animation = 0;}.bind(this), playerCharacter.skills[2]['duration']);
                }
            } else if (inputData.input == 'shield') {
                console.log('activating shield');
                if (playerCharacter.shield == playerCharacter.original_shield) {
                    playerCharacter.shield += playerCharacter.skills[3]['action']['shield'];
                }
                playerCharacter.animation = 3;
                console.log(playerCharacter.skills[3]['duration']);
                setTimeout(function() {
                    playerCharacter.animation = 0;
                    playerCharacter.shield -= playerCharacter.skills[3]['action']['shield'];
                }.bind(this), playerCharacter.skills[3]['duration']);
            } else if (inputData.input == 'target') {
                console.log('new target', inputData.options);
                playerCharacter.target = inputData.options.id;
            } else if (inputData.input == 'move') {
                console.log("player moving to");
                console.log(inputData);
                playerCharacter._lastDistance = Number.POSITIVE_INFINITY;
                playerCharacter.destination = new Point(inputData.options.destination.x, inputData.options.destination.z);
            }
        }
    };

    /**
     * Makes a new character, places it randomly and adds it to the game world
     * @return {Character} the added Character object
     */
    makeCharacter(playerId, name) {
        let newCharacterX = Math.floor(Math.random()*(this.worldSettings.width-200) / 2);
        let newCharacterY = Math.floor(Math.random()*(this.worldSettings.height-200) / 2);

        // todo playerId should be called ownerId
        let character = new Character(++this.world.idCount, this, name, newCharacterX, newCharacterY);
        character.playerId = playerId;
        this.addObjectToWorld(character);
        console.log(`Character added: ${character.toString()}`);

        return character;
    };
}

module.exports = MMORPGGameEngine;
