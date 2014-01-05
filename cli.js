#!/usr/bin/env node
"use strict"

var m = new (require('./main'))()

m.update(function(err) {
	m.list().forEach(function(k) {
		console.log('#', k)
		console.log(m.config(k).join("\n"))
	})
})
