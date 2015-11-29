"use strict"

function clean_fieldname(name) {
	if(name[0] == '+') {
		name = 'pos_' + name
	} else if(name[0] == '-') {
		name = 'neg_' + name
	} else if(/[^a-zA-Z_]/.test(name[0])) {
		name = '_' + name
	}
	return name.replace(/[^a-zA-Z0-9_]/g, '_')
}

function split_with_escape(string, char) {
	var a = []
	char = char || ':'
	string.split(char).forEach(function(e) {
		var prev = a[a.length - 1]
		if(prev && prev.substr(-1) == "\\") {
			a[a.length - 1] = prev.slice(0, -1) + char + e
		} else {
			a.push(e)
		}
	})
	return a
}

function parse_zones_list(stdout) {
	var zones = {}

	stdout.trim().split('\n').forEach(function(line) {
		line = split_with_escape(line)
		if(line.length != 2) return
		zones[line[0]] = line[1]
	})

	return zones
}

exports.clean_fieldname   = clean_fieldname
exports.parse_zones_list  = parse_zones_list
exports.split_with_escape = split_with_escape
