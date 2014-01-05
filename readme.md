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

Currently all this is very experimental.
The Server works and queries from the munin master seem ok.
There is a "load" plugin which can be used as an example.
More plugins are needed for metrics that are relevant from the GZ.
Deployment is not fully decided yet - but simple copying the files to the GZ or spinning a custom image are both possible.
