import { Command, flags } from "@oclif/command";
const isRoot = require("is-root");
var sudo = require("sudo-prompt");
const { exec } = require("promisify-child-process");
import cli from "cli-ux";
import { parse } from "yaml";
import { readFileSync } from "fs";
const chalk = require("chalk");
import * as inquirer from "inquirer";
// import cmd from "node-cmd";
var cmd = require("node-cmd");

export default class AddApp extends Command {
  static description = "Creates a running Dokku app from a docker-compose file";
  static aliases = ["app:create", "app:add"];

  static examples = [
    `$ hatch app:create
-n My App -i HelloWorld -p 8080
`
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({
      char: "n",
      description: "App Name"
    }),
    image: flags.string({
      char: "i",
      description: "Dockker Image Name"
    }),
    port: flags.string({
      char: "p",
      description: "Port number to map to Nginx port 80"
    }),
    networkMode: flags.string({
      char: "m",
      description: "Network Mode (host)"
    }),
    update: flags.boolean({
      char: "u",
      description: "Update Existing Dokku Image"
    })
  };

  static args = [{ name: "file" }];

  handleError(err: Error) {
    cli.action.stop("Failed");
    this.error(err);
  }

  base64Encode(str: string) {
    const buf = Buffer.from(str, "utf8");
    return buf.toString("base64");
  }

  generateDirCommands(
    volumes: string[],
    folderOwner: string,
    folderGroup: string
  ) {
    let directoryCommands = "";
    volumes.forEach(volume => {
      let volumeInfo: string[] = volume.split(":");
      directoryCommands += `sudo mkdir -p ${volumeInfo[0]} && `;
      directoryCommands += `sudo chown -R ${folderOwner}:${folderGroup} ${volumeInfo[0]} && `;
    });
    return directoryCommands.substring(0, directoryCommands.length - 3);
  }

  generateStorageCommands(appName: string, volumes: string[]) {
    let storageCommands = "";
    volumes.forEach(volume => {
      storageCommands += `sudo dokku storage:mount ${appName} ${volume} && `;
    });
    return storageCommands.substring(0, storageCommands.length - 3);
  }

  async runCmd(cmd: string) {
    return new Promise(async (resolve, reject) => {
      exec(cmd, {
        maxBuffer: 200 * 1024
      })
        .then((res: any) => {
          console.log(res.stdout);
          resolve(res.stdout);
        })
        .catch((error: any) => {
          console.log(error.stdout);
          resolve(error.stdout);
        });
    });
  }

  async run() {
    // if (!isRoot()) {
    //   this.warn("Please run as root");
    //   this.exit();
    // }

    const that = this;
    const { args, flags } = this.parse(AddApp);
    let fileName: string;
    if (args.file) {
      fileName = args.file;
    } else {
      fileName = await cli.prompt("Docker Compose File Name", {
        default: "docker-compose.yml"
      });
    }

    const fileContents = readFileSync(`${fileName}`, "utf8");
    const composeObj = parse(fileContents);
    // console.log(composeObj);
    // console.log(Object.keys(composeObj.services));
    let services: Array<string> = Object.keys(composeObj.services);
    for (const service of services) {
      const appName = await cli.prompt(`App Name`, {
        default: service
      });
      const imageName: string = composeObj.services[service].image;
      let envVariablesOrig: Array<string> =
        composeObj.services[service].environment;
      let envVariablesFinal: Array<string> = [];

      console.log(chalk.redBright("Environment Variables:"));

      for (const envVar of envVariablesOrig) {
        let keyVal: Array<string> = envVar.split("=");
        const resp = await cli.prompt(keyVal[0], {
          default: keyVal[1]
        });
        envVariablesFinal.push(`${keyVal[0]}=${this.base64Encode(resp)}`);
      }
      console.log(`Setting env variables to:`, envVariablesFinal);

      console.log(chalk.redBright("Storage Volumes:"));

      const volumes = composeObj.services[service].volumes;
      let volumesFinal: string[] = [];
      for (const volumeMap of volumes) {
        let keyVal: Array<string> = volumeMap.split(":");
        const resp = await cli.prompt(keyVal[1], {
          default: keyVal[0]
        });
        volumesFinal.push(`${resp}:${keyVal[1]}`);
      }
      const folderOwner = await cli.prompt(`Owner of storage folders`);
      const folderGroup = await cli.prompt(`Group of storage folders`);
      // console.log(valuesFinal);

      const ports: Array<string> = composeObj.services[service].ports;

      let portResponse: any = {};

      if (ports && ports.length > 1) {
        let choices: Array<object> = [];
        ports.forEach(port => {
          let portArr: Array<string> = port.split(":");
          choices.push({
            name: portArr.length > 1 ? portArr[1] : portArr[0]
          });
        }),
          (portResponse = await inquirer.prompt([
            {
              name: "mapPort80To",
              message: "which port should be mapped to port 80",
              type: "list",
              choices: choices
            }
          ]));
      } else if (ports.length === 0) {
        let portsArray: Array<string> = ports[0].split(":");
        portResponse =
          portsArray.length > 1
            ? { mapPort80To: portsArray[1] }
            : { mapPort80To: portsArray[0] };
      }
      // console.log(
      //   `Mapping ${portResponse.mapPort80To} to port 80 in Nginx`,
      //   portResponse
      // );
      cli.action.start(`Creating ${appName}`);
      this.runCmd(`sudo dokku apps:create ${appName}`)
        .then(() => {
          cli.action.stop("Created");
          cli.action.start(`Setting Config Variables`);
          const setConfigCmd = `sudo dokku config:set --no-restart qbittorrent -encoded ${appName} ${envVariablesFinal.join(
            " "
          )}`;
          console.log(setConfigCmd);
          return this.runCmd(setConfigCmd);
        })
        .then(() => {
          cli.action.stop("Variables Set");
          cli.action.start(`Creating and Mounting Storage Volumes`);

          const dirCommmands = that.generateDirCommands(
            volumesFinal,
            folderOwner,
            folderGroup
          );
          const storageCommands = that.generateStorageCommands(
            appName,
            volumesFinal
          );

          return this.runCmd(`${dirCommmands} && ${storageCommands}`);
        })
        .then(() => {
          cli.action.stop("Created and Mounted");
          cli.action.start(
            `Downloading and deploying '${imageName}' from Docker`
          );
          const pullTagDeployCmd = `sudo docker pull ${imageName} && sudo docker tag ${imageName} dokku/${appName}:latest && sudo dokku tags:deploy ${appName} latest && sudo dokku proxy:ports-add ${appName} http:80:${portResponse.mapPort80To}`;
          this.log(pullTagDeployCmd);
          return this.runCmd(pullTagDeployCmd);
        })
        .then(() => {
          cli.action.stop("Completed");
        })
        .catch(error => {
          console.log(`Peter was here 55 EEEEROR`);
          this.error(error);
        });
    }
  }
}
