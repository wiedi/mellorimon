"use strict"
var exec  = require('child_process').exec
var kstat = require('../util').kstat


function Arc(cb) {
	kstat([
		'zfs:0:arcstats:hits',
		'zfs:0:arcstats:misses'
	],function(err, results) {
		if(err) {
			cb(null, {})
			return
		}

		var max	= Number(results['unix:0:var:v_proc'])
		var current = Number(results['unix:0:system_misc:nproc'])
		var warning = parseInt(max*0.92)
		var critical = parseInt(max*0.98)

		cb(null, {'arc': [
			"graph_title ZFS ARC Efficiency",
			"graph_info ZFS Adaptive Replacement Cache Hits + Misses",
			"graph_args --base 1000",
			"graph_vlabel cache hits (+) / misses (-) per ${graph_period}",
			"graph_category disk",
			"misses.label misses",
			"misses.value " + results['zfs:0:arcstats:misses'],
			"misses.type DERIVE",
			"misses.min 0",
			"misses.graph no",
			"hits.label hits",
			"hits.value " + results['zfs:0:arcstats:hits'],
			"hits.type DERIVE",
			"hits.min 0",
			"hits.negative misses"
		]})
	})
}


module.exports = Arc
