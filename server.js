#!/usr/bin/env node
"use strict"

var os      = require('os')
var net     = require('net')
var carrier = require('carrier')

var m = new (require('./main'))()
setInterval(m.update.bind(m), 5 * 60 * 1000) // schedule update every 5 minutes
m.update()

var server = net.createServer(function(conn) {
	carrier.carry(conn, function parser(line) {
		var args = line.split(' ')
		var cmd  = args.shift()

		switch(cmd) {
		case 'cap':
			conn.write('cap dirtyconfig\n')
			break
		case 'list':
			conn.write(m.list().join(' ') + '\n')
			break
		case 'nodes':
			conn.write(os.hostname() + '\n.\n')
			break
		case 'config':
			if(args.length < 1) {
				conn.write('# Unknown service\n.\n')
				break
			}
			conn.write(m.config(args[0]).join('\n') + '\n.\n')
			break
		case 'fetch':
			conn.write('# this node requires the use of the dirtyconfig protocol extension\n.\n')
			break
		case 'version':
			conn.write('munins node on ' + os.hostname() + ' version: mellorimon-0.1\n')
			break
		case 'quit':
			conn.end()
			break
		default:
			conn.write('# Unknown command. Try cap, list, nodes, config, fetch, version or quit\n')
		}
	})
	conn.write('# munin node at ' + os.hostname() + '\n')
	process.once('uncaughtException', function(err){
		if (err.errno === 'ECONNRESET'){
			return;
		}
		throw( err );
	});
}).listen(4949, '::')
