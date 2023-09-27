async function getEventsInDate() {
  const timeMin = new Date().toISOString();
  const timeMax = endOfDay();
  console.log('------------------ SYNC EVENTS ------------------');
  console.log('- From:', timeMin);
  console.log('- To:  ', timeMax);
  const calendarId = 'primary';
  // Add query parameters in optionalArgs
  const optionalArgs = {
    timeMin,
    timeMax,
    showDeleted: false,
    singleEvents: true,
    // maxResults: 1,
    orderBy: 'startTime',
  };
  try {
    // call Events.list method to list the calendar events using calendarId optional query parameter
    const response = Calendar.Events.list(calendarId, optionalArgs);
    const events = response.items;
    console.log('- Count of events:', events.length);
    if (events.length === 0) {
      await sendEvents([]);
      return;
    }
    // Print the calendar events
    const data = events.map(
      ({
        id,
        recurringEventId,
        attendees,
        summary,
        description,
        start,
        end,
        hangoutLink,
        visibility,
        htmlLink,
      }) => ({
        id,
        recurringId: recurringEventId,
        attendees: attendees?.map((a) => ({
          email: a.email,
          status: a.responseStatus,
        })),
        summary,
        description,
        startedAt: start.dateTime,
        finishedAt: end.dateTime,
        meetingLink: hangoutLink,
        eventLink: htmlLink,
        isPrivate: visibility === 'private',
      }),
    );
    await sendEvents(data);
  } catch (err) {
    // TODO (developer) - Handle exception from Calendar API
    console.log('Failed with error %s', err.message);
  }
  console.log('-------------------------------------------------');
}
