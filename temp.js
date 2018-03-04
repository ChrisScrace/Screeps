var targets = creep.room.find(FIND_STRUCTURES, {
  filter: (structure) => {
    return (dropOffPoints.includes(structure.structureType)) && structure.energy < structure.energyCapacity;}});
    if(targets)
