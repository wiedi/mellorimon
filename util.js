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
			a[a.length - 1] = prev.slice(0, -1) + ':' + e
		} else {
			a.push(e)
		}
	})
	return a
}

exports.clean_fieldname = clean_fieldname
exports.split_with_escape = split_with_escape
