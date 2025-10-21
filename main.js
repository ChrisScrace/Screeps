const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleBuilder = require('role.builder');
const spawnManager = require('spawnManager');
const constructionManager = require('constructionManager'); // 👈 new line

module.exports.loop = function () {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    spawnManager.run();

    // Run auto-building for each owned room
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        constructionManager.run(room);
    }

    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === 'harvester') roleHarvester.run(creep);
        else if (creep.memory.role === 'upgrader') roleUpgrader.run(creep);
        else if (creep.memory.role === 'builder') roleBuilder.run(creep);
    }
};
