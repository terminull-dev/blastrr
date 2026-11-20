const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(__dirname, 'blastrr.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run("PRAGMA journal_mode = WAL;");
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      wallet_address TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      discount_code TEXT UNIQUE,
      referral_pct REAL NOT NULL DEFAULT 2,
      level_one_pct_override REAL,
      level_two_pct_override REAL,
      referred_by TEXT,
      admin_suspended INTEGER NOT NULL DEFAULT 0,
      admin_suspend_reason TEXT,
      admin_suspended_by TEXT,
      admin_suspended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_login_ip_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      is_new_ip INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_user_login_ip_events_wallet_created ON user_login_ip_events(wallet_address, created_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_user_login_ip_events_ip_created ON user_login_ip_events(ip_address, created_at DESC)');
    db.run(
      'INSERT OR IGNORE INTO users (wallet_address) SELECT DISTINCT wallet_address FROM user_login_ip_events WHERE wallet_address IS NOT NULL AND wallet_address != \'\''
    );

    db.run(`CREATE TABLE IF NOT EXISTS wallet_sessions (
      token_hash TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      reauthenticated_at INTEGER,
      revoked_at INTEGER
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_wallet_sessions_ip_expiry ON wallet_sessions(ip_address, expires_at, revoked_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_wallet_sessions_wallet_expiry ON wallet_sessions(wallet_address, expires_at, revoked_at)');

    db.run(`CREATE TABLE IF NOT EXISTS ip_security_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      triggering_wallet TEXT NOT NULL,
      session_count INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_ip_security_incidents_ip_created ON ip_security_incidents(ip_address, created_at DESC)');

    db.run(`CREATE TABLE IF NOT EXISTS wallet_security_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      incident_id INTEGER NOT NULL,
      locked_at INTEGER NOT NULL,
      cleared_at INTEGER,
      cleared_by TEXT,
      FOREIGN KEY(incident_id) REFERENCES ip_security_incidents(id)
    )`);
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_security_locks_active
      ON wallet_security_locks(wallet_address) WHERE cleared_at IS NULL`);
    db.run('CREATE INDEX IF NOT EXISTS idx_wallet_security_locks_wallet_locked ON wallet_security_locks(wallet_address, locked_at DESC)');

    db.run(`CREATE TABLE IF NOT EXISTS wallet_security_lock_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      admin_wallet TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('CLEAR', 'AUTO_REAUTH')),
      reason TEXT,
      created_at INTEGER NOT NULL
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_wallet_security_lock_reviews_wallet_created ON wallet_security_lock_reviews(wallet_address, created_at DESC)');

    db.run(`CREATE TABLE IF NOT EXISTS user_admin_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      admin_wallet TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('SUSPEND', 'RESTORE')),
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_user_admin_actions_wallet_created ON user_admin_actions(wallet_address, created_at DESC)');

    db.run(`CREATE TABLE IF NOT EXISTS hedging_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      symbol TEXT NOT NULL,
      attempted_account_id TEXT NOT NULL,
      attempted_side TEXT NOT NULL CHECK(attempted_side IN ('BUY', 'SELL')),
      conflicting_side TEXT NOT NULL CHECK(conflicting_side IN ('BUY', 'SELL')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_hedging_alerts_wallet_created ON hedging_alerts(wallet_address, created_at DESC)');
    db.run(`CREATE TABLE IF NOT EXISTS hedging_alert_accounts (
      alert_id INTEGER NOT NULL,
      account_id TEXT NOT NULL,
      trade_id TEXT,
      position_side TEXT NOT NULL CHECK(position_side IN ('BUY', 'SELL')),
      FOREIGN KEY(alert_id) REFERENCES hedging_alerts(id) ON DELETE CASCADE
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_hedging_alert_accounts_alert ON hedging_alert_accounts(alert_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_hedging_alert_accounts_account ON hedging_alert_accounts(account_id)');

    db.run(`CREATE TABLE IF NOT EXISTS public_chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market_symbol TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_public_chat_market_created ON public_chat_messages(market_symbol, id DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_public_chat_wallet_created ON public_chat_messages(wallet_address, id DESC)');

    db.run(`CREATE TABLE IF NOT EXISTS creator_applications (
      wallet_address TEXT PRIMARY KEY,
      x_url TEXT,
      youtube_url TEXT,
      tiktok_url TEXT,
      instagram_url TEXT,
      twitch_url TEXT,
      discord_url TEXT,
      website_url TEXT,
      community_size TEXT NOT NULL,
      community_description TEXT NOT NULL,
      creator_motivation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      base_price_usdt REAL NOT NULL,
      price_usdt REAL NOT NULL,
      simulated_capital REAL NOT NULL,
      profit_target REAL NOT NULL,
      max_drawdown_pct REAL NOT NULL,
      daily_loss_pct REAL NOT NULL,
      max_single_day_profit_pct REAL DEFAULT 40.0,
      active INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admins (
      wallet_address TEXT PRIMARY KEY,
      role TEXT DEFAULT 'SUPER_ADMIN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    const treasurySuperAdmins = [
      '0x9c19edeba86b214db5b3d21da9416d5e5568365b',
      'A3AVrbzCYzqKEkBR7pDQGYgnAbmBF9qNMQDX84QpuRZx'
    ];
    treasurySuperAdmins.forEach(walletAddress => {
      const walletPredicate = walletAddress.startsWith('0x')
        ? 'LOWER(wallet_address) = LOWER(?)'
        : 'wallet_address = ?';
      db.run(`UPDATE admins SET role = 'SUPER_ADMIN' WHERE ${walletPredicate}`, [walletAddress]);
      db.run(
        `INSERT INTO admins (wallet_address, role)
         SELECT ?, 'SUPER_ADMIN'
         WHERE NOT EXISTS (SELECT 1 FROM admins WHERE ${walletPredicate})`,
        [walletAddress, walletAddress]
      );
    });

    db.run(`CREATE TABLE IF NOT EXISTS support_staff (
      wallet_address TEXT PRIMARY KEY,
      role TEXT NOT NULL DEFAULT 'SUPPORT' CHECK(role = 'SUPPORT'),
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS support_staff_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      admin_wallet TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('ADD', 'REMOVE')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_support_staff_events_wallet_created ON support_staff_events(wallet_address, created_at DESC)');

    db.run(`CREATE TABLE IF NOT EXISTS wallet_disclaimer_acceptances (
      wallet_address TEXT NOT NULL,
      version TEXT NOT NULL,
      accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (wallet_address, version)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS purchases (
      tx_hash TEXT PRIMARY KEY,
      chain_id INTEGER NOT NULL,
      wallet_address TEXT NOT NULL,
      account_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      amount_usdt REAL,
      payment_asset TEXT NOT NULL DEFAULT 'USDT',
      payer_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      wallet_address TEXT,
      plan_id INTEGER,
      initial_balance REAL,
      current_balance REAL,
      current_equity REAL,
      high_water_mark REAL,
      daily_starting_balance REAL,
      risk_day TEXT,
      status TEXT DEFAULT 'ACTIVE',
      lock_reason TEXT,
      locked_until TEXT,
      permanent_lock INTEGER DEFAULT 0,
      admin_frozen INTEGER DEFAULT 0,
      admin_freeze_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(wallet_address) REFERENCES users(wallet_address),
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      symbol TEXT,
      market_type TEXT NOT NULL DEFAULT 'CRYPTO',
      side TEXT,
      entry_price REAL,
      order_type TEXT NOT NULL DEFAULT 'MARKET' CHECK(order_type IN ('MARKET', 'LIMIT')),
      trigger_price REAL,
      size_usd REAL,
      units REAL,
      lot_size REAL,
      pip_size REAL,
      sl REAL,
      tp REAL,
      sl_tp_mode TEXT NOT NULL DEFAULT 'price',
      sl_amount REAL,
      tp_amount REAL,
      pnl REAL DEFAULT 0,
      status TEXT DEFAULT 'OPEN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      leverage INTEGER DEFAULT 1,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trade_copy_groups (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_trade_copy_groups_wallet ON trade_copy_groups(wallet_address, created_at)');
    db.run(`CREATE TABLE IF NOT EXISTS trade_copy_group_members (
      group_id TEXT NOT NULL,
      account_id TEXT NOT NULL PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('LEADER', 'FOLLOWER')),
      size_pct REAL NOT NULL DEFAULT 100,
      FOREIGN KEY(group_id) REFERENCES trade_copy_groups(id) ON DELETE CASCADE
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_trade_copy_group_members_group ON trade_copy_group_members(group_id, role)');
    db.run(`CREATE TABLE IF NOT EXISTS trade_copy_leader_trades (
      leader_trade_id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_trade_copy_leader_trades_group ON trade_copy_leader_trades(group_id)');
    db.run(`CREATE TABLE IF NOT EXISTS trade_copy_links (
      leader_trade_id TEXT NOT NULL,
      follower_trade_id TEXT NOT NULL UNIQUE,
      group_id TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(leader_trade_id, follower_trade_id)
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_trade_copy_links_leader ON trade_copy_links(leader_trade_id)');

    db.run(`CREATE TABLE IF NOT EXISTS account_trade_journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      day TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(account_id, day),
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_account_trade_journals_account_day ON account_trade_journals(account_id, day)');

    db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      wallet_address TEXT,
      amount REAL,
      status TEXT DEFAULT 'PENDING',
      type TEXT DEFAULT 'PROFIT_SPLIT',
      plan_name TEXT,
      user_ip TEXT,
      user_amount REAL,
      admin_share REAL,
      payout_chain_id INTEGER,
      payout_asset TEXT NOT NULL DEFAULT 'USDT',
      payout_tx_hash TEXT,
      funds_deducted INTEGER DEFAULT 0,
      approved_at DATETIME,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS referral_withdrawals (
      id TEXT PRIMARY KEY,
      wallet_address TEXT,
      amount REAL,
      status TEXT DEFAULT 'PENDING',
      payout_chain_id INTEGER,
      payout_asset TEXT NOT NULL DEFAULT 'USDT',
      payout_tx_hash TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS referral_withdrawal_allocations (
      withdrawal_id TEXT NOT NULL,
      referral_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(withdrawal_id, referral_id),
      FOREIGN KEY(withdrawal_id) REFERENCES referral_withdrawals(id),
      FOREIGN KEY(referral_id) REFERENCES referrals(id)
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_referral_withdrawal_allocations_referral ON referral_withdrawal_allocations(referral_id)');

    db.run(`CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_wallet TEXT,
      referee_wallet TEXT,
      plan_id INTEGER,
      paid_amount REAL,
      commission_earned REAL,
      commission_pct REAL DEFAULT 2,
      level INTEGER NOT NULL DEFAULT 1,
      purchase_tx_hash TEXT,
      purchase_chain_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS referral_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      level_one_pct REAL NOT NULL DEFAULT 2,
      level_two_pct REAL NOT NULL DEFAULT 2
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS plan_seed_state (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      seeded INTEGER NOT NULL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      plan_id INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      claimed_by TEXT,
      claimed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      standard_discount_pct REAL NOT NULL DEFAULT 90
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS site_maintenance (
      page_id TEXT PRIMARY KEY,
      is_offline INTEGER NOT NULL DEFAULT 0,
      outage_message TEXT NOT NULL DEFAULT '',
      updated_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    for (const pageId of ['home', 'trade', 'accounts', 'copytrading', 'leaderboard', 'blastrrpass', 'profile', 'plans', 'faq', 'docs']) {
      db.run('INSERT OR IGNORE INTO site_maintenance (page_id) VALUES (?)', [pageId]);
    }

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_plan_rewards (
      plan_id INTEGER PRIMARY KEY,
      xp_reward INTEGER NOT NULL DEFAULT 1000,
      points_reward INTEGER NOT NULL DEFAULT 100,
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_users (
      wallet_address TEXT PRIMARY KEY,
      xp INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      profile_image_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_levels (
      level INTEGER PRIMARY KEY CHECK(level BETWEEN 1 AND 12),
      xp_required INTEGER NOT NULL UNIQUE,
      discount_bonus_pct REAL NOT NULL DEFAULT 0,
      points_cost INTEGER NOT NULL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_level_definitions (
      level INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      FOREIGN KEY(level) REFERENCES battlepass_levels(level)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      action_url TEXT NOT NULL DEFAULT 'https://x.com/',
      task_type TEXT NOT NULL DEFAULT 'SOCIAL_CLICK' CHECK(task_type IN ('SOCIAL_CLICK', 'GREEN_DAY', 'GREEN_WEEK', 'TRADE_DAY', 'WITHDRAWAL', 'PLATFORM_REVIEW', 'JOURNAL_DAY', 'JOURNAL_WEEK', 'JOURNAL_MONTH', 'PURCHASE_ANY', 'PURCHASE_PLAN')),
      cadence TEXT NOT NULL DEFAULT 'DAILY' CHECK(cadence IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')),
      plan_id INTEGER,
      xp_reward INTEGER NOT NULL,
      points_reward INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      is_builtin INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_task_claims (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      task_id INTEGER NOT NULL,
      cadence TEXT NOT NULL CHECK(cadence IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')),
      period_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(wallet_address, task_id, cadence, period_key),
      FOREIGN KEY(task_id) REFERENCES battlepass_tasks(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_events (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      event_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      xp INTEGER NOT NULL,
      points INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_type, reference_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_reward_codes (
      code TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      level INTEGER NOT NULL,
      discount_bonus_pct REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      redeemed_at DATETIME,
      UNIQUE(wallet_address, level),
      FOREIGN KEY(level) REFERENCES battlepass_levels(level)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_level_titles (
      wallet_address TEXT NOT NULL,
      level INTEGER NOT NULL,
      claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(wallet_address, level),
      FOREIGN KEY(level) REFERENCES battlepass_levels(level)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      points_cost INTEGER NOT NULL CHECK(points_cost >= 0),
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      reward_type TEXT NOT NULL CHECK(reward_type IN ('ACCOUNT', 'DISCOUNT', 'XP', 'POINTS')),
      plan_id INTEGER,
      discount_pct REAL,
      xp_amount INTEGER NOT NULL DEFAULT 0,
      points_amount INTEGER NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_pack_rewards (
      pack_id INTEGER NOT NULL,
      reward_id INTEGER NOT NULL,
      odds REAL NOT NULL,
      max_drops INTEGER NOT NULL DEFAULT 0 CHECK(max_drops >= 0),
      PRIMARY KEY(pack_id, reward_id),
      FOREIGN KEY(pack_id) REFERENCES battlepass_packs(id),
      FOREIGN KEY(reward_id) REFERENCES battlepass_rewards(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_pack_openings (
      id TEXT PRIMARY KEY,
      request_key TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      pack_id INTEGER NOT NULL,
      reward_id INTEGER NOT NULL,
      points_spent INTEGER NOT NULL,
      reward_type TEXT NOT NULL,
      reward_name TEXT NOT NULL,
      reward_description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      points_awarded INTEGER NOT NULL DEFAULT 0,
      account_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(wallet_address, request_key),
      FOREIGN KEY(pack_id) REFERENCES battlepass_packs(id),
      FOREIGN KEY(reward_id) REFERENCES battlepass_rewards(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS battlepass_discount_certificates (
      code TEXT PRIMARY KEY,
      opening_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      reward_id INTEGER NOT NULL,
      discount_pct REAL NOT NULL CHECK(discount_pct BETWEEN 91 AND 98),
      eligible_plan_id INTEGER,
      redeemed_at DATETIME,
      purchase_tx_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(opening_id) REFERENCES battlepass_pack_openings(id),
      FOREIGN KEY(reward_id) REFERENCES battlepass_rewards(id),
      FOREIGN KEY(eligible_plan_id) REFERENCES plans(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admin_notifications (
      event_key TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS daily_account_summaries (
      account_id TEXT NOT NULL,
      day TEXT NOT NULL,
      opening_balance REAL NOT NULL,
      closing_balance REAL NOT NULL,
      profit REAL NOT NULL,
      PRIMARY KEY (account_id, day),
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      account_id TEXT,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      assigned_staff_wallet TEXT,
      assigned_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      author_role TEXT NOT NULL CHECK(author_role IN ('USER', 'ADMIN')),
      author_name TEXT NOT NULL,
      body TEXT NOT NULL,
      author_wallet TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS support_ticket_admin_reads (
      ticket_id TEXT NOT NULL,
      admin_wallet TEXT NOT NULL,
      last_read_message_id INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(ticket_id, admin_wallet),
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id)
    )`);

    db.all('PRAGMA table_info(support_tickets)', (err, columns) => {
      if (err) {
        console.error('Unable to inspect support ticket assignment schema', err.message);
        return;
      }
      const existing = new Set(columns.map(column => column.name));
      const additions = [
        ['assigned_staff_wallet', 'TEXT'],
        ['assigned_at', 'DATETIME']
      ];
      const addNext = index => {
        if (index >= additions.length) {
          db.run('CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_status ON support_tickets(assigned_staff_wallet, status, updated_at DESC)');
          return;
        }
        const [name, type] = additions[index];
        if (existing.has(name)) return addNext(index + 1);
        db.run(`ALTER TABLE support_tickets ADD COLUMN ${name} ${type}`, alterErr => {
          if (alterErr) {
            console.error(`Unable to add support_tickets.${name}`, alterErr.message);
            return;
          }
          addNext(index + 1);
        });
      };
      addNext(0);
    });

    db.run(`CREATE TABLE IF NOT EXISTS user_reviews (
      account_id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      username TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0,
      moderation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(moderation_status IN ('PENDING', 'APPROVED', 'HIDDEN', 'REJECTED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS review_moderation_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      reviewer_wallet TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('APPROVE', 'HIDE', 'REJECT')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('CREATE INDEX IF NOT EXISTS idx_review_moderation_actions_account_created ON review_moderation_actions(account_id, created_at DESC)');

    db.run('CREATE INDEX IF NOT EXISTS idx_support_tickets_wallet_updated ON support_tickets(wallet_address, updated_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_support_tickets_status_updated ON support_tickets(status, updated_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id, created_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_promo_codes_created_at ON promo_codes(created_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_battlepass_claims_wallet ON battlepass_task_claims(wallet_address, created_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_battlepass_events_wallet ON battlepass_events(wallet_address, created_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_battlepass_level_titles_wallet_level ON battlepass_level_titles(wallet_address, level DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_battlepass_pack_openings_wallet ON battlepass_pack_openings(wallet_address, created_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_battlepass_pack_openings_reward ON battlepass_pack_openings(pack_id, reward_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_battlepass_discount_certificates_wallet ON battlepass_discount_certificates(wallet_address, created_at DESC)');
    db.run('CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC)');
    db.run('INSERT OR IGNORE INTO referral_settings (id, level_two_pct) VALUES (1, 2)');
    db.run('INSERT OR IGNORE INTO plan_seed_state (id, seeded) VALUES (1, 0)');

    db.run(
      'INSERT OR IGNORE INTO battlepass_settings (id, standard_discount_pct) VALUES (1, 90)'
    );
    const levelTitles = [
      'Rookie', 'Apprentice', 'Adept', 'Specialist', 'Veteran', 'Strategist',
      'Expert', 'Elite', 'Master', 'Grandmaster', 'Champion', 'Legend'
    ];
    for (let level = 1; level <= 12; level++) {
      db.run(
        'INSERT OR IGNORE INTO battlepass_levels (level, xp_required, discount_bonus_pct, points_cost) VALUES (?, ?, ?, ?)',
        [level, level * 10000, level, level * 100]
      );
      db.run(
        'INSERT OR IGNORE INTO battlepass_level_definitions (level, title) VALUES (?, ?)',
        [level, levelTitles[level - 1]]
      );
    }
    db.all("PRAGMA table_info(battlepass_tasks)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect battlepass_tasks schema', err.message);
        return;
      }
      const requiredColumns = [
        ['cadence', "ALTER TABLE battlepass_tasks ADD COLUMN cadence TEXT NOT NULL DEFAULT 'DAILY'"],
        ['action_url', "ALTER TABLE battlepass_tasks ADD COLUMN action_url TEXT NOT NULL DEFAULT 'https://x.com/'"],
        ['task_type', "ALTER TABLE battlepass_tasks ADD COLUMN task_type TEXT NOT NULL DEFAULT 'SOCIAL_CLICK'"],
        ['is_builtin', 'ALTER TABLE battlepass_tasks ADD COLUMN is_builtin INTEGER NOT NULL DEFAULT 0'],
        ['plan_id', 'ALTER TABLE battlepass_tasks ADD COLUMN plan_id INTEGER']
      ];
      const addMissingColumns = (index) => {
        if (index >= requiredColumns.length) return migrateTaskTypeConstraint();
        const [name, sql] = requiredColumns[index];
        if (columns.some(column => column.name === name)) return addMissingColumns(index + 1);
        db.run(sql, alterErr => {
          if (alterErr) {
            console.error(`Unable to add battlepass_tasks.${name}`, alterErr.message);
            return;
          }
          addMissingColumns(index + 1);
        });
      };
      const seedTasks = () => db.run(
        `UPDATE battlepass_tasks SET is_builtin = 1
         WHERE task_type IN ('GREEN_DAY', 'GREEN_WEEK', 'TRADE_DAY', 'JOURNAL_DAY', 'JOURNAL_WEEK', 'JOURNAL_MONTH', 'PURCHASE_ANY', 'PURCHASE_PLAN')`,
        markErr => {
          if (markErr) {
            console.error('Unable to mark built-in battle pass tasks', markErr.message);
            return;
          }
          const defaults = [
            ['Green day', 'Finish the previous UTC day with positive realized trading profit. Claim after the day closes.', 'GREEN_DAY', 'DAILY', 500, 50],
            ['Green week', 'Finish the previous UTC week with positive realized trading profit. Claim after the week closes.', 'GREEN_WEEK', 'WEEKLY', 2500, 250],
            ['Trade each day', 'Close at least one trade during the current UTC day.', 'TRADE_DAY', 'DAILY', 100, 10],
            ['Paid withdrawal', 'Claim after a withdrawal is marked paid during this UTC day.', 'WITHDRAWAL', 'DAILY', 500, 50],
            ['Review the platform', 'Submit a review through the internal review form to earn this one-time reward automatically.', 'PLATFORM_REVIEW', 'ONCE', 200, 200],
            ['Journal your day', 'Write or update a journal entry for today to unlock this daily reward.', 'JOURNAL_DAY', 'DAILY', 100, 10],
            ['Journal five days', 'Write journal entries for five different days this UTC week.', 'JOURNAL_WEEK', 'WEEKLY', 500, 50],
            ['Journal every day this month', 'Write a journal entry for every day in the current UTC month.', 'JOURNAL_MONTH', 'MONTHLY', 1000, 100],
            ['Buy any plan', 'Claim a reward for each account bought through a verified paid purchase.', 'PURCHASE_ANY', 'ONCE', 500, 50]
          ];
          const seedNext = index => {
            if (index >= defaults.length) return;
            const [title, description, taskType, cadence, xpReward, pointsReward] = defaults[index];
            db.run(
              `INSERT INTO battlepass_tasks
               (title, description, task_type, cadence, xp_reward, points_reward, is_builtin)
               SELECT ?, ?, ?, ?, ?, ?, 1
               WHERE NOT EXISTS (
                 SELECT 1 FROM battlepass_tasks WHERE is_builtin = 1 AND task_type = ?
               )`,
              [title, description, taskType, cadence, xpReward, pointsReward, taskType],
              seedErr => {
                if (seedErr) {
                  console.error(`Unable to seed the built-in ${taskType} task`, seedErr.message);
                  return;
                }
                seedNext(index + 1);
              }
            );
          };
          seedNext(0);
        }
      );
      const migrateBattlePassTaskClaims = callback => db.get(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'battlepass_task_claims'",
        [],
        (schemaErr, schema) => {
          if (schemaErr || !schema?.sql) {
            console.error('Unable to inspect battlepass_task_claims constraints', schemaErr?.message || 'Table definition not found.');
            return;
          }
          if (schema.sql.includes("'ONCE'")) return callback();
          db.run('PRAGMA foreign_keys = OFF', pragmaErr => {
            if (pragmaErr) {
              console.error('Unable to prepare battlepass claim migration', pragmaErr.message);
              return;
            }
            db.run('BEGIN IMMEDIATE', beginErr => {
              if (beginErr) {
                console.error('Unable to start battlepass claim migration', beginErr.message);
                db.run('PRAGMA foreign_keys = ON');
                return;
              }
              const steps = [
                `CREATE TABLE battlepass_task_claims_new (
                  id TEXT PRIMARY KEY,
                  wallet_address TEXT NOT NULL,
                  task_id INTEGER NOT NULL,
                  cadence TEXT NOT NULL CHECK(cadence IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')),
                  period_key TEXT NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE(wallet_address, task_id, cadence, period_key),
                  FOREIGN KEY(task_id) REFERENCES battlepass_tasks(id)
                )`,
                `INSERT INTO battlepass_task_claims_new
                 (id, wallet_address, task_id, cadence, period_key, created_at)
                 SELECT id, wallet_address, task_id, cadence, period_key, created_at
                 FROM battlepass_task_claims`,
                'DROP TABLE battlepass_task_claims',
                'ALTER TABLE battlepass_task_claims_new RENAME TO battlepass_task_claims'
              ];
              const runMigrationStep = index => {
                if (index >= steps.length) {
                  return db.run('COMMIT', commitErr => {
                    if (commitErr) {
                      console.error('Unable to complete battlepass claim migration', commitErr.message);
                      db.run('ROLLBACK', () => db.run('PRAGMA foreign_keys = ON'));
                      return;
                    }
                    db.run('PRAGMA foreign_keys = ON', foreignKeysErr => {
                      if (foreignKeysErr) return console.error('Unable to restore database foreign key checks', foreignKeysErr.message);
                      db.run(
                        'CREATE INDEX IF NOT EXISTS idx_battlepass_claims_wallet ON battlepass_task_claims(wallet_address, created_at DESC)',
                        indexErr => {
                          if (indexErr) return console.error('Unable to recreate the battlepass claims index', indexErr.message);
                          callback();
                        }
                      );
                    });
                  });
                }
                db.run(steps[index], stepErr => {
                  if (stepErr) {
                    console.error('Unable to migrate battlepass claim cadence constraint', stepErr.message);
                    return db.run('ROLLBACK', () => db.run('PRAGMA foreign_keys = ON'));
                  }
                  runMigrationStep(index + 1);
                });
              };
              runMigrationStep(0);
            });
          });
        }
      );
      const migrateTaskTypeConstraint = () => db.get(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'battlepass_tasks'",
        [],
        (schemaErr, schema) => {
          if (schemaErr || !schema?.sql) {
            console.error('Unable to inspect battlepass_tasks constraints', schemaErr?.message || 'Table definition not found.');
            return;
          }
          const taskTypes = ['TRADE_DAY', 'PLATFORM_REVIEW', 'JOURNAL_DAY', 'JOURNAL_WEEK',
            'JOURNAL_MONTH', 'PURCHASE_ANY', 'PURCHASE_PLAN', 'ONCE'];
          if (taskTypes.every(taskType => schema.sql.includes(`'${taskType}'`))) {
            return migrateBattlePassTaskClaims(seedTasks);
          }
          db.run('PRAGMA foreign_keys = OFF', pragmaErr => {
            if (pragmaErr) {
              console.error('Unable to prepare battlepass task migration', pragmaErr.message);
              return;
            }
            db.run('BEGIN IMMEDIATE', beginErr => {
              if (beginErr) {
                console.error('Unable to start battlepass task migration', beginErr.message);
                db.run('PRAGMA foreign_keys = ON');
                return;
              }
              const steps = [
                `CREATE TABLE battlepass_tasks_new (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  description TEXT NOT NULL,
                  action_url TEXT NOT NULL DEFAULT 'https://x.com/',
                  task_type TEXT NOT NULL DEFAULT 'SOCIAL_CLICK' CHECK(task_type IN ('SOCIAL_CLICK', 'GREEN_DAY', 'GREEN_WEEK', 'TRADE_DAY', 'WITHDRAWAL', 'PLATFORM_REVIEW', 'JOURNAL_DAY', 'JOURNAL_WEEK', 'JOURNAL_MONTH', 'PURCHASE_ANY', 'PURCHASE_PLAN')),
                  cadence TEXT NOT NULL DEFAULT 'DAILY' CHECK(cadence IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')),
                  plan_id INTEGER,
                  xp_reward INTEGER NOT NULL,
                  points_reward INTEGER NOT NULL,
                  active INTEGER NOT NULL DEFAULT 1,
                  is_builtin INTEGER NOT NULL DEFAULT 0,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                `INSERT INTO battlepass_tasks_new
                 (id, title, description, action_url, task_type, cadence, plan_id, xp_reward, points_reward, active, is_builtin, created_at)
                 SELECT id, title, description, action_url, task_type, cadence, plan_id, xp_reward, points_reward, active, is_builtin, created_at
                 FROM battlepass_tasks`,
                'DROP TABLE battlepass_tasks',
                'ALTER TABLE battlepass_tasks_new RENAME TO battlepass_tasks'
              ];
              const runMigrationStep = index => {
                if (index >= steps.length) {
                  return db.run('COMMIT', commitErr => {
                    if (commitErr) {
                      console.error('Unable to complete battlepass task migration', commitErr.message);
                      db.run('ROLLBACK', () => db.run('PRAGMA foreign_keys = ON'));
                      return;
                    }
                    db.run('PRAGMA foreign_keys = ON', foreignKeysErr => {
                      if (foreignKeysErr) console.error('Unable to restore database foreign key checks', foreignKeysErr.message);
                      migrateBattlePassTaskClaims(seedTasks);
                    });
                  });
                }
                db.run(steps[index], stepErr => {
                  if (stepErr) {
                    console.error('Unable to migrate battlepass task type constraint', stepErr.message);
                    return db.run('ROLLBACK', () => db.run('PRAGMA foreign_keys = ON'));
                  }
                  runMigrationStep(index + 1);
                });
              };
              runMigrationStep(0);
            });
          });
        }
      );
      addMissingColumns(0);
    });

    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect users schema', err.message);
        return;
      }
      const existing = new Set(columns.map(column => column.name));
      const additions = [
        ['referral_pct', 'REAL NOT NULL DEFAULT 2'],
        ['level_one_pct_override', 'REAL'],
        ['level_two_pct_override', 'REAL'],
        ['referred_by', 'TEXT'],
        ['admin_suspended', 'INTEGER NOT NULL DEFAULT 0'],
        ['admin_suspend_reason', 'TEXT'],
        ['admin_suspended_by', 'TEXT'],
        ['admin_suspended_at', 'DATETIME'],
        ['leaderboard_hidden', 'INTEGER NOT NULL DEFAULT 0']
      ].filter(([name]) => !existing.has(name));
      const addNextColumn = index => {
        if (index >= additions.length) {
          db.run('CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by)');
          db.run(
            `UPDATE users
             SET referred_by = (
               SELECT r.referrer_wallet FROM referrals r
               WHERE LOWER(r.referee_wallet) = LOWER(users.wallet_address)
                 AND r.referrer_wallet IS NOT NULL
               ORDER BY r.created_at, r.id LIMIT 1
             )
             WHERE referred_by IS NULL AND EXISTS (
               SELECT 1 FROM referrals r
               WHERE LOWER(r.referee_wallet) = LOWER(users.wallet_address)
                 AND r.referrer_wallet IS NOT NULL
             )`,
            backfillErr => {
              if (backfillErr) console.error('Unable to backfill first-touch referral attribution', backfillErr.message);
            }
          );
          db.run(
            'UPDATE users SET level_one_pct_override = referral_pct WHERE level_one_pct_override IS NULL AND referral_pct != 2',
            backfillErr => {
              if (backfillErr) console.error('Unable to preserve custom level-1 referral rates', backfillErr.message);
            }
          );
          return;
        }
        const [name, type] = additions[index];
        db.run(`ALTER TABLE users ADD COLUMN ${name} ${type}`, alterErr => {
          if (alterErr) {
            console.error(`Unable to add users.${name}`, alterErr.message);
            return;
          }
          addNextColumn(index + 1);
        });
      };
      addNextColumn(0);
    });

    db.all("PRAGMA table_info(referral_settings)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect referral_settings schema', err.message);
        return;
      }
      if (columns.some(column => column.name === 'level_one_pct')) return;
      db.run(
        'ALTER TABLE referral_settings ADD COLUMN level_one_pct REAL NOT NULL DEFAULT 2',
        alterErr => {
          if (alterErr) console.error('Unable to add referral_settings.level_one_pct', alterErr.message);
        }
      );
    });

    db.all("PRAGMA table_info(referrals)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect referrals schema', err.message);
        return;
      }
      const existing = new Set(columns.map(column => column.name));
      const additions = [
        ['commission_pct', 'REAL DEFAULT 2'],
        ['level', 'INTEGER NOT NULL DEFAULT 1'],
        ['purchase_tx_hash', 'TEXT'],
        ['purchase_chain_id', 'INTEGER']
      ].filter(([name]) => !existing.has(name));
      const addNextColumn = index => {
        if (index >= additions.length) {
          db.run('CREATE INDEX IF NOT EXISTS idx_referrals_referrer_level_created ON referrals(referrer_wallet, level, created_at DESC)');
          db.run('CREATE INDEX IF NOT EXISTS idx_referrals_referee_level_created ON referrals(referee_wallet, level, created_at)');
          db.run(
            `UPDATE referrals
             SET purchase_tx_hash = (
                   SELECT p.tx_hash FROM purchases p
                   JOIN accounts a ON a.id = p.account_id
                   WHERE LOWER(p.wallet_address) = LOWER(referrals.referee_wallet)
                     AND a.plan_id = referrals.plan_id
                     AND ABS(strftime('%s', p.created_at) - strftime('%s', referrals.created_at)) <= 1
                   LIMIT 1
                 ),
                 purchase_chain_id = (
                   SELECT p.chain_id FROM purchases p
                   JOIN accounts a ON a.id = p.account_id
                   WHERE LOWER(p.wallet_address) = LOWER(referrals.referee_wallet)
                     AND a.plan_id = referrals.plan_id
                     AND ABS(strftime('%s', p.created_at) - strftime('%s', referrals.created_at)) <= 1
                   LIMIT 1
                 )
             WHERE purchase_tx_hash IS NULL
               AND (SELECT COUNT(*) FROM purchases p
                    JOIN accounts a ON a.id = p.account_id
                    WHERE LOWER(p.wallet_address) = LOWER(referrals.referee_wallet)
                      AND a.plan_id = referrals.plan_id
                      AND ABS(strftime('%s', p.created_at) - strftime('%s', referrals.created_at)) <= 1) = 1`,
            backfillErr => {
              if (backfillErr) console.error('Unable to backfill unambiguous referral purchase provenance', backfillErr.message);
            }
          );
          return;
        }
        const [name, type] = additions[index];
        db.run(`ALTER TABLE referrals ADD COLUMN ${name} ${type}`, alterErr => {
          if (alterErr) {
            console.error(`Unable to add referrals.${name}`, alterErr.message);
            return;
          }
          addNextColumn(index + 1);
        });
      };
      addNextColumn(0);
    });

    db.all("PRAGMA table_info(purchases)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect purchases schema', err.message);
        return;
      }
      const existing = new Set(columns.map(column => column.name));
      const additions = [
        ['quantity', 'INTEGER NOT NULL DEFAULT 1'],
        ['amount_usdt', 'REAL'],
        ['payment_asset', "TEXT NOT NULL DEFAULT 'USDT'"],
        ['payer_address', 'TEXT']
      ].filter(([name]) => !existing.has(name));
      const addNextColumn = index => {
        if (index >= additions.length) {
          return db.run(
            `UPDATE purchases
             SET amount_usdt = 0, payment_asset = 'FREE'
             WHERE UPPER(COALESCE(payment_asset, '')) = 'FREE'
                OR substr(LOWER(tx_hash), 1, 5) IN ('free_', 'pass_')`,
            backfillErr => {
              if (backfillErr) console.error('Unable to record zero-value promo purchases', backfillErr.message);
              db.run(
                `CREATE TRIGGER IF NOT EXISTS purchases_require_recorded_paid_amount
                 BEFORE INSERT ON purchases
                 WHEN NEW.chain_id > 0 AND (
                   NEW.amount_usdt IS NULL OR NEW.amount_usdt <= 0
                   OR UPPER(COALESCE(NEW.payment_asset, '')) NOT IN ('USDT', 'USDC')
                 )
                 BEGIN
                   SELECT RAISE(ABORT, 'Paid purchases require a positive recorded USDT or USDC amount');
                 END`,
                triggerErr => {
                  if (triggerErr) console.error('Unable to enforce recorded amounts for paid purchases', triggerErr.message);
                  db.run(
                    `CREATE TRIGGER IF NOT EXISTS purchases_keep_recorded_paid_amount
                     BEFORE UPDATE OF chain_id, amount_usdt, payment_asset ON purchases
                     WHEN NEW.chain_id > 0 AND (
                       NEW.amount_usdt IS NULL OR NEW.amount_usdt <= 0
                       OR UPPER(COALESCE(NEW.payment_asset, '')) NOT IN ('USDT', 'USDC')
                     )
                     BEGIN
                       SELECT RAISE(ABORT, 'Paid purchases require a positive recorded USDT or USDC amount');
                     END`,
                    updateTriggerErr => {
                      if (updateTriggerErr) console.error('Unable to protect recorded amounts for paid purchases', updateTriggerErr.message);
                    }
                  );
                }
              );
            }
          );
        }
        const [name, type] = additions[index];
        db.run(`ALTER TABLE purchases ADD COLUMN ${name} ${type}`, alterErr => {
          if (alterErr) {
            console.error(`Unable to add purchases.${name}`, alterErr.message);
            return;
          }
          addNextColumn(index + 1);
        });
      };
      addNextColumn(0);
    });

    db.all("PRAGMA table_info(support_ticket_messages)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect support ticket message schema', err.message);
        return;
      }
      if (columns.some(column => column.name === 'author_wallet')) return;
      db.run('ALTER TABLE support_ticket_messages ADD COLUMN author_wallet TEXT', alterErr => {
        if (alterErr) console.error('Unable to add support_ticket_messages.author_wallet', alterErr.message);
      });
    });

    db.all("PRAGMA table_info(accounts)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect accounts schema', err.message);
        return;
      }
      const existing = new Set(columns.map(column => column.name));
      const additions = [
        ['lock_reason', 'TEXT'],
        ['locked_until', 'TEXT'],
        ['permanent_lock', 'INTEGER DEFAULT 0'],
        ['admin_frozen', 'INTEGER DEFAULT 0'],
        ['admin_freeze_reason', 'TEXT'],
        ['risk_day', 'TEXT']
      ].filter(([name]) => !existing.has(name));
      for (const [name, type] of additions) {
        db.run(`ALTER TABLE accounts ADD COLUMN ${name} ${type}`, (alterErr) => {
          if (alterErr) console.error(`Unable to add accounts.${name}`, alterErr.message);
        });
      }
    });

    db.all("PRAGMA table_info(plans)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect plans schema', err.message);
        return;
      }
      if (!columns.some(column => column.name === 'active')) {
        db.run("ALTER TABLE plans ADD COLUMN active INTEGER DEFAULT 1", (alterErr) => {
          if (alterErr) console.error('Unable to add plans.active', alterErr.message);
        });
      }
    });

    db.all("PRAGMA table_info(trades)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect trades schema', err.message);
        return;
      }
      if (!columns.some(column => column.name === 'leverage')) {
        db.run("ALTER TABLE trades ADD COLUMN leverage INTEGER DEFAULT 1", (alterErr) => {
          if (alterErr) console.error('Unable to add trades.leverage', alterErr.message);
        });
      }
      [
        ['order_type', "TEXT NOT NULL DEFAULT 'MARKET'"],
        ['trigger_price', 'REAL'],
        ['market_type', "TEXT NOT NULL DEFAULT 'CRYPTO'"],
        ['lot_size', 'REAL'],
        ['pip_size', 'REAL'],
        ['sl_tp_mode', "TEXT NOT NULL DEFAULT 'price'"],
        ['sl_amount', 'REAL'],
        ['tp_amount', 'REAL']
      ].forEach(([name, type]) => {
        if (!columns.some(column => column.name === name)) {
          db.run(`ALTER TABLE trades ADD COLUMN ${name} ${type}`, alterErr => {
            if (alterErr) console.error(`Unable to add trades.${name}`, alterErr.message);
          });
        }
      });

      db.all("PRAGMA table_info(user_reviews)", (err, columns) => {
        if (err) {
          console.error('Unable to inspect user_reviews schema', err.message);
          return;
        }
        if (columns.some(column => column.name === 'account_id')) {
          const ensureModerationColumn = () => {
            if (columns.some(column => column.name === 'moderation_status')) {
              db.run(
                "UPDATE user_reviews SET moderation_status = 'APPROVED' WHERE published = 1 AND moderation_status = 'PENDING'",
                updateErr => {
                  if (updateErr) console.error('Unable to initialize existing review moderation states', updateErr.message);
                }
              );
              db.run('CREATE INDEX IF NOT EXISTS idx_user_reviews_published_updated ON user_reviews(published, updated_at DESC)');
              db.run('CREATE INDEX IF NOT EXISTS idx_user_reviews_moderation_updated ON user_reviews(moderation_status, updated_at DESC)');
              return;
            }
            db.run("ALTER TABLE user_reviews ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'PENDING'", alterErr => {
              if (alterErr) return console.error('Unable to add user_reviews.moderation_status', alterErr.message);
              db.run("UPDATE user_reviews SET moderation_status = 'APPROVED' WHERE published = 1", updateErr => {
                if (updateErr) console.error('Unable to initialize existing review moderation states', updateErr.message);
                db.run('CREATE INDEX IF NOT EXISTS idx_user_reviews_published_updated ON user_reviews(published, updated_at DESC)');
                db.run('CREATE INDEX IF NOT EXISTS idx_user_reviews_moderation_updated ON user_reviews(moderation_status, updated_at DESC)');
              });
            });
          };
          if (columns.some(column => column.name === 'moderation_status')) return ensureModerationColumn();
          return ensureModerationColumn();
        }

        db.serialize(() => {
          db.run('BEGIN IMMEDIATE', (beginErr) => {
            if (beginErr) {
              console.error('Unable to start user review migration', beginErr.message);
              return;
            }
            const rollback = (label, migrationErr) => db.run('ROLLBACK', () => {
              console.error(label, migrationErr?.message || 'Migration rolled back.');
            });
            db.run('ALTER TABLE user_reviews RENAME TO user_reviews_legacy', (renameErr) => {
              if (renameErr) return rollback('Unable to prepare user review migration', renameErr);
              db.run(`CREATE TABLE user_reviews (
                account_id TEXT PRIMARY KEY,
                wallet_address TEXT NOT NULL,
                username TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                comment TEXT NOT NULL,
                published INTEGER NOT NULL DEFAULT 0,
                moderation_status TEXT NOT NULL DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(account_id) REFERENCES accounts(id)
              )`, (createErr) => {
                if (createErr) return rollback('Unable to create account-linked reviews table', createErr);
                db.run(`INSERT INTO user_reviews (account_id, wallet_address, username, rating, comment, published, moderation_status, created_at, updated_at)
                  SELECT (SELECT a.id FROM accounts a
                          JOIN purchases p ON p.account_id = a.id
                            AND LOWER(p.wallet_address) = LOWER(a.wallet_address)
                          WHERE LOWER(a.wallet_address) = LOWER(old.wallet_address)
                          ORDER BY a.created_at, a.id LIMIT 1),
                         old.wallet_address, old.username, old.rating, old.comment, old.published,
                         CASE WHEN old.published = 1 THEN 'APPROVED' ELSE 'PENDING' END,
                         old.created_at, old.updated_at
                  FROM user_reviews_legacy old
                  WHERE EXISTS (
                    SELECT 1 FROM accounts a
                    JOIN purchases p ON p.account_id = a.id
                      AND LOWER(p.wallet_address) = LOWER(a.wallet_address)
                    WHERE LOWER(a.wallet_address) = LOWER(old.wallet_address)
                  )`,
                (copyErr) => {
                  if (copyErr) return rollback('Unable to migrate existing account reviews', copyErr);
                  db.run('DROP TABLE user_reviews_legacy', (dropErr) => {
                    if (dropErr) return rollback('Unable to finish user review migration', dropErr);
                    db.run('CREATE INDEX IF NOT EXISTS idx_user_reviews_published_updated ON user_reviews(published, updated_at DESC)', (indexErr) => {
                      if (indexErr) return rollback('Unable to index migrated user reviews', indexErr);
                      db.run('CREATE INDEX IF NOT EXISTS idx_user_reviews_moderation_updated ON user_reviews(moderation_status, updated_at DESC)', moderationIndexErr => {
                        if (moderationIndexErr) return rollback('Unable to index review moderation states', moderationIndexErr);
                        db.run('COMMIT', (commitErr) => {
                          if (commitErr) return rollback('Unable to commit user review migration', commitErr);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

    db.all("PRAGMA table_info(withdrawals)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect withdrawals schema', err.message);
        return;
      }
      const existing = new Set(columns.map(column => column.name));
      const additions = [
        ['type', "TEXT DEFAULT 'PROFIT_SPLIT'"],
        ['plan_name', 'TEXT'],
        ['user_ip', 'TEXT'],
        ['user_amount', 'REAL'],
        ['admin_share', 'REAL'],
        ['payout_chain_id', 'INTEGER'],
        ['payout_asset', "TEXT NOT NULL DEFAULT 'USDT'"],
        ['payout_tx_hash', 'TEXT'],
        ['funds_deducted', 'INTEGER'],
        ['approved_at', 'DATETIME'],
        ['paid_at', 'DATETIME']
      ].filter(([name]) => !existing.has(name));
      const addNext = (index) => {
        if (index >= additions.length) {
          db.run(
            `CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_payout_tx_hash
             ON withdrawals(payout_tx_hash) WHERE payout_tx_hash IS NOT NULL`,
            indexErr => {
              if (indexErr) console.error('Unable to create unique withdrawal transaction index', indexErr.message);
            }
          );
          return db.run(
            `UPDATE withdrawals SET funds_deducted = 1
             WHERE status = 'PENDING' AND funds_deducted IS NULL`,
            (updateErr) => {
              if (updateErr) console.error('Unable to migrate legacy pending withdrawal balances', updateErr.message);
            }
          );
        }
        const [name, type] = additions[index];
        db.run(`ALTER TABLE withdrawals ADD COLUMN ${name} ${type}`, (alterErr) => {
          if (alterErr) {
            console.error(`Unable to add withdrawals.${name}`, alterErr.message);
            return addNext(index + 1);
          }
          addNext(index + 1);
        });
      }
      addNext(0);
    });

    db.all("PRAGMA table_info(referral_withdrawals)", (err, columns) => {
      if (err) {
        console.error('Unable to inspect referral_withdrawals schema', err.message);
        return;
      }
      const existing = new Set(columns.map(column => column.name));
      const additions = [
        ['paid_at', 'DATETIME'],
        ['payout_chain_id', 'INTEGER'],
        ['payout_asset', "TEXT NOT NULL DEFAULT 'USDT'"],
        ['payout_tx_hash', 'TEXT']
      ].filter(([name]) => !existing.has(name));
      const addNext = index => {
        if (index >= additions.length) {
          return db.run(
            `CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_withdrawals_payout_tx_hash
             ON referral_withdrawals(payout_tx_hash) WHERE payout_tx_hash IS NOT NULL`,
            indexErr => {
              if (indexErr) console.error('Unable to create unique referral withdrawal transaction index', indexErr.message);
            }
          );
        }
        const [name, type] = additions[index];
        db.run(`ALTER TABLE referral_withdrawals ADD COLUMN ${name} ${type}`, alterErr => {
          if (alterErr) {
            console.error(`Unable to add referral_withdrawals.${name}`, alterErr.message);
            return addNext(index + 1);
          }
          addNext(index + 1);
        });
      };
      addNext(0);
    });
  });
}

module.exports = db;
