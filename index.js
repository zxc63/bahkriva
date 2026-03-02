const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const TOKEN = '8158713545:AAFFW_Cx1a-X9aG2ae8mowTDNBnpWeFDiC0';
const ADMIN_ID = 6958994529;
const DB_FILE = 'barvikha.json';
const CURRENCY = 'TON'; // Валюта TON

const bot = new Telegraf(TOKEN);

// Database
let db = { users: {}, games: {}, transactions: {} };

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function load() {
  if (!fs.existsSync(DB_FILE)) { save(); return; }
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    db = { users: {}, games: {}, transactions: {} };
    save();
  }
  if (!db.users) db.users = {};
  if (!db.games) db.games = {};
  if (!db.transactions) db.transactions = {};
}

load();

// TON Mini App URL (замени на свой)
const MINIAPP_URL = 'https://твій-url/perfect_game.html';

function ensureUser(uid) {
  if (!db.users[uid]) {
    db.users[uid] = { 
      balance: 0, 
      referrals: 0, 
      stars: 0,
      inventory: [],
      totalBets: 0,
      totalWins: 0,
      totalTON: 0
    };
  }
}

// Главное меню BARVIKHA
function showMainMenu(ctx) {
  const uid = ctx.from.id;
  ensureUser(uid);
  save();

  const u = db.users[uid];
  let msg = '🏛️ <b>BARVIKHA CASINO</b>\n';
  msg += '━━━━━━━━━━━━━━━━━\n';
  msg += '💰 Баланс: <code>' + u.balance + '</code> ' + CURRENCY + '\n';
  msg += '⭐ Зірки: <code>' + u.stars + '</code>\n';
  msg += '📊 Ставок: <code>' + u.totalBets + '</code>\n';
  msg += '🎯 Виграшів: <code>' + u.totalWins + '</code>\n';
  msg += '━━━━━━━━━━━━━━━━━';

  return ctx.replyWithHTML(msg, Markup.keyboard([
    ['🎰 ІГРИ', '⚔️ PVP'],
    ['💎 КЕЙСИ', '🎁 БОНУС'],
    ['👥 РЕФЕРАЛИ', '⭐ ЗІРКИ'],
    ['📈 ПРОФІЛЬ', '💸 ВИВЕСТИ']
  ]).resize());
}

// TON депозит
function showDeposit(ctx) {
  const uid = ctx.from.id;
  ensureUser(uid);

  const msg = '💎 <b>ДЕПОЗИТ TON</b>\n';
  msg += '━━━━━━━━━━━━━━━━━\n';
  msg += '1 TON = 1000 монет\n\n';
  msg += '📱 Відправ TON на: <code>EQB...your_wallet</code>\n';
  msg += '💬 Надішли чек адміну: @' + (ctx.from.username || 'admin') + '\n\n';
  msg += '⚡ Авто-поповнення через TON Connect (скоро)';

  ctx.replyWithHTML(msg);
}

// START
bot.start((ctx) => {
  const uid = ctx.from.id;
  load();
  ensureUser(uid);

  const payload = (ctx.message.text || '').split(' ')[1];
  const referrerId = payload ? Number(payload) : null;

  if (!db.users[uid]) {
    // Стартовый бонус
    db.users[uid].balance += 100;
    if (referrerId && referrerId !== uid && db.users[referrerId]) {
      db.users[referrerId].balance += 50;
      db.users[referrerId].referrals += 1;
      bot.telegram.sendMessage(referrerId, '👥 Новий реферал! +50 TON');
    }
    save();
  }

  showMainMenu(ctx);
});

