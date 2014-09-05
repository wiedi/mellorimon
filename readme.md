# Mellorimon

Minimal reiplementation of a [Munin](http://munin-monitoring.org) Server inteded for use in the SmartOS Global Zone.

## Design

The standard Munin Node is very flexible and allows monitoring many different metrics with plugins which can be written in nearly every language.
Generally this is great but is not ideal for the SmartOS Global Zone.

The SmartOS GZ is a minimal set of software needed to run as a hypervisor.
There is no Python interpreter. Perl is installed in a custom path which would require some modifications to munin.

As the munin protocol is very simpel it was easier to reiplement a minimal but compatible server for that use case in node.js.

**This is not a replacement for munin inside a normal SmartOS Zone - use munin from pkgsrc there!**

This reimplementation differs in a few places from the standard munin node:

- Plugins aren't external executed programms but node.js modules with one function.
- There is no configuration. Everything is either autodetected or uses (hopefully) sane defaults.
- It uses the [dirty config](http://munin-monitoring.org/wiki/protocol-dirty-config) protocol extension. This combines the old config+fetch steps in one and often saves executing commands twice. The old behavior is **not** supported. This makes the code simpler in many places.
- The plugins don't fetch values on each network request. Instead they are queried every 5 minutes (the default munin poll interval) and results cached.

The limited scope allowed us to cut some corners that might improve performance and reduce code complexity but trade in the flexibility found in the original.


## Development Status

The Server Code has been running in production for some time now and seems to work very well.
More plugins have been added over time, some of which have received more testing than others.
Generally everything should just work.
If you find any bugs or issues please let us know.

## Deployment

Included is a small shellscript that will help with deployment.

Download or clone this repository on your admin workstation.
Then use the <code>deploy.sh</code> to install dependencies and scp the files into your SmartOS host.

	./deploy.sh server.example.com

After that reboot the SmartOS system or issue:

	svccfg import /opt/custom/smf/mellorimon.xml

to start the server.
