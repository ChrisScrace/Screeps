const sourceManager = require('sourceManager');

module.exports = {
    run(room) {
        if (!room || !room.controller || !room.controller.my) return;

        // Initialize source memory
        sourceManager.initRoom(room);

        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;

        const spawn = spawns[0];
        if (spawn.spawning) return;

        // Energy and creep role counts
        const energy = room.energyAvailable;
        const creeps = _.groupBy(
            _.filter(Game.creeps, c => c.room.name === room.name),
            c => c.memory.role
        );

        const counts = {
            harvester: creeps.harvester?.length || 0,
            hauler: creeps.hauler?.length || 0,
            builder: creeps.builder?.length || 0,
            upgrader: creeps.upgrader?.length || 0
        };

        // Desired counts
        const desired = this.getDesiredCounts(room);

        // Spawn priorities (harvesters first, then haulers, then utility)
        if (counts.harvester < desired.harvester) {
            this.spawnCreep(spawn, 'harvester');
            return;
        }
        if (counts.hauler < desired.hauler) {
            this.spawnCreep(spawn, 'hauler');
            return;
        }
        if (counts.builder < desired.builder) {
            this.spawnCreep(spawn, 'builder');
            return;
        }
        if (counts.upgrader < desired.upgrader) {
            this.spawnCreep(spawn, 'upgrader');
            return;
        }
    },

    // ----------------------------
    // Dynamic desired creep counts
    // ----------------------------
    getDesiredCounts(room) {
        const sites = room.find(FIND_CONSTRUCTION_SITES).length;
        const containers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        }).length;

        const energyCap = room.energyCapacityAvailable;

        // Base ratios
        let harvester = 2;
        let hauler = energyCap < 600 ? 1 : 2;
        let upgrader = energyCap < 800 ? 1 : 2;

        // Dynamic builder scaling
        let builder = 1;
        builder += Math.floor(sites / 3);
        builder = Math.min(builder, containers || 2, 4);

        // Early room fallback
        if (energyCap < 400) {
            harvester = 2;
            hauler = 0;
            builder = 1;
            upgrader = 1;
        }

        return { harvester, hauler, builder, upgrader };
    },

    // ----------------------------
    // Spawn logic
    // ----------------------------
    spawnCreep(spawn, role) {
        const body = this.getBody(role, spawn.room.energyAvailable);
        const name = `${role}_${Game.time}`;
        const result = spawn.spawnCreep(body, name, { memory: { role } });

        if (result === OK) {
            console.log(`🚀 Spawning new ${role}: ${name}`);
        } else if (result !== ERR_BUSY && result !== ERR_NOT_ENOUGH_ENERGY) {
            console.log(`⚠️ Failed to spawn ${role}: ${result}`);
        }
    },

    // ----------------------------
    // Role-specific body designs
    // ----------------------------
    getBody(role, energy) {
        if (role === 'harvester') {
            return energy >= 550 ? [WORK, WORK, WORK, CARRY, MOVE, MOVE] : [WORK, CARRY, MOVE];
        }
        if (role === 'hauler') {
            return energy >= 550 ? [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE] : [CARRY, CARRY, MOVE];
        }
        if (role === 'builder') {
            return energy >= 550 ? [WORK, WORK, CARRY, CARRY, MOVE, MOVE] : [WORK, CARRY, MOVE];
        }
        if (role === 'upgrader') {
            return energy >= 550 ? [WORK, WORK, CARRY, CARRY, MOVE, MOVE] : [WORK, CARRY, MOVE];
        }
        return [WORK, CARRY, MOVE];
    }
};
