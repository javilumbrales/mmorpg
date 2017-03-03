'use strict';

const GameEngine = require('incheon').GameEngine;
const Missile= require('./Missile');
const Character = require('./Character');
const Timer = require('./Timer');

class MMORPGGameEngine extends GameEngine {

    start() {
        let that = this;
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

        this.on('postStep', this.reduceVisibleThrust.bind(this));
    };

    reduceVisibleThrust(postStepEv) {
        if (postStepEv.isReenact)
            return;

        for (let objId of Object.keys(this.world.objects)) {
            let o = this.world.objects[objId];
            if (Number.isInteger(o.showThrust) && o.showThrust >= 1)
                o.showThrust--;
        }
    }

    processInput(inputData, playerId) {

        super.processInput(inputData, playerId);

        console.log("INPUT RECEIVED", inputData, playerId);

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
            } else if (inputData.input == 'right') {
                //playerCharacter.y += 5;
            } else if (inputData.input == 'left') {
                //playerCharacter.z += 5;
            } else if (inputData.input == 'space') {
                this.makeMissile(playerCharacter, inputData.messageIndex);
                this.emit('fireMissile');
            } else if (inputData.input == 'move') {
                console.log("player moving to");
                console.log(inputData);
                playerCharacter.isAccelerating = true;
                playerCharacter.x = inputData.options.destination.x;
                playerCharacter.y = inputData.options.destination.z;
            }
        }
    };

    /**
     * Makes a new ship, places it randomly and adds it to the game world
     * @return {Ship} the added Ship object
     */
    makeCharacter(playerId) {
        let newCharacterX = Math.floor(Math.random()*(this.worldSettings.width-200) / 2);
        let newCharacterY = Math.floor(Math.random()*(this.worldSettings.height-200) / 2);

        // todo playerId should be called ownerId
        let character = new Character(++this.world.idCount, this, newCharacterX, newCharacterY);
        character.playerId = playerId;
        this.addObjectToWorld(character);
        console.log(`Character added: ${character.toString()}`);

        return character;
    };

    makeMissile(playerShip, inputId) {
        let missile = new Missile(++this.world.idCount);
        missile.x = playerShip.x;
        missile.y = playerShip.y;
        missile.angle = playerShip.angle;
        missile.playerId = playerShip.playerId;
        missile.shipOwnerId = playerShip.id;
        missile.inputId = inputId;
        missile.velocity.set(
            Math.cos(missile.angle * (Math.PI / 180)),
            Math.sin(missile.angle * (Math.PI / 180))
        ).setMagnitude(10)
        .add(playerShip.velocity.x, playerShip.velocity.y);
        missile.velX = missile.velocity.x;
        missile.velY = missile.velocity.y;

        this.trace.trace(`missile[${missile.id}] created vx=${missile.velocity.x} vy=${missile.velocity.y}`);


        this.addObjectToWorld(missile);
        this.timer.add(40, this.destroyMissile, this, [missile.id]);

        return missile;
    }

    // destroy the missile if it still exists
    destroyMissile(missileId) {
        if (this.world.objects[missileId]) {
            this.trace.trace(`missile[${missileId}] destroyed`);
            this.removeObjectFromWorld(missileId);
        }
    }
}

module.exports = MMORPGGameEngine;
