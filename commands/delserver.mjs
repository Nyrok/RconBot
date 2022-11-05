'use strict';

import { writeFile, readFile } from 'fs/promises'
import {AutocompleteInteraction, CommandInteraction, SlashCommandBuilder, SlashCommandStringOption} from 'discord.js'

export function getData(){
	return new SlashCommandBuilder()
		.setName('delserver')
		.setDescription('Supprimer un serveur dans la liste')
        .addStringOption(new SlashCommandStringOption()
            .setName('serveur')
            .setDescription('Choisit le serveur à Supprimer')
            .setRequired(true)
            .setAutocomplete(true))
}

/**
 * @param {CommandInteraction} interaction 
 */
export async function execute(interaction){
    let nom = interaction.options.getString("serveur");
    await readFile('./servers.json', 'utf8').then(async (data) => {
		let servers = JSON.parse(data);
		if (typeof servers[nom] === "undefined") {
			interaction.reply("> **Ce serveur n'existe pas !** ❌")
			return;
		}
        delete servers[nom];
        await writeFile('./servers.json', JSON.stringify(servers));		
        await interaction.reply(`> **J'ai supprimé le serveur ${nom}** ✅`);
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
            filtered.map(choice => ({ name: choice, value: choice })),
        );
	});
}