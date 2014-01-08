"use strict"

var exec = require('child_process').exec

function parse(stdout) {
	var stats = {usr: 0, sys: 0, idl: 0, cpus: 0}
	stdout.split('\n').forEach(function(line) {
		line = line.trim().split(/\s+/)
		if(line.length != 16) return
		if(line[0] == 'CPU') return /* skip header */
		stats.usr += Number(line[12])
		stats.sys += Number(line[13])
		stats.idl += Number(line[15])
		stats.cpus++
	})
	return stats
}

function mpstat(cb) {
	exec("mpstat", function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}
		var stats = parse(stdout)
		cb(null, {'mpstat': [
			"graph_title CPU Utilization",
			"graph_vlabel %",
			"graph_info Aggregates percentage each CPU spends on user + system + idel time",
			"graph_args --base 1000 -l 0 -u " + stats.cpus * 100 ,
			"graph_scale no",
			"graph_category system",
			"usr.label user",
			"usr.draw AREA",
			"usr.value " + stats.usr,
			"sys.label system",
			"sys.draw STACK",
			"sys.value " + stats.sys,
			"idl.label idel",
			"idl.draw STACK",
			"idl.value " + stats.idl
		]})
	})
}

module.exports = mpstat
