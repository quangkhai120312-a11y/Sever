const mineflayer = require('mineflayer');

// CẤU HÌNH THÔNG TIN SERVER
const botOptions = {
    host: 'NoeMC.aternos.me',   // IP server của bạn
    port: 53668,                // Cổng (Port) chính xác của bạn
    username: 'SeverSupporter',  // Đã cập nhật tên Bot mới
    version: '1.21.1'            // Phiên bản Minecraft
};

const bot = mineflayer.createBot(botOptions);

bot.on('spawn', () => {
    console.log(`[Bot] Đã kết nối thành công vào server: ${botOptions.host}:${botOptions.port}`);
});

// CHỨC NĂNG: TỰ ĐỘNG HỒI SINH KHI CHẾT
bot.on('death', () => {
    console.log('[Bot] Ôi không, bot đã bị chết! Đang tự động hồi sinh sau 1 giây...');
    setTimeout(() => {
        bot.respawn();
        console.log('[Bot] Đã hồi sinh thành công và tiếp tục treo máy.');
    }, 1000); // Chờ 1 giây rồi tự bấm nút Hồi sinh (Respawn)
});

// 1. CHỨC NĂNG: Chào người chơi mới sau 30 giây
bot.on('playerJoined', (player) => {
    if (player.username === bot.username) return;

    console.log(`[Bot] ${player.username} vừa vào game. Sẽ chào sau 30s...`);
    
    setTimeout(() => {
        if (bot.players[player.username]) {
            bot.chat(`Chào mừng ${player.username} vào sever, vui lòng gõ !list để xem danh sách lệnh`);
        }
    }, 30000);
});

// 2. CHỨC NĂNG: Tự động tìm giường ngủ trong bán kính 10 block khi trời tối
bot.on('time', () => {
    if ((bot.time.timeOfDay >= 13000 || bot.isRaining) && !bot.isSleeping) {
        const bedBlock = bot.findBlock({
            matching: block => block.name.includes('bed'),
            maxDistance: 10
        });

        if (bedBlock) {
            console.log(`[Bot] Trời tối, đang đi ngủ tại vị trí: ${bedBlock.position}`);
            bot.sleep(bedBlock).catch(err => {
                console.log(`[Bot] Lỗi không ngủ được: ${err.message}`);
            });
        }
    }
});

bot.on('wake', () => {
    console.log('[Bot] Trời đã sáng! Bot đã thức dậy.');
});

// 3. CHỨC NĂNG: Tương tác lệnh !list trong Game (Đã bỏ chat say/admin)
bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    // LỆNH: !list (Dành cho TẤT CẢ mọi người)
    if (message.trim() === '!list') {
        bot.chat(`--- DANH SÁCH LỆNH SERVER ---`);
        setTimeout(() => bot.chat(`> Di chuyển chung: /spawn (Về sảnh), /warp <tên> (Đến khu công cộng)`), 400);
        setTimeout(() => bot.chat(`> Tra cứu khu: /warp list hoặc /warps (Xem toàn bộ các địa danh)`), 800);
        setTimeout(() => bot.chat(`> Simple_RTP: /rtp (Dịch chuyển ngẫu nhiên)`), 1200);
        setTimeout(() => bot.chat(`> SetHome: /sethome <tên>, /home <tên>, /sethome list (Xem ds nhà)`), 1600);
        setTimeout(() => bot.chat(`> SimpleTPA: /tpa <tên>, /tpaccept (Đồng ý), /tpdeny (Từ chối)`), 2000);
        return;
    }
});

// 4. CHỨC NĂNG: Chat trực tiếp từ màn hình Termux vào Game
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    const text = data.trim();
    if (text.length > 0) {
        bot.chat(text);
        console.log(`[Termux -> Game] Bạn vừa bắt bot chat: ${text}`);
    }
});

// Tự động kết nối lại nếu bị mất kết nối đột ngột
bot.on('end', () => {
    console.log('[Bot] Mất kết nối! Đang tự động kết nối lại sau 10 giây...');
    setTimeout(() => {
        mineflayer.createBot(botOptions);
    }, 10000);
});

bot.on('error', (err) => console.log(`[Lỗi Hệ Thống] ${err}`));
