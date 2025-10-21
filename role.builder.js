module.exports = {
    run(creep) {
        // -----------------------
        // If out of energy, fetch some
        // -----------------------
        if (creep.store[RESOURCE_ENERGY] === 0) {
            if (this.fetchEnergy(creep)) return; // moved or withdrawing
        }

        // -----------------------
        // If energy, build priority construction
        // -----------------------
        const target = this.findConstruction(creep);
        if (!target) return; // nothing to build

        if (creep.build(target) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    },

    // -----------------------
    // Fetch energy from containers > haulers > spawn/floor
    // -----------------------
    fetchEnergy(creep) {
        // Containers
        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        });
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }

        // Nearby haulers carrying energy
        const hauler = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: c => c.memory.role === 'hauler' && c.store[RESOURCE_ENERGY] > 0
        });
        if (hauler) {
            if (creep.withdraw(hauler, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(hauler, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }

        // Spawn/floor drops
        const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
        if (spawn && spawn.store[RESOURCE_ENERGY] > 0) {
            if (creep.withdraw(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }

        const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (dropped) {
            if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }

        return false; // no energy found
    },

    // -----------------------
    // Builder priority: containers -> extensions -> towers -> roads
    // -----------------------
    findConstruction(creep) {
        const sites = creep.room.find(FIND_CONSTRUCTION_SITES);

        // Assign priorities (lower number = higher priority)
        const priorities = {
            [STRUCTURE_CONTAINER]: 1,
            [STRUCTURE_EXTENSION]: 2,
            [STRUCTURE_TOWER]: 3,
            [STRUCTURE_ROAD]: 4,
            [STRUCTURE_SPAWN]: 5
        };

        // Sort by priority
        sites.sort((a, b) => {
            return (priorities[a.structureType] || 99) - (priorities[b.structureType] || 99);
        });

        return sites[0] || null;
    }
};
