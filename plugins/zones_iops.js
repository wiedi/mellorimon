"use strict"
var exec  = require('child_process').exec
var parse_zones_list = require('../util').parse_zones_list

var IOP_VARS = {
	'zones_iops': [
		"graph_title iops stats of all zones",
		"graph_info iops per zone of all zones actually running",
		"graph_args --base 1000 -l0",
		"graph_category zones_diskio",
		"graph_vlabel iops read(-)/written(+) per ${graph_period}",
	],
	'zones_diskio': [
		"graph_title diskio stats of all zones",
		"graph_info diskio per zone of all zones actually running",
		"graph_args --base=1024 -l0",
		"graph_category zones_diskio",
		"graph_vlabel diskio read(-)/written(+) in bytes/${graph_period}"
	],
}



function generate_stats(zone_stats) {

	var munin_zone_stats = {}

	var lookup = {'zones_iops': ['nwritten','nread'], 'zones_diskio': ['writes','reads']}

	Object.keys(lookup).forEach(function(t){
		var tmpMuninStats = []

		Object.keys(zone_stats).forEach(function(currZoneUuid){
			var short_uuid = "z"+currZoneUuid.split('-')[0]
			var alias = zone_stats[currZoneUuid].alias
			var label = currZoneUuid.split('-')[0] +' ('+ alias +')'
			if(currZoneUuid == "global"){
				short_uuid = "g"
				alias = ""
				label = "global"
			}
			var tmpVars = [
			short_uuid+"_"+lookup[t][1]+".value " + zone_stats[currZoneUuid][lookup[t][1]],
			short_uuid+"_"+lookup[t][1]+".min 0",
			short_uuid+"_"+lookup[t][1]+".label " + label,
			short_uuid+"_"+lookup[t][1]+".type DERIVE",
			short_uuid+"_"+lookup[t][1]+".graph no",
			short_uuid+"_"+lookup[t][0]+".value " +zone_stats[currZoneUuid][lookup[t][0]],
			short_uuid+"_"+lookup[t][0]+".min 0",
			short_uuid+"_"+lookup[t][0]+".label " + label,
			short_uuid+"_"+lookup[t][0]+".type DERIVE",
			short_uuid+"_"+lookup[t][0]+".negative "+short_uuid+"_"+lookup[t][1],
			short_uuid+"_"+lookup[t][0]+".info Iops of zone uuid: "+currZoneUuid+" ailas: "+alias,
			]

			tmpMuninStats = tmpMuninStats.concat(tmpVars)

		})

		munin_zone_stats[t] = IOP_VARS[t].concat(tmpMuninStats)

	})


	;["10ms","100ms","1s","10s"].forEach(function(t){
		var header = [
		"graph_title "+t+" latency iops stats of all zones",
		"graph_info "+t+" latency iops per zone of all zones actually running",
		"graph_args --base 1000 -l0",
		"graph_category zones_diskio",
		"graph_vlabel iops with "+t+" latency",
		]

		var tmpMuninStats = []

		Object.keys(zone_stats).forEach(function(currZoneUuid){
			var short_uuid = "a"+currZoneUuid.split('-')[0]
			var alias = zone_stats[currZoneUuid].alias
			var label = currZoneUuid.split('-')[0] +' ('+ alias +')'
			if(currZoneUuid == "global"){
				short_uuid = "g"
				alias = ""
				label = "global"
			}
			var tmpVars = [
			 short_uuid+"_"+t+".value " +zone_stats[currZoneUuid][t],
			 short_uuid+"_"+t+".min 0",
			 short_uuid+"_"+t+".label " + label,
			 short_uuid+"_"+t+".type DERIVE",
			 short_uuid+"_"+t+".info Iops with "+t+" latency of zone uuid: "+currZoneUuid+" ailas: "+alias,
			 ]

			tmpMuninStats = tmpMuninStats.concat(tmpVars)

		})

		munin_zone_stats['zones_ops'+t+'_latency'] = header.concat(tmpMuninStats)

	})

	return munin_zone_stats
}



function kstats(cb) {

	var list = {}
	var cmd = "kstat -p zone_zfs:*:*:nwritten zone_zfs:*:*:nread zone_zfs:*:*:reads zone_zfs:*:*:writes zone_zfs:*:*:zonename zone_vfs:*:*:100ms_ops zone_vfs:*:*:10ms_ops zone_vfs:*:*:1s_ops zone_vfs:*:*:10s_ops" 

	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}

		stdout.split('\n').forEach(function(line) {
			line = line.trim().split('\t')
			if(line.length != 2) return
			var keyNames = line[0].split(':')
			if(keyNames.length != 4) return
			var zname = keyNames[2]

			if(!(zname in list)) {
				list[zname] = {}
			}
			list[zname][keyNames[3]] = line[1]
		})

	cb(null, list)

	})

}


function makeZoneStats(zones, list) {

	var	zone_stats = {}

	Object.keys(list).forEach(function(currZoneKey){

		var currZone = list[currZoneKey]
		var alias = zones[currZone.zonename]
		/* global zone doesn't exist in zones array */
		if(currZone.zonename == "global"){
			alias = "global"
		}
		zone_stats[currZone.zonename] = {
			"nwritten": Number(currZone['nwritten']),
			"nread": Number(currZone['nread']),
			"reads": Number(currZone['reads']),
			"writes": Number(currZone['writes']),
			"10ms": Number(currZone['10ms_ops']),
			"100ms": Number(currZone['100ms_ops']),
			"1s": Number(currZone['1s_ops']),
			"10s": Number(currZone['10s_ops']),
			"alias": alias
		}
	})

	return zone_stats
}

function ZonesIops(cb) {
	var cmd = "vmadm list -p -o uuid,alias"
	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}
		var zones = parse_zones_list(stdout)

		kstats(function(err, list){
		var zone_stats = makeZoneStats(zones, list)
		var munin_stats =  generate_stats(zone_stats)
		cb(null,munin_stats)
		})
	})
}

module.exports = ZonesIops
