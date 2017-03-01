'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, './index.html');

// define routes and socket
const server = express();
server.get('/', function(req, res) { res.sendFile(INDEX); });
server.use('/', express.static(path.join(__dirname, '.')));
let requestHandler = server.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const io = socketIO(requestHandler);

// Game Server
const MMORPGServerEngine = require(path.join(__dirname, 'src/server/MMORPGServerEngine.js'));
const MMORPGGameEngine = require(path.join(__dirname, 'src/common/MMORPGGameEngine.js'));
const SimplePhysicsEngine = require('incheon').physics.SimplePhysicsEngine;

// Game Instances
const physicsEngine = new SimplePhysicsEngine({ collisionOptions: { COLLISION_DISTANCE: 50 } } );
const gameEngine = new MMORPGGameEngine({ physicsEngine });
const serverEngine = new MMORPGServerEngine(io, gameEngine, { timeoutInterval: 60 * 5 , debug: {} });

// start the game
serverEngine.start();
