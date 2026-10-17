const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

async function sendPushNotifications(messages) {
    const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
    })

    if (!response.ok) {
        throw new Error(`Expo Push Service respondeu HTTP ${response.status}.`)
    }

    const result = await response.json()
    return Array.isArray(result.data) ? result.data : [result.data]
}

async function sendPushNotificationsInBatches(messages) {
    const tickets = []
    for (let index = 0; index < messages.length; index += 100) {
        tickets.push(...await sendPushNotifications(messages.slice(index, index + 100)))
    }
    return tickets
}

module.exports = { sendPushNotificationsInBatches }