bot.on('text', async (ctx, next) => {
  const uid = ctx.from.id;
  const text = ctx.message.text;
  load();
  ensureUser(uid);

  // МЕНЮ
  if (text === '📈 ПРОФІЛЬ') {
    const u = db.users[uid];
    let msg = '👤 <b>ТВІЙ ПРОФІЛЬ</b>\n';
    msg += '━━━━━━━━━━━━━━━━━\n';
    msg += '💰 Баланс: <code>' + u.balance + '</code> TON\n';
    msg += '⭐ Зірки: <code>' + u.stars + '</code>\n';
    msg += '👥 Рефералів: <code>' + u.referrals + '</code>\n';
    msg += '📊 Ставок: <code>' + u.totalBets + '</code>\n';
    msg += '🎯 Виграшів: <code>' + u.totalWins + '</code>\n';
    msg += '💎 TON загалом: <code>' + u.totalTON + '</code>\n\n';

    if (u.inventory && u.inventory.length > 0) {
      msg += '🎒 <b>ІНВЕНТАР (' + u.inventory.length + ')</b>:\n';
      u.inventory.slice(-5).reverse().forEach(item => {
        msg += '  ' + item.icon + ' ' + item.name + '\n';
      });
    }

    ctx.replyWithHTML(msg);
    return;
  }

  if (text === '🎰 ІГРИ') {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🎰 СЛАУТИ', MINIAPP_URL + '?mode=slots')],
      [Markup.button.webApp('🧨 МАЙНИ', MINIAPP_URL + '?mode=mines')],
      [Markup.button.webApp('🏀 КОРЗИНА', MINIAPP_URL + '?mode=basket')]
    ]);
    ctx.replyWithHTML('🎰 <b>ІГРИ TON CASINO</b>', keyboard);
    return;
  }

  if (text === '⚔️ PVP') {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🎯 РУЛЕТКА', MINIAPP_URL + '?mode=roulette')],
      [Markup.button.webApp('⚔️ АРЕНА', MINIAPP_URL + '?mode=arena')],
      [Markup.button.webApp('🔨 КУЗНИЦЯ', MINIAPP_URL + '?mode=forge')]
    ]);
    ctx.replyWithHTML('⚔️ <b>PVP РЕЖИМИ</b>', keyboard);
    return;
  }

  if (text === '💎 КЕЙСИ') {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📦 Бронзовий (50 TON)', 'case_bronze')],
      [Markup.button.callback('🎁 Срібний (150 TON)', 'case_silver')],
      [Markup.button.callback('💎 Золотий (300 TON)', 'case_gold')]
    ]);
    ctx.replyWithHTML('💎 <b>КУПУЙ КЕЙСИ</b>\n\nВигравай рідкісні предмети!', keyboard);
    return;
  }

  if (text === '🎁 БОНУС') {
    const lastBonus = db.users[uid].lastBonus || 0;
    const now = Date.now();

    if (now - lastBonus > 24 * 60 * 60 * 1000) { // 24 години
      db.users[uid].balance += 50;
      db.users[uid].lastBonus = now;
      save();
      ctx.replyWithHTML('🎁 <b>Щоденний бонус!</b>\n\n+50 TON на рахунок!');
    } else {
      const remaining = Math.ceil((24 * 60 * 60 * 1000 - (now - lastBonus)) / (1000 * 60 * 60));
      ctx.reply('⏰ Бонус доступний через ' + remaining + ' год');
    }
    return;
  }

  if (text === '👥 РЕФЕРАЛИ') {
    const u = db.users[uid];
    const refLink = `https://t.me/${ctx.botInfo.username}?start=${uid}`;
    let msg = '👥 <b>РЕФЕРАЛЬНА СИСТЕМА</b>\n';
    msg += '━━━━━━━━━━━━━━━━━\n';
    msg += '📎 Твоя посилання: <code>' + refLink + '</code>\n';
    msg += '👥 Рефералів: <code>' + u.referrals + '</code>\n';
    msg += '💰 Зароблено: <code>' + (u.referrals * 50) + '</code> TON\n\n';
    msg += '💎 За кожного друга: +50 TON';

    ctx.replyWithHTML(msg);
    return;
  }

  if (text === '⭐ ЗІРКИ') {
    ctx.replyWithHTML('⭐ <b>КУПУЙ ЗІРКИ TON</b>\n\n1 зірка = 10 TON\n\nСкільки зірок купити?');
    // Добавь логику покупки
    return;
  }

  if (text === '💸 ВИВЕСТИ') {
    const u = db.users[uid];
    if (u.balance < 100) {
      ctx.reply('💸 Мінімум для виведення: 100 TON');
      return;
    }

    const reqId = String(Date.now()) + '_' + uid;
    db.transactions[reqId] = {
      id: reqId,
      userId: uid,
      amount: u.balance,
      status: 'pending',
      createdAt: Date.now()
    };
    save();

    bot.telegram.sendMessage(ADMIN_ID, `💸 ВИВІД TON\nID: ${reqId}\nЮзер: ${uid}\nСума: ${u.balance}\n/w_ok_${reqId}`);
    ctx.reply(`📤 Заявка на вивід створена!\nID: <code>${reqId}</code>`);
    return;
  }

  return next();
});

