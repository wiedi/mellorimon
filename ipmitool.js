"use strict"

var exec = require('child_process').exec
var clean_fieldname = require('./util').clean_fieldname

var UNIT_DEFAULTS = {
	'rpm': [
		"graph_title RPMs",
		"graph_args --base 1000 -l 0",
		"graph_vlabel RPM",
		"graph_info IPMI Hardware RPM Numbers",
		"graph_category sensors"
	],
	'percent': [
		"graph_title IPMI Sensors",
		"graph_args --base 1000 -l 0 -u 100",
		"graph_vlabel %",
		"graph_info IPMI Hardware Percent Numbers",
		"graph_category sensors"
	],
	'degrees c': [
		"graph_title Temperature",
		"graph_args --base 1000",
		"graph_vlabel Degrees C",
		"graph_info IPMI Hardware Temperature",
		"graph_category sensors"
	],
	'volts': [
		"graph_title Voltages",
		"graph_args --base 1000",
		"graph_vlabel Volts",
		"graph_info IPMI Hardware voltage measurements",
		"graph_category sensors"
	],
	'amps': [
		"graph_title Electric Currents",
		"graph_args --base 1000",
		"graph_vlabel Amperes",
		"graph_info IPMI Hardware ampere measurements",
		"graph_category sensors"
	],
	'watts': [
		"graph_title Power",
		"graph_args --base 1000",
		"graph_vlabel Watts",
		"graph_info IPMI Hardware power measurements",
		"graph_category sensors"
	]
}

/* parse the ipmitool sensor output
 * returns an object containing each type of unit,
 * each of which contains a list of value objects
 */
function parse(stdout) {
	var out = {}
	stdout.split('\n').forEach(function(line) {
		line = line.trim().split(/\s*\|\s*/)
		if(line.length != 10) return
		if(line[3] == 'na') return

		var unit = line[2].toLowerCase()
		if(!(unit in out)) {
			out[unit] = []
		}
		out[unit].push({
			'sensor': line[0],
			'value':  line[1],
			'units':  unit,
			'state':  line[3],
			'lower-non-recoverable': line[4].replace('na', ''),
			'lower-critical':        line[5].replace('na', ''),
			'lower-non-critical':    line[6].replace('na', ''),
			'upper-non-critical':    line[7].replace('na', ''),
			'upper-critical':        line[8].replace('na', ''),
			'upper-non-recoverable': line[9].replace('na', '')
		})
	})
	return out
}

function fetch(cb) {
	exec("ipmitool sensor", function(err, stdout, stderr) {
		if(err) {
			cb(err)
			return
		}
		cb(null, parse(stdout))
	})
}

function format_field(field) {
	var name = clean_fieldname(field.sensor)
	var lines = [
		name + ".label " + field.sensor,
		name + ".value " + field.value
	]
	var warn = field['lower-non-critical'] + ':' + field['upper-non-critical']
	var crit = field['lower-critical']     + ':' + field['upper-critical']

	/* some iLO2 variants have invalid warning values that can't be changed
	 * if lower and upper bounds are 0 ignore those
	 */
	if(Number(field['lower-non-critical']) == 0 && Number(field['upper-non-critical']) == 0)
		warn = ':'
	if(Number(field['lower-critical']) == 0     && Number(field['upper-critical']) == 0)
		crit = ':'

	if(warn != ':') lines.push(name + ".warning "  + warn)
	if(crit != ':') lines.push(name + ".critical " + crit)
	return lines
}

function format_graph(values, unit) {
	if(!values[unit]) return
	var stats = UNIT_DEFAULTS[unit]
	values[unit].forEach(function(f) {
		stats = stats.concat(format_field(f))
	})
	return stats
}

function IPMI(cb) {
	fetch(function create_graphs(err, values) {
		if(err) {
			cb(null, {})
			return
		}

		var stats = {}
		Object.keys(UNIT_DEFAULTS).forEach(function(u) {
			var s = format_graph(values, u)
			if(s) {
				stats['ipmi_' + u.replace(' ', '_')] = s
			}
		})
		cb(null, stats)
	})
}

module.exports = IPMI