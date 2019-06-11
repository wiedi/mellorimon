"use strict"
var exec  = require('child_process').exec
var kstat = require('../util').kstat


function Cpu(cb) {
	kstat(['cpu:*:sys:cpu_nsec_*'],function(err, results) {
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

		var out_cpu = [
			"graph_title CPU Usage",
			"graph_info CPU time used",
			"graph_args --base 1000",
			"graph_vlabel cpu time used per ${graph_period}",
			"graph_category system",
			"graph_order kernel user idle"
		];

		['kernel', 'user', 'idle'].forEach(function(s) {
			out_cpu = out_cpu.concat([
				s + ".label " + s,
				s + ".min 0",
				s + ".type DERIVE",
				s + ".draw AREASTACK",
				s + ".cdef " + s + ",1000000000,/",
				s + ".value " + stats[s]
			])
		})

		var out_intr = [
			"graph_title Interrupt CPU Usage",
			"graph_info CPU time used",
			"graph_args --base 1000",
			"graph_vlabel cpu time used per ${graph_period}",
			"graph_category system",
			"graph_order intr",
			"intr.label intr",
			"intr.min 0",
			"intr.type DERIVE",
			"intr.cdef intr,1000000000,/",
			"intr.value " + stats["intr"]
		]

		cb(null, {
			'cpu': out_cpu,
			'intr_cpu': out_intr
		})
	})
}

module.exports = Cpu
