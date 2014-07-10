"use strict"

var async = require('async')

var plugins = [
	require('./load'),
	require('./kstat'),
	require('./ipmitool'),
	require('./zpool'),
	require('./mpstat'),
	require('./mem'),
	require('./processes'),
	require('./network'),
	require('./zones_network')
]

function Mellorimon() {
	this.stats = {}
}

Mellorimon.prototype.update = function(cb) {
	var self = this
	cb = cb || function() {}
	async.parallel(plugins, function(err, result) {
		if(err) {
			cb(err)
			return
		}
		self.stats = {}
		result.forEach(function(v) {
			for(var prop in v) {
				self.stats[prop] = v[prop]
			}
		})
		cb(null)
	})
}

Mellorimon.prototype.list = function list() {
	return Object.keys(this.stats)
}

Mellorimon.prototype.config = function config(stat) {
	if(!(stat in this.stats)) {
		return []
	}
	return this.stats[stat]
}

module.exports = Mellorimon
