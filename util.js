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

exports.clean_fieldname = clean_fieldname
