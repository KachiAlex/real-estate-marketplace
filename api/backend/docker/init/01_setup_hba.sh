#!/bin/bash
# No-op init script to avoid overwriting pg_hba.conf when md5 config is desired.
# This file was intentionally left to do nothing to preserve custom md5 setup.
exit 0
# WARNING: This configuration uses TRUST for host connections and is intended
