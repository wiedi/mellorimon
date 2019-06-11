"use strict"

var async = require('async')
var exec  = require('child_process').exec

function pagesize(cb) {
	exec("pagesize", function(err, stdout, stderr) {
		if(err) {
			cb(err)
			return
		}
		cb(null, Number(stdout))
	})
}

function kstat(stats, cb) {
	exec("kstat -p " + stats.join(' '), function(err, stdout, stderr) {
		if(err) {
			cb(err)
			return
		}
		var list = {}
		stdout.split('\n').forEach(function(line) {
			line = line.trim().split('\t')
			if(line.length != 2) return
			list[line[0]] = line[1]
		})
		cb(null, list)
	})
}

function mem(cb) {
	async.parallel({
		pagesize: pagesize,
		kstat: function(cb) {
			kstat([
				'unix:0:system_pages:physmem',
				'unix:0:system_pages:pp_kernel',
				'unix:0:system_pages:pagesfree',
				'zfs:0:arcstats:size'
			], cb)
		}
	}, function(err, results) {
		if(err) {
			cb(null, {})
			return
		}
		var total  = Number(results.kstat['unix:0:system_pages:physmem'])   * results.pagesize
		var kernel = Number(results.kstat['unix:0:system_pages:pp_kernel']) * results.pagesize
		var free   = Number(results.kstat['unix:0:system_pages:pagesfree']) * results.pagesize
		var arc    = Number(results.kstat['zfs:0:arcstats:size']) /* already bytes */
		var used = total - kernel - free
		kernel = kernel - arc /* arc is included in the kernel calculation */
		cb(null, {'mem': [
			"graph_title Memory Utilization",
			"graph_vlabel byte",
			"graph_info Memory utilization as reported by kstat",
			"graph_args --base 1024 -l 0",
			"graph_category system",
			"kernel.label kernel",
			"kernel.draw AREA",
			"kernel.value " + kernel,
			"arc.label zfs arc",
			"arc.draw STACK",
			"arc.value " + arc,
			"used.label used",
			"used.draw STACK",
			"used.value " + used,
			"free.label free",
			"free.draw STACK",
			"free.value " + free,
			"total.label total",
			"total.draw LINE1",
			"total.value " + total
		]})
	})
}

module.exports = mem
