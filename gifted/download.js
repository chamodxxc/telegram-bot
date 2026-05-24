const axios = require("axios");
const { gmd } = require("../gift");
const { searchGiftedTechYts } = require("../gift/gmdHelpers");

// =====================
// YTS HELPER
// =====================
async function getYts(query) {
    const videos = await searchGiftedTechYts(query);
    if (!videos || !videos.length) return null;
    return videos[0];
}

// =====================
// 🔍 SEARCH COMMAND
// =====================
gmd({
    pattern: "yts",
    react: "🔍",
    category: "search",
    description: "YouTube search",
    cooldown: 3
}, async (msg, Gifted, conText) => {

    const { reply, q, prefix, chatId } = conText;

    if (!q) {
        return reply(`🔍 Usage:\n${prefix}yts song name`);
    }

    try {
        await Gifted.sendChatAction(chatId, "typing");

        const videos = await searchGiftedTechYts(q);
        if (!videos || !videos.length) return reply("❌ No results found.");

        let text = `🔍 *Search Results*\n\n`;

        videos.slice(0, 5).forEach((v, i) => {
            text += `*${i + 1}.* ${v.name}\n`;
            text += `⏱ ${v.duration}\n`;
            text += `👁 ${v.views}\n`;
            text += `📺 ${v.author}\n\n`;
        });

        text += `\n👉 Use:\n.play name\n.video name`;

        await reply(text);

    } catch (e) {
        console.log(e);
        reply("❌ Search error");
    }
});

// =====================
// 🎵 PLAY (AUDIO)
// =====================
gmd({
    pattern: "play",
    react: "🎵",
    category: "download"
}, async (msg, Gifted, conText) => {

    const { reply, q, chatId } = conText;
    if (!q) return reply("🎵 .play song name");

    try {
        await Gifted.sendChatAction(chatId, "typing");

        const video = await getYts(q);
        if (!video) return reply("❌ No results");

        const api = buildApi(video.url, "mp3");

        const res = await axios.get(api);

        if (!res.data || !res.data.status || !res.data.result?.download) {
            return reply("❌ API failed (audio)");
        }

        const data = res.data.result;

        // 🔥 SAFE send (URL method)
        await Gifted.sendMessage(chatId, {
            audio: { url: data.download },
            mimetype: "audio/mpeg",
            fileName: `${data.title}.mp3`
        }, { quoted: msg });

    } catch (e) {
        console.log(e);
        reply("❌ Audio error (fixed needed)");
    }
});

// =====================
// 🎬 VIDEO (BUTTON UI)
// =====================
gmd({
    pattern: "video",
    react: "🎬",
    category: "download",
    description: "YouTube video with quality buttons",
    cooldown: 5
}, async (msg, Gifted, conText) => {

    const { reply, q, chatId } = conText;

    if (!q) return reply("🎬 Usage: .video song name");

    try {
        await Gifted.sendChatAction(chatId, "typing");

        const video = await getYts(q);
        if (!video) return reply("❌ No results found.");

        const caption =
`🎬 *WhiteShadow Video Downloader*

🎵 ${video.name}
⏱ ${video.duration}
👁 ${video.views}
📌 Choose Quality 👇`;

        await Gifted.sendMessage(chatId, {
            image: { url: video.thumbnail || "https://i.imgur.com/2nCt3Sbl.jpg" },
            caption,
            footer: "WhiteShadow-MD",
            buttons: [
                { buttonId: `.vdl ${video.url} 144`, buttonText: { displayText: "144p" }, type: 1 },
                { buttonId: `.vdl ${video.url} 360`, buttonText: { displayText: "360p" }, type: 1 },
                { buttonId: `.vdl ${video.url} 480`, buttonText: { displayText: "480p" }, type: 1 },
                { buttonId: `.vdl ${video.url} 720`, buttonText: { displayText: "720p" }, type: 1 },
                { buttonId: `.vdl ${video.url} 1080`, buttonText: { displayText: "1080p" }, type: 1 }
            ],
            headerType: 4
        }, { quoted: msg });

    } catch (e) {
        console.log(e);
        reply("❌ Video error");
    }
});

// =====================
// 📥 VIDEO DOWNLOAD HANDLER
// =====================
gmd({
    pattern: "vdl",
    dontAddCommandList: true
}, async (msg, Gifted, conText) => {

    const { reply, q, chatId } = conText;

    try {
        const args = q.split(" ");
        const url = args[0];
        const quality = args[1] || "720";

        if (!url) return reply("❌ Invalid data");

        await Gifted.sendChatAction(chatId, "upload_video");

        const api = buildApi(url, quality);

        const res = await axios.get(api);

        if (!res.data || !res.data.status || !res.data.result?.download) {
            return reply("❌ API failed (video)");
        }

        const data = res.data.result;

        await Gifted.sendMessage(chatId, {
            video: { url: data.download },
            caption: `🎬 ${data.title}\n📺 ${data.quality}`
        }, { quoted: msg });

    } catch (e) {
        console.log(e);
        reply("❌ Video error fixed needed");
    }
});
