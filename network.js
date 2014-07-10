"use strict"
var exec  = require('child_process').exec
var async = require('async')

/*kstat -p link:0:bge0:ipackets64 = incoming packets counter*/
/*kstat -p link:0:bge0:opackets64 = outgoing packets counter*/

function kstat(stats, cb) {
	exec("kstat -p " + stats.join(' '), function(err, stdout, stderr) {
		if(err) {
			cb(err)
			return
		}
		var list = {}
		stdout.split('\n').forEach(function(line) {
			line = line.trim().split('\t')
			if(line.length != 2) return
			list[line[0]] = line[1]
		})
		cb(null, list)
	})
}

function generate_stats(nictags, cb) {

	var	kstats = []

	nictags.forEach(function(nictag) {
	kstats = kstats.concat(
	[
		'link:0:'+nictag.iface+':ipackets64',
		'link:0:'+nictag.iface+':opackets64',
		'link:0:'+nictag.iface+':ierrors',
		'link:0:'+nictag.iface+':oerrors',
		'link:0:'+nictag.iface+':rbytes64',
		'link:0:'+nictag.iface+':obytes64',
		'link:0:'+nictag.iface+':ifspeed'

	])
	})
	kstat(kstats, function(err, results) {
		if(err) {
			cb(null, {})
			return
		}

		var iface_stats = {}

		nictags.forEach(function(nictag) {

			var ifspeed	= Number(results['link:0:'+nictag.iface+':ifspeed'])
			var ifspeedMbps = parseInt(ifspeed/1000000)
			var ifspeedWarn = parseInt(ifspeed*0.75)

			var ipackets = Number(results['link:0:'+nictag.iface+':ipackets64'])
			var opackets = Number(results['link:0:'+nictag.iface+':opackets64'])
			var ierrors	= Number(results['link:0:'+nictag.iface+':ierrors'])
			var oerrors	= Number(results['link:0:'+nictag.iface+':oerrors'])
			var rbytes = Number(results['link:0:'+nictag.iface+':rbytes64'])
			var obytes = Number(results['link:0:'+nictag.iface+':obytes64'])


			iface_stats['network_packets_'+nictag.iface] = [
				"graph_title "+nictag.iface+" packet stats",
				"graph_info incoming and outgoing packet counter",
				"graph_order ipackets opackets ierrors oerrors",
				"graph_args --base 1000",
				"graph_category network",
				"graph_vlabel packets in (-) / out (+) per ${graph_period}",
				"ipackets.value " + ipackets,
				"ipackets.min 0",
				"ipackets.label packets",
				"ipackets.type DERIVE",
				"ipackets.graph no",
				"opackets.value " + opackets,
				"opackets.min 0",
				"opackets.label packets",
				"opackets.type DERIVE",
				"opackets.negative ipackets",
				"ierrors.value " + ierrors,
				"ierrors.min 0",
				"ierrors.label errors",
				"ierrors.type DERIVE",
				"ierrors.graph no",
				"ierrors.warning 1",
				"oerrors.value " + oerrors,
				"oerrors.min 0",
				"oerrors.label errors",
				"oerrors.type DERIVE",
				"oerrors.warning 1",
				"oerrors.negative ierrors"
			]

			iface_stats['network_traffic_'+nictag.iface] = [
				"graph_title "+nictag.iface+" traffic stats",
				"graph_info incoming and outgoing traffic",
				"graph_order rbytes obytes",
				"graph_args --base 1024",
				"graph_category network",
				"graph_vlabel traffic in (-) / out (+) per ${graph_period}",
				"rbytes.value " + rbytes,
				"rbytes.min 0",
				"rbytes.label bps",
				"rbytes.type DERIVE",
				"rbytes.graph no",
				"rbytes.cdef rbytes,8,*",
				"rbytes.warning " + ifspeedWarn,
				"obytes.value " + obytes,
				"obytes.min 0",
				"obytes.label bps",
				"obytes.type DERIVE",
				"obytes.cdef obytes,8,*",
				"obytes.warning " + ifspeedWarn,
				"obytes.negative rbytes",
				"obytes.info Traffic of "+nictag.iface+" interface. Maximum speed is "+ifspeedMbps+"Mbps"
			]

		})
		cb(null,iface_stats)
	})
}


function parse(stdout) {
	var nictags = []

	stdout.trim().split('\n').forEach(function(line) {
		line = line.match(/(\\.|[^:])+/g)

		if(line.length != 3) return
		nictags.push({
			'name': line[0],
			'mac': line[1],
			'iface': line[2]
		})
	})
	return nictags
}




function Network(cb) {
	var cmd = "nictagadm list -p"
	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}

		var nictags = parse(stdout)
		generate_stats(nictags, cb)

	})


}

module.exports = Network
