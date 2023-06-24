'use strict';

import {CommandInteraction, AutocompleteInteraction, SlashCommandBuilder, SlashCommandStringOption} from 'discord.js'
import {Rcon} from "rcon-client"
import {readFile, writeFile} from 'fs/promises'
import iconv from 'iconv-lite';
const {encode} = iconv;

export function getData() {
    return new SlashCommandBuilder()
        .setName('download')
        .setDescription('Envoyer une commande à exécuter sur le serveur')
        .addStringOption(new SlashCommandStringOption().setName('serveur').setDescription('Choisit le serveur sur lequel faire le rcon').setRequired(true).setAutocomplete(true))
        .addStringOption(new SlashCommandStringOption().setName('path').setDescription('Path du fichier distant à télécharger').setRequired(true))
}

/**
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
    let nom = interaction
        .options
        .getString("serveur")
    let path = interaction
        .options
        .getString("path")
    await readFile('./servers.json', 'utf8').then(async(data) => {
        let servers = JSON.parse(data);
        if (typeof servers[nom] === "undefined") {
            interaction.reply("> **Ce serveur n'existe pas !** ❌")
            return;
        }
        const rcon = await Rcon.connect({host: servers[nom].ip, port: servers[nom].port, password: servers[nom].mdp, timeout: 60000}).catch(e => interaction.reply("> **Connexion impossible**\n" + e));
        if (!rcon.authenticated) return;
        let fileSize;
        let fileData = {};
        const sum = (obj) => Object.values(obj).reduce((accumulator, value) => accumulator + value.length, 0);
        const round = (value) => Number(value.toFixed(2))
        await interaction.deferReply()
        rcon.emitter.on('packet', (packet) => {
            const zipName = path.replace('.', '_') + '.zip';
            const file = 'cache/' + zipName;
            if (packet?.type === 7) {
                fileSize = Number(packet.payload.toString())
                interaction.editReply(`DOWNLOAD \`${path}\` into \`${file}\` (${fileSize} bytes)`)
            } else if (packet?.type === 8) {
                const id = packet.payload.toString().split(':')[0]
                const data = packet.payload.toString().split(':')[1]
                fileData[id] = data;
                if(id % 10 === 0) interaction.editReply(`DOWNLOAD \`${path}\` into \`${file}\` (${fileSize} bytes)\n> ${round((sum(fileData) / fileSize) * 100)}% - Received **${sum(fileData)} bytes**`)
            } else {
                if (!packet.payload.length) return interaction.editReply("> **Le fichier `" + path + "` n'existe pas.**");
                let data = "";
                for(const buffer of Object.values(fileData)){
                    data += atob(buffer.toString())
                }
                const fileBuffer = encode(data, 'ISO-8859-1');
                writeFile(file, fileBuffer)
                if(fileSize < 8000000){
                    interaction.editReply({content: `DOWNLOAD \`${path}\` into \`${file}\` (${fileSize} bytes)\n> 100% - **Downloaded successfully ✅**`, files: [{name: zipName, attachment: fileBuffer}]})
                } else {
                    interaction.editReply(`DOWNLOAD \`${path}\` into \`${file}\` (${fileSize} bytes)\n> 100% - **Downloaded successfully ✅**\n> *Can't send file through Discord (>8 MB)*`)
                }
            }
        })
        await rcon?.sendPacket(6, Buffer.from(path, 'utf-8')).catch(e => interaction.editReply("DOWNLOAD `" + path + "`\n> **Envoi impossible**\n" + e));
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