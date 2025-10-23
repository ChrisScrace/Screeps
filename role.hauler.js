if (!creep.memory.hauling) {
    // Get or pick target
    let target = Game.getObjectById(creep.memory.targetId);
    if (!target || (target.energy !== undefined && target.energy === 0) || 
        (target.store && target.store[RESOURCE_ENERGY] === 0)) {

        const targets = roomCache.getDropped(room)
            .concat(roomCache.getTombstones(room))
            .concat(roomCache.getContainers(room));

        target = creep.pos.findClosestByRange(targets);
        if (target) creep.memory.targetId = target.id;
    }

    if (!target) return;

    // Move to target using cached path
    pathCache.moveTo(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });

    // Pickup or withdraw
    if (target.resourceType) creep.pickup(target);
    else creep.withdraw(target, RESOURCE_ENERGY);

    // Clear memory if target emptied
    if ((target.resourceType && target.amount === 0) ||
        (target.store && target.store[RESOURCE_ENERGY] === 0)) {
        delete creep.memory.targetId;
    }
    return;
}
