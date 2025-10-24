const sourceManager = require('sourceManager');

const roleBodies = {
    harvester: (energy) => {
        const body = [];
        let cost = 0;

        body.push(WORK, CARRY, MOVE);
        cost += 200;

        while (cost + 100 <= energy && body.length < 15) {
            body.push(WORK);
            cost += 100;
        }

        return body;
    },
    hauler: (energy) => {
        const body = [];
        let cost = 0;
        while (cost + 150 <= energy && body.length < 15) {
            body.push(CARRY, CARRY, MOVE);
            cost += 150;
        }
        return body.length ? body : [CARRY, MOVE];
    },
    upgrader: (energy) => {
        const body = [];
        let cost = 0;
        while (cost + 200 <= energy && body.length < 15) {
            body.push(WORK, CARRY, MOVE);
            cost += 200;
        }
        return body.length ? body : [WORK, CARRY, MOVE];
    },
    builder: (energy) => {
        const body = [];
        let cost = 0;
        while (cost + 200 <= energy && body.length < 15) {
            body.push(WORK, CARRY, MOVE);
            cost += 200;
        }
        return body.length ? body : [WORK, CARRY, MOVE];
    }
};

module.exports = {
    run(room) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn || spawn.spawning) return;

        const energyAvailable = room.energyAvailable;
        const creepsByRole = _.groupBy(Game.creeps, c => c.memory.role);

        // Initialize source memory
        sourceManager.initRoom(room);
        const sources = (Memory.rooms[room.name] && Memory.rooms[room.name].sources) || {};

        // --------------------
        // 1. HARVESTERS
        // --------------------
        const harvesters = creepsByRole['harvester'] || [];
        let sourceToSpawn = null;
        let maxFree = -1;

        for (const sId in sources) {
            const assigned = harvesters.filter(h => h.memory.sourceId === sId).length;
            const freeTiles = sources[sId].tiles.length - assigned;
            if (freeTiles > maxFree) {
                maxFree = freeTiles;
                sourceToSpawn = sId;
            }
        }

        if (sourceToSpawn && maxFree > 0) {
            return this.spawnCreep(spawn, 'harvester', sourceToSpawn, energyAvailable);
        }

        // --------------------
        // 2. HAULERS
        // --------------------
        const haulers = creepsByRole['hauler'] || [];
        const energyContainers = room.find(FIND_STRUCTURES, {
            filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                s.store[RESOURCE_ENERGY] > 50
        });

        const targetHaulers = Math.min(4, Math.max(1, energyContainers.length));
        if (targetHaulers > haulers.length) {
            return this.spawnCreep(spawn, 'hauler', null, energyAvailable);
        }

        // --------------------
        // 3. BUILDERS
        // --------------------
        const numBuilders = (creepsByRole['builder'] || []).length;
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);

        // Calculate total remaining energy/work
        const totalEnergyRequired = constructionSites.reduce((sum, site) => sum + (site.progressTotal - site.progress), 0);
        const targetBuilders = Math.min(4, Math.max(1, Math.ceil(totalEnergyRequired / 5000)));

        if (numBuilders < targetBuilders) {
            return this.spawnCreep(spawn, 'builder', null, energyAvailable);
        }

        // --------------------
        // 4. UPGRADERS
        // --------------------
        const numUpgraders = (creepsByRole['upgrader'] || []).length;
        const targetUpgraders = Math.min(4, Math.max(1, Math.floor(room.energyCapacityAvailable / 400)));
        // scale upgraders by available energy capacity

        if (numUpgraders < targetUpgraders) {
            return this.spawnCreep(spawn, 'upgrader', null, energyAvailable);
        }
    },

    spawnCreep(spawn, role, sourceId = null, energy) {
        const body = roleBodies[role](energy);
        const name = `${role}${Game.time}`;
        const memory = { role, roomName: spawn.room.name };
        if (sourceId) memory.sourceId = sourceId;

        const result = spawn.spawnCreep(body, name, { memory });
        if (result === OK) console.log(`Spawning ${role} ${name} (${body.length} parts)`);

        return result;
    }
};
