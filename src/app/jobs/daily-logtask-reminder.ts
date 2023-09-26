import { sendGChatMessage } from 'utils/send-google-chat-msg';

export const sendDailyLogworkNotify = async (gChatWebhook: string) => {
  return await sendGChatMessage(gChatWebhook, {
    text: `Hi <users/all>!`,
    cardsV2: [
      {
        cardId: 'card01',
        card: {
          header: {
            title: 'Daily Log-task Reminder',
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: 'Just to remind you to log your tasks into Jira before the end of your working time!',
                  },
                },
                {
                  divider: {},
                },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'Log task now',
                        onClick: {
                          openLink: {
                            url: 'https://oneline.atlassian.net/jira/software/c/projects/APM/boards/903',
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
