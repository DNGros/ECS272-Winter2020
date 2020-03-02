#!/bin/bash

function fail {
    printf '%s\n' "$1" >&2  ## Send message to stderr. Exclude >&2 if you don't want it that way.
    exit "${2-1}"  ## Return a code specified by $2 or 1 by default.
}

cd data || fail "no data directory"
echo "Downloading Person Activity Dataset"
#wget https://archive.ics.uci.edu/ml/machine-learning-databases/00196/ConfLongDemo_JSI.txt || fail "bad download"
cat person_activity_headers.txt ConfLongDemo_JSI.txt > ConfLongDemo_JSI.csv || fail "fail cat"
rm ConfLongDemo_JSI.txt || fail "rm"
cd .. || fail "can't get back"
