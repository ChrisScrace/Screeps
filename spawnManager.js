const sourceManager = require('sourceManager');

const roleBodies = {
    harvester: (energy) => {
        const body = [];
        let cost = 0;
        while (cost + 200 <= energy && body.length < 15) { // cap
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
    run() {
        const spawn = Game.spawns['Spawn1'];
        if (!spawn || spawn.spawning) return;

        const room = spawn.room;
        const energyAvailable = room.energyAvailable;
        if (!Memory.rooms[room.name].sources) sourceManager.initRoom(room);

        const sources = Memory.rooms[room.name].sources;
        const creepsByRole = _.groupBy(Game.creeps, c => c.memory.role);

        // === HARVESTERS: fill all free tiles ===
        const harvesters = creepsByRole['harvester'] || [];
        let harvestersPerSource = {};
        for (const sId in sources) harvestersPerSource[sId] = 0;
        for (const h of harvesters) {
            if (h.memory.sourceId) harvestersPerSource[h.memory.sourceId]++;
        }
        let sourceToSpawn = null;
        for (const sId in sources) {
            if (sources[sId].tiles.length > harvestersPerSource[sId]) {
                sourceToSpawn = sId;
                break;
            }
        }
        if (sourceToSpawn) return this.spawnCreep(spawn, 'harvester', sourceToSpawn, energyAvailable);

        // === HAULERS: spawn if needed ===
        const haulers = creepsByRole['hauler'] || [];
        const freeEnergy = room.find(FIND_DROPPED_RESOURCES, {filter: r => r.resourceType === RESOURCE_ENERGY});
        if (freeEnergy.length > haulers.length) return this.spawnCreep(spawn, 'hauler', null, energyAvailable);

        // === UPGRADERS / BUILDERS ===
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
        const memory = { role };
        if (sourceId) memory.sourceId = sourceId;

        const result = spawn.spawnCreep(body, name, { memory });
        if (result === OK) console.log(`Spawning ${role} ${name} (${body.length} parts)`);
    }
};
