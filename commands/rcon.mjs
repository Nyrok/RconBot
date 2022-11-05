'use strict';

import { CommandInteraction, AutocompleteInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js'
import { Rcon } from "rcon-client"
import { readFile } from 'fs/promises'

export function getData() {
	return new SlashCommandBuilder()
		.setName('rcon')
		.setDescription('Envoyer une commande rcon à un serveur')
		.addStringOption(new SlashCommandStringOption()
			.setName('serveur')
			.setDescription('Choisit le serveur sur lequel faire le rcon')
			.setRequired(true)
			.setAutocomplete(true))
		.addStringOption(new SlashCommandStringOption()
			.setName('command')
			.setDescription('Commande à exécuter')
			.setRequired(true))
}

/**
 * @param {CommandInteraction} interaction 
 */
export async function execute(interaction) {
	let nom = interaction.options.getString("serveur")
	let command = interaction.options.getString("command")
	await readFile('./servers.json', 'utf8').then(async (data) => {
		let servers = JSON.parse(data);
		if (typeof servers[nom] === "undefined") {
			interaction.reply("> **Ce serveur n'existe pas !** ❌")
			return;
		}
		const rcon = await Rcon.connect({
			host: servers[nom].ip,
			port: servers[nom].port,
			password: servers[nom].mdp
		});
		await rcon.send(command).then(response => interaction.reply("`" + command + "`\n>>> " + response))
	});
}

/**
 * @param {AutocompleteInteraction} interaction 
 */
export async function autocomplete(interaction) {
	const focusedValue = interaction.options.getFocused();
	await readFile('./servers.json', 'utf8').then(async (data) => {
		let servers = JSON.parse(data);
		let choices = Object.keys(servers)
		const filtered = choices.filter(choice => choice.includes(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({
				name: choice,
				value: choice
			})),
		);
	});
}