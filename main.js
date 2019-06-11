"use strict"

var async = require('async')

var plugins = [
	require('./plugins/arc'),
	require('./plugins/cpu'),
	require('./plugins/load'),
	require('./plugins/ipmitool'),
	require('./plugins/zpool'),
	require('./plugins/mem'),
	require('./plugins/swap'),
	require('./plugins/processes'),
	require('./plugins/network'),
	require('./plugins/zones_network'),
	require('./plugins/zones_cpu'),
	require('./plugins/zones_memory'),
	require('./plugins/zones_iops'),
]

function Mellorimon() {
	this.stats = {}
	this.last_update = 0
	this.subscribers = []
}

var CACHE_TTL = 30 * 1000 /* 30 seconds */

Mellorimon.prototype.update = function(cb) {
	var self = this
	cb = cb || function() {}

	var now = + new Date()
	if(now - this.last_update < CACHE_TTL) {
		cb(null)
		return
	}
	self.subscribers.push(cb)
	if(self.subscribers.length > 1) {
		return
	}
	async.parallel(plugins, function(err, result) {
		if(err) {
			self.subscribers.forEach(function(s) {
				process.nextTick(function() {
					s.apply(err)
				})
			})
			self.subscribers = []
			return
		}

		self.last_update = now
		self.stats = {}
		result.forEach(function(v) {
			for(var prop in v) {
				self.stats[prop] = v[prop]
			}
		})

		self.subscribers.forEach(function(s) {
			process.nextTick(function() {
				s.apply(null)
			})
		})
		self.subscribers = []
	})
}

Mellorimon.prototype.list = function list(cb) {
	var self = this
	this.update(function(err) {
		if(err) {
			cb(err)
			return
		}
		cb(null, Object.keys(self.stats))
	})
}

Mellorimon.prototype.config = function config(stat, cb) {
	var self = this
	this.update(function(err) {
		if(err) {
			cb(err)
			return
		}
		if(!(stat in self.stats)) {
			cb(null, [])
			return
		}
		cb(null, self.stats[stat])
	})
}

module.exports = Mellorimon
