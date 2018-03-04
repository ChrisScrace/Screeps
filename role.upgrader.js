var roleUpgrader = {

  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.memory.upgrading && creep.carry.energy == 0) {
      creep.memory.upgrading = false;
      creep.say('🚚 collecting');
    }
    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
      creep.memory.upgrading = true;
      creep.say('🛠 upgrade');
    }

    if(creep.memory.upgrading) {
      if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
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

module.exports = roleUpgrader;
