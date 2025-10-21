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
  run() {
    const spawn = Game.spawns['Spawn1'];  // ← adjust if spawn has different name
    if (!spawn) {
      console.log('⚠️ Spawn not found');
      return;
    }
    if (spawn.spawning) {
      // Optionally show the role being spawned
      const spawningCreep = Game.creeps[spawn.spawning.name];
      if (spawningCreep) {
        spawn.room.visual.text(
          '🛠️ ' + spawningCreep.memory.role,
          spawn.pos.x + 1,
          spawn.pos.y,
          { align: 'left', opacity: 0.8 }
        );
      }
      return;
    }

    const room = spawn.room;
    const energyAvailable = room.energyAvailable;

    // Ensure source data is initialized
    sourceManager.initRoom(room);
    const sources = Memory.rooms[room.name].sources;
    if (!sources) {
      console.log('⚠️ No source data for room', room.name);
      return;
    }

    const creepsByRole = _.groupBy(Game.creeps, c => c.memory.role);
    const harvesters = creepsByRole['harvester'] || [];
    const haulers = creepsByRole['hauler'] || [];
    const upgraders = creepsByRole['upgrader'] || [];
    const builders = creepsByRole['builder'] || [];

    // 1. HARVESTERS: fill all free source-tiles
    let sourceToSpawn = null;
    let maxFree = -1;
    for (const sId in sources) {
      const tileCount = (sources[sId].tiles || []).length;
      const assignedCount = harvesters.filter(h => h.memory.sourceId === sId).length;
      const freeTiles = tileCount - assignedCount;
      // Debug log
      // console.log(`Source ${sId}: tileCount=${tileCount}, assigned=${assignedCount}, free=${freeTiles}`);
      if (freeTiles > maxFree) {
        maxFree = freeTiles;
        sourceToSpawn = sId;
      }
    }
    if (sourceToSpawn && maxFree > 0) {
      this.spawnCreep(spawn, 'harvester', sourceToSpawn, energyAvailable);
      return;
    }

    // 2. HAULERS: only after harvesters exist. Spawn if dropped energy > existing haulers
    const freeEnergy = room.find(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_ENERGY });
    if (harvesters.length > 0 && freeEnergy.length > haulers.length) {
      this.spawnCreep(spawn, 'hauler', null, energyAvailable);
      return;
    }

    // 3. UPGRADERS / BUILDERS
    const targetUpgraders = room.controller.level >= 3 ? 3 : 2;
    const targetBuilders = room.find(FIND_CONSTRUCTION_SITES).length > 5 ? 2 : 1;

    if (upgraders.length < targetUpgraders) {
      this.spawnCreep(spawn, 'upgrader', null, energyAvailable);
      return;
    }
    if (builders.length < targetBuilders) {
      this.spawnCreep(spawn, 'builder', null, energyAvailable);
      return;
    }

    // If nothing else, maybe idle or additional logic
    // console.log('✅ All primary roles satisfied');
  },

  spawnCreep(spawn, role, sourceId = null, energy) {
    const body = roleBodies[role](energy);
    const name = `${role}_${Game.time}`;
    const memory = { role: role };
    if (sourceId) {
      memory.sourceId = sourceId;
    }
    const result = spawn.spawnCreep(body, name, { memory: memory });
    if (result === OK) {
      console.log(`Spawning ${role} ${name} with body [${body.join(',')}]`);
    } else {
      console.log(`⚠️ spawnCreep error: ${result} for ${role} ${name}`);
    }
  },
};
