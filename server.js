#!/usr/bin/env node
"use strict"

var os      = require('os')
var net     = require('net')
var carrier = require('carrier')

var m = new (require('./main'))()

var server = net.createServer(function(conn) {
	conn.on("error", function(err) {})
	carrier.carry(conn, function parser(line) {
		var args = line.split(' ')
		var cmd  = args.shift()

		switch(cmd) {
		case 'cap':
			conn.write('cap dirtyconfig\n')
			break
		case 'list':
			m.list(function(err, list) {
				if(err) {
					conn.write('\n')
					return
				}
				conn.write(list.join(' ') + '\n')
			})
			break
		case 'nodes':
			conn.write(os.hostname() + '\n.\n')
			break
		case 'config':
			if(args.length < 1) {
				conn.write('# Unknown service\n.\n')
				break
			}
			m.config(args[0], function(err, stat) {
				if(err) {
					conn.write('# Error\n.\n')
					return
				}
				conn.write(stat.join('\n') + '\n.\n')
			})
			break
		case 'fetch':
			conn.write('# this node requires the use of the dirtyconfig protocol extension\n.\n')
			break
		case 'version':
			conn.write('munins node on ' + os.hostname() + ' version: mellorimon-0.2\n')
			break
		case 'quit':
			conn.end()
			break
		default:
			conn.write('# Unknown command. Try cap, list, nodes, config, fetch, version or quit\n')
		}
	})
	conn.write('# munin node at ' + os.hostname() + '\n')
}).listen(4949, '::')
