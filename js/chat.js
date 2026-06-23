// এক্সপোর্ট চ্যাট ডাটা মেকানিজম
async function exportChatSession(chatId, format) {
    const rawMessages = await queryMessages(chatId);
    let outputData = "";
    let mimeType = "text/plain";
    let fileExtension = "txt";

    if (format === 'json') {
        outputData = JSON.stringify(rawMessages, null, 2);
        mimeType = "application/json";
        fileExtension = "json";
    } else if (format === 'txt') {
        rawMessages.forEach(m => {
            outputData += `[${new Date(m.timestamp).toLocaleString()}] ${m.sender}: ${m.text}\n`;
        });
    } else if (format === 'pdf') {
        // স্ট্যান্ডার্ড উইন্ডো প্রিন্ট মেকানিজম যা পিডিএফ সেভ পপআপ জেনারেট করবে
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<pre>${JSON.stringify(rawMessages, null, 2)}</pre>`);
        printWindow.document.close();
        printWindow.print();
        return;
    }

    const blob = new Blob([outputData], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Chat_Export_${chatId}.${fileExtension}`;
    link.click();
}

// মেসেজ শিডিউলিং (Send Later) মেকানিজম
function scheduleMessage(chatId, text, delayInMs) {
    setTimeout(async () => {
        const scheduledPayload = {
            msgId: 'msg_' + Date.now(),
            chatId: chatId,
            sender: AuthModule.sessionUser.userId,
            text: `[Scheduled Message] ${text}`,
            timestamp: Date.now()
        };
        await writeData('messages', scheduledPayload);
        if (ChatModule.activeChatId === chatId) {
            ChatModule.streamMessages();
        }
    }, delayInMs);
    alert(`Message scheduled successfully to be sent in ${delayInMs / 1000} seconds!`);
}

// মেসেজ ফরোয়ার্ড ও রিপ্লাই মেটা-ডাটা ইনজেকশন
async function forwardMessage(msgId, targetChatId) {
    const sourceMsg = await readData('messages', msgId);
    if (sourceMsg) {
        const forwardedPayload = {
            msgId: 'msg_' + Date.now(),
            chatId: targetChatId,
            sender: AuthModule.sessionUser.userId,
            text: `[Forwarded]: ${sourceMsg.text}`,
            timestamp: Date.now()
        };
        await writeData('messages', forwardedPayload);
        alert("Message forwarded successfully.");
    }
          }
