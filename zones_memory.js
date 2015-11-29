"use strict"
var exec  = require('child_process').exec
var parse_zones_list = require('./util').parse_zones_list

function generate_stats(zone_stats, total_mem) {

	var munin_zone_stats = {}

	var totalMemoryGraph = [
		"total_mem.label total physical memory",
		"total_mem.draw LINE1",
		"total_mem.value "+total_mem,
		"total_mem.colour 000000",
	]

	;['rss','physcap'].forEach(function(t){

	var MEM_VARS = [
		"graph_title memory "+t+" stats of all zones",
		"graph_info memory per zone of all zones actually running",
		"graph_args --base 1024 -l0",
		"graph_category zones_memory",
		"graph_vlabel byte",
	]


	Object.keys(zone_stats).forEach(function(currZoneUuid){
		var short_uuid = "z"+currZoneUuid.split('-')[0]
		var alias = zone_stats[currZoneUuid].alias
		var label = currZoneUuid.split('-')[0] +' ('+ alias +')'
		var tmpZoneData = [
			short_uuid+"_"+t+".value " + zone_stats[currZoneUuid][t],
			short_uuid+"_"+t+".label " + label,
			short_uuid+"_"+t+".draw AREASTACK",
			short_uuid+"_"+t+".min 0",
		]
		MEM_VARS = MEM_VARS.concat(tmpZoneData)
	})

	//add total memory graph at the end for overlay reasons
	MEM_VARS = MEM_VARS.concat(totalMemoryGraph)

	munin_zone_stats["zones_mem_"+t] = MEM_VARS

	})
	return munin_zone_stats
}



function cpuKstats(cb) {

	var list = {}
	var cmd = "kstat -p memory_cap:*:*:physcap memory_cap:*:*:rss memory_cap:*:*:zonename memory_cap:*:*:swap memory_cap:*:*:swapcap memory_cap:*:*:nover"
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
		var alias = zones[currZone["zonename"]]
		/*skip global zone */
		if(currZone.zonename != "global"){
			zone_stats[currZone["zonename"]] = {
				"physcap": Number(currZone["physcap"]),
				"rss": Number(currZone["rss"]),
				"swap": Number(currZone["swap"]),
				"swapcap": Number(currZone["swapcap"]),
				"nover": Number(currZone["nover"]),
				"alias": alias
			}
		}
	})
	return zone_stats
}

function ZonesMemory(cb) {
	var cmd = "vmadm list -p -o uuid,alias"
	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}
		var zones = parse_zones_list(stdout)
		var cmd = "sysinfo"
		exec(cmd, function(err, stdout, stderr) {
			if(err) {
				cb(null, {})
				return
			}
			var sysinfo = JSON.parse(stdout)
			var total_memory = Number(sysinfo['MiB of Memory']*1048576)
			cpuKstats(function(err, list){
			var zone_stats = makeZoneStats(zones, list)
			var munin_stats =  generate_stats(zone_stats, total_memory)
			cb(null,munin_stats)
			})
		})
	})
}

module.exports = ZonesMemory