// CALLBACK КЕЙСЫ
bot.action(/^case_/, (ctx) => {
  const uid = ctx.from.id;
  const caseType = ctx.match[0].split('_')[1];
  ensureUser(uid);

  const prices = { bronze: 50, silver: 150, gold: 300 };
  const price = prices[caseType];

  if (db.users[uid].balance < price) {
    ctx.answerCbQuery('❌ Недостатньо TON!');
    return;
  }

  // Генерируем награду
  const rewards = {
    bronze: ['🪙 100 TON', '⚔️ Бронзовий меч', '🛡️ Щит'],
    silver: ['💰 500 TON', '⚔️ Срібний меч', '💎 5 кристалів'],
    gold: ['💎 1000 TON', '👑 Легендарний меч', '🔮 Артефакт']
  };

  const reward = rewards[caseType][Math.floor(Math.random() * 3)];

  db.users[uid].balance -= price;
  if (!db.users[uid].inventory) db.users[uid].inventory = [];
  db.users[uid].inventory.push({name: reward, from: caseType.toUpperCase(), date: Date.now()});
  save();

  ctx.answerCbQuery('🎁 ' + reward);
  ctx.replyWithHTML(`🎉 <b>КЕЙС ВІДКРИТО!</b>\n\n📦 ${caseType.toUpperCase()}\n💰 Списано: ${price} TON\n🎁 <code>${reward}</code>\n\n💰 Залишок: ${db.users[uid].balance} TON`);
});

// TON Payments (упрощено)
bot.command('deposit', showDeposit);

// ADMIN
bot.command('w_ok_(\w+)', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const reqId = ctx.match[1];
  if (!db.transactions[reqId]) return ctx.reply('Заявку не знайдено');

  const req = db.transactions[reqId];
  if (req.status !== 'pending') return ctx.reply('Вже оброблено');

  req.status = 'approved';
  req.doneAt = Date.now();
  save();

  ctx.reply(`✅ Вивід ${req.amount} TON схвалено: ${reqId}`);
  bot.telegram.sendMessage(req.userId, `✅ Вивід ${req.amount} TON схвалено! TON відправлено на гаманець`);
});

bot.command('w_no_(\w+)', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const reqId = ctx.match[1];
  if (!db.transactions[reqId]) return ctx.reply('Заявку не знайдено');

  const req = db.transactions[reqId];
  req.status = 'rejected';
  req.doneAt = Date.now();
  save();

  ctx.reply(`❌ Вивід відхилено: ${reqId}`);
  bot.telegram.sendMessage(req.userId, `❌ Вивід відхилено. ID: ${reqId}`);
});

// Mini App результаты
bot.on('message', async (ctx, next) => {
  if (ctx.message.web_app_data) {
    const uid = ctx.from.id;
    ensureUser(uid);

    try {
      const data = JSON.parse(ctx.message.web_app_data.data);

      if (data.action === 'game_result') {
        db.users[uid].totalBets += data.amount;
        if (data.won) {
          db.users[uid].totalWins++;
          db.users[uid].balance += data.amount;
          db.users[uid].totalTON += data.amount;
        }
        save();

        ctx.reply(`🎮 <b>${data.gameType.toUpperCase()}</b>\n\n${data.won ? '✅ ВИГРАВ' : '❌ ПРОГРАВ'}\n💰 ${data.amount} TON`);
      }
    } catch (e) {
      console.error('Mini App error:', e);
    }
  }
  return next();
});

bot.launch().then(() => {
  console.log('🎰 BARVIKHA TON CASINO запущено!');
  console.log('💎 Mini App:', MINIAPP_URL);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
