"use strict"
var os = require('os')

function Failtest(cb) {
	cb(null, {
		'failtest': [
			"graph_title Failtest",
			"graph_vlabel fails",
			"graph_info Test for alerting",
			"graph_args --base 1000 -l 0",
			"graph_scale no",
			"graph_category system",
			"ok.label ok",
			"ok.info I'm ok",
			"ok.warning "  + 10,
			"ok.critical " + 100,
			"ok.value "    + (Math.random() * 9),
			"warn.label warn",
			"warn.info You have been warned before",
			"warn.warning "  + 10,
			"warn.critical " + 100,
			"warn.value "    + (Math.random() * 75 + 10),
			"errr.label err",
			"errr.info EOUTATIME",
			"errr.warning "  + 10,
			"errr.critical " + 100,
			"errr.value "    + (Math.random() * 20 + 100),
		]
	})
}

module.exports = Failtest
