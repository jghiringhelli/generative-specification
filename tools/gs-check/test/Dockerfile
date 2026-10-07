# The Linux environment for the checker's controls: Node 22, python3 with pytest (the python control), git, bash.
# Build:  docker build -t gs-check-test -f tools/gs-check/test/Dockerfile tools/gs-check/test
# Run:    docker run --rm -v "$PWD:/w:ro" -w /w gs-check-test node --test tools/gs-check/test/controls.test.mjs
FROM node:22
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pytest python-is-python3 bash git && rm -rf /var/lib/apt/lists/*
