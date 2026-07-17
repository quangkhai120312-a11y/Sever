const mineflayer = require('mineflayer');
// NẠP THƯ VIỆN PATHFINDER ĐỂ TÌM ĐƯỜNG ĐI BỘ
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalGetToBlock } = require('mineflayer-pathfinder').goals;

// CẤU HÌNH THÔNG TIN SERVER
const botOptions = {
    host: 'NoeMC.aternos.me',   // IP server của bạn
    port: 53668,                // Cổng (Port) chính xác của bạn
    username: 'SeverSupporter',  // Tên Bot
    version: '1.21.1'            // Phiên bản Minecraft
};

const bot = mineflayer.createBot(botOptions);

// Kích hoạt plugin pathfinder cho bot
bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
    console.log(`[Bot] Đã kết nối thành công vào server: ${botOptions.host}:${botOptions.port}`);
    
    // Khởi tạo các thiết lập di chuyển cơ bản (nhảy lên block, mở cửa...)
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);

    // Kích hoạt chức năng chống AFK
    startAntiAFK();
});

// CHỨC NĂNG: TỰ ĐỘNG TÌM ĐƯỜNG VÀ ĐI NGỦ (Sử dụng Pathfinder)
bot.on('time', () => {
    if ((bot.time.timeOfDay >= 13000 || bot.isRaining) && !bot.isSleeping) {
        // Tìm khối block giường trong bán kính 15 block
        const bedBlock = bot.findBlock({
            matching: block => block.name.includes('bed'),
            maxDistance: 15
        });

        if (bedBlock) {
            console.log(`[Bot] Trời tối! Phát hiện giường tại ${bedBlock.position}. Đang tìm đường đi tới...`);
            
            // Ra lệnh cho Pathfinder tìm đường đi bộ đến sát cạnh cái giường
            const goal = new GoalGetToBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z);
            bot.pathfinder.setGoal(goal);

            // Khi bot đã đi đến đích (sát cạnh giường)
            bot.once('goal_reached', () => {
                console.log('[Bot] Đã đến sát cạnh giường, chuẩn bị leo lên ngủ...');
                bot.sleep(bedBlock).catch(err => {
                    console.log(`[Bot] Không ngủ được: ${err.message}`);
                });
            });
        }
    }
});

bot.on('wake', () => {
    console.log('[Bot] Trời đã sáng! Bot đã thức dậy.');
});

// CHỨC NĂNG CHỐNG AFK BẰNG VUNG TAY & XOAY NGƯỜI
function startAntiAFK() {
    console.log('[Bot] Đã bật chế độ chống AFK (Vung tay tự động).');
    setInterval(() => {
        // Chỉ vung tay khi bot không ngủ và không đang bận tìm đường đi bộ
        if (!bot.isSleeping && !bot.pathfinder.isMoving()) {
            bot.swingHand('right'); 
            const yaw = bot.entity.yaw + (Math.random() - 0.5) * 0.5;
            const pitch = bot.entity.pitch + (Math.random() - 0.5) * 0.2;
            bot.look(yaw, pitch, true);
        }
    }, 15000); 
}

// CHỨC NĂNG: TỰ ĐỘNG HỒI SINH KHI CHẾT
bot.on('death', () => {
    console.log('[Bot] Ôi không, bot đã bị chết! Đang tự động hồi sinh sau 1 giây...');
    setTimeout(() => {
        bot.respawn();
        console.log('[Bot] Đã hồi sinh thành công và tiếp tục treo máy.');
    }, 1000);
});

// CHỨC NĂNG: Chào người chơi mới sau 30 giây
bot.on('playerJoined', (player) => {
    if (player.username === bot.username) return;
    
    setTimeout(() => {
        if (bot.players[player.username]) {
            bot.chat(`Chào mừng ${player.username} vào sever, vui lòng gõ !list để xem danh sách lệnh`);
        }
    }, 30000);
});

// CHỨC NĂNG: Tương tác lệnh !list trong Game
bot.on('chat', (username, message) => {
    if (username === bot.username) return;

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

// CHỨC NĂNG: Chat trực tiếp từ màn hình Termux vào Game
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    const text = data.trim();
    if (text.length > 0) {
        bot.chat(text);
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
