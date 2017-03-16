'use strict';

const ServerEngine = require('incheon').ServerEngine;
const Database = require('./Database');

class MMORPGServerEngine extends ServerEngine {
    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.serializer.registerClass(require('../common/Character'));
        this.serializer.registerClass(require('../common/NPC'));
        this.serializer.registerClass(require('../common/Mob'));
    }

    start() {
        super.start();

        this.database = new Database(process);

        // Test DB
        //this.database.createUser(
                //{"username":"javi", "pass": "javi", "name": "Javier Ch"},
                //function(created) {
                    //console.log('created', created.dataValues);
                //}
        //);
        //this.database.loadUser(
                //{"username":"javi", "pass": "javi"},
                //function(user) {
                    //console.log('loadUser', user.dataValues);
                    //return user.dataValues;
                //}
        //);

        this.createNpc('Gandalf');

        for (let i = 0; i < 10; i++) {
            this.createMob('foo', Math.round(Math.random()));
        }

        this.gameEngine.on('killed', (e) => {

            console.log(`player killed: ${e.object.toString()}`);
            this.updateStatus({"status":"standard", "message": `RIP: ${e.object.name}`});
            this.gameEngine.removeObjectFromWorld(e.object.id);
        });

        this.players = {};
    }

    createNpc(name) {
        let npc = this.gameEngine.makeNpc(name);
    }

    createMob(name, aggressive) {
        let npc = this.gameEngine.makeMob(name, aggressive);
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        let makePlayerCharacter = () => {
            let names = ["Valanar", "Vala", "Rins", "Ripo", "Ripollet", "p0w3rf1y"];
            let kind = 0; //Math.round(Math.random());
            let character = this.gameEngine.makeCharacter(socket.playerId, names[Math.floor(Math.random() * names.length)] + Math.round(Math.random() * 4), kind);
            this.players[socket.playerId] = character.name;
            this.updateStatus({"status": 'connected', "message": `Player connected: ${character.name}`});
            setTimeout(() => {
                this.io.sockets.emit('connectedPlayers', this.players);
            }, 1500);
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
                delete this.gameEngine.world.objects[objId];
            }
        }
        if (this.players[playerId]) {
            this.updateStatus({"status": 'disconnected', "message": `Player disconnected: ${this.players[playerId]}`});
            delete this.players[playerId];
        }
    }

    updateStatus(data) {
        // delay so player socket can catch up
        setTimeout(() => {
            this.io.sockets.emit('statusUpdate', data);
        }, 1000);

    }
}

module.exports = MMORPGServerEngine;
