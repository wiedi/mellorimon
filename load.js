"use strict"
var os = require('os')

function Load(cb) {
	cb(null, {
		'load': [
			"graph_title Load average",
			"graph_vlabel load",
			"graph_info The load average of the machine describes how many processes are in the run-queue (scheduled to run 'immediately').",
			"graph_args --base 1000 -l 0",
			"graph_scale no",
			"graph_category system",
			"load.label load",
			"load.info Average load for the five minutes.",
			"load.warning "  + os.cpus().length,
			"load.critical " + os.cpus().length * 10,
			"load.value "    + os.loadavg()[1]
		]
	})
}

module.exports = Load
