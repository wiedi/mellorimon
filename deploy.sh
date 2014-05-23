#!/bin/bash
set -e

if [ $# -ne 1 ]; then
	echo "${0} [host]"
	exit 0
fi

host=${1}

npm install

ssh $host "rm -rf /opt/mellorimon"
ssh $host "mkdir  /opt/mellorimon"
scp -r * $host:/opt/mellorimon
ssh $host "cp /opt/mellorimon/manifest.xml /opt/custom/smf/mellorimon.xml"

