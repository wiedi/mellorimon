"use strict"

var exec = require('child_process').exec
var clean_fieldname = require('./util').clean_fieldname

function parse(stdout) {
	var pools = []
	stdout.split('\n').forEach(function(line) {
		line = line.split('\t')
		if(line.length != 5) return
		pools.push({
			'name':      line[0],
			'size':      line[1],
			'allocated': line[2],
			'free':      line[3],
			'capacity':  line[4]
		})
	})
	return pools
}

function fetch(cb) {
	exec("zpool list -Hpo name,size,allocated,free,capacity", function(err, stdout, stderr) {
		if(err) {
			cb(err)
			return
		}
		cb(null, parse(stdout))
	})
}

function zpool(cb) {
	fetch(function(err, pools) {
		if(err) {
			cb(null, {})
			return
		}
		var stats = {}
		pools.forEach(function(pool) {
			var name = clean_fieldname(pool.name)
			stats['zpool_' + name] = [
				"graph_title zpool usage (" + pool.name + ")",
				"graph_vlabel bytes",
				"graph_info Space available and used on the zpool",
				"graph_args --base 1024 --lower-limit 0",
				"graph_category disk",
				"allocated.draw AREA",
				"allocated.label allocated",
				"allocated.value " + pool.allocated,
				"free.draw STACK",
				"free.label free",
				"free.value " + pool.free,
				"size.draw LINE1",
				"size.label size",
				"size.value " + pool.size,
				"capacity.graph no",
				"capacity.label capacity",
				"capacity.value " + pool.capacity,
				"capacity.warning 92",
				"capacity.critical 98"
			]
		})
		cb(null, stats)
	})
}

module.exports = zpool
