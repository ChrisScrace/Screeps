var dropOffPoints = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN];

var roleHarvester = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.memory.delivering && creep.carry.energy <= 0) {
      creep.memory.delivering = false;
      creep.say('🔄 harvest');
    }
    else if(!creep.memory.delivering && creep.carry.energy >= creep.carryCapacity) {
      creep.memory.delivering = true;
      creep.say('⚡ deliver');
    }

    else if(creep.memory.delivering) {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (dropOffPoints.includes(structure.structureType)) && structure.energy < structure.energyCapacity;
        }
      });
      if(targets.length > 0) {
          if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
          }
        }
    }
    else {
      var sources = creep.room.find(FIND_SOURCES);
      if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
      }
    }
    creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
  }
};

module.exports = roleHarvester;
