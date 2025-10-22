const sourceManager = require('sourceManager');

const roleBodies = {
    harvester: (energy) => {
        const body = [];
        let cost = 0;
        while (cost + 200 <= energy && body.length < 9) {
            body.push(WORK, CARRY, MOVE);
            cost += 200;
        }
        return body.length ? body : [WORK, CARRY, MOVE];
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
        const sources = Memory.rooms[room.name].sources;

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
        const freeEnergy = room.find(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_ENERGY });
        if (freeEnergy.length > haulers.length) {
            return this.spawnCreep(spawn, 'hauler', null, energyAvailable);
        }

        // --------------------
        // 3. UPGRADERS / BUILDERS
        // --------------------
        const numUpgraders = (creepsByRole['upgrader'] || []).length;
        const numBuilders = (creepsByRole['builder'] || []).length;
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES).length;

        const targetUpgraders = room.controller.level >= 3 ? 3 : 2;
        const targetBuilders = constructionSites > 5 ? 2 : 1;

        if (numUpgraders < targetUpgraders) return this.spawnCreep(spawn, 'upgrader', null, energyAvailable);
        if (numBuilders < targetBuilders) return this.spawnCreep(spawn, 'builder', null, energyAvailable);
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
