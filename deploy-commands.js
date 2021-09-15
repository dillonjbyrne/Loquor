const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('pizzatime').setDescription('Pizza Time'),
	new SlashCommandBuilder()
		.setName('pizzaparker')
		.setDescription('Pizza Time!')
		.addChannelOption(
			(option) => option
				.setName('channel-to-join')
				.setDescription('Overrides current user\'s channel for pizza time if user is in a voice channel.')
		)
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();
