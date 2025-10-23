module.exports = {
    run(creep) {
        // -------------------------
        // 1. Toggle building state
        // -------------------------
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false; // out of energy, go harvest
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true; // full, go build/upgrade
        }

        // -------------------------
        // 2. Collect energy if not building
        // -------------------------
        if (!creep.memory.building) {
            let source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) 
                             && s.store[RESOURCE_ENERGY] > 0
            });

            if (!source) {
                const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { 
                    filter: r => r.resourceType === RESOURCE_ENERGY 
                });
                if (dropped) source = dropped;
            }

            if (!source) {
                // Idle near controller if nothing to withdraw
                if (creep.room.controller) creep.moveTo(creep.room.controller.pos, { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }

            if (source.resourceType) {
                if (creep.pickup(source) === ERR_NOT_IN_RANGE) creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else {
                if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // -------------------------
        // 3. Build construction sites
        // -------------------------
        const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        // -------------------------
        // 4. Upgrade controller if nothing to build
        // -------------------------
        if (creep.room.controller) {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller.pos, { visualizePathStyle: { stroke: '#00ff00' } });
            }
        }
    }
};
