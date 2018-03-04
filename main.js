//creeps
var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleExtractor = require('role.extractor');
var roleTransporter = require('role.transporter');
var roleCleaner = require('role.cleaner');

//spawns
var roleSpawn = require('role.spawn');

module.exports.loop = function () {

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    for(var name in Game.spawns){
        var spawn = Game.spawns[name];
        roleSpawn.spawn(spawn);
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];

        switch(creep.memory.role)
        {
          case ('harvester'):
            roleHarvester.run(creep);
            break;
          case ('upgrader'):
            roleUpgrader.run(creep);
            break;
          case ('builder'):
            roleBuilder.run(creep);
            break;
          case ('extractor'):
            roleExtractor.run(creep);
            break;
          case ('transporter'):
            roleTransporter.run(creep);
            break;
          case ('cleaner'):
            roleCleaner.run(creep);
            break;
        }
    }
}
