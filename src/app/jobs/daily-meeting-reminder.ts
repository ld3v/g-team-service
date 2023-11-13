import { sendGChatMessage } from 'utils/send-google-chat-msg';
import * as moment from 'moment';

export const sendDailyMeetingNotify = async (
  gChatWebhook: string,
  { id, alias }: { id: string; alias: string },
  startedAt: Date | null,
  {
    newHostedLink,
    meetingLink,
    eventLink,
    noteMessage = '',
  }: {
    meetingLink?: string;
    eventLink?: string;
    newHostedLink: string;
    noteMessage?: string;
  },
) => {
  const startTime = startedAt ? moment(startedAt) : null;

  return await sendGChatMessage(gChatWebhook, {
    text: `Hi <users/${id}>!`,
    cardsV2: [
      {
        cardId: 'card01',
        card: {
          header: {
            title: 'Daily Meeting Reminder',
            subtitle: `Hosted by @${alias}`,
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: 'Today is <b>your turn</b> to <b>host the Daily Meeting</b>!<br/>So please <b>take your time</b> to <b>prepare to have a good meeting</b>!',
                  },
                },
                {
                  divider: {},
                },
                ...(noteMessage
                  ? [
                      {
                        textParagraph: {
                          text: noteMessage,
                        },
                      },
                      { divider: {} },
                    ]
                  : []),
                ...(startTime
                  ? [
                      {
                        textParagraph: {
                          text:
                            '<i>And remember that we have the Daily Meeting at ' +
                            `${startTime.format('HH:mm')} ` +
                            `(${startTime.fromNow()})</i><br/>` +
                            'If he/she off today, click the <b>Get a new hosted</b> to get a new random member to host this meeting!',
                        },
                      },
                      {
                        divider: {},
                      },
                    ]
                  : []),
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'Join meeting',
                        onClick: {
                          openLink: {
                            url: meetingLink || 'https://meet.google.com',
                          },
                        },
                        color: {
                          red: 0.7412,
                          green: 0.0941,
                          blue: 0.4549,
                        },
                      },
                      {
                        text: eventLink
                          ? 'View this event'
                          : 'Check event on calendar',
                        onClick: {
                          openLink: {
                            url: eventLink || 'https://calendar.google.com',
                          },
                        },
                      },
                      {
                        text: 'Get a new hosted',
                        onClick: {
                          openLink: {
                            url: newHostedLink,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  });
};
