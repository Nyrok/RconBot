'use strict';

import {CommandInteraction, AutocompleteInteraction, SlashCommandBuilder, SlashCommandStringOption} from 'discord.js'
import {Rcon} from "rcon-client"
import {readFile} from 'fs/promises'

export function getData() {
    return new SlashCommandBuilder()
        .setName('listen')
        .setDescription('Avoir en live les logs console du serveur')
        .addStringOption(new SlashCommandStringOption().setName('serveur').setDescription('Choisit le serveur sur lequel faire le rcon').setRequired(true).setAutocomplete(true))
        .addStringOption(new SlashCommandStringOption().setName('webhook').setDescription('Webhook sur lequel envoyer les logs').setRequired(true))
}

/**
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
    let nom = interaction
        .options
        .getString("serveur")
    let webhook = interaction
        .options
        .getString("webhook")
    await readFile('./servers.json', 'utf8').then(async(data) => {
        let servers = JSON.parse(data);
        if (typeof servers[nom] === "undefined") {
            interaction.reply("> **Ce serveur n'existe pas !** ❌")
            return;
        }
        const rcon = await Rcon.connect({host: servers[nom].ip, port: servers[nom].port, password: servers[nom].mdp, timeout: 60000}).catch(e => interaction.reply("> **Connexion impossible**\n" + e));
        if (!rcon.authenticated) return;
		await rcon?.sendRaw(Buffer.from(webhook, 'utf-8'), 9)
			.then(response => {
				if(!response.length) response = 'Aucun output.'
				interaction.reply(`> \`${response}\` is now listening to \`${webhook}\``)
			}).catch(e => interaction.reply("> **Envoi impossible**\n" + e));
    });
}

/**
 * @param {AutocompleteInteraction} interaction
 */
export async function autocomplete(interaction) {
    const focusedValue = interaction
        .options
        .getFocused();
    await readFile('./servers.json', 'utf8').then(async(data) => {
        let servers = JSON.parse(data);
        let choices = Object.keys(servers)
        const filtered = choices.filter(choice => choice.includes(focusedValue));
        await interaction.respond(filtered.map(choice => ({name: choice, value: choice})),);
    });
}