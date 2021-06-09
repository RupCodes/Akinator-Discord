const Discord = require('discord.js');
const fs = require("fs");
module.exports.run = async (client, message, args) => {
    fs.readdir('./commands/', (err, files) => {
        if(err) console.error(err);

        let jsfiles = files.filter(f => f.split(".").pop() === "js");
        if(jsfiles.length <= 0) {
            console.log("No commands to load!");
            return;
        }
        
        let result = jsfiles.map(f => `${require(`./${f}`).config.name} \n \`${require(`./${f}`).config.description}\` `).join('\n');
        message.channel.send(new Discord.MessageEmbed()
	
			.setTitle(`All Available Commands`)
			.addField('Made By', `\`Rup#2626\``, true)
			.addField('Prefix', `\`${process.env.prefix}\``, true)
            .addField('Github', `[Akinator-Discord](https://github.com/Rup-1234/Akinator-Discord)`, true)
                        .setDescription(result)
			.setColor('RANDOM'),
		);
})
}


module.exports.config = {
	name: 'help',
	description: 'shows all available commands',
	aliases: [],
};