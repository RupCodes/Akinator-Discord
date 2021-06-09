
module.exports.run = async(client, message, args) => {
           client.akinator(message, client);
    }
        module.exports.config = {
            name: 'start',
            description: "starts akinator",
            aliases: ['aki']
          }