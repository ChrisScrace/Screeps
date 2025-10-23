module.exports = {
    run(creep) {
        // -------------------------
        // 1️⃣ Toggle hauling state
        // -------------------------
        if (creep.memory.hauling && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.hauling = false;
        }
        if (!creep.memory.hauling && creep.store.getFreeCapacity() === 0) {
            creep.memory.hauling = true;
        }

        // -------------------------
        // 2️⃣ Collect energy if not hauling
        // -------------------------
        if (!creep.memory.hauling) {
            const target = creep.pos.findClosestByPath(
                creep.room.find(FIND_DROPPED_RESOURCES)
                    .concat(creep.room.find(FIND_TOMBSTONES, { filter: t => t.store[RESOURCE_ENERGY] > 0 }))
                    .concat(creep.room.find(FIND_STRUCTURES, { 
                        filter: s => 
                            (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    }))
            );

            if (target) {
                if (target.resourceType) {
                    if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                }
            }
            return;
        }

        // -------------------------
        // 3️⃣ Deliver energy
        // -------------------------
        const deliveryTargets = creep.room.find(FIND_STRUCTURES, {
            filter: s => (
                (s.structureType === STRUCTURE_SPAWN ||
                 s.structureType === STRUCTURE_TOWER ||
                 s.structureType === STRUCTURE_EXTENSION) &&
                 s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            )
        }).sort((a, b) => {
            // Prioritize spawn > tower > extension
            const priority = { [STRUCTURE_SPAWN]: 1, [STRUCTURE_TOWER]: 2, [STRUCTURE_EXTENSION]: 3 };
            return priority[a.structureType] - priority[b.structureType];
        });

        const builder = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: c => c.memory.role === 'builder' && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        let target = deliveryTargets[0] || builder;

        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        // -------------------------
        // 4️⃣ Drop energy if nowhere else
        // -------------------------
        creep.drop(RESOURCE_ENERGY);
    }
};
