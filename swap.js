"use strict"

var exec = require('child_process').exec

function swap(cb) {
	exec("swap -s", function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}

		var m = stdout.match(/total: (\d+)k bytes allocated \+ (\d+)k reserved = (\d+)k used, (\d+)k available/)
		var allocated = Number(m[1]) * 1024
		var reserved  = Number(m[2]) * 1024
		var used      = Number(m[3]) * 1024
		var available = Number(m[4]) * 1024

		cb(null, {'swap': [
			"graph_title Swap Utilization",
			"graph_vlabel byte",
			"graph_info Swap utilization",
			"graph_args --base 1024 -l 0",
			"graph_category system",
			"allocated.label allocated",
			"allocated.draw AREA",
			"allocated.value " + allocated,
			"reserved.label reserved",
			"reserved.draw STACK",
			"reserved.value " + reserved,
			"available.label available",
			"available.draw STACK",
			"available.value " + available,
			"used.label used",
			"used.draw LINE1",
			"used.value " + used
		]})
	})
}

module.exports = swap
