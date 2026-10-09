FROM node:24-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip python3-pytest python-is-python3 git bash ca-certificates && rm -rf /var/lib/apt/lists/*
RUN git config --global user.email x@x && git config --global user.name x && git config --global --add safe.directory '*'
ENV PIP_BREAK_SYSTEM_PACKAGES=1
