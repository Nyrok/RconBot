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
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})
client.commands = new Collection()
const modules = [rcon, addserver, delserver];
let commands = []
modules.forEach(command => commands.push(command.getData().toJSON()));

const token = "MTAzODQwMzA4Mzg3NDYxMTI2MA.GyLewo.rSfWNEv9e3QZBvKq8rsUUA8fJV03qKMUuxZHvU"
const clientId = "1038403083874611260";

const rest = new REST({
	version: '10'
}).setToken(token);

export async function loadCommands() {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		const data = await rest.put(
			Routes.applicationCommands(clientId), {
				body: commands
			},
		);
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
		}
	} else if (interaction.isAutocomplete()) {
			if (interaction.commandName === "rcon") {
				await rcon.autocomplete(interaction);
			} else if (interaction.commandName === "delserver") {
				await delserver.autocomplete(interaction);
			}
	}
});

loadCommands();
client.login(token)