#!/usr/bin/env node --max_old_space_size=4096

var mapshaper = require("mapshaper");
mapshaper.enableLogging();
mapshaper.runCommands(process.argv.slice(2), done);

function done(err) {
  if (err) {
    mapshaper.printError(err);
    process.exit(1);
  } else {
    process.exit(0);
  }
}
