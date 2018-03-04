var dropOffPoints = [STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_SPAWN];

var roleCleaner = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.memory.delivering && creep.carry.energy <= 0) {
      creep.memory.delivering = false;
      creep.say('💩 cleaning');
    }
    else if(!creep.memory.delivering && creep.carry.energy >= creep.carryCapacity) {
      creep.memory.delivering = true;
      creep.say('📦 deliver');
    }

    else if(creep.memory.delivering) {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (dropOffPoints.includes(structure.structureType) && structure.energy < structure.energyCapacity) ||
                  (structure.structureType == STRUCTURE_CONTAINER  && _.sum(structure.store) < structure.storeCapacity);
        }
      });
      if(targets.length > 0) {
          if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
          }
        }
    }
    else {
      var energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: (resource) => {
          return resource.resourceType == RESOURCE_ENERGY;
        }
      });
      if(energy){
        if(creep.pickup(energy) == ERR_NOT_IN_RANGE) {
          creep.moveTo(energy, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
      }
    }
    creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
  }
};

module.exports = roleCleaner;
