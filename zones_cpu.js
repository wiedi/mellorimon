"use strict"
var exec  = require('child_process').exec
var parse_zones_list = require('./util').parse_zones_list

function generate_stats(zone_stats) {

	var munin_zone_stats = [
		"graph_title cpu time stats of all zones",
		"graph_info cpu time per zone of all zones running (inkl. gz)",
		"graph_args --base 1000",
		"graph_category zones_cpu",
		"graph_vlabel cpu time used (+) / waitrq (-) per ${graph_period}"
	]

	Object.keys(zone_stats).forEach(function(currZoneUuid){

		var nsec_sys = zone_stats[currZoneUuid].nsec_sys
		var nsec_user = zone_stats[currZoneUuid].nsec_user
		var cputime = Number(nsec_sys+nsec_user)
		var nsec_waitrq = zone_stats[currZoneUuid].nsec_waitrq
		var short_uuid = "z"+currZoneUuid.split('-')[0]
		var alias = zone_stats[currZoneUuid].alias
		var label = currZoneUuid.split('-')[0] +' ('+ alias +')'
		if(currZoneUuid == "global"){
			short_uuid = "g"
			alias = ""
			label = "global"
		}
		var tmpZoneData = [
			short_uuid+"_nsec_waitrq.value " + nsec_waitrq,
			short_uuid+"_nsec_waitrq.min 0",
			short_uuid+"_nsec_waitrq.label " + label,
			short_uuid+"_nsec_waitrq.type DERIVE",
			short_uuid+"_nsec_waitrq.graph no",
			short_uuid+"_nsec_waitrq.cdef "+short_uuid+"_nsec_waitrq,1000000000,/",
			short_uuid+"_cputime.value " + cputime,
			short_uuid+"_cputime.min 0",
			short_uuid+"_cputime.label " + label,
			short_uuid+"_cputime.type DERIVE",
			short_uuid+"_cputime.cdef "+short_uuid+"_cputime,1000000000,/",
			short_uuid+"_cputime.negative "+short_uuid+"_nsec_waitrq"

		]

		munin_zone_stats = munin_zone_stats.concat(tmpZoneData)

		})

	return { 'zones_cpu_time': munin_zone_stats }
}

function cpuKstats(cb) {

	var list = {}
	var cmd = "kstat -p zones:*:*:nsec_sys zones:*:*:nsec_user zones:*:*:nsec_waitrq zones:*:*:zonename"
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
		/*global zone doesn't exist in zones array */
		if(currZone.zonename == "global"){
			alias = "global"
		}

		zone_stats[currZone.zonename] = {
			"nsec_sys": Number(currZone["nsec_sys"]),
			"nsec_user": Number(currZone["nsec_user"]),
			"nsec_waitrq": Number(currZone["nsec_waitrq"]),
			"alias": alias
		}
	})

	return zone_stats
}

function ZonesCpu(cb) {
	var cmd = "vmadm list -p -o uuid,alias"
	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}
	  var zones = parse_zones_list(stdout)

	  cpuKstats(function(err, list){
		var zone_stats = makeZoneStats(zones, list)
		var munin_stats =  generate_stats(zone_stats)
		cb(null,munin_stats)
	  })
	})
}

module.exports = ZonesCpu
