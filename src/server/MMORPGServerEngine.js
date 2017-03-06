'use strict';

const ServerEngine = require('incheon').ServerEngine;
const nameGenerator = require('./NameGenerator');

class MMORPGServerEngine extends ServerEngine {
    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.serializer.registerClass(require('../common/Missile'));
        this.serializer.registerClass(require('../common/Character'));

        this.scoreData = {};
    }

    start() {
        super.start();
        //for (let x = 0; x < 3; x++) this.makeBot();


        this.gameEngine.on('killed', (e) => {

            console.log(`player killed: ${e.character.toString()}`);
            this.gameEngine.removeObjectFromWorld(e.character.id);
        });
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        let makePlayerCharacter = () => {
            let character = this.gameEngine.makeCharacter(socket.playerId);

            this.scoreData[character.id] = {
                kills: 0,
                name: nameGenerator('general')
            };
            this.updateScore();
        };

        // handle client restart requests
        socket.on('requestRestart', makePlayerCharacter);
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);

        // iterate through all objects, delete those that are associated with the player
        for (let objId of Object.keys(this.gameEngine.world.objects)) {
            let obj = this.gameEngine.world.objects[objId];
            if (obj.playerId == playerId) {
                // remove score data
                if (this.scoreData[objId]) {
                    delete this.scoreData[objId];
                }
                delete this.gameEngine.world.objects[objId];
            }
        }

        this.updateScore();
    }

    makeBot() {
        let bot = this.gameEngine.makeCharacter(0);
        bot.attachAI();

        this.scoreData[bot.id] = {
            kills: 0,
            name: nameGenerator('general') + 'Bot'
        };

        this.updateScore();
    }

    updateScore() {
        // delay so player socket can catch up
        setTimeout(() => {
            this.io.sockets.emit('scoreUpdate', this.scoreData);
        }, 1000);

    }
}

module.exports = MMORPGServerEngine;
