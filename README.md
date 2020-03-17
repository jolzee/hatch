# hatch

Creates Dokku Apps from Docker Compose files

WIP - Don't use yet

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/hatch.svg)](https://npmjs.org/package/hatch)
[![Downloads/week](https://img.shields.io/npm/dw/hatch.svg)](https://npmjs.org/package/hatch)
[![License](https://img.shields.io/npm/l/hatch.svg)](https://github.com/jolzee/hatch/blob/master/package.json)

<!-- toc -->

- [Usage](#usage)
- [Commands](#commands)
  <!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g hatch
$ hatch COMMAND
running command...
$ hatch (-v|--version|version)
hatch/0.0.0 win32-x64 node-v13.9.0
$ hatch --help [COMMAND]
USAGE
  $ hatch COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`hatch add-app [DOCKER-COMPOSE-FILE]`](#hatch-hello-file)
- [`hatch help [COMMAND]`](#hatch-help-command)

## `hatch add-app [DOCKER-COMPOSE-FILE]`

describe the command here

```
USAGE
  $ hatch add-app [FILE]

OPTIONS
  -h, --help                     show CLI help
  -i, --image=image              Dockker Image Name
  -m, --networkMode=networkMode  Network Mode (host)
  -n, --name=name                App Name
  -p, --port=port                Port number to map to Nginx port 80
  -u, --update                   Update Existing Dokku Image

ALIASES
  $ hatch app:create
  $ hatch app:add

EXAMPLE
  $ hatch app:create -n My App -i HelloWorld -p 8080
```

_See code: [src\commands\hello.ts](https://github.com/jolzee/hatch/blob/v0.0.0/src\commands\hello.ts)_

## `hatch help [COMMAND]`

display help for hatch

```
USAGE
  $ hatch add-app [FILE]

OPTIONS
  -h, --help                     show CLI help
  -i, --image=image              Dockker Image Name
  -m, --networkMode=networkMode  Network Mode (host)
  -n, --name=name                App Name
  -p, --port=port                Port number to map to Nginx port 80
  -u, --update                   Update Existing Dokku Image

ALIASES
  $ hatch app:create
  $ hatch app:add

EXAMPLE
  $ hatch app:create
  -n My App -i HelloWorld -p 8080
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src\commands\help.ts)_

<!-- commandsstop -->
