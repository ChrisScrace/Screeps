var roleExtractor = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.memory.target){
      if(creep.harvest(Game.getObjectById(creep.memory.target.id)) == ERR_NOT_IN_RANGE) {
        creep.moveTo(Game.getObjectById(creep.memory.target.id), {visualizePathStyle: {stroke: '#ffffff'}});
        creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
      }
      else{
        creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
      }
    }
    else{
      var sources = creep.room.find(FIND_SOURCES);
      var extractors = _.filter(Game.creeps, (otherCreep) => otherCreep.memory.model == creep.memory.model);
      //creep.memory.target = sources[extractors.length % sources.length];
      console.log('Target enegy source selected: ' + extractors.length % sources.length);
    }
  }
};

module.exports = roleExtractor;
