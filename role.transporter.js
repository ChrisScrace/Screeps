var dropOffPoints = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN];

var roleTransporter = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.memory.delivering && creep.carry.energy <= 0) {
      creep.memory.delivering = false;
      creep.say('🚚 collecting');
    }
    else if(!creep.memory.delivering && creep.carry.energy >= creep.carryCapacity) {
      creep.memory.delivering = true;
      creep.say('📦 deliver');
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
      var energyStorages = creep.room.find(FIND_STRUCTURES,{
        filter: (structure) => {
          return structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0;
        }
      });
      if(energyStorages.length > 0){
        energyStorages.sort(function(a, b)  {return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]});
        if(creep.withdraw(energyStorages[0], RESOURCE_ENERGY, creep.energyCapacity) == ERR_NOT_IN_RANGE) {
          creep.moveTo(energyStorages[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        }
      }
    }
    creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
  }
};

module.exports = roleTransporter;
