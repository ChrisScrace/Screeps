const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleHauler = require('role.hauler');
const roleBuilder = require('role.builder');
const spawnManager = require('spawnManager');
const constructionManager = require('constructionManager');
const towerManager = require('towerManager');
const sourceManager = require('sourceManager');

module.exports.loop = function () {
    // Clean up memory
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    // Room-wide managers
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!room.controller || !room.controller.my) continue;

        spawnManager.run(room);
        sourceManager.initRoom(room);
        constructionManager.run(room);
        towerManager.run(room);
    }

    // Run creeps
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === 'harvester') roleHarvester.run(creep);
        else if (creep.memory.role === 'upgrader') roleUpgrader.run(creep);
        else if (creep.memory.role === 'builder') roleBuilder.run(creep);
        else if (creep.memory.role === 'hauler') roleHauler.run(creep);
    }
};
