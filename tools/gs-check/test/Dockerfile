# The Linux environment for the checker controls: Node 22, python3 with pip and pytest (the python control), git, bash.
# Build:  docker build -t gs-check-test -f tools/gs-check/test/Dockerfile tools/gs-check/test
# Run:    docker run --rm -v "$PWD:/w:ro" -w /w gs-check-test node --test tools/gs-check/test/controls.test.mjs
FROM node:22
ENV PIP_BREAK_SYSTEM_PACKAGES=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip python3-pytest python-is-python3 bash git && rm -rf /var/lib/apt/lists/*
