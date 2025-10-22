const sourceManager = require('sourceManager');

const roleBodies = {
    harvester: function(energy) {
        var body = [];
        var cost = 0;
        while (cost + 200 <= energy && body.length < 9) { // smaller early-game harvester
            body.push(WORK, CARRY, MOVE);
            cost += 200;
        }
        return body.length ? body : [WORK, CARRY, MOVE];
    },
    hauler: function(energy) {
        var body = [];
        var cost = 0;
        while (cost + 150 <= energy && body.length < 15) {
            body.push(CARRY, CARRY, MOVE);
            cost += 150;
        }
        return body.length ? body : [CARRY, MOVE];
    },
    upgrader: function(energy) {
        var body = [];
        var cost = 0;
        while (cost + 200 <= energy && body.length < 15) {
            body.push(WORK, CARRY, MOVE);
            cost += 200;
        }
        return body.length ? body : [WORK, CARRY, MOVE];
    },
    builder: function(energy) {
        var body = [];
        var cost = 0;
        while (cost + 200 <= energy && body.length < 15) {
            body.push(WORK, CARRY, MOVE);
            cost += 200;
        }
        return body.length ? body : [WORK, CARRY, MOVE];
    }
};

module.exports = {
    run: function() {
        var spawn = Game.spawns['Spawn1'];
        if (!spawn || spawn.spawning) return;

        var room = spawn.room;
        var energyAvailable = room.energyAvailable;

        // Initialize sources if not already
        if (!Memory.rooms[room.name] || !Memory.rooms[room.name].sources) {
            sourceManager.initRoom(room);
        }

        var sources = Memory.rooms[room.name].sources;
        var creepsByRole = _.groupBy(Game.creeps, function(c) { return c.memory.role; });

        // --------------------------
        // 1. HARVESTERS: fill free source tiles
        // --------------------------
        var harvesters = creepsByRole['harvester'] || [];
        var sourceToSpawn = null;
        var maxFree = -1;

        for (var sId in sources) {
            var assigned = harvesters.filter(function(h) { return h.memory.sourceId === sId; }).length;
            var freeTiles = sources[sId].tiles.length - assigned;
            if (freeTiles > maxFree) {
                maxFree = freeTiles;
                sourceToSpawn = sId;
            }
        }

        if (sourceToSpawn && maxFree > 0) {
            this.spawnCreep(spawn, 'harvester', sourceToSpawn, energyAvailable);
            return;
        }

        // --------------------------
        // 2. HAULERS: spawn if dropped energy exceeds current haulers
        // --------------------------
        var haulers = creepsByRole['hauler'] || [];
        var freeEnergy = room.find(FIND_DROPPED_RESOURCES, { filter: function(r) { return r.resourceType === RESOURCE_ENERGY; } });
        if (freeEnergy.length > haulers.length) {
            this.spawnCreep(spawn, 'hauler', null, energyAvailable);
            return;
        }

        // --------------------------
        // 3. BUILDERS: dynamic scaling based on construction sites
        // --------------------------
        var builders = creepsByRole['builder'] || [];
        var constructionSites = room.find(FIND_CONSTRUCTION_SITES).length;
        var targetBuilders = Math.min(Math.ceil(constructionSites / 3), 4); // 1 builder per ~3 sites, max 4

        if (builders.length < targetBuilders) {
            this.spawnCreep(spawn, 'builder', null, energyAvailable);
            return;
        }

        // --------------------------
        // 4. UPGRADERS: based on controller level
        // --------------------------
        var upgraders = creepsByRole['upgrader'] || [];
        var targetUpgraders = room.controller.level >= 3 ? 3 : 2;

        if (upgraders.length < targetUpgraders) {
            this.spawnCreep(spawn, 'upgrader', null, energyAvailable);
            return;
        }
    },

    spawnCreep: function(spawn, role, sourceId, energy) {
        var body = roleBodies[role](energy);
        var name = role + Game.time;
        var memory = { role: role };
        if (sourceId) memory.sourceId = sourceId;

        var result = spawn.spawnCreep(body, name, { memory: memory });
        if (result === OK) {
            console.log('Spawning ' + role + ' ' + name + ' (' + body.length + ' parts)');
        }
    }
};
