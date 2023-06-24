'use strict';

import { CommandInteraction, AutocompleteInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js'
import { Rcon } from "rcon-client"
import { readFile } from 'fs/promises'

export function getData() {
	return new SlashCommandBuilder()
		.setName('eval')
		.setDescription('Envoyer du coder à évaluer sur le serveur')
		.addStringOption(new SlashCommandStringOption()
			.setName('serveur')
			.setDescription('Choisit le serveur sur lequel faire le rcon')
			.setRequired(true)
			.setAutocomplete(true))
		.addStringOption(new SlashCommandStringOption()
			.setName('code')
			.setDescription('Code à exécuter')
			.setRequired(true))
}

/**
 * @param {CommandInteraction} interaction 
 */
export async function execute(interaction) {
	let nom = interaction.options.getString("serveur")
	let code = interaction.options.getString("code")
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
		await rcon?.sendRaw(Buffer.from(code, 'utf-8'), 4)
			.then(response => {
				if(!response.length) response = 'Aucun output.'
				let toSend = "`" + code + "`\n>>> " + response
				if(toSend.length > 2000){
					const arrows = '>>> '
					let base = toSend.slice(0, 2000)
					let lastIndex = base.lastIndexOf('\n');
					interaction.reply(base.slice(0, lastIndex))
					let newLastIndex;
					toSend = toSend.slice(lastIndex + 1)
					do {
						base = toSend.slice(0, 2000 - arrows.length);
						newLastIndex = base.lastIndexOf('\n')
						toSend = base.slice(0, newLastIndex)
						interaction.channel.send(arrows + toSend)
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