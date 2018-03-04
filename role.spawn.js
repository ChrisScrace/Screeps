var creepCost = function (creepTags){
    var creepParts = new Map();
    creepParts.set(WORK , 100 )
              .set(MOVE, 50)
              .set(CARRY, 50)
              .set(ATTACK, 50)
              .set(RANGED_ATTACK, 50)
              .set(HEAL, 50)
              .set(CLAIM, 50)
              .set(TOUGH, 50);

    var total = 0;

    for(var name in creepTags)
    {
        var part = creepTags[name];
        total += creepParts.get(part);
    }
    return total;
}

var creepDetails = {
  'Extractor'   :   {'role' : 'extractor',    'cap' : 2 , 'build' : [WORK, WORK, MOVE]},
  'Transporter' :   {'role' : 'transporter',  'cap' : 1 , 'build' : [WORK, CARRY, CARRY, MOVE, MOVE]},
  'Cleaner'     :   {'role' : 'cleaner',      'cap' : 1 , 'build' : [WORK, CARRY, CARRY, MOVE, MOVE]},
  'Builder'     :   {'role' : 'builder',      'cap' : 1 , 'build' : [WORK, WORK, CARRY, MOVE, MOVE]},
  'Upgrader'    :   {'role' : 'upgrader',     'cap' : 1 , 'build' : [WORK, WORK, CARRY, MOVE, MOVE]}};

var roleSpawn = {
  spawn:function(spawn){
    for(var name in creepDetails){
      var creep = creepDetails[name];
      if(spawn.room.energyAvailable >= creepCost(creepDetails[name].build)){
        var creepTypePool = _.filter(Game.creeps, (creep) => creep.memory.model == name);
        if(creepTypePool.length < creepDetails[name].cap) {
          var newName = name + Game.time;
          console.log('Spawning new ' + creepDetails[name].role + ": " + newName + " with parts: " + creepDetails[name].build);
          spawn.spawnCreep(creepDetails[name].build,
            newName,
            {memory: {model: name, role: creepDetails[name].role}});
        }
      }
    }
  }
};

module.exports = roleSpawn;
