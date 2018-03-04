var roleBuilder = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.memory.building && creep.carry.energy == 0) {
        creep.memory.building = false;
        creep.say('🚚 collecting');
    }
    else if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
        creep.memory.building = true;
        creep.say('🚧 build');
    }
    else if(creep.memory.building) {
      var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
      if(target) {
        if(creep.build(target) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
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
  }
};

module.exports = roleBuilder;
