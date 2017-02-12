"use strict"
var exec  = require('child_process').exec
var kstat = require('./util').kstat


function Cpu(cb) {
	kstat(['*:*:*:cpu_nsec_*'],function(err, results) {
		if(err) {
			cb(null, {})
			return
		}

		var stats = {
			dtrace: 0,
			idle:   0,
			intr:   0,
			kernel: 0,
			user:   0
		}

		Object.keys(results).forEach(function(k) {
			stats[k.split('_').pop()] += Number(results[k])
		})

		var out = [
			"graph_title CPU Usage",
			"graph_info CPU time used",
			"graph_args --base 1000",
			"graph_vlabel cpu time used per ${graph_period}",
			"graph_category system",
			"graph_order kernel intr dtrace user idle"
		]

		Object.keys(stats).forEach(function(s) {
			out = out.concat([
				s + ".label " + s,
				s + ".min 0",
				s + ".type DERIVE",
				s + ".draw AREASTACK",
				s + ".cdef " + s + ",1000000000,/",
				s + ".value " + stats[s]
			])
		})
		
		cb(null, {'cpu': out})
	})
}

module.exports = Cpu
