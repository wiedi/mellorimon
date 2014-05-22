"use strict"
var exec  = require('child_process').exec
var async = require('async')

/*kstat -p unix:0:var:v_proc = max number of processes*/
/*kstat -p unix:0:system_misc:nproc = current number of processes*/


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

function Processes(cb) {
    async.parallel({
        kstat: function(cb) {
            kstat([
                'unix:0:var:v_proc',
                'unix:0:system_misc:nproc'
            ], cb)
        }
    }, function(err, results) {
        if(err) {
            cb(null, {})
            return
        }
        var max      = Number(results.kstat['unix:0:var:v_proc'])
        var current  = Number(results.kstat['unix:0:system_misc:nproc'])
        var warning  = parseInt(max*0.92)
        var critical = parseInt(max*0.98)

        cb(null, {'processes': [
            "graph_title Process number utilization",
            "graph_vlabel ",
            "graph_info Process number utilization as reported by kstat",
            "graph_args --base 1000 -l 0",
            "graph_scale no",
            "graph_category system",
            "processes.label processes",
            "processes.info Number of processes running.",
            "processes.warning "  + warning,
            "processes.critical " + critical,
            "processes.value "    + current,
            "maximum.label maximum",
			"maximum.info Running processes limit on this machine",
            "maximum.value "      + max,
        ]})
    })
}


module.exports = Processes
