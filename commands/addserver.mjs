'use strict';

import { writeFile, readFile } from 'fs/promises'
import { CommandInteraction, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption } from 'discord.js'

export function getData(){
	return new SlashCommandBuilder()
		.setName('addserver')
		.setDescription('Ajouter un serveur dans la liste')
        .addStringOption(new SlashCommandStringOption()
            .setName("nom")
            .setRequired(true)
            .setDescription("Nom du Serveur"))
        .addStringOption(new SlashCommandStringOption()
            .setName("ip")
            .setRequired(true)
            .setDescription("IP du Serveur"))
        .addIntegerOption(new SlashCommandIntegerOption()
            .setName("port")
            .setRequired(true)
            .setDescription("Port du Serveur"))
        .addStringOption(new SlashCommandStringOption()
            .setName("mdp")
            .setRequired(true)
            .setDescription("MDP du RCON"))
}

/**
 * @param {CommandInteraction} interaction 
 */
export async function execute(interaction){
    let nom = interaction.options.getString("nom")
    let ip = interaction.options.getString("ip")
    let port = interaction.options.getInteger("port")
    let mdp = interaction.options.getString("mdp")
    await readFile('./servers.json', 'utf8').then(async (data) => {
		let servers = JSON.parse(data);
		if(typeof servers[nom] !== 'undefined'){
            await interaction.reply("> **Ce serveur existe déjà.** ❌")
            return;
        }
        servers[nom] = {ip: ip, port: port, mdp: mdp}
        await writeFile('./servers.json', JSON.stringify(servers))
        await interaction.reply(`> **J'ai ajouté ${nom} avec (${ip}, ${port}, ${mdp}) dans la base de donnée.** ✅`)
	});
}