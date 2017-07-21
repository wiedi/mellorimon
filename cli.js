#!/usr/bin/env node
"use strict"

var m = new (require('./main'))()

m.list(function(err, list) {
	if(err) {
		console.log(err)
		return
	}
	list.forEach(function(k) {
		m.config(k, function(err, stats) {
			console.log('#', k)
			if(err) {
				console.log('# Error: ' + err)
				return
			}
			console.log(stats.join("\n"))
		})
	})
})
