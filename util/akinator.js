const { MessageEmbed } = require("discord.js");
const { Aki } = require("aki-api");
const isPlaying = new Set();
const attemptingGuess = new Set();
const image_finder = require("image-search-engine")

module.exports = async function (message, client) {
    try {  
        let usertag = message.author.tag
        let avatar = message.author.displayAvatarURL()
        // Game running already
        if (isPlaying.has(message.author.id)) {
            let isPlayingEmbed = new MessageEmbed()
                .setAuthor(usertag, avatar)
                .setTitle(`You're Already Playing!`)
                .setDescription("Stop current game to start another one.")
                .setColor("RED")

            return message.channel.send(isPlayingEmbed)
        }
       
        // Adding user in the game
        isPlaying.add(message.author.id)

        let startEmbed = new MessageEmbed()
            .setAuthor(usertag, avatar)
            .setTitle(`Starting Akinator...`)
            .setDescription("Game will begin Shortly")
            .setColor("RANDOM")

        let startmsg = await message.channel.send(startEmbed)

        const region = 'en';
       const aki = new Aki({ region });
        await aki.start();


        let notFinished = true;
        let stepsSinceLastGuess = 0;

        let noResEmbed = new MessageEmbed()
            .setAuthor(usertag, avatar)
            .setTitle(`Game Ended`)
            .setDescription(`**${message.author.username}, Your Game ended due to inactivity.**`) // 1 minute
            .setColor("RANDOM")

        let akiEmbed = new MessageEmbed()
            .setAuthor(usertag, avatar)
            .setTitle(`Question ${aki.currentStep + 1}`)
            .setDescription(`**Progress: 0%\n${aki.question}**`)
            .addField("Please Type...", )
            .setFooter(`You can also type "S" or "Stop" to End your Game`)
            .setColor("RANDOM")

        await startmsg.delete();
        let akiMessage = await message.channel.send(akiEmbed);
         
        // stops game if message is deleted
        client.on("messageDelete", async deletedMessage => {
            if (deletedMessage.id == akiMessage.id) {
                notFinished = false;
                isPlaying.delete(message.author.id)
                attemptingGuess.delete(message.guild.id)
                await aki.win()
                return;
            }
        })

        // repeat while the game is not finished
        while (notFinished) {
            if (!notFinished) return;

            stepsSinceLastGuess = stepsSinceLastGuess + 1

            if (((aki.progress >= 95 && stepsSinceLastGuess >= 10) || aki.currentStep >= 78) && (!attemptingGuess.has(message.guild.id))) {
                attemptingGuess.add(message.guild.id)
                await aki.win();

                stepsSinceLastGuess = 0;

                let guessEmbed = new MessageEmbed()
                    .setAuthor(usertag, avatar)
                    .setTitle(`I'm ${Math.round(aki.progress)}% Sure your Character is...`)
                    .setDescription(`**${aki.answers[0].name}**\n${aki.answers[0].description}\n\nIs this your Character? **(Type Y/Yes or N/No)**`)
                    .addField("Ranking", `**#${aki.answers[0].ranking}**`, true)
                    .addField("No. of Questions", `**${aki.currentStep}**`, true)
                    .setImage(await image_finder.find(aki.answers[0].name, {size: "large"}))
                    .setColor("RANDOM")
                await akiMessage.edit(guessEmbed);

                // valid answers if the akinator sends the last question
                const guessFilter = x => {
                    return (x.author.id === message.author.id && ([
                        "y",
                        "yes",
                        "n",
                        "no"
                    ].includes(x.content.toLowerCase())));
                }

                await message.channel.awaitMessages(guessFilter, {
                    max: 1, time: 60000
                })
                    .then(async responses => {
                        if (!responses.size) {
                            return akiMessage.edit(noResEmbed);
                        }
                        const guessAnswer = String(responses.first()).toLowerCase();

                        await responses.first().delete();

                        attemptingGuess.delete(message.guild.id)

                        // if they answered yes
                        if (guessAnswer == "y" || guessAnswer == "yes") {
                            let finishedGameCorrect = new MessageEmbed()
                                .setAuthor(usertag, avatar)
                                .setTitle(`Well Played!`)
                                .setDescription(`**${message.author.username}, i guessed it right :D**`)
                                .addField("Character", `**${aki.answers[0].name}**`, true)
                                .addField("Ranking", `**#${aki.answers[0].ranking}**`, true)
                                .addField("No. of Questions", `**${aki.currentStep}**`, true)
                                .setThumbnail(await image_finder.find(aki.answers[0].name))
                                .setColor("RANDOM")
                            await akiMessage.edit(finishedGameCorrect)
                            notFinished = false;
                            isPlaying.delete(message.author.id)
                            return;
                           
                        // otherwise
                        } else if (guessAnswer == "n" || guessAnswer == "no") {
                            if (aki.currentStep >= 78) {
                                let finishedGameDefeated = new MessageEmbed()
                                    .setAuthor(usertag, avatar)
                                    .setTitle(`Well Played!`)
                                    .setDescription(`**${message.author.username}, oof, you defeated me D:**`)
                                    .setColor("RANDOM")
                                await akiMessage.edit(finishedGameDefeated)
                                notFinished = false;
                                isPlaying.delete(message.author.id)
                            } else {
                                aki.progress = 50
                            }
                        }
                    });
            }

            if (!notFinished) return;

            let updatedAkiEmbed = new MessageEmbed()
                .setAuthor(usertag, avatar)
                .setTitle(`Question ${aki.currentStep + 1}`)
                .setDescription(`**Progress: ${Math.round(aki.progress)}%\n${aki.question}**`)
                .addField("Please Type...", "**Y**/**Yes**\n**N**/**No**\n**I**/**IDK**\n**P**/**Probably**\n**PN**/**Probably Not**\n**B**/**Back**")
                .setFooter(`You can also type "S" or "Stop" to End your Game`)
                .setColor("RANDOM")
            akiMessage.edit(updatedAkiEmbed)

            // all valid answers when answering a regular akinator question
            const filter = x => {
                return (x.author.id === message.author.id && ([
                    "y",
                    "yes",
                    "n",
                    "no",
                    "i",
                    "idk",
                    "i",
                    "p",
                    "probably",
                    "pn",
                    "probably not",
                    "b",
                    "back",
                    "s",
                    "stop"
                ].includes(x.content.toLowerCase())));
            }

            await message.channel.awaitMessages(filter, {
                max: 1, time: 60000
            })
                .then(async responses => {
                    if (!responses.size) {
                        await aki.win()
                        notFinished = false;
                        isPlaying.delete(message.author.id)
                        return akiMessage.edit(noResEmbed)
                    }
                    const answer = String(responses.first()).toLowerCase().replace("'", "");

                    // assign points for the possible answers given
                    const answers = {
                        "y": 0,
                        "yes": 0,
                        "n": 1,
                        "no": 1,
                        "idk": 2,
                        "i": 2,
                        "p": 3,
                        "probably": 3,
                        "pn": 4,
                        "probably not": 4,
                    }

                    let thinkingEmbed = new MessageEmbed()
                        .setAuthor(usertag, avatar)
                        .setTitle(`Question ${aki.currentStep + 1}`)
                        .setDescription(`**Progress: ${Math.round(aki.progress)}%\n${aki.question}**`)
                        .addField("Please Type...", "**Y**/**Yes**\n**N**/**No**\n**I**/**IDK**\n**P**/**Probably**\n**PN**/**Probably Not**\n**B**/**Back**")
                        .setFooter(`Thinking...`)
                        .setColor("RANDOM")
                    await akiMessage.edit(thinkingEmbed)

                    await responses.first().delete();

                    if (answer == "b" || answer == "back") {
                        if (aki.currentStep >= 1) {
                            await aki.back();
                        }
                       
                    // stop the game if the user selected to stop
                    } else if (answer == "s" || answer == "stop") {
                        isPlaying.delete(message.author.id)
                        let stopEmbed = new MessageEmbed()
                            .setAuthor(usertag, avatar)
                            .setTitle(`Game Ended`)
                            .setDescription(`**${message.author.username}, your game was successfully ended!**`)
                            .setColor("RANDOM")
                        await aki.win()
                        await akiMessage.edit(stopEmbed)
                        notFinished = false;
                    } else {
                        await aki.step(answers[answer]);
                    }

                    if (!notFinished) return;
                });
        }
    } catch (e) {
        attemptingGuess.delete(message.guild.id)
        isPlaying.delete(message.author.id)
        console.log(`Akinator Error: ${e}`)
    }
}
