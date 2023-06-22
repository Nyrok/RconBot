import {
    Client,
    GatewayIntentBits,
    Collection,
    Events,
    REST,
    Routes
} from 'discord.js'
import * as rcon from "./commands/rcon.mjs"
import * as addserver from "./commands/addserver.mjs"
import * as delserver from "./commands/delserver.mjs"
import * as evalc from "./commands/evalc.mjs"
import * as exec from "./commands/exec.mjs"
import config from "./config.json" assert {type: 'json'};
const {token, clientId} = config;
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})
client.commands = new Collection()
const modules = [rcon, addserver, delserver, evalc, exec];
let commands = []
modules.forEach(command => commands.push(command.getData().toJSON()));

const rest = new REST({version: '10'}).setToken(token);

export async function loadCommands() {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(Routes.applicationCommands(clientId), {
            body: commands
        },);
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
};

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "addserver") {
            addserver.execute(interaction)
        } else if (interaction.commandName === "rcon") {
            await rcon.execute(interaction);
        } else if (interaction.commandName === "delserver") {
            await delserver.execute(interaction);
        } else if (interaction.commandName === "eval") {
            await evalc.execute(interaction);
        } else if (interaction.commandName === "exec") {
            await exec.execute(interaction);
        }
    } else if (interaction.isAutocomplete()) {
        if (interaction.commandName === "rcon") {
            await rcon.autocomplete(interaction);
        } else if (interaction.commandName === "delserver") {
            await delserver.autocomplete(interaction);
        } else if (interaction.commandName === "eval") {
            await evalc.autocomplete(interaction);
        } else if (interaction.commandName === "exec") {
            await exec.autocomplete(interaction);
        }
    }
});

loadCommands();
client.login(token)
