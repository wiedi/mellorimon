#!/bin/bash
set -e

if [ $# -ne 1 ]; then
	echo "${0} [host]"
	exit 0
fi

host=${1}

npm install

ssh -n $host "rm -rf /opt/mellorimon"
ssh -n $host "mkdir  /opt/mellorimon"
scp -r * $host:/opt/mellorimon
ssh -n $host "cp /opt/mellorimon/manifest.xml /opt/custom/smf/mellorimon.xml"

