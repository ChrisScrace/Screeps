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
            // Prioritize sources: dropped energy, tombstones, containers
            let target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES) ||
                creep.pos.findClosestByPath(FIND_TOMBSTONES, {
                    filter: t => t.store[RESOURCE_ENERGY] > 0
                }) ||
                creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                        s.store[RESOURCE_ENERGY] > 100
                });

            if (target) {
                if (target.resourceType) {
                    // Dropped resource
                    if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    // Tombstone or container
                    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                }
            }
            return;
        }

        // -------------------------
        // 3. Deliver energy to spawns
        // -------------------------
        let deliverTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                s.structureType === STRUCTURE_SPAWN &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (deliverTarget) {
            if (creep.transfer(deliverTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(deliverTarget, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        // -------------------------
        // 4. Deliver energy to towers
        // -------------------------
        deliverTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                s.structureType === STRUCTURE_TOWER &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (deliverTarget) {
            if (creep.transfer(deliverTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(deliverTarget, { visualizePathStyle: { stroke: '#ff0000' } });
            }
            return;
        }

        // -------------------------
        // 5. Deliver energy to extensions
        // -------------------------
        deliverTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                s.structureType === STRUCTURE_EXTENSION &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (deliverTarget) {
            if (creep.transfer(deliverTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(deliverTarget, { visualizePathStyle: { stroke: '#00ffff' } });
            }
            return;
        }

        // -------------------------
        // 6. Deliver energy to builders
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
        // 7. Drop on ground if nowhere else
        // -------------------------
        creep.drop(RESOURCE_ENERGY);
    }
};
