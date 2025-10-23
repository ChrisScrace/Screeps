module.exports = {
    run(creep) {
        // -------------------------
        // 1. Toggle hauling state
        // -------------------------
        if (creep.memory.hauling && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.hauling = false; // out of energy, go collect
        }
        if (!creep.memory.hauling && creep.store.getFreeCapacity() === 0) {
            creep.memory.hauling = true; // full, deliver
        }

        // -------------------------
        // 2. Collect energy if not hauling
        // -------------------------
        if (!creep.memory.hauling) {
            let target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES) ||
                         creep.pos.findClosestByPath(FIND_STRUCTURES, {
                             filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 100
                         });

            if (target) {
                if (target.resourceType) {
                    if (creep.pickup(target) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else {
                    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
            return;
        }

        // -------------------------
        // 3. Deliver energy to spawn/extensions
        // -------------------------
        let deliverTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (deliverTarget) {
            if (creep.transfer(deliverTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(deliverTarget, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        // -------------------------
        // 4. Deliver energy to builders
        // -------------------------
        const builder = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: c => c.memory.role === 'builder' && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (builder) {
            if (creep.transfer(builder, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(builder, { visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }

        // -------------------------
        // 5. Drop on ground if nowhere else
        // -------------------------
        creep.drop(RESOURCE_ENERGY);
    }
};
