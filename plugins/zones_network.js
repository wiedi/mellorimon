"use strict"
var exec  = require('child_process').exec
var parse_zones_list = require('../util').parse_zones_list

function generate_stats(zone_nic_stats) {

	var zones_network_traffic = [
		"graph_title traffic stats of all zones",
		"graph_info incoming and outgoing traffic of all zones",
		"graph_args --base 1000",
		"graph_category zones_network",
		"graph_vlabel traffic in (-) / out (+) per ${graph_period} in bps"
	]

	Object.keys(zone_nic_stats).forEach(function(currZoneUuid){

		var obytes = zone_nic_stats[currZoneUuid].obytes64
		var rbytes = zone_nic_stats[currZoneUuid].rbytes64
		var short_uuid = "z"+currZoneUuid.split('-')[0]
		var alias = zone_nic_stats[currZoneUuid].alias
		var label = currZoneUuid.split('-')[0] +' ('+ alias +')'

		var tmpZoneData = [
			short_uuid+"_rbytes.value " + rbytes,
			short_uuid+"_rbytes.min 0",
			short_uuid+"_rbytes.label " + label,
			short_uuid+"_rbytes.type DERIVE",
			short_uuid+"_rbytes.graph no",
			short_uuid+"_rbytes.cdef "+short_uuid+"_rbytes,8,*",
			short_uuid+"_obytes.value " + obytes,
			short_uuid+"_obytes.min 0",
			short_uuid+"_obytes.label " + label,
			short_uuid+"_obytes.type DERIVE",
			short_uuid+"_obytes.cdef "+short_uuid+"_obytes,8,*",
			short_uuid+"_obytes.negative "+short_uuid+"_rbytes",
			short_uuid+"_obytes.info Traffic of zone uuid: "+currZoneUuid+" ailas: "+alias
		]

		zones_network_traffic = zones_network_traffic.concat(tmpZoneData)

		})

	return { 'zones_network_traffic': 	zones_network_traffic }
}

function linkKstats(cb) {

	var list = {}

	var cmd = "kstat -p link"
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
			var nicname = keyNames[2]

			if(!(nicname in list)) {
				list[nicname] = {}
			}

			if(keyNames[3] == "obytes64") {
				list[nicname]["obytes64"] = line[1]
			}

			if(keyNames[3] == "rbytes64") {
				list[nicname]["rbytes64"] = line[1]
			}

			if(keyNames[3] == "zonename") {
				list[nicname]["zonename"] = line[1]
			}
		})

	cb(null, list)

	})

}

function makeZoneStats(zones, list) {

	var zone_stats = {}

	Object.keys(list).forEach(function(currIfaceKey){

		var currIface = list[currIfaceKey]
		/* skip global zone */
		if(currIface.zonename == "global") return

		if(!(currIface.zonename in zone_stats)) {
			zone_stats[currIface.zonename] = {
				"obytes64": Number(currIface.obytes64),
				"rbytes64": Number(currIface.rbytes64),
				"alias": zones[currIface.zonename]
			}
		}
		else {
			zone_stats[currIface.zonename].obytes64 += Number(currIface.obytes64)
			zone_stats[currIface.zonename].rbytes64 += Number(currIface.rbytes64)
		}
	})

	return zone_stats
}

function ZonesNetwork(cb) {
	var cmd = "vmadm list -p -o uuid,alias"
	exec(cmd, function(err, stdout, stderr) {
		if(err) {
			cb(null, {})
			return
		}
		var zones = parse_zones_list(stdout)

		/* if there are no zones hide the graph */
		if(Object.keys(zones).length < 1) {
			cb(null, {})
			return
		}

		linkKstats(function(err, list) {
			var zone_stats = makeZoneStats(zones, list)
			var munin_stats =  generate_stats(zone_stats)
			cb(null,munin_stats)
		})
	})
}

module.exports = ZonesNetwork
