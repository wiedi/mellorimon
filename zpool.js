"use strict"

var exec = require('child_process').exec
var clean_fieldname = require('./util').clean_fieldname

function zpool_parse(stdout) {
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

function zfs_list_parse(stdout) {
	var fs = []
	stdout.split('\n').forEach(function(line) {
		line = line.split('\t')
		if(line.length != 3) return
		var avail = Number(line[1])
		var used  = Number(line[2])
		fs.push({
			'name':     line[0],
			'avail':    avail,
			'used':     used,
			'capacity': ((used / (used + avail)) * 100) | 0
		})
	})
	return fs
}

function generate_zpool_stats(pools) {
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
	return stats
}

function generate_zfs_list_stats(fs_data, stats) {
	fs_data.forEach(function(fs) {
		var name = clean_fieldname(fs.name)
		stats['zfslist_' + name] = [
			"graph_title zfs usage (" + fs.name + ")",
			"graph_vlabel bytes",
			"graph_info Space available and used for ZFS",
			"graph_args --base 1024 --lower-limit 0",
			"graph_category disk",
			"used.draw AREA",
			"used.label used",
			"used.value " + fs.used,
			"avail.draw STACK",
			"avail.label avail",
			"avail.value " + fs.avail,
			"capacity.graph no",
			"capacity.label capacity",
			"capacity.value " + fs.capacity,
			"capacity.warning 92",
			"capacity.critical 98"
		]
	})
	return stats
}

function zpool(cb) {
	var cmd = "zpool list -Hpo name,size,allocated,free,capacity"
	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}
		var pool_data = zpool_parse(stdout)
		var stats = generate_zpool_stats(pool_data)

		var pool_list = []
		pool_data.forEach(function(x) {
			pool_list.push(x.name)
		})

		var zfs_list_cmd = "zfs list -Hpo name,avail,used " + pool_list.join(" ")
		exec(zfs_list_cmd, function(err, stdout, stderr) {
			if(err) {
				cb(null, {})
				return
			}
			var fs_data = zfs_list_parse(stdout)
			console.log(stdout, fs_data)
			stats = generate_zfs_list_stats(fs_data, stats)
			console.log(stats)
			cb(null, stats)
		})
	})
}

module.exports = zpool
