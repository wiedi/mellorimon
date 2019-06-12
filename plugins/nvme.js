"use strict"

var async = require('async')
var exec = require('child_process').exec
var clean_fieldname = require('../util').clean_fieldname

function list_devices(cb) {
	var cmd = "nvmeadm list"
	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}

		var devices = {}
		stdout.trim().split('\n').forEach(function(line) {
			line = line.match(/([a-z0-9]+): model: (.*), serial: (.*), FW rev: (.*), NVMe v(.*)/)
			if(line === null) return;
			devices[line[1]] = {
				model:  line[2],
				serial: line[3],
				fw_rev: line[4],
				proto:  line[5]
			}
		})
		cb(null, devices)
	})
}

function nvme_health(dev, cb) {
	var cmd = "nvmeadm -v get-logpage " + dev + " health"
	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}

		var health = {}
		stdout.trim().split('\n').forEach(function(line) {
			line = line.match(/^  ([^:]+):\s+(.*)/)
			if(line === null) return;
			health[line[1]] = line[2]
		})
		cb(null, health)
	})
}

function dev_info(dev) {
	return 'NVMe v' + dev['proto'] + ' Model: ' + dev['model'] + ' Firmware: ' + dev['fw_rev']
}

function nvme_temperature(devices) {
	var stats = [
		"graph_title NVMe Temperature",
		"graph_info NVMe Device Temperature",
		"graph_args --base 1000",
		"graph_vlabel Degrees C",
		"graph_category sensors",
	]

	Object.keys(devices).forEach(function(dev) {
		var d = devices[dev]
		var f = clean_fieldname(d['serial'])
		stats.push(f + ".label " + dev)
		stats.push(f + ".info " + dev_info(d))
		stats.push(f + ".value " + d.health['Temperature'].replace('C', ''))
	})
	return stats
}


function nvme_life(devices) {
	var stats = [
		"graph_title NVMe Device Life Used",
		"graph_info NVMe Device Life Used",
		"graph_args --base 1000 -l 0",
		"graph_vlabel %",
		"graph_category disk",
	]

	Object.keys(devices).forEach(function(dev) {
		var d = devices[dev]
		var f = clean_fieldname(d['serial'])
		stats.push(f + ".label " + dev)
		stats.push(f + ".info " + dev_info(d))
		stats.push(f + ".value " + d.health['Device Life Used'].replace('%', ''))
		stats.push(f + ".warning :66")
		stats.push(f + ".critical :90")
	})
	return stats
}


function nvme_sparecapacity(devices) {
	var stats = [
		"graph_title NVMe Spare Capacity",
		"graph_info NVMe Spare Capacity",
		"graph_args --base 1000 -l 0",
		"graph_vlabel %",
		"graph_category disk",
	]

	Object.keys(devices).forEach(function(dev) {
		var d = devices[dev]
		var f = clean_fieldname(d['serial'])
		stats.push(f + ".label " + dev)
		stats.push(f + ".info " + dev_info(d))
		stats.push(f + ".value " +   d.health['Available Spare Capacity'].replace('%', ''))
		stats.push(f + ".warning " + d.health['Available Spare Threshold'].replace('%', '') + ':')
	})
	return stats
}

function nvme_error(devices) {
	var graphs = {}
	Object.keys(devices).forEach(function(dev) {
		var d = devices[dev]
		var f = clean_fieldname(d['serial'])

		var stats = [
			"graph_title NVMe Errors (" + dev + ")",
			"graph_info NVMe Errors for " + dev + " " + dev_info(d),
			"graph_args --base 1000 -l 0",
			"graph_vlabel Errors",
			"graph_category disk",
		]

		stats.push("logged.label Errors Logged")
		stats.push("logged.value " + d.health['Errors Logged'])
		stats.push("logged.warning :1")
		stats.push("mediae.label Uncorrectable Media Errors")
		stats.push("mediae.value " + d.health['Uncorrectable Media Errors'])
		stats.push("mediae.warning :1")

		stats.push("space.label Available Space Warning")
		stats.push("space.value " + (d.health['  Available Space'] != 'OK' ? '1' : '0'))
		stats.push("space.warning :1")

		stats.push("temp.label Temperature Warning")
		stats.push("temp.value " + (d.health['  Temperature'] != 'OK' ? '1' : '0'))
		stats.push("temp.warning :1")

		stats.push("rel.label Device Reliability Warning")
		stats.push("rel.value " + (d.health['  Device Reliability'] != 'OK' ? '1' : '0'))
		stats.push("rel.warning :1")

		stats.push("media.label Media Warning")
		stats.push("media.value " + (d.health['  Media'] != 'OK' ? '1' : '0'))
		stats.push("media.warning :1")

		stats.push("mem.label Volatile Memory Backup Warning")
		stats.push("mem.value " + (d.health['  Volatile Memory Backup'] != 'OK' ? '1' : '0'))
		stats.push("mem.warning :1")

		graphs['nvme_err_' + f] = stats
	})
	return graphs
}

function generate_stats(devices) {
	if(Object.keys(devices).length === 0) {
		return {}
	}
	var graphs = nvme_error(devices)

	graphs['nvme_temp'] =          nvme_temperature(devices)
	graphs['nvme_life'] =          nvme_life(devices)
	graphs['nvme_sparecapacity'] = nvme_sparecapacity(devices)
	return graphs
}

function NVMe(cb) {
	var stats = {}
	list_devices(function(err, devices) {
		if(err) {
			cb(null, {})
			return
		}

		async.each(Object.keys(devices), function(d, cb) {
			nvme_health(d, function(err, h) {
				devices[d]['health'] = h
				cb()
			})
		}, function(err) {
			cb(null, generate_stats(devices))
		})
	})
}

module.exports = NVMe
