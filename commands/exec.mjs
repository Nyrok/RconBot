'use strict';

import { CommandInteraction, AutocompleteInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js'
import { Rcon } from "rcon-client"
import { readFile } from 'fs/promises'

export function getData() {
	return new SlashCommandBuilder()
		.setName('exec')
		.setDescription('Envoyer une commande à exécuter sur le serveur')
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
		}).catch(e => interaction.reply("> **Connexion impossible**\n" + e));
		if (!rcon.authenticated) return;
		await rcon?.sendRaw(Buffer.from(command, 'utf-8'), 5)
			.then(async response => {
				if(!response.length) response = 'Aucun output.'
				let toSend = "`" + command + "`\n```sh\n" + response + "\n```"
				if(toSend.length > 2000){
					const arrows = '\n```'
					let base = toSend.slice(0, 2000)
					let lastIndex = base.lastIndexOf('\n');
					await interaction.reply(base.slice(0, lastIndex) + "\n```")
					let newLastIndex;
					toSend = toSend.slice(lastIndex + 1)
					do {
						base = toSend.slice(0, 2000 - arrows.length * 2 + 2);
						newLastIndex = base.lastIndexOf('\n')
						toSend = base.slice(0, newLastIndex)
						await interaction.channel.send(arrows + 'sh\n' + toSend + arrows)
					} while(toSend.length > 2000)
				}
				else interaction.reply(toSend)
			}).catch(e => interaction.reply("> **Envoi impossible**\n" + e));
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