function startOfDay(ymd) {
  const date = ymd ? new Date(yml) : new Date();
  date.setHours(0, 0, 0, 0).toLocaleString('en-US', { timezone: 'UTC' });

  return date.toISOString();
}

function endOfDay(ymd) {
  const date = ymd ? new Date(yml) : new Date();
  date.setHours(23, 59, 59, 999).toLocaleString('en-US', { timezone: 'UTC' });

  return date.toISOString();
}

async function sendEvents(events) {
  const API_KEY =
    PropertiesService.getScriptProperties().getProperty('API_KEY');
  console.log(JSON.stringify(events));
  return UrlFetchApp.fetch(
    `https://team-apis.nqhuy.dev/integrate/g-events/passive-sync?apiKey=${API_KEY}`,
    {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({ events }),
    },
  );
}
