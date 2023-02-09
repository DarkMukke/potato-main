/**
 * @typedef ConfigReactionEvent
 * @type {object}
 * @property {string} reaction
 * @property {string} target_role
 * @property {string} target_channel
 * @property {string} notification
 */

/**
 * @typedef ConfigTrackableMessage
 * @type {object}
 * @property {string} message_id
 * @property {Array.<ConfigReactionEvent>} reactions
 */

/**
 * @typedef FetchedChannel
 * @type {TextChannel}
 */

const {Client, Events, GatewayIntentBits, Partials, roleMention, TextChannel} = require('discord.js');
const config = require('./config.json');
const _ = require('underscore');

const stringTemplateParser = (expression, valueObj) => {
    const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
    return expression.replace(templateMatcher, (substring, value) => {
        value = valueObj[value];
        return value;
    });
}

const client = new Client({
    intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});


client.once(Events.ClientReady, () => {
    console.log('Ready to rumble!');

    _.each(config.REACTION_TRACKER,
        /**
         * @param tracker {ConfigTrackableMessage}
         * @returns {Promise<void>}
         */
        async tracker => {
            const args = tracker.message_id.split(`-`); // Splitting the string into an array
            console.log(`Processing chan-msg : ${tracker.message_id}.`);
            const channelId = args[0] + ''; // Explicit string casting
            const messageId = args[1] + ''; // Explicit string casting
            /**
             * @type {FetchedChannel}
             */
            const ChannelManager = await client.channels.fetch(channelId);
            const Message = await ChannelManager.messages.fetch(messageId);
            console.log("Tracking message " + Message.channelId );
            /*const reactionFilter = (reaction) => {
                //we only really want to track reactions from our config, nothing else
                const reactions_2_track = _.pluck(tracker.reactions, 'reaction');
                return _.contains(reactions_2_track, reaction.emoji.name);
            }*/
            const collector = Message.createReactionCollector({});
            collector.on('collect', (reaction, user) => {
                /**
                 * @type {ConfigReactionEvent}
                 */
                const eventToHandle = _.find(tracker.reactions, row => {
                    return row.reaction === reaction.emoji.identifier;
                })
                if ( undefined === eventToHandle ) {
                    console.log(`Unhandled reaction ${reaction.emoji.name} : ${reaction.emoji.identifier} from ${user.tag}.`);
                } else {
                    const message_params = {
                        role: roleMention(eventToHandle.target_role),
                        user: user.tag
                    }
                    const raw_message = stringTemplateParser(eventToHandle.notification, message_params);
                    /**
                     * @type {FetchedChannel}
                     */
                    const channel = client.channels.cache.get(eventToHandle.target_channel);
                    channel.send(raw_message);
                }
            });


        });

});

client.login(config.BOT_TOKEN);


