const defaultPageTitle = document.title;
const LIVE_CHART_THEME = Object.freeze({
    background: '#090d13',
    text: '#9ca3af',
    grid: 'rgba(148, 163, 184, 0.08)',
    border: 'rgba(148, 163, 184, 0.16)',
    up: '#72f0c3',
    down: '#ff638e'
});
const CHART_AXIS_TIME_FORMATTERS = Object.freeze({
    year: new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }),
    month: new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', year: '2-digit' }),
    day: new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }),
    time: new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    })
});
const CHART_INDICATOR_DEFINITIONS = Object.freeze({
    VOLUME: { label: 'Volume', parameters: [] },
    SMA: { label: 'Simple moving average', parameters: [['period', 'Period', 20, 2, 200, 1]] },
    EMA: { label: 'Exponential moving average', parameters: [['period', 'Period', 50, 2, 200, 1]] },
    BOLLINGER: { label: 'Bollinger Bands', parameters: [['period', 'Period', 20, 2, 200, 1], ['deviation', 'Std dev', 2, 0.5, 4, 0.1]] },
    VWAP: { label: 'Session VWAP', parameters: [] },
    RSI: { label: 'RSI', parameters: [['period', 'Period', 14, 2, 100, 1]] },
    MACD: { label: 'MACD', parameters: [['fast', 'Fast', 12, 2, 100, 1], ['slow', 'Slow', 26, 3, 200, 1], ['signal', 'Signal', 9, 2, 100, 1]] },
    STOCHASTIC: { label: 'Stochastic', parameters: [['k', '%K', 14, 2, 100, 1], ['d', '%D', 3, 2, 50, 1]] },
    ATR: { label: 'ATR', parameters: [['period', 'Period', 14, 2, 100, 1]] },
    ADX: { label: 'ADX', parameters: [['period', 'Period', 14, 2, 100, 1]] },
    CCI: { label: 'CCI', parameters: [['period', 'Period', 20, 2, 100, 1]] },
    OBV: { label: 'On-balance volume', parameters: [] }
});
let connectedWallet = null;
        let connectedWalletType = 'EVM';
        let connectedSolanaProviderName = null;
        let availableWallets = [];
        const solanaProviderListeners = new WeakSet();
        let userAccounts = [];
        const accountProgressMetrics = new Map();
        let showPermanentlyLockedPortfolioAccounts = false;
        let accountPerformanceData = { overall: null, accounts: [] };
        let accountPerformanceRequest = null;
        let accountPerformanceRequestWallet = null;
        let selectedAccountsPerformanceTab = 'overall';
        let accountHistoryWallet = null;
        let accountPurchases = [];
        let accountWithdrawals = [];
        let accountStatementOwner = null;
        let withdrawalAvailability = [];
        let selectedWithdrawalAccountId = null;
        let userReviewAccounts = [];
        let selectedAccountId = null;
        let activeAccount = null;
                let liveMarketChart = null;
                let liveMarketCandleSeries = null;
        let liveMarketResizeObserver = null;
        const liveMarketResizeTargets = new Map();
        let liveMarketPaneCharts = [];
        let liveMarketRangeSyncing = false;
        let liveMarketSyncedCharts = new WeakSet();
        let liveMarketChartPair = null;
        let liveMarketChartStatus = null;
        let liveMarketLastCandle = null;
        let liveMarketFirstCandleTime = null;
        let liveMarketCandles = [];
        let liveMarketIndicatorSeries = {};
        let activeChartIndicators = [];
        let nextChartIndicatorId = 1;
        let activeChartDrawingTool = null;
        let liveMarketDrawings = [];
        let liveMarketDrawingAnchor = null;
        let liveMarketDrawingSvg = null;
        let liveMarketDrawingHost = null;
        let liveMarketDrawingsStorageKey = null;
        let liveMarketTimeframeSeconds = 60;
        let liveMarketChartGeneration = 0;
        let liveMarketTradeLines = [];
        let liveMarketTradeMarkers = [];
        let activePromoCode = null;
        let battlePassDiscountBonusPct = 0;
        let activePromoDetails = null;
        let standardDiscountPct = 90;
        let plansData = [];
        let planLoadAttempts = 0;
        let marketDataStream = null;
        let marketDataReconnectTimer = null;
        let marketTickerItems = new Map();
        let marketChatSymbol = null;
        let marketChatGeneration = 0;
        let marketChatRefreshInterval = null;
        let marketChatFeedback = '';
        let marketChatFeedbackIsError = false;
        let marketChatSending = false;
        const marketChatWindows = new Map();
        let autoSyncInterval = null;
        let currentLivePrice = 0;
        let displayedOpenTrades = [];
        let tradeExecutionInProgress = false;
        const accountCalendarMonths = new Map();
        const accountJournalDays = new Map();
        const accountJournalDrafts = new Map();
        let userHasEditedPrice = false;
        let availableCommissionBalance = 0;
        let currentLeaderboardMode = 'DAILY';
        let currentUserProfile = null;
        let adminUserSearchQuery = '';
        let adminTickets = [];
        let adminTicketFilter = 'UNREAD';
        let adminSelectedTicketId = null;
        let tradeCopyGroups = [];
        let tradeCopyGroupsLoadedWallet = null;
        let tradeCopyGroupsPromise = null;
        let tradeCopyWizard = null;
        let hidePermanentlyLockedCopyAccounts = true;
        let walletSessionToken = null;
        let walletSessionOwner = null;
        let walletSessionExpiresAt = 0;
        let walletSessionPromise = null;
        let walletSessionGeneration = 0;
        let walletSoftLocked = false;
        let walletSecurityPollTimer = null;
        let adminOperationsPollTimer = null;
        let adminOperationsPollInFlight = false;
        let adminOperationsLoaded = false;
        let dashboardInitialized = false;
        let dashboardAuthenticated = false;
        let disclaimerGateMode = 'login';
        let pendingPurchaseDisclaimer = null;
        let battlePassProfile = null;
        let battlePassTasks = [];
        let battlePassLevels = [];
        let battlePassActiveTab = 'missions';
        let adminBattlePassTasks = [];
        let battlePassPacks = [];
        let battlePassVault = { rewards: [], certificates: [], promotional_packs: [] };
        let lastPackReveal = null;
        let battlePassSelectedPackId = null;
        let adminBattlePassPacks = [];
        let adminBattlePassRewards = [];
        let adminBattlePassPlans = [];
        let adminBattlePassPromotionRecipients = new Map();
        let adminBattlePassPromotionRequestKey = null;
                let marketsData = [];
                let cryptoMarketsData = [];
                let forexMarketsData = [];
                let tradingMarketMode = 'CRYPTO';
                const marketQuotesBySymbol = new Map();
                let forexChartStats = null;
                let forexChartStatsSymbol = null;
                let liveMarketChartHistoryFailed = false;
                let liveMarketChartUsesNewYorkTime = false;
                const closingTradeIds = new Set();
        let maintenanceStatuses = {};
        let maintenanceMessage = '';
        let currentWalletIsAdmin = false;
        let currentWalletIsSupport = false;
        const maintenanceViewPages = {
            tradeView: 'trade',
            accountsView: 'accounts',
            copyTradingView: 'copytrading',
            leaderboardView: 'leaderboard',
            blastrrPassView: 'blastrrpass',
            profileView: 'profile',
            buyView: 'plans'
        };
        const maintenancePageLabels = {
            home: 'Homepage',
            trade: 'Trading Terminal',
            accounts: 'My Accounts',
            copytrading: 'Copy Trading',
            leaderboard: 'Leaderboard',
            blastrrpass: 'BlastrrPass',
            profile: 'Profile & Promos',
            plans: 'Buy Plans',
            faq: 'FAQ',
            docs: 'Docs'
        };
        
        const TREASURY_WALLET = "0x9c19edeba86b214db5b3d21da9416d5e5568365b";
        const SOLANA_TREASURY_WALLET = 'A3AVrbzCYzqKEkBR7pDQGYgnAbmBF9qNMQDX84QpuRZx';
        const SOLANA_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        const SOLANA_ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        const SOLANA_TOKENS = {
            USDT: { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
            USDC: { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 }
        };
        const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
        const DISCLAIMER_VERSION = '2026-11-17-v2';

        function escapeHTML(value) {
            return String(value ?? '').replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        async function readApiJson(response, endpoint) {
            const body = await response.text();
            try {
                return JSON.parse(body);
            } catch {
                const isHtml = body.trimStart().startsWith('<');
                const detail = isHtml && response.status === 502
                    ? 'The API server is unavailable; the hosting proxy could not reach the Blastrr backend. Check the backend process and deployment logs.'
                    : isHtml
                        ? 'The server returned an HTML page instead of API JSON. Check that this site routes /api requests to the running Blastrr API server.'
                        : 'The server returned an invalid API response.';
                throw new Error(`${endpoint} failed (HTTP ${response.status}). ${detail}`);
            }
        }

        function setTradeFeedback(message) {
            const feedback = document.getElementById('trade-feedback');
            if (feedback) feedback.textContent = message || '';
        }

        async function readAdminApiResponse(response, endpoint) {
            const body = await response.text();
            try {
                return JSON.parse(body);
            } catch {
                const detail = body.trimStart().startsWith('<')
                    ? 'The server returned an HTML page instead of API JSON. Restart/deploy the latest server code so the admin API routes are available.'
                    : 'The server returned an invalid API response.';
                throw new Error(`${endpoint} failed (HTTP ${response.status}). ${detail}`);
            }
        }

        function renderForexChartStats(market, quote) {
            const stats = forexChartStatsSymbol === market.symbol ? forexChartStats : null;
            const price = Number(quote.price);
            const referencePrice = Number(stats?.referencePrice);
            const highPrice = Number(stats?.highPrice);
            const lowPrice = Number(stats?.lowPrice);
            renderChartMarketStats({
                bidPrice: quote.bid,
                askPrice: quote.ask,
                lastPrice: price,
                priceChangePercent: Number.isFinite(referencePrice) && referencePrice > 0
                    ? ((price / referencePrice) - 1) * 100
                    : undefined,
                high24h: Number.isFinite(highPrice) && highPrice > 0 ? Math.max(highPrice, price) : price,
                low24h: Number.isFinite(lowPrice) && lowPrice > 0 ? Math.min(lowPrice, price) : price
            });
        }

        const SUPPORTED_EVM_CHAINS = {
            1: {
                name: "Ethereum Mainnet", chainIdHex: "0x1",
                tokens: {
                    USDT: { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
                    USDC: { address: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 }
                }
            },
            8453: {
                name: "Base", chainIdHex: "0x2105",
                tokens: {
                    USDT: { address: "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2", decimals: 6 },
                    USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 }
                }
            },
            137: {
                name: "Polygon PoS", chainIdHex: "0x89",
                tokens: {
                    USDT: { address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", decimals: 6 },
                    USDC: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 }
                }
            },
            43114: {
                name: "Avalanche C-Chain", chainIdHex: "0xa86a",
                tokens: {
                    USDT: { address: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", decimals: 6 },
                    USDC: { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 }
                }
            },
            56: {
                name: "BNB Smart Chain",
                chainIdHex: "0x38",
                rpcUrl: "https://bsc-dataseed.binance.org",
                nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                tokens: {
                    USDT: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 }
                }
            },
            448000: {
                name: "NullNet Private EVM",
                chainIdHex: "0x6d600",
                rpcUrl: "https://rpc.lunul.org",
                nativeCurrency: { name: "LUN", symbol: "LUN", decimals: 18 },
                tokens: {
                    USDT: { address: "0x7ec3659A8225ED474D7c662126616aE08545C29b", decimals: 18 }
                }
            }
        };

        function updatePaymentAssetOptions() {
            const networkSelect = document.getElementById('payment-chain-select');
            const assetSelect = document.getElementById('payment-asset-select');
            const solanaWalletGroup = document.getElementById('solana-wallet-group');
            if (!networkSelect || !assetSelect) return;
            const isSolana = networkSelect.value === '101';
            const tokens = isSolana ? SOLANA_TOKENS : SUPPORTED_EVM_CHAINS[Number(networkSelect.value)]?.tokens || {};
            const selectedAsset = assetSelect.value;
            assetSelect.innerHTML = Object.keys(tokens)
                .map(symbol => `<option value="${symbol}">${symbol}</option>`)
                .join('');
            assetSelect.value = tokens[selectedAsset] ? selectedAsset : Object.keys(tokens)[0] || '';
            if (solanaWalletGroup) solanaWalletGroup.hidden = !isSolana;
        }

        function getSolanaWalletProvider(walletName) {
            if (walletName === 'solflare') {
                return window.solflare?.isSolflare ? window.solflare : null;
            }
            return window.phantom?.solana?.isPhantom
                ? window.phantom.solana
                : window.solana?.isPhantom
                    ? window.solana
                    : null;
        }

        function addAvailableWallet(wallet) {
            const key = wallet.type === 'EVM' ? wallet.address.toLowerCase() : wallet.address;
            const existingIndex = availableWallets.findIndex(item =>
                (item.type === 'EVM' ? item.address.toLowerCase() : item.address) === key
            );
            if (existingIndex >= 0) availableWallets[existingIndex] = wallet;
            else availableWallets.push(wallet);
            updateWalletDropdown();
        }

        function updateWalletConnectionControls() {
            const loginType = document.getElementById('wallet-login-type')?.value || 'EVM';
            const loginSolanaGroup = document.getElementById('wallet-login-solana-group');
            const addType = document.getElementById('wallet-add-type')?.value || 'EVM';
            const addSolanaGroup = document.getElementById('wallet-add-solana-group');
            if (loginSolanaGroup) loginSolanaGroup.hidden = loginType !== 'SOLANA';
            if (addSolanaGroup) addSolanaGroup.hidden = addType !== 'SOLANA';
        }

        function updatePayoutOptions(prefix) {
            const networkSelect = document.getElementById(`${prefix}-payout-network`);
            const assetSelect = document.getElementById(`${prefix}-payout-asset`);
            if (!networkSelect || !assetSelect) return;
            const isSolana = connectedWalletType === 'SOLANA';
            const networks = isSolana
                ? [{ id: 101, name: 'Solana Mainnet', tokens: SOLANA_TOKENS }]
                : Object.entries(SUPPORTED_EVM_CHAINS).map(([id, config]) => ({
                    id: Number(id),
                    name: config.name,
                    tokens: config.tokens
                }));
            const selectedNetwork = Number(networkSelect.value);
            networkSelect.replaceChildren(...networks.map(network =>
                new Option(network.name, String(network.id))
            ));
            networkSelect.value = networks.some(network => network.id === selectedNetwork)
                ? String(selectedNetwork)
                : String(networks[0]?.id || '');
            const activeNetwork = networks.find(network => String(network.id) === networkSelect.value);
            const selectedAsset = assetSelect.value;
            assetSelect.replaceChildren(...Object.keys(activeNetwork?.tokens || {}).map(symbol =>
                new Option(symbol, symbol)
            ));
            assetSelect.value = activeNetwork?.tokens?.[selectedAsset] ? selectedAsset : assetSelect.options[0]?.value || '';
            networkSelect.disabled = isSolana;
        }

        function updateWalletNetworkOptions() {
            const networkSelect = document.getElementById('payment-chain-select');
            if (!networkSelect) return;
            for (const option of networkSelect.options) {
                const isSolanaOption = option.value === '101';
                option.hidden = connectedWalletType === 'SOLANA' ? !isSolanaOption : isSolanaOption;
                option.disabled = option.hidden;
            }
            const expectedNetwork = connectedWalletType === 'SOLANA' ? '101' : '1';
            if (networkSelect.selectedOptions[0]?.disabled) networkSelect.value = expectedNetwork;
            updatePaymentAssetOptions();
        }

        function getSelectedPayoutOptions(prefix) {
            const payoutChainId = Number(document.getElementById(`${prefix}-payout-network`)?.value);
            const payoutAsset = document.getElementById(`${prefix}-payout-asset`)?.value || '';
            const supportedTokens = payoutChainId === 101
                ? (connectedWalletType === 'SOLANA' ? SOLANA_TOKENS : {})
                : (connectedWalletType === 'EVM' ? SUPPORTED_EVM_CHAINS[payoutChainId]?.tokens || {} : {});
            if (!supportedTokens[payoutAsset]) {
                throw new Error('Choose a supported payout network and asset for the active wallet.');
            }
            return { payout_chain_id: payoutChainId, payout_asset: payoutAsset };
        }

        function getConnectedWalletOwnerKey() {
            if (!connectedWallet) return null;
            return connectedWalletType === 'SOLANA'
                ? `solana:${connectedWallet}`
                : connectedWallet.toLowerCase();
        }

        function toTokenUnits(amount, decimals) {
            const match = String(amount).match(/^(\d+)(?:\.(\d+))?$/);
            if (!match || (match[2]?.length || 0) > decimals) {
                throw new Error('Invalid payment amount for token precision.');
            }
            const whole = BigInt(match[1]) * (10n ** BigInt(decimals));
            const fraction = BigInt((match[2] || '').padEnd(decimals, '0') || '0');
            return whole + fraction;
        }

        async function ensurePaymentNetwork(provider, chainConfig) {
            const targetChainId = BigInt(chainConfig.chainIdHex);
            const currentChainId = BigInt(await provider.request({ method: 'eth_chainId' }));

            if (currentChainId !== targetChainId) {
                try {
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: chainConfig.chainIdHex }]
                    });
                } catch (switchError) {
                    if (switchError.code !== 4902 || !chainConfig.rpcUrl || !chainConfig.nativeCurrency) {
                        throw switchError;
                    }
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: chainConfig.chainIdHex,
                            chainName: chainConfig.name,
                            rpcUrls: [chainConfig.rpcUrl],
                            nativeCurrency: chainConfig.nativeCurrency
                        }]
                    });
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: chainConfig.chainIdHex }]
                    });
                }
            }

            const activeChainId = BigInt(await provider.request({ method: 'eth_chainId' }));
            if (activeChainId !== targetChainId) {
                throw new Error(`Wallet is connected to chain ${activeChainId.toString()}, not ${targetChainId.toString()}.`);
            }
        }

        window.addEventListener('DOMContentLoaded', async () => {
            await loadMaintenanceStatus();
            setInterval(loadMaintenanceStatus, 30000);
            updatePaymentAssetOptions();
            document.getElementById('payment-chain-select')?.addEventListener('change', updatePaymentAssetOptions);
            updateWalletConnectionControls();
            updatePayoutOptions('account');
            updatePayoutOptions('referral');
            document.getElementById('wallet-login-type')?.addEventListener('change', updateWalletConnectionControls);
            document.getElementById('wallet-add-type')?.addEventListener('change', updateWalletConnectionControls);
            document.getElementById('account-payout-network')?.addEventListener('change', () => updatePayoutOptions('account'));
            document.getElementById('account-payout-network')?.addEventListener('change', updateWithdrawalPayoutSummary);
            document.getElementById('account-payout-asset')?.addEventListener('change', updateWithdrawalPayoutSummary);
            document.getElementById('referral-payout-network')?.addEventListener('change', () => updatePayoutOptions('referral'));
            document.querySelector('.account-main-tabs')?.addEventListener('click', event => {
                const tab = event.target.closest('[data-accounts-section-tab]');
                if (tab) switchAccountsSection(tab.dataset.accountsSectionTab);
            });
            document.getElementById('refresh-account-withdrawals')?.addEventListener('click', loadAccountWithdrawalHistory);
            document.getElementById('refresh-account-purchases')?.addEventListener('click', loadAccountPurchaseHistory);
            document.getElementById('download-account-purchase-statement')?.addEventListener('click', downloadAccountPurchaseStatement);
            document.getElementById('download-account-withdrawal-statement')?.addEventListener('click', downloadAccountWithdrawalStatement);
            document.getElementById('open-withdrawal-request')?.addEventListener('click', () => requestWithdrawal());
            document.getElementById('close-withdrawal-modal')?.addEventListener('click', closeWithdrawalRequest);
            document.getElementById('withdrawal-request-account-list')?.addEventListener('click', event => {
                const option = event.target.closest('[data-withdrawal-account]');
                if (option && !option.disabled) selectWithdrawalAccount(option.dataset.withdrawalAccount);
            });
            document.getElementById('withdrawal-request-form')?.addEventListener('submit', submitWithdrawalRequest);
            document.getElementById('withdrawal-request-amount')?.addEventListener('input', updateWithdrawalAmountSummary);
            document.getElementById('withdrawal-request-modal')?.addEventListener('click', event => {
                if (event.target === event.currentTarget) closeWithdrawalRequest();
            });
            const disclaimerScrollArea = document.getElementById('disclaimer-scroll-area');
            disclaimerScrollArea?.addEventListener('scroll', updateDisclaimerScrollState);
            document.getElementById('disclaimer-accept-terms')?.addEventListener('change', updateDisclaimerContinueState);
            document.getElementById('disclaimer-simulated-funds')?.addEventListener('change', updateDisclaimerContinueState);
            document.getElementById('disclaimer-continue-button')?.addEventListener('click', acceptDisclaimer);
            document.getElementById('disclaimer-cancel-purchase')?.addEventListener('click', () => resolvePurchaseDisclaimer(false));
            document.getElementById('market-chat-form')?.addEventListener('submit', postMarketChatMessage);
            document.getElementById('market-chat-popout')?.addEventListener('click', openMarketChatInNewTab);
            document.getElementById('withdrawal-certificates-list')?.addEventListener('click', downloadWithdrawalCertificate);
            document.getElementById('refresh-withdrawal-certificates')?.addEventListener('click', loadWithdrawalCertificates);
            document.getElementById('leaderboard-exclude-self')?.addEventListener('change', saveLeaderboardPreference);
            document.getElementById('accounts-performance-tabs')?.addEventListener('click', event => {
                const tab = event.target.closest('[data-performance-account]');
                if (tab) selectAccountsPerformanceTab(tab.dataset.performanceAccount);
            });
            document.getElementById('chart-timeframe')?.addEventListener('change', reloadLiveMarketChart);
            document.getElementById('chart-drawing-toolbar')?.addEventListener('click', event => {
                const toolButton = event.target.closest('[data-chart-drawing-tool]');
                if (toolButton) {
                    selectChartDrawingTool(toolButton.dataset.chartDrawingTool);
                    return;
                }
                const actionButton = event.target.closest('[data-chart-drawing-action]');
                if (actionButton?.dataset.chartDrawingAction === 'undo') undoLastChartDrawing();
                if (actionButton?.dataset.chartDrawingAction === 'clear') clearLiveChartDrawings();
                if (actionButton?.dataset.chartDrawingAction === 'live') {
                    selectChartDrawingTool('select');
                    liveMarketChart?.timeScale().scrollToRealTime();
                    chartDrawingStatus('Showing the latest live data.');
                }
            });
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && activeChartDrawingTool) selectChartDrawingTool('select');
            });
            document.getElementById('chart-indicator-add')?.addEventListener('click', addChartIndicator);
            document.getElementById('chart-indicator-select')?.addEventListener('change', renderActiveChartIndicators);
            document.getElementById('chart-active-indicators')?.addEventListener('click', event => {
                const button = event.target.closest('[data-remove-chart-indicator]');
                if (!button) return;
                activeChartIndicators = activeChartIndicators.filter(indicator => indicator.id !== button.dataset.removeChartIndicator);
                renderActiveChartIndicators();
                refreshChartIndicators();
            });
            document.getElementById('chart-active-indicators')?.addEventListener('change', event => {
                const input = event.target.closest('[data-indicator-param]');
                if (!input) return;
                const indicator = activeChartIndicators.find(item => item.id === input.dataset.indicatorId);
                const definition = CHART_INDICATOR_DEFINITIONS[indicator?.type];
                const parameter = definition?.parameters.find(item => item[0] === input.dataset.indicatorParam);
                const value = Number(input.value);
                if (!indicator || !parameter || !Number.isFinite(value)) return;
                indicator.params[parameter[0]] = Math.min(parameter[4], Math.max(parameter[3], value));
                if (indicator.type === 'MACD' && indicator.params.fast >= indicator.params.slow) {
                    indicator.params.slow = Math.min(200, indicator.params.fast + 1);
                }
                renderActiveChartIndicators();
                refreshChartIndicators();
            });
            window.addEventListener('message', event => {
                if (event.origin !== window.location.origin || event.data?.type !== 'BLASTRR_CHAT_READY') return;
                const child = marketChatWindows.get(event.source);
                if (!child || child.closed) return;
                child.postMessage({
                    type: 'BLASTRR_CHAT_SESSION',
                    wallet: connectedWallet,
                    token: walletSessionToken,
                    expiresAt: walletSessionExpiresAt
                }, window.location.origin);
                marketChatWindows.delete(event.source);
            });
            marketChatRefreshInterval = setInterval(() => {
                if (!document.hidden && marketChatSymbol) loadMarketChat(marketChatSymbol);
            }, 10000);
            document.getElementById('wallet-menu-trigger')?.addEventListener('click', toggleWalletMenu);
            document.addEventListener('click', event => {
                if (!event.target.closest('#wallet-menu')) closeWalletMenu();
            });
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape') closeWalletMenu();
            });

            const provider = getProvider();
            if (provider?.on) {
                provider.on('accountsChanged', (accounts) => {
                    if (connectedWalletType !== 'EVM') return;
                    if (accounts && accounts.length > 0) {
                        availableWallets = [
                            ...availableWallets.filter(item => item.type !== 'EVM'),
                            ...accounts.map(address => ({ address, type: 'EVM' }))
                        ];
                        updateWalletDropdown();
                        onWalletSwitched(accounts[0], 'EVM');
                    } else {
                        disconnectWallet();
                    }
                });
            }
        });

        async function loadMarketConfig() {
            const [cryptoResponse, forexResponse] = await Promise.all([
                fetch('/config/markets.json'),
                fetch('/config/forexMarkets.json')
            ]);
            if (!cryptoResponse.ok) throw new Error(`Crypto market configuration request failed (${cryptoResponse.status}).`);
            if (!forexResponse.ok) throw new Error(`Forex market configuration request failed (${forexResponse.status}).`);
            cryptoMarketsData = await cryptoResponse.json();
            forexMarketsData = await forexResponse.json();
            if (!Array.isArray(cryptoMarketsData) || cryptoMarketsData.length === 0 ||
                !Array.isArray(forexMarketsData) || forexMarketsData.length === 0) {
                throw new Error('Market configuration is empty or invalid.');
            }

            marketsData = cryptoMarketsData;
            initializeMarketPriceTicker();
            renderTradeMarkets('CRYPTO');
        }

        function renderTradeMarkets(mode, preferredSymbol = null) {
            tradingMarketMode = mode === 'FOREX' ? 'FOREX' : 'CRYPTO';
            marketsData = tradingMarketMode === 'FOREX' ? forexMarketsData : cryptoMarketsData;
            const select = document.getElementById('order-symbol');
            if (!select) return;
            select.replaceChildren();
            const groups = new Map();
            for (const market of marketsData) {
                if (market.enabled === false || !market.label || !market.symbol || !market.pair || !market.type) continue;
                const groupName = market.group || 'Markets';
                if (!groups.has(groupName)) {
                    const group = document.createElement('optgroup');
                    group.label = groupName;
                    groups.set(groupName, group);
                    select.append(group);
                }
                const option = document.createElement('option');
                option.value = market.symbol;
                option.textContent = market.label;
                option.dataset.pair = market.pair;
                option.dataset.type = market.type;
                option.dataset.source = market.source;
                option.dataset.assetClass = market.asset_class || 'CRYPTO';
                groups.get(groupName).append(option);
            }

            select.disabled = false;
            const defaultMarket = marketsData.find(market => market.symbol === preferredSymbol) ||
                (tradingMarketMode === 'CRYPTO'
                    ? marketsData.find(market => market.pair === 'NDX100USDT') || marketsData[0]
                    : marketsData[0]);
            select.value = defaultMarket.symbol;
            document.querySelectorAll('[data-trade-market-mode]').forEach(button => {
                button.classList.toggle('active', button.dataset.tradeMarketMode === tradingMarketMode);
            });
            updateForexTicketLabels();
            onSymbolChanged(defaultMarket.symbol);
        }

        function findConfiguredMarket(symbol) {
            return [...cryptoMarketsData, ...forexMarketsData].find(market => market.symbol === symbol);
        }

        function switchTradingMarketMode(mode) {
            if (!dashboardAuthenticated || !walletSessionToken ||
                walletSessionOwner !== getConnectedWalletOwnerKey() ||
                walletSessionExpiresAt <= Date.now()) {
                lockDashboard();
                return;
            }
            if (mode === tradingMarketMode) {
                switchView('tradeView');
                return;
            }
            renderTradeMarkets(mode);
            switchView('tradeView');
        }

        function toggleMobileMenu(forceClose = false) {
            const nav = document.getElementById('nav-menu');
            const hamburger = document.getElementById('hamburger-icon');
            if (!nav) return;
            if (forceClose === true) {
                nav.classList.remove('mobile-open');
                if (hamburger) {
                    hamburger.classList.remove('menu-open');
                    hamburger.setAttribute('aria-label', 'Open navigation menu');
                    hamburger.setAttribute('aria-expanded', 'false');
                }
                return;
            }
            nav.classList.toggle('mobile-open');
            if (hamburger) {
                const isOpen = nav.classList.contains('mobile-open');
                hamburger.classList.toggle('menu-open', isOpen);
                hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
                hamburger.setAttribute('aria-expanded', String(isOpen));
            }
        }

        function disposeLiveMarketChart() {
            liveMarketChartGeneration += 1;
            liveMarketResizeObserver?.disconnect();
            liveMarketResizeObserver = null;
            liveMarketResizeTargets.clear();
            liveMarketPaneCharts.forEach(pane => pane.chart.remove());
            liveMarketPaneCharts = [];
            liveMarketSyncedCharts = new WeakSet();
            liveMarketRangeSyncing = false;
            liveMarketChart?.remove();
            liveMarketChart = null;
            liveMarketCandleSeries = null;
            liveMarketChartPair = null;
            liveMarketChartUsesNewYorkTime = false;
            liveMarketChartStatus = null;
            liveMarketLastCandle = null;
            liveMarketFirstCandleTime = null;
            liveMarketCandles = [];
            liveMarketChartHistoryFailed = false;
            liveMarketIndicatorSeries = {};
            liveMarketTradeLines = [];
            liveMarketTradeMarkers = [];
            liveMarketDrawings = [];
            liveMarketDrawingAnchor = null;
            liveMarketDrawingSvg = null;
            liveMarketDrawingHost = null;
            liveMarketDrawingsStorageKey = null;
        }

        function defaultChartIndicatorParams(type) {
            const params = {};
            for (const [key, , value] of CHART_INDICATOR_DEFINITIONS[type]?.parameters || []) {
                params[key] = value;
            }
            return params;
        }

        function addChartIndicator() {
            const select = document.getElementById('chart-indicator-select');
            const type = select?.value;
            if (!type || !CHART_INDICATOR_DEFINITIONS[type]) return;
            activeChartIndicators.push({
                id: `${type}-${nextChartIndicatorId++}`,
                type,
                params: defaultChartIndicatorParams(type)
            });
            renderActiveChartIndicators();
            refreshChartIndicators();
        }

        function renderActiveChartIndicators() {
            const container = document.getElementById('chart-active-indicators');
            const select = document.getElementById('chart-indicator-select');
            const addButton = document.getElementById('chart-indicator-add');
            if (!container || !select || !addButton) return;
            const selectedType = select.value;
            addButton.disabled = !selectedType || !CHART_INDICATOR_DEFINITIONS[selectedType];
            container.replaceChildren();

            for (const indicator of activeChartIndicators) {
                const definition = CHART_INDICATOR_DEFINITIONS[indicator.type];
                if (!definition) continue;
                const item = document.createElement('div');
                item.className = 'chart-indicator-item';
                const name = document.createElement('strong');
                name.textContent = definition.label;
                item.append(name);

                for (const [key, label, defaultValue, min, max, step] of definition.parameters) {
                    const group = document.createElement('label');
                    group.className = 'chart-indicator-param-group';
                    group.textContent = label;
                    const input = document.createElement('input');
                    input.className = 'chart-indicator-param';
                    input.type = 'number';
                    input.min = String(min);
                    input.max = String(max);
                    input.step = String(step);
                    input.value = String(indicator.params[key] ?? defaultValue);
                    input.setAttribute('aria-label', `${definition.label} ${label}`);
                    input.dataset.indicatorId = indicator.id;
                    input.dataset.indicatorParam = key;
                    group.append(input);
                    item.append(group);
                }

                const remove = document.createElement('button');
                remove.className = 'chart-indicator-remove';
                remove.type = 'button';
                remove.textContent = '×';
                remove.title = `Remove ${definition.label}`;
                remove.setAttribute('aria-label', `Remove ${definition.label}`);
                remove.dataset.removeChartIndicator = indicator.id;
                item.append(remove);
                container.append(item);
            }
        }

        function chartDrawingStatus(message) {
            const status = document.getElementById('chart-drawing-status');
            if (status) status.textContent = message;
        }

        function selectChartDrawingTool(tool) {
            const supportedTools = ['trendline', 'horizontal', 'vertical', 'rectangle', 'measure', 'fib'];
            activeChartDrawingTool = supportedTools.includes(tool) ? tool : null;
            liveMarketDrawingAnchor = null;
            liveMarketDrawingHost?.classList.toggle('is-drawing', Boolean(activeChartDrawingTool));
            document.querySelectorAll('[data-chart-drawing-tool]').forEach(button => {
                const isActive = activeChartDrawingTool
                    ? button.dataset.chartDrawingTool === activeChartDrawingTool
                    : button.dataset.chartDrawingTool === 'select';
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
            const instructions = {
                trendline: 'Click two points to draw a trendline.',
                horizontal: 'Click a price level to place a horizontal line.',
                vertical: 'Click a time to place a vertical line.',
                rectangle: 'Click two opposite corners to draw a rectangle.',
                measure: 'Click two points to measure price and percentage change.',
                fib: 'Click a swing high/low and an endpoint to draw Fibonacci retracements.'
            };
            chartDrawingStatus(activeChartDrawingTool
                ? instructions[activeChartDrawingTool]
                : 'Drag chart to pan; drag the price axis to scale. Drawings save in this browser.');
            renderLiveChartDrawings();
        }

        function undoLastChartDrawing() {
            if (liveMarketDrawingAnchor) {
                liveMarketDrawingAnchor = null;
                chartDrawingStatus('Pending drawing cancelled.');
                renderLiveChartDrawings();
                return;
            }
            if (!liveMarketDrawings.length) return;
            liveMarketDrawings.pop();
            saveLiveChartDrawings();
            renderLiveChartDrawings();
            chartDrawingStatus('Last drawing removed.');
        }

        function clearLiveChartDrawings() {
            if (!liveMarketDrawings.length && !liveMarketDrawingAnchor) return;
            if (!window.confirm('Clear drawings for this market and timeframe?')) return;
            liveMarketDrawings = [];
            liveMarketDrawingAnchor = null;
            saveLiveChartDrawings();
            renderLiveChartDrawings();
            chartDrawingStatus('Drawings cleared for this market and timeframe.');
        }

        function chartDrawingTimeToSeconds(time) {
            if (typeof time === 'number' && Number.isFinite(time)) return time;
            if (typeof time === 'string') {
                const parsed = Date.parse(time);
                return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
            }
            if (time && Number.isFinite(time.year) && Number.isFinite(time.month) && Number.isFinite(time.day)) {
                return Date.UTC(time.year, time.month - 1, time.day) / 1000;
            }
            return null;
        }

        function chartDrawingStorageKey(source, pair, timeframe) {
            const wallet = getConnectedWalletOwnerKey() || 'guest';
            return `blastrr.chart-drawings.v1:${wallet}:${source}:${pair}:${timeframe}`;
        }

        function loadLiveChartDrawings() {
            if (!liveMarketDrawingsStorageKey) return;
            try {
                const stored = JSON.parse(window.localStorage.getItem(liveMarketDrawingsStorageKey) || '[]');
                const types = new Set(['trendline', 'horizontal', 'vertical', 'rectangle', 'measure', 'fib']);
                liveMarketDrawings = Array.isArray(stored) ? stored.filter(drawing => {
                    if (!drawing || !types.has(drawing.type) || !Array.isArray(drawing.points)) return false;
                    const expectedPoints = ['horizontal', 'vertical'].includes(drawing.type) ? 1 : 2;
                    return drawing.points.length === expectedPoints &&
                        drawing.points.every(point => Number.isFinite(point?.time) && Number.isFinite(point?.price));
                }).slice(-500) : [];
            } catch (error) {
                liveMarketDrawings = [];
                console.error('Unable to load saved chart drawings:', error.message);
                chartDrawingStatus('Saved drawings could not be loaded in this browser.');
            }
        }

        function saveLiveChartDrawings() {
            if (!liveMarketDrawingsStorageKey) return;
            try {
                window.localStorage.setItem(liveMarketDrawingsStorageKey, JSON.stringify(liveMarketDrawings));
            } catch (error) {
                console.error('Unable to save chart drawings:', error.message);
                chartDrawingStatus('Drawings are visible now but could not be saved in this browser.');
            }
        }

        function chartDrawingPointFromEvent(event) {
            if (!liveMarketChart || !liveMarketCandleSeries || !liveMarketDrawingHost) return null;
            const bounds = liveMarketDrawingHost.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;
            const plotWidth = liveMarketChart.timeScale().width();
            if (x < 0 || x > plotWidth || y < 0 || y > liveMarketDrawingHost.clientHeight - 28) return null;
            const time = chartDrawingTimeToSeconds(liveMarketChart.timeScale().coordinateToTime(x));
            const price = liveMarketCandleSeries.coordinateToPrice(y);
            if (!Number.isFinite(time) || !Number.isFinite(price)) return null;
            return { time, price };
        }

        function createChartDrawingSvgElement(name, attributes = {}) {
            const element = document.createElementNS('http://www.w3.org/2000/svg', name);
            Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
            return element;
        }

        function chartDrawingCoordinates(point) {
            const x = liveMarketChart.timeScale().timeToCoordinate(point.time);
            const y = liveMarketCandleSeries.priceToCoordinate(point.price);
            return {
                x: Number.isFinite(x) ? x : null,
                y: Number.isFinite(y) ? y : null
            };
        }

        function renderLiveChartDrawing(drawing, preview = false) {
            const points = drawing.points.map(chartDrawingCoordinates);
            const svg = liveMarketDrawingSvg;
            const plotWidth = liveMarketChart.timeScale().width();
            const plotHeight = Math.max(0, liveMarketDrawingHost.clientHeight - 28);
            const colors = {
                trendline: '#38bdf8',
                horizontal: '#fbbf24',
                vertical: '#f472b6',
                rectangle: '#a78bfa',
                measure: '#34d399',
                fib: '#fbbf24'
            };
            const color = colors[drawing.type];
            const opacity = preview ? 0.65 : 0.95;
            const lineAttributes = {
                stroke: color,
                'stroke-width': 1.5,
                'stroke-opacity': opacity,
                'vector-effect': 'non-scaling-stroke',
                ...(preview ? { 'stroke-dasharray': '5 4' } : {})
            };
            const addLine = (x1, y1, x2, y2, extra = {}) => {
                svg.append(createChartDrawingSvgElement('line', { ...lineAttributes, x1, y1, x2, y2, ...extra }));
            };

            if (drawing.type === 'horizontal' && Number.isFinite(points[0].y)) {
                addLine(0, points[0].y, plotWidth, points[0].y);
            } else if (drawing.type === 'vertical' && Number.isFinite(points[0].x)) {
                addLine(points[0].x, 0, points[0].x, plotHeight);
            } else if (['trendline', 'measure'].includes(drawing.type) &&
                points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) {
                addLine(points[0].x, points[0].y, points[1].x, points[1].y);
                if (drawing.type === 'measure') {
                    const delta = drawing.points[1].price - drawing.points[0].price;
                    const percent = drawing.points[0].price ? delta / drawing.points[0].price * 100 : 0;
                    const label = createChartDrawingSvgElement('text', {
                        x: Math.min(plotWidth - 8, Math.max(8, (points[0].x + points[1].x) / 2 + 8)),
                        y: Math.min(plotHeight - 8, Math.max(14, (points[0].y + points[1].y) / 2 - 8)),
                        class: 'live-market-chart-drawing-measure-label',
                        opacity
                    });
                    label.textContent = `${delta >= 0 ? '+' : ''}${delta.toPrecision(6)} (${percent.toFixed(2)}%)`;
                    svg.append(label);
                }
            } else if (drawing.type === 'rectangle' &&
                points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) {
                const x = Math.min(points[0].x, points[1].x);
                const y = Math.min(points[0].y, points[1].y);
                svg.append(createChartDrawingSvgElement('rect', {
                    x,
                    y,
                    width: Math.abs(points[1].x - points[0].x),
                    height: Math.abs(points[1].y - points[0].y),
                    ...lineAttributes,
                    fill: color,
                    'fill-opacity': preview ? 0.08 : 0.12
                }));
            } else if (drawing.type === 'fib' &&
                points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) {
                const levels = [
                    [0, '0%'], [0.236, '23.6%'], [0.382, '38.2%'], [0.5, '50%'],
                    [0.618, '61.8%'], [0.786, '78.6%'], [1, '100%']
                ];
                const startX = Math.min(points[0].x, points[1].x);
                levels.forEach(([ratio, label]) => {
                    const price = drawing.points[0].price +
                        (drawing.points[1].price - drawing.points[0].price) * ratio;
                    const y = liveMarketCandleSeries.priceToCoordinate(price);
                    if (!Number.isFinite(y)) return;
                    addLine(startX, y, plotWidth, y, { 'stroke-opacity': ratio === 0 || ratio === 1 ? opacity : opacity * 0.65 });
                    const levelLabel = createChartDrawingSvgElement('text', {
                        x: plotWidth - 5,
                        y: Math.max(10, y - 3),
                        fill: color,
                        opacity,
                        'font-size': 9,
                        'text-anchor': 'end'
                    });
                    levelLabel.textContent = label;
                    svg.append(levelLabel);
                });
            }
        }

        function renderLiveChartDrawings(previewPoint = null) {
            if (!liveMarketDrawingSvg || !liveMarketChart || !liveMarketCandleSeries || !liveMarketDrawingHost) return;
            const width = liveMarketDrawingHost.clientWidth;
            const height = liveMarketDrawingHost.clientHeight;
            liveMarketDrawingSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            liveMarketDrawingSvg.replaceChildren();
            liveMarketDrawings.forEach(drawing => renderLiveChartDrawing(drawing));
            if (activeChartDrawingTool && liveMarketDrawingAnchor && previewPoint) {
                renderLiveChartDrawing({
                    type: activeChartDrawingTool,
                    points: [liveMarketDrawingAnchor, previewPoint]
                }, true);
            }
        }

        function setupLiveChartDrawings(host, source, pair, timeframe) {
            liveMarketDrawingHost = host;
            liveMarketDrawingSvg = createChartDrawingSvgElement('svg', {
                class: 'live-market-chart-drawings',
                'aria-hidden': 'true'
            });
            host.append(liveMarketDrawingSvg);
            liveMarketDrawingsStorageKey = chartDrawingStorageKey(source, pair, timeframe);
            liveMarketDrawings = [];
            liveMarketDrawingAnchor = null;
            loadLiveChartDrawings();
            host.addEventListener('pointerdown', event => {
                if (!activeChartDrawingTool || event.button !== 0) return;
                const point = chartDrawingPointFromEvent(event);
                if (!point) return;
                event.preventDefault();
                event.stopPropagation();
                if (['horizontal', 'vertical'].includes(activeChartDrawingTool)) {
                    liveMarketDrawings.push({
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        type: activeChartDrawingTool,
                        points: [point]
                    });
                    saveLiveChartDrawings();
                    renderLiveChartDrawings();
                    chartDrawingStatus(`Click chart to place another ${activeChartDrawingTool === 'horizontal' ? 'horizontal line' : 'vertical line'}.`);
                    return;
                }
                if (!liveMarketDrawingAnchor) {
                    liveMarketDrawingAnchor = point;
                    chartDrawingStatus('Click the second point to complete the drawing. Press Undo to cancel.');
                    renderLiveChartDrawings(point);
                    return;
                }
                liveMarketDrawings.push({
                    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    type: activeChartDrawingTool,
                    points: [liveMarketDrawingAnchor, point]
                });
                liveMarketDrawingAnchor = null;
                saveLiveChartDrawings();
                renderLiveChartDrawings();
                chartDrawingStatus('Drawing saved. Click two points to add another.');
            }, true);
            host.addEventListener('pointermove', event => {
                if (!activeChartDrawingTool) {
                    renderLiveChartDrawings();
                    return;
                }
                const point = chartDrawingPointFromEvent(event);
                if (!point) return;
                event.preventDefault();
                event.stopPropagation();
                if (liveMarketDrawingAnchor) renderLiveChartDrawings(point);
            }, true);
            host.addEventListener('pointerup', () => window.requestAnimationFrame(() => renderLiveChartDrawings()), true);
            host.addEventListener('wheel', () => window.requestAnimationFrame(() => renderLiveChartDrawings()), { passive: true });
            liveMarketChart.timeScale().subscribeVisibleLogicalRangeChange(() => renderLiveChartDrawings());
            selectChartDrawingTool(activeChartDrawingTool || 'select');
        }

        function observeLiveMarketChart(chart, host) {
            if (!window.ResizeObserver) return;
            if (!liveMarketResizeObserver) {
                liveMarketResizeObserver = new ResizeObserver(entries => {
                    for (const entry of entries) {
                        const targetChart = liveMarketResizeTargets.get(entry.target);
                        const { width, height } = entry.contentRect;
                        if (targetChart && width > 0 && height > 0) {
                            targetChart.resize(width, height);
                            if (targetChart === liveMarketChart) renderLiveChartDrawings();
                        }
                    }
                });
            }
            liveMarketResizeTargets.set(host, chart);
            liveMarketResizeObserver.observe(host);
        }

        function chartOptionsForHost(host, { showTimeScale = false } = {}) {
            return {
                width: host.clientWidth,
                height: host.clientHeight,
                layout: {
                    background: { color: LIVE_CHART_THEME.background },
                    textColor: LIVE_CHART_THEME.text
                },
                grid: {
                    vertLines: { color: LIVE_CHART_THEME.grid },
                    horzLines: { color: LIVE_CHART_THEME.grid }
                },
                rightPriceScale: { borderColor: LIVE_CHART_THEME.border },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: true
                },
                handleScale: {
                    axisPressedMouseMove: { time: true, price: true },
                    mouseWheel: true,
                    pinch: true
                },
                timeScale: {
                    borderColor: LIVE_CHART_THEME.border,
                    shiftVisibleRangeOnNewBar: false,
                    timeVisible: showTimeScale,
                    visible: showTimeScale,
                    tickMarkFormatter: formatChartAxisTime
                },
                localization: {
                    locale: 'en-US',
                    timeFormatter: formatChartTimeInNewYork
                },
                crosshair: { mode: LightweightCharts.CrosshairMode?.Normal ?? 0 }
            };
        }

        function formatChartTimeInNewYork(time) {
            return formatChartAxisTime(time);
        }

        function formatChartAxisTime(time, tickMarkType) {
            const date = typeof time === 'number'
                ? new Date(time * 1000)
                : new Date(Date.UTC(time.year, time.month - 1, time.day));
            if (tickMarkType === 0) return CHART_AXIS_TIME_FORMATTERS.year.format(date);
            if (tickMarkType === 1) return CHART_AXIS_TIME_FORMATTERS.month.format(date);
            if (tickMarkType === 2) return CHART_AXIS_TIME_FORMATTERS.day.format(date);
            return CHART_AXIS_TIME_FORMATTERS.time.format(date);
        }

        const newYorkChartTimeFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        });

        function floorChartTimeToNewYorkInterval(timestampSeconds, intervalSeconds) {
            if (intervalSeconds <= 60 * 60) {
                return Math.floor(timestampSeconds / intervalSeconds) * intervalSeconds;
            }
            const getWallClockTime = timestamp => {
                const parts = Object.fromEntries(newYorkChartTimeFormatter.formatToParts(new Date(timestamp * 1000))
                    .filter(part => part.type !== 'literal')
                    .map(part => [part.type, Number(part.value)]));
                return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) / 1000;
            };
            const targetWallClockTime = Math.floor(getWallClockTime(timestampSeconds) / intervalSeconds) * intervalSeconds;
            let flooredTimestamp = targetWallClockTime - (getWallClockTime(timestampSeconds) - timestampSeconds);
            for (let attempt = 0; attempt < 3; attempt += 1) {
                const offsetSeconds = getWallClockTime(flooredTimestamp) - flooredTimestamp;
                const adjustedTimestamp = targetWallClockTime - offsetSeconds;
                if (adjustedTimestamp === flooredTimestamp) break;
                flooredTimestamp = adjustedTimestamp;
            }
            return flooredTimestamp;
        }

        function createChartIndicatorSeries(chart, indicatorSeries) {
            const options = {
                title: indicatorSeries.name,
                priceLineVisible: false,
                lastValueVisible: true
            };
            if (indicatorSeries.color) options.color = indicatorSeries.color;
            const series = indicatorSeries.type === 'histogram'
                ? chart.addHistogramSeries(options)
                : chart.addLineSeries({ ...options, lineWidth: 2 });
            series.setData(indicatorSeries.data);
            return series;
        }

        function syncLiveChartRanges(chart) {
            if (liveMarketSyncedCharts.has(chart)) return;
            liveMarketSyncedCharts.add(chart);
            chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (liveMarketRangeSyncing || !range) return;
                liveMarketRangeSyncing = true;
                try {
                    [liveMarketChart, ...liveMarketPaneCharts.map(pane => pane.chart)]
                        .filter(other => other && other !== chart)
                        .forEach(other => other.timeScale().setVisibleLogicalRange(range));
                } finally {
                    liveMarketRangeSyncing = false;
                }
            });
        }

        function indicatorDataForPane(data) {
            return data.map(item => item.type === 'histogram' ? {
                ...item,
                data: item.data.map(point => point.value === undefined ? point : {
                    time: point.time,
                    value: point.value,
                    color: point.color
                })
            } : item);
        }

        function renderChartIndicatorPane(indicator, calculated, paneIndex, paneCount) {
            const container = document.getElementById('tradingview-widget-container');
            const paneElement = document.createElement('section');
            paneElement.className = 'chart-indicator-pane';
            const title = document.createElement('div');
            title.className = 'chart-indicator-pane-title';
            title.textContent = calculated.series.map(series => series.name).join(' · ');
            const host = document.createElement('div');
            host.className = 'chart-indicator-pane-host';
            paneElement.append(title, host);
            container.append(paneElement);

            const chart = LightweightCharts.createChart(host, chartOptionsForHost(host, {
                showTimeScale: paneIndex === paneCount - 1
            }));
            const series = indicatorDataForPane(calculated.series)
                .map(item => createChartIndicatorSeries(chart, item));
            const pane = { id: indicator.id, chart, series, host };
            liveMarketPaneCharts.push(pane);
            observeLiveMarketChart(chart, host);
            syncLiveChartRanges(chart);
            const range = liveMarketChart.timeScale().getVisibleLogicalRange();
            if (range) chart.timeScale().setVisibleLogicalRange(range);
            return pane;
        }

        function indicatorSeriesData(indicator) {
            if (!window.ChartIndicatorCalculations) return { pane: false, series: [] };
            return window.ChartIndicatorCalculations.compute(indicator.type, liveMarketCandles, indicator.params);
        }

        function refreshChartIndicators() {
            if (!liveMarketChart || liveMarketCandles.length === 0) return;
            Object.values(liveMarketIndicatorSeries).flat().forEach(series => liveMarketChart.removeSeries(series));
            liveMarketIndicatorSeries = {};
            liveMarketPaneCharts.forEach(pane => {
                liveMarketResizeObserver?.unobserve(pane.host);
                liveMarketResizeTargets.delete(pane.host);
                pane.chart.remove();
            });
            liveMarketPaneCharts = [];
            document.querySelectorAll('#tradingview-widget-container .chart-indicator-pane').forEach(pane => pane.remove());

            const calculatedIndicators = activeChartIndicators.map(indicator => ({
                indicator,
                calculated: indicatorSeriesData(indicator)
            }));
            const paneIndicators = calculatedIndicators.filter(item => item.calculated.pane);
            calculatedIndicators.filter(item => !item.calculated.pane).forEach(({ indicator, calculated }) => {
                liveMarketIndicatorSeries[indicator.id] = calculated.series.map(series =>
                    createChartIndicatorSeries(liveMarketChart, series)
                );
            });
            paneIndicators.forEach(({ indicator, calculated }, index) =>
                renderChartIndicatorPane(indicator, calculated, index, paneIndicators.length)
            );
            syncLiveChartRanges(liveMarketChart);
        }

        function updateChartIndicatorData() {
            if (!liveMarketChart || liveMarketCandles.length === 0) return;
            for (const indicator of activeChartIndicators) {
                const calculated = indicatorSeriesData(indicator);
                const existing = calculated.pane
                    ? liveMarketPaneCharts.find(pane => pane.id === indicator.id)?.series
                    : liveMarketIndicatorSeries[indicator.id];
                if (!existing) continue;
                calculated.series.forEach((series, index) => existing[index]?.setData(series.data));
            }
        }

        async function initLiveMarketChart(pair, source) {
            disposeLiveMarketChart();
            const selectedMarketLabel = document.getElementById('order-symbol')?.selectedOptions?.[0]?.textContent?.trim();
            const pairLabel = selectedMarketLabel
                ? selectedMarketLabel.split(/\s+/)[0].replace(/\/USDT$/i, '/USD')
                : String(pair || '').replace(/\.P$/i, '').replace(/USDT$/i, '/USD');
            const chartPairLabel = document.getElementById('chart-pair-label');
            if (chartPairLabel) chartPairLabel.textContent = pairLabel || 'Selected market';
            const forexMarket = source === 'SWISSQUOTE' ? marketsData.find(item => item.pair === pair) : null;
            liveMarketChartUsesNewYorkTime = Boolean(forexMarket);
            forexChartStats = null;
            forexChartStatsSymbol = forexMarket?.symbol || null;
            const forexPipSize = Number(forexMarket?.pip_size);
            const forexPricePrecision = forexMarket && Number.isFinite(forexPipSize) && forexPipSize > 0
                ? Math.min(8, Math.ceil(-Math.log10(forexPipSize)) + 1)
                : null;
            const container = document.getElementById('tradingview-widget-container');
            if (!container) return;
            container.replaceChildren();

            if (!window.LightweightCharts?.createChart) {
                container.textContent = 'Live chart is unavailable. Check the chart library connection.';
                return;
            }

            const generation = liveMarketChartGeneration;
            const timeframe = document.getElementById('chart-timeframe')?.value || '1m';
            const timeframeConfig = {
                '1m': { seconds: 60, binance: '1m', bitget: '1m' },
                '5m': { seconds: 300, binance: '5m', bitget: '5m' },
                '15m': { seconds: 900, binance: '15m', bitget: '15m' },
                '1h': { seconds: 3600, binance: '1h', bitget: '1H' },
                '4h': { seconds: 14400, binance: '4h', bitget: '4H' },
                '1d': { seconds: 86400, binance: '1d', bitget: '1D' }
            }[timeframe] || { seconds: 60, binance: '1m', bitget: '1m' };
            liveMarketTimeframeSeconds = timeframeConfig.seconds;
            liveMarketChartPair = pair;
            const chartHost = document.createElement('div');
            chartHost.className = 'live-market-chart-host';
            liveMarketChartStatus = document.createElement('div');
            liveMarketChartStatus.className = 'live-market-chart-status';
            liveMarketChartStatus.textContent = 'Loading live candles…';
            const attribution = document.createElement('a');
            attribution.className = 'live-market-chart-attribution';
            attribution.href = 'https://www.tradingview.com/lightweight-charts/';
            attribution.target = '_blank';
            attribution.rel = 'noopener noreferrer';
            attribution.textContent = 'Charts by TradingView';
            attribution.title = source === 'SWISSQUOTE'
                ? (forexMarket?.history_symbol
                    ? 'Gold history: Yahoo Finance COMEX futures, rebased to Swissquote XAU/USD spot · Chart times: New York'
                    : 'Forex history: Yahoo Finance · Live quotes: Swissquote · Chart times: New York')
                : 'Charts by TradingView';
            chartHost.append(liveMarketChartStatus, attribution);
            const timezoneLabel = document.createElement('span');
            timezoneLabel.className = 'live-market-chart-timezone';
            timezoneLabel.textContent = 'ET';
            timezoneLabel.title = 'Chart times use Eastern Time (EST/EDT), New York';
            chartHost.append(timezoneLabel);
            container.replaceChildren(chartHost);

            liveMarketChart = LightweightCharts.createChart(chartHost, chartOptionsForHost(chartHost, { showTimeScale: true }));
            liveMarketCandleSeries = liveMarketChart.addCandlestickSeries({
                upColor: LIVE_CHART_THEME.up,
                downColor: LIVE_CHART_THEME.down,
                borderVisible: true,
                borderUpColor: LIVE_CHART_THEME.up,
                borderDownColor: LIVE_CHART_THEME.down,
                wickVisible: true,
                wickUpColor: LIVE_CHART_THEME.up,
                wickDownColor: LIVE_CHART_THEME.down,
                ...(forexPricePrecision ? {
                    priceFormat: {
                        type: 'price',
                        precision: forexPricePrecision,
                        minMove: 10 ** -forexPricePrecision
                    }
                } : {})
            });
            observeLiveMarketChart(liveMarketChart, chartHost);
            syncLiveChartRanges(liveMarketChart);
            setupLiveChartDrawings(chartHost, source, pair, timeframe);

            if (source === 'SWISSQUOTE') {
                liveMarketChartStatus.textContent = 'Loading Forex chart history…';
                liveMarketChartHistoryFailed = true;
                try {
                    if (!forexMarket) throw new Error('The selected Forex market is not configured.');
                    const response = await walletFetch(`/api/forex/candles?symbol=${encodeURIComponent(forexMarket.symbol)}&timeframe=${encodeURIComponent(timeframe)}`);
                    const data = await response.json();
                    if (!response.ok) throw new Error(data?.error || `Forex candle request failed (${response.status}).`);
                    if (generation !== liveMarketChartGeneration || liveMarketChartPair !== pair) return;
                    if (!Array.isArray(data.candles) || data.candles.length === 0) {
                        throw new Error('Forex history provider returned no candles.');
                    }
                    liveMarketCandleSeries.setData(data.candles);
                    liveMarketCandles = data.candles;
                    renderLiveChartDrawings();
                    liveMarketFirstCandleTime = data.candles[0].time;
                    liveMarketLastCandle = { ...data.candles[data.candles.length - 1] };
                    forexChartStats = data.stats;
                    refreshChartIndicators();
                    liveMarketChart.timeScale().fitContent();
                    renderChartTradeOverlays(displayedOpenTrades);
                    liveMarketChartHistoryFailed = false;
                    liveMarketChartStatus.remove();
                    liveMarketChartStatus = null;
                    const lastTick = marketQuotesBySymbol.get(forexMarket.symbol);
                    if (lastTick) {
                        updateLiveMarketChart(pair, lastTick.price, lastTick.publishTime);
                        renderForexChartStats(forexMarket, lastTick);
                    }
                } catch (error) {
                    if (generation !== liveMarketChartGeneration) return;
                    liveMarketChartHistoryFailed = true;
                    console.error(`Unable to load Forex chart history for ${pair}:`, error.message);
                    liveMarketChartStatus.textContent = 'Forex history is unavailable; showing live candles only.';
                }
                return;
            }

            try {
                const endpoint = source === 'BITGET_PERP'
                    ? `https://api.bitget.com/api/v2/mix/market/candles?productType=USDT-FUTURES&symbol=${encodeURIComponent(pair)}&granularity=${timeframeConfig.bitget}&limit=1000`
                    : source === 'BINANCE_SPOT'
                        ? `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${timeframeConfig.binance}&limit=1000`
                        : source === 'BINANCE_PERP'
                            ? `https://fapi.binance.com/fapi/v1/klines?symbol=${encodeURIComponent(pair)}&interval=${timeframeConfig.binance}&limit=1000`
                            : null;
                if (!endpoint) throw new Error(`Candlestick charts are not configured for ${source}.`);
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`Market candle request failed (${response.status}).`);
                const data = await response.json();
                if (source === 'BITGET_PERP' && data?.code !== '00000') {
                    throw new Error(`Bitget candle request failed (${data?.msg || data?.code}).`);
                }
                if (generation !== liveMarketChartGeneration || liveMarketChartPair !== pair) return;

                const candleRows = source === 'BITGET_PERP' ? data.data || [] : Array.isArray(data) ? data : [];
                const candles = candleRows.map(candle => ({
                    time: Math.floor(Number(candle[0]) / 1000),
                    open: Number(candle[1]),
                    high: Number(candle[2]),
                    low: Number(candle[3]),
                    close: Number(candle[4]),
                    volume: Number(candle[5]) || 0
                })).filter(candle => Number.isFinite(candle.time) &&
                    [candle.open, candle.high, candle.low, candle.close].every(value => Number.isFinite(value) && value > 0))
                    .sort((a, b) => a.time - b.time);
                if (candles.length === 0) throw new Error('Market provider returned no valid candles.');
                liveMarketCandleSeries.setData(candles);
                liveMarketCandles = candles;
                renderLiveChartDrawings();
                liveMarketFirstCandleTime = candles[0].time;
                liveMarketLastCandle = { ...candles[candles.length - 1] };
                refreshChartIndicators();
                liveMarketChart.timeScale().fitContent();
                renderChartTradeOverlays(displayedOpenTrades);
                liveMarketChartStatus.remove();
                liveMarketChartStatus = null;
            } catch (error) {
                if (generation !== liveMarketChartGeneration) return;
                console.error(`Unable to load market candles for ${pair}:`, error.message);
                liveMarketChartStatus.textContent = 'Unable to load live candles. Change market or refresh to retry.';
            }
        }

        function updateLiveMarketChart(pair, priceValue, timestampValue) {
            if (!liveMarketCandleSeries || pair !== liveMarketChartPair) return;
            const price = Number(priceValue);
            const timestamp = Number(timestampValue);
            if (!Number.isFinite(price) || price <= 0) return;
            const timestampSeconds = (Number.isFinite(timestamp) ? timestamp : Date.now()) / 1000;
            const time = liveMarketChartUsesNewYorkTime
                ? floorChartTimeToNewYorkInterval(timestampSeconds, liveMarketTimeframeSeconds)
                : Math.floor(timestampSeconds / liveMarketTimeframeSeconds) * liveMarketTimeframeSeconds;
            const latest = liveMarketLastCandle;
            if (!latest) {
                liveMarketLastCandle = { time, open: price, high: price, low: price, close: price, volume: 0 };
                liveMarketCandles = [{ ...liveMarketLastCandle }];
                liveMarketFirstCandleTime = time;
                liveMarketCandleSeries.update({ ...liveMarketLastCandle });
                renderLiveChartDrawings();
                if (!liveMarketChartHistoryFailed) {
                    liveMarketChartStatus?.remove();
                    liveMarketChartStatus = null;
                }
                refreshChartIndicators();
                return;
            }
            if (time < latest.time) return;
            if (time === latest.time) {
                latest.high = Math.max(latest.high, price);
                latest.low = Math.min(latest.low, price);
                latest.close = price;
                liveMarketCandleSeries.update({ ...latest });
                liveMarketCandles[liveMarketCandles.length - 1] = { ...latest };
                renderLiveChartDrawings();
                updateChartIndicatorData();
                return;
            }
            liveMarketLastCandle = {
                time,
                open: latest.close,
                high: Math.max(latest.close, price),
                low: Math.min(latest.close, price),
                close: price,
                volume: 0
            };
            liveMarketCandleSeries.update({ ...liveMarketLastCandle });
            liveMarketCandles.push({ ...liveMarketLastCandle });
            if (liveMarketCandles.length > 500) liveMarketCandles.shift();
            renderLiveChartDrawings();
            updateChartIndicatorData();
        }

        function reloadLiveMarketChart() {
            const select = document.getElementById('order-symbol');
            const option = select?.selectedOptions?.[0];
            if (option) initLiveMarketChart(option.dataset.pair, option.dataset.source);
        }

        function renderChartTradeOverlays(trades) {
            if (!liveMarketCandleSeries) return;
            liveMarketTradeLines.forEach(line => liveMarketCandleSeries.removePriceLine(line));
            liveMarketTradeLines = [];
            liveMarketTradeMarkers = [];
            if (activeAccount && isPermanentlyLockedCopyAccount(activeAccount)) {
                liveMarketCandleSeries.setMarkers([]);
                return;
            }
            const selectedSymbol = document.getElementById('order-symbol')?.value;
            const isLimitMode = document.getElementById('order-type')?.value === 'LIMIT';
            const validTrades = (trades || []).filter(trade =>
                trade.symbol === selectedSymbol && trade.status === (isLimitMode ? 'PENDING' : 'OPEN')
            );
            const lineStyle = LightweightCharts.LineStyle?.Dashed ?? 2;
            for (const trade of validTrades) {
                const isLong = trade.side === 'BUY';
                const isPending = trade.status === 'PENDING';
                const tradeLabel = isPending ? (isLong ? 'LIMIT LONG' : 'LIMIT SHORT') : (isLong ? 'LONG' : 'SHORT');
                const addPriceLine = (price, title, color, width = 1) => {
                    const value = Number(price);
                    if (!Number.isFinite(value) || value <= 0) return;
                    liveMarketTradeLines.push(liveMarketCandleSeries.createPriceLine({
                        price: value,
                        color,
                        lineWidth: width,
                        lineStyle,
                        axisLabelVisible: true,
                        title
                    }));
                };
                if (isPending) {
                    const pendingPrice = Number(trade.trigger_price ?? trade.entry_price ?? currentLivePrice);
                    addPriceLine(pendingPrice, `${tradeLabel} limit`, '#60a5fa', 2);
                } else {
                    addPriceLine(trade.entry_price, `${tradeLabel} entry`, isLong ? LIVE_CHART_THEME.up : LIVE_CHART_THEME.down, 2);
                }
                addPriceLine(trade.sl, `${tradeLabel} SL`, LIVE_CHART_THEME.down);
                addPriceLine(trade.tp, `${tradeLabel} TP`, '#22d3ee');

                const entryTimestamp = new Date(trade.created_at).getTime();
                const entryTime = Math.floor(entryTimestamp / (liveMarketTimeframeSeconds * 1000)) * liveMarketTimeframeSeconds;
                if (Number.isFinite(entryTimestamp) && entryTime >= liveMarketFirstCandleTime && entryTime <= liveMarketLastCandle?.time) {
                    liveMarketTradeMarkers.push({
                        time: entryTime,
                        position: isLong ? 'belowBar' : 'aboveBar',
                        color: isPending ? '#60a5fa' : (isLong ? LIVE_CHART_THEME.up : LIVE_CHART_THEME.down),
                        shape: isLong ? 'arrowUp' : 'arrowDown',
                        text: isPending ? 'Limit' : `${isLong ? 'Long' : 'Short'} entry`
                    });
                }
            }
            liveMarketTradeMarkers.sort((left, right) => left.time - right.time);
            liveMarketCandleSeries.setMarkers(liveMarketTradeMarkers);
        }

        function onSymbolChanged(tvSymbol) {
            userHasEditedPrice = false;
            document.title = defaultPageTitle;
            const select = document.getElementById('order-symbol');
            if (!select) return;
            const opt = select.querySelector(`option[value="${tvSymbol}"]`);
            if (!opt) return;
            updateForexTicketLabels();
            resetChartMarketStats(opt.textContent);
            initLiveMarketChart(opt.dataset.pair, opt.dataset.source);
            startPricePolling(opt.dataset.pair, opt.dataset.type, opt.dataset.source);
            startMarketChat(tvSymbol, opt.textContent);
        }

        function startMarketChat(symbol, label) {
            marketChatSymbol = symbol;
            marketChatGeneration++;
            const room = document.getElementById('market-chat-room');
            const messages = document.getElementById('market-chat-messages');
            if (room) room.textContent = `${label || symbol} · public room`;
            if (messages) messages.innerHTML = '<p class="market-chat-empty">Loading room messages…</p>';
            marketChatFeedback = '';
            marketChatFeedbackIsError = false;
            updateMarketChatControls();
            loadMarketChat(symbol);
        }

        async function openMarketChatInNewTab() {
            if (!marketChatSymbol) return;
            for (const chatWindow of marketChatWindows.keys()) {
                if (chatWindow.closed) marketChatWindows.delete(chatWindow);
            }
            const chatWindow = window.open(`/chat.html?symbol=${encodeURIComponent(marketChatSymbol)}`, '_blank');
            if (!chatWindow) {
                marketChatFeedback = 'Allow pop-ups to open chat in a new tab.';
                marketChatFeedbackIsError = true;
                updateMarketChatControls();
                return;
            }
            marketChatWindows.set(chatWindow, true);
            try {
                await ensureWalletSession();
                setTimeout(() => marketChatWindows.delete(chatWindow), 15000);
            } catch (error) {
                marketChatWindows.delete(chatWindow);
                chatWindow.close();
                marketChatFeedback = error.message || 'Unable to authorize the chat tab.';
                marketChatFeedbackIsError = true;
                updateMarketChatControls();
            }
        }

        function updateMarketChatControls() {
            const input = document.getElementById('market-chat-input');
            const send = document.getElementById('market-chat-send');
            const status = document.getElementById('market-chat-status');
            if (!input || !send || !status) return;
            const hasEligibleAccount = userAccounts.some(isSelectableTradingAccount);
            const canPost = dashboardAuthenticated && Boolean(connectedWallet) && hasEligibleAccount;
            input.disabled = !canPost;
            send.disabled = !canPost || marketChatSending;
            status.classList.toggle('is-error', marketChatFeedbackIsError);
            status.textContent = marketChatFeedback || (!dashboardAuthenticated
                ? 'Sign in to post. Anyone can read. Slow mode: one message per minute.'
                : !hasEligibleAccount
                    ? 'Posting requires an active, unlocked trading account. DLL/MLL-locked or admin-frozen accounts cannot post.'
                    : 'Text only. Slow mode: one message per minute. Links and moderated content are blocked.');
        }

        async function loadMarketChat(symbol) {
            const generation = marketChatGeneration;
            const messagesElement = document.getElementById('market-chat-messages');
            if (!symbol || !messagesElement) return;
            try {
                const response = await fetch(`/api/chat/messages?symbol=${encodeURIComponent(symbol)}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load public chat.');
                if (generation !== marketChatGeneration || symbol !== marketChatSymbol) return;
                if (marketChatFeedback === 'Public chat is temporarily unavailable.') {
                    marketChatFeedback = '';
                    marketChatFeedbackIsError = false;
                    updateMarketChatControls();
                }
                const wasNearBottom = messagesElement.scrollHeight - messagesElement.scrollTop - messagesElement.clientHeight < 48;
                const messages = Array.isArray(data.messages) ? data.messages : [];
                messagesElement.innerHTML = messages.length
                    ? messages.map(message => {
                        const timestamp = new Date(`${String(message.created_at || '').replace(' ', 'T')}Z`);
                        const time = Number.isNaN(timestamp.getTime()) ? '' : timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        const username = message.username || message.display_name || 'Trader';
                        const avatar = message.profile_image_url
                            ? `<img src="${escapeHTML(message.profile_image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
                            : `<span class="market-chat-player-avatar-fallback">${escapeHTML(username.slice(0, 1).toUpperCase())}</span>`;
                        return `<article class="market-chat-message">
                            <span class="market-chat-author-wrap">
                                <button class="market-chat-message-author" type="button" aria-label="View ${escapeHTML(username)} player card">
                                    ${escapeHTML(username)}
                                    <span class="market-chat-player-card" role="tooltip">
                                        ${avatar}
                                        <span class="market-chat-player-details">
                                            <strong>${escapeHTML(username)}</strong>
                                            <small>Rank: ${Number(message.battlepass_level) ? `Level ${Number(message.battlepass_level)}` : 'Unranked'} · ${Number(message.battlepass_xp || 0).toLocaleString()} XP · ${Number(message.battlepass_points || 0).toLocaleString()} points</small>
                                            <span class="market-chat-player-rank">Title: ${escapeHTML(message.battlepass_title || 'BlastrrPass player')}</span>
                                            <small>Total payouts: $${Number(message.total_payouts || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</small>
                                            <small>Referral code: ${escapeHTML(message.referral_code || '—')}</small>
                                        </span>
                                    </span>
                                </button>
                            </span>
                            <time class="market-chat-message-time">${escapeHTML(time)}</time>
                            <span class="market-chat-message-body">${escapeHTML(message.body)}</span>
                        </article>`;
                    }).join('')
                    : '<p class="market-chat-empty">No messages yet. Start the conversation.</p>';
                if (wasNearBottom || messages.length <= 1) messagesElement.scrollTop = messagesElement.scrollHeight;
            } catch (error) {
                if (generation === marketChatGeneration) {
                    messagesElement.innerHTML = '<p class="market-chat-empty">Unable to load this market’s chat room.</p>';
                    marketChatFeedback = 'Public chat is temporarily unavailable.';
                    marketChatFeedbackIsError = true;
                    updateMarketChatControls();
                }
            }
        }

        async function postMarketChatMessage(event) {
            event.preventDefault();
            const input = document.getElementById('market-chat-input');
            if (!input || !marketChatSymbol || !dashboardAuthenticated || !connectedWallet) return;
            const message = input.value.trim();
            if (!message) return;
            const submittedSymbol = marketChatSymbol;
            marketChatSending = true;
            marketChatFeedback = 'Sending…';
            marketChatFeedbackIsError = false;
            updateMarketChatControls();
            try {
                const response = await walletFetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol: marketChatSymbol, message })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to send your message.');
                if (marketChatSymbol === submittedSymbol && input.value.trim() === message) {
                    input.value = '';
                    marketChatFeedback = 'Message sent.';
                    marketChatFeedbackIsError = false;
                    await loadMarketChat(submittedSymbol);
                }
            } catch (error) {
                marketChatFeedback = error.message || 'Unable to send your message.';
                marketChatFeedbackIsError = true;
            } finally {
                marketChatSending = false;
                updateMarketChatControls();
            }
        }

        function resetChartMarketStats(marketLabel) {
            const marketName = document.getElementById('chart-market-name');
            if (marketName) marketName.textContent = marketLabel || 'Selected market';
            const selectedMarket = marketsData.find(market => market.symbol === document.getElementById('order-symbol')?.value);
            const volumeCard = document.getElementById('chart-volume-24h')?.parentElement;
            if (volumeCard) volumeCard.hidden = selectedMarket?.asset_class === 'FOREX';
            for (const id of ['chart-mid-price', 'chart-bid-ask', 'chart-change-24h', 'chart-high-24h', 'chart-low-24h', 'chart-volume-24h']) {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = '—';
                    element.classList.remove('is-positive', 'is-negative');
                }
            }
        }

        function formatMarketStat(value, style = 'number', maximumFractionDigits = 2) {
            const number = Number(value);
            if (!Number.isFinite(number)) return '—';
            if (style === 'currency') {
                return `$${number.toLocaleString(undefined, { maximumFractionDigits })}`;
            }
            if (style === 'compactCurrency') {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    notation: 'compact',
                    maximumFractionDigits: 2
                }).format(number);
            }
            if (style === 'percent') {
                return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`;
            }
            return number.toLocaleString(undefined, { maximumFractionDigits });
        }

        function updateMarketTabTitle(price, pair) {
            const baseAsset = String(pair || '').replace(/USDT$/, '');
            if (!Number.isFinite(price) || price <= 0 || !baseAsset) {
                document.title = defaultPageTitle;
                return;
            }
            document.title = `$${price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} | ${baseAsset}`;
        }

        function createMarketTickerItem(market, interactive) {
            const item = document.createElement(interactive ? 'button' : 'span');
            item.className = 'market-ticker-item';
            if (interactive) {
                item.type = 'button';
                item.dataset.tickerSymbol = market.symbol;
                item.setAttribute('aria-label', `Select ${market.label}`);
            }

            const pair = document.createElement('span');
            pair.className = 'market-ticker-pair';
            pair.textContent = market.pair.replace(/USDT$/, '/USDT');
            const price = document.createElement('strong');
            price.className = 'market-ticker-price';
            price.textContent = '—';
            const change = document.createElement('span');
            change.className = 'market-ticker-change';
            change.textContent = '—';
            item.append(pair, price, change);
            return { item, price, change };
        }

        function initializeMarketPriceTicker() {
            const track = document.getElementById('market-ticker-track');
            if (!track) return;
            const markets = marketsData.filter(market =>
                market.enabled !== false && market.source === 'BINANCE_SPOT' && market.pair && market.symbol
            );
            marketTickerItems = new Map();
            track.replaceChildren();

            const primaryGroup = document.createElement('div');
            primaryGroup.className = 'market-ticker-group';
            const repeatedGroup = document.createElement('div');
            repeatedGroup.className = 'market-ticker-group';
            repeatedGroup.setAttribute('aria-hidden', 'true');

            markets.forEach(market => {
                const primary = createMarketTickerItem(market, true);
                const repeated = createMarketTickerItem(market, false);
                marketTickerItems.set(market.pair, [primary, repeated]);
                primaryGroup.append(primary.item);
                repeatedGroup.append(repeated.item);
            });
            track.append(primaryGroup, repeatedGroup);
            track.addEventListener('click', event => {
                const button = event.target.closest('[data-ticker-symbol]');
                if (!button) return;
                if (tradingMarketMode !== 'CRYPTO') switchTradingMarketMode('CRYPTO');
                const select = document.getElementById('order-symbol');
                if (select && select.value !== button.dataset.tickerSymbol) {
                    select.value = button.dataset.tickerSymbol;
                    onSymbolChanged(select.value);
                }
            });
            connectMarketDataStream();
        }

        function connectMarketDataStream() {
            if (marketDataStream || !dashboardAuthenticated || walletSoftLocked) return;
            const controller = new AbortController();
            marketDataStream = controller;
            const connect = async () => {
                try {
                    const response = await walletFetch('/api/market-data/stream', {
                        signal: controller.signal
                    });
                    if (response.status === 401) {
                        lockDashboard('Your wallet session expired. Sign in again to continue.');
                        return;
                    }
                    if (response.status === 423) {
                        setWalletSoftLockState(true);
                        return;
                    }
                    if (!response.ok) throw new Error(`Market data stream failed (${response.status}).`);
                    if (!response.body) throw new Error('Market data streaming is unavailable in this browser.');

                    const status = document.getElementById('market-ticker-status');
                    if (status) status.textContent = 'LIVE · SERVER MARKET DATA';
                    const forexStatus = document.getElementById('market-hours-status');
                    const selectedMarket = marketsData.find(market => market.symbol === document.getElementById('order-symbol')?.value);
                    if (forexStatus && selectedMarket?.asset_class === 'FOREX') forexStatus.lastChild.textContent = 'SWISSQUOTE · LIVE';

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    while (!controller.signal.aborted) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const frames = buffer.split(/\r?\n\r?\n/);
                        buffer = frames.pop() || '';
                        for (const frame of frames) {
                            const data = frame.split(/\r?\n/)
                                .filter(line => line.startsWith('data:'))
                                .map(line => line.slice(5).trimStart())
                                .join('\n');
                            if (!data) continue;
                            try {
                                applyMarketDataQuote(JSON.parse(data));
                            } catch (error) {
                                console.warn('Invalid server market data update:', error);
                            }
                        }
                    }
                } catch (error) {
                    if (controller.signal.aborted) return;
                    const status = document.getElementById('market-ticker-status');
                    if (status) status.textContent = 'Reconnecting to server market data';
                    const forexStatus = document.getElementById('market-hours-status');
                    const selectedMarket = marketsData.find(market => market.symbol === document.getElementById('order-symbol')?.value);
                    if (forexStatus && selectedMarket?.asset_class === 'FOREX') forexStatus.lastChild.textContent = 'FOREX · RECONNECTING';
                    console.warn('Market data stream disconnected:', error);
                } finally {
                    if (marketDataStream === controller) marketDataStream = null;
                    if (!controller.signal.aborted && dashboardAuthenticated && !walletSoftLocked) {
                        marketDataReconnectTimer = setTimeout(connectMarketDataStream, 3000);
                    }
                }
            };
            connect();
        }

        function disconnectMarketDataStream() {
            if (marketDataReconnectTimer) {
                clearTimeout(marketDataReconnectTimer);
                marketDataReconnectTimer = null;
            }
            marketDataStream?.abort();
            marketDataStream = null;
        }

        function setWalletSoftLockState(locked) {
            walletSoftLocked = locked === true;
            document.body.classList.toggle('wallet-soft-locked', walletSoftLocked);
            const warning = document.getElementById('wallet-security-warning');
            if (warning) warning.hidden = !walletSoftLocked;
            if (walletSoftLocked) disconnectMarketDataStream();
            else connectMarketDataStream();
        }

        function applyMarketDataQuote(update) {
            const market = [...cryptoMarketsData, ...forexMarketsData].find(item => item.symbol === update?.symbol);
            const price = Number(update?.price);
            const publishTime = Number(update?.publishedAt ?? update?.publishTime);
            if (!market || !Number.isFinite(price) || price <= 0 || !Number.isFinite(publishTime)) return;
            const quote = {
                ...update,
                price,
                bid: Number(update.bid),
                ask: Number(update.ask),
                publishTime
            };
            marketQuotesBySymbol.set(market.symbol, quote);

            const tickerItems = marketTickerItems.get(market.pair);
            if (tickerItems && Number.isFinite(Number(update.priceChangePercent))) {
                const formattedPrice = new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: 'USD',
                    maximumSignificantDigits: 8
                }).format(price);
                const change = Number(update.priceChangePercent);
                const formattedChange = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                tickerItems.forEach(item => {
                    item.price.textContent = formattedPrice;
                    item.change.textContent = formattedChange;
                    item.change.classList.toggle('is-positive', change > 0);
                    item.change.classList.toggle('is-negative', change < 0);
                });
            }

            if (market.symbol !== document.getElementById('order-symbol')?.value) {
                calculateMetrics();
                updateDisplayedOpenTradePnls(currentLivePrice);
                return;
            }
            const status = document.getElementById('market-hours-status');
            if (status && market.asset_class === 'FOREX') {
                status.lastChild.textContent = Date.now() - publishTime > 30000
                    ? 'MARKET CLOSED · LAST QUOTE'
                    : 'SWISSQUOTE · LIVE';
            }
            currentLivePrice = price;
            updateMarketTabTitle(price, market.pair);
            updateLiveMarketChart(market.pair, price, publishTime);
            if (market.asset_class === 'FOREX') renderForexChartStats(market, quote);
            else renderChartMarketStats(quote);
            const priceInput = document.getElementById('order-price');
            if (priceInput && !userHasEditedPrice) {
                priceInput.value = price;
                if (document.getElementById('order-type')?.value === 'LIMIT') userHasEditedPrice = true;
                calculateMetrics();
            }
            updateDisplayedOpenTradePnls(price);
            monitorClientStops();
        }

        function renderChartMarketStats(ticker) {
            if (!ticker) return;
            const selectedMarket = marketsData.find(market => market.symbol === document.getElementById('order-symbol')?.value);
            const isForex = selectedMarket?.asset_class === 'FOREX';
            const pipSize = Number(selectedMarket?.pip_size);
            const pricePrecision = isForex && Number.isFinite(pipSize) && pipSize > 0
                ? Math.min(8, Math.ceil(-Math.log10(pipSize)) + 1)
                : 2;
            const priceStyle = isForex ? 'number' : 'currency';
            const bidPrice = Number(ticker.bidPr ?? ticker.bidPrice ?? ticker.bid);
            const askPrice = Number(ticker.askPr ?? ticker.askPrice ?? ticker.ask);
            const lastPrice = Number(ticker.lastPr ?? ticker.lastPrice ?? ticker.price);
            const midPrice = Number.isFinite(bidPrice) && bidPrice > 0 && Number.isFinite(askPrice) && askPrice > 0
                ? (bidPrice + askPrice) / 2
                : lastPrice;
            const bidAsk = Number.isFinite(bidPrice) && bidPrice > 0 && Number.isFinite(askPrice) && askPrice > 0
                ? `${formatMarketStat(bidPrice, priceStyle, pricePrecision)} / ${formatMarketStat(askPrice, priceStyle, pricePrecision)}`
                : '—';
            const changePct = Number(ticker.priceChangePercent ?? (Number(ticker.change24h) * 100));
            const volumeUsd = Number(ticker.usdtVolume ?? ticker.quoteVolume);
            const highPrice = Number(ticker.highPrice ?? ticker.high24h);
            const lowPrice = Number(ticker.lowPrice ?? ticker.low24h);
            const volumeCard = document.getElementById('chart-volume-24h')?.parentElement;
            if (volumeCard) volumeCard.hidden = isForex;
            const stats = [
                ['chart-mid-price', formatMarketStat(midPrice, priceStyle, pricePrecision)],
                ['chart-bid-ask', bidAsk],
                ['chart-change-24h', formatMarketStat(changePct, 'percent')],
                ['chart-high-24h', formatMarketStat(highPrice, priceStyle, pricePrecision)],
                ['chart-low-24h', formatMarketStat(lowPrice, priceStyle, pricePrecision)],
                ['chart-volume-24h', formatMarketStat(volumeUsd, 'compactCurrency')]
            ];
            stats.forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
            const change = document.getElementById('chart-change-24h');
            if (change && Number.isFinite(changePct)) {
                change.classList.toggle('is-positive', changePct > 0);
                change.classList.toggle('is-negative', changePct < 0);
            }
        }

        function startPricePolling() {
            connectMarketDataStream();
        }

        function updateOrderType(orderType) {
            const normalizedOrderType = String(orderType || 'MARKET').toUpperCase() === 'LIMIT' ? 'LIMIT' : 'MARKET';
            const isLimit = normalizedOrderType === 'LIMIT';
            const orderTypeInput = document.getElementById('order-type');
            if (orderTypeInput) orderTypeInput.value = normalizedOrderType;
            document.querySelectorAll('[data-order-type]').forEach(button => {
                const isSelected = button.dataset.orderType === normalizedOrderType;
                button.classList.toggle('is-active', isSelected);
                button.setAttribute('aria-pressed', String(isSelected));
            });

            const tradeListTitle = document.getElementById('trade-list-title');
            const tradeListDescription = document.getElementById('trade-list-description');
            if (tradeListTitle) tradeListTitle.textContent = isLimit ? 'Pending Limit Orders' : 'Open Positions & PnL';
            if (tradeListDescription) {
                tradeListDescription.textContent = isLimit
                    ? 'Manage unfilled limit orders. Filled orders move to Market Positions.'
                    : 'Manage filled positions and their live PnL, including filled limit orders.';
            }
            const buyButton = document.getElementById('order-buy-button');
            const sellButton = document.getElementById('order-sell-button');
            if (buyButton) buyButton.textContent = isLimit ? 'Place Buy Limit' : 'Execute Buy / Long';
            if (sellButton) sellButton.textContent = isLimit ? 'Place Sell Limit' : 'Execute Sell / Short';

            const priceLabel = document.getElementById('order-price-label');
            const priceInput = document.getElementById('order-price');
            if (priceLabel) {
                priceLabel.textContent = isLimit
                    ? 'Limit price (Buy fills at/below; Sell fills at/above)'
                    : 'Live Reference Price (orders use a fresh quote)';
            }
            if (priceInput) {
                priceInput.placeholder = isLimit ? 'Set trigger price' : 'Current market price';
                if (isLimit) {
                    if (currentLivePrice > 0 && !userHasEditedPrice) priceInput.value = currentLivePrice;
                    userHasEditedPrice = true;
                } else {
                    userHasEditedPrice = false;
                    if (currentLivePrice > 0) priceInput.value = currentLivePrice;
                }
            }
            calculateMetrics();
            renderChartTradeOverlays(displayedOpenTrades);
            if (selectedAccountId) {
                loadOpenTrades(selectedAccountId).catch(error => console.error('Failed to refresh trade terminal:', error));
            } else {
                const tbody = document.getElementById('open-trades-list');
                if (tbody) {
                    const emptyMessage = isLimit
                        ? 'Select an account to view pending limit orders.'
                        : 'Select an account to view open positions.';
                    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #6b7280; padding: 24px;">${emptyMessage}</td></tr>`;
                }
            }
        }

        function updateForexTicketLabels() {
            const isForex = tradingMarketMode === 'FOREX';
            const sizeLabel = document.getElementById('order-size-label');
            const sizeInput = document.getElementById('order-size-usd');
            const shortcuts = document.getElementById('order-size-shortcuts');
            const marketHours = document.getElementById('market-hours-status');
            const selectedMarket = marketsData.find(market => market.symbol === document.getElementById('order-symbol')?.value);
            if (sizeLabel) sizeLabel.textContent = isForex ? 'Base position size (lots at 1x)' : 'Collateral Margin ($ USD)';
            if (sizeInput) {
                sizeInput.min = isForex ? '0.01' : '10';
                sizeInput.step = isForex ? '0.01' : 'any';
                sizeInput.placeholder = isForex ? '0.10' : '500';
            }
            if (shortcuts) shortcuts.hidden = isForex;
            if (marketHours) {
                marketHours.setAttribute('aria-label', isForex ? 'Forex majors trade 24 hours a day, five days a week' : 'Crypto markets trade 24/7/365');
                marketHours.title = isForex
                    ? 'Forex prices are provided by Swissquote and may be stale while markets are closed.'
                    : 'Crypto markets trade continuously. Exchange or platform maintenance may temporarily affect access.';
                const text = marketHours.lastChild;
                if (text) text.textContent = isForex ? 'SWISSQUOTE · FOREX 24/5' : '24/7 TRADING LIVE';
            }
            const pipSize = Number(selectedMarket?.pip_size);
            const priceInput = document.getElementById('order-price');
            if (priceInput && isForex) {
                priceInput.step = pipSize === 0.01 ? '0.001' : '0.00001';
            } else if (priceInput) {
                priceInput.removeAttribute('step');
            }
            toggleStopAmountMode(document.getElementById('order-sl-tp-amount-mode')?.checked === true);
            calculateMetrics();
        }

        function onPriceInputChanged() {
            userHasEditedPrice = true;
            const orderTypeInput = document.getElementById('order-type');
            if (orderTypeInput?.value === 'MARKET') {
                orderTypeInput.value = 'LIMIT';
                updateOrderType('LIMIT');
                return;
            }
            calculateMetrics();
        }

        function updateLeverageDisplay(val) {
            const lbl = document.getElementById('leverage-label');
            if (lbl) lbl.innerText = val == "1" ? "1x Spot Mode" : `${val}x Leverage Mode`;
            const liquidationMetric = document.getElementById('order-liquidation-metric');
            const orderMetrics = document.getElementById('order-metrics');
            if (liquidationMetric) liquidationMetric.hidden = Number(val) <= 1;
            if (orderMetrics) orderMetrics.classList.toggle('is-leveraged', Number(val) > 1);
            calculateMetrics();
        }

        function toggleStopAmountMode(enabled) {
            const stopLabel = document.getElementById('order-sl-label');
            const targetLabel = document.getElementById('order-tp-label');
            const help = document.getElementById('order-sl-tp-mode-help');
            const stopInput = document.getElementById('order-sl');
            const targetInput = document.getElementById('order-tp');
            const isForex = tradingMarketMode === 'FOREX';
            if (stopLabel) stopLabel.textContent = enabled ? 'Stop Loss amount ($ P&L)' : (isForex ? 'Stop Loss distance (pips)' : 'Stop Loss trigger price (SL)');
            if (targetLabel) targetLabel.textContent = enabled ? 'Take Profit amount ($ P&L)' : (isForex ? 'Take Profit distance (pips)' : 'Take Profit trigger price (TP)');
            if (help) {
                help.textContent = enabled
                    ? 'Enter loss and profit amounts'
                    : isForex ? 'Off: enter pip distances' : 'Off: enter trigger prices';
            }
            if (stopInput) stopInput.placeholder = enabled ? 'Loss amount ($)' : isForex ? 'Pips' : 'Trigger price';
            if (targetInput) targetInput.placeholder = enabled ? 'Profit amount ($)' : isForex ? 'Pips' : 'Trigger price';
        }

        function getClientForexQuoteToUsdRate(quoteCurrency) {
            const currency = String(quoteCurrency || '').toUpperCase();
            if (currency === 'USD') return 1;
            const conversion = {
                EUR: ['FX:EURUSD', false],
                GBP: ['FX:GBPUSD', false],
                AUD: ['FX:AUDUSD', false],
                NZD: ['FX:NZDUSD', false],
                JPY: ['FX:USDJPY', true],
                CHF: ['FX:USDCHF', true],
                CAD: ['FX:USDCAD', true]
            }[currency];
            const rate = marketQuotesBySymbol.get(conversion?.[0])?.price;
            if (!Number.isFinite(rate) || rate <= 0) return currency === 'USD' ? 1 : NaN;
            return conversion[1] ? 1 / rate : rate;
        }

        function calculateMetrics() {
            const sizeInput = parseFloat(document.getElementById('order-size-usd')?.value) || 0;
            const leverage = parseInt(document.getElementById('order-leverage')?.value) || 1;
            const priceInputVal = parseFloat(document.getElementById('order-price')?.value) || currentLivePrice || 0;
            const selectedMarket = marketsData.find(market => market.symbol === document.getElementById('order-symbol')?.value);
            const isForex = selectedMarket?.asset_class === 'FOREX';
            let marginInput = sizeInput;
            let notional = marginInput * leverage;
            if (isForex && selectedMarket) {
                const quoteToUsd = getClientForexQuoteToUsdRate(selectedMarket.quote_currency);
                const units = sizeInput * leverage * Number(selectedMarket.lot_units);
                notional = Number.isFinite(quoteToUsd) ? units * priceInputVal * quoteToUsd : 0;
                marginInput = notional / leverage;
            }

            const notionalLabel = document.getElementById('notional-exposure-label');
            if (notionalLabel) notionalLabel.innerText = `$${notional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const marginLabel = document.getElementById('position-margin-label');
            if (marginLabel) {
                const forexLots = sizeInput * leverage;
                const marginText = `Margin: $${marginInput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                marginLabel.innerText = isForex
                    ? `${forexLots.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lots at ${leverage}x · ${marginText}`
                    : marginText;
            }

            const liqLabel = document.getElementById('liquidation-price-label');
            if (liqLabel) {
                if (priceInputVal > 0 && marginInput > 0 && leverage > 1) {
                    const estLiqPriceLong = priceInputVal * (1 - (1 / leverage) * 0.9);
                    liqLabel.innerText = `$${estLiqPriceLong.toFixed(2)}`;
                } else {
                    liqLabel.innerText = '—';
                }
            }
            updateAvailableBalanceLabel(marginInput);
        }

        function switchView(viewId) {
            if (!dashboardAuthenticated || !walletSessionToken ||
                walletSessionOwner !== getConnectedWalletOwnerKey() ||
                walletSessionExpiresAt <= Date.now()) {
                lockDashboard();
                return;
            }
            if (currentWalletIsSupport && !currentWalletIsAdmin) viewId = 'supportStaffView';
            const requestedViewId = viewId;
            const pageId = maintenanceViewPages[viewId];
            if (pageId && maintenanceStatuses[pageId] && !currentWalletIsAdmin) {
                renderMaintenanceView(pageId);
                viewId = 'maintenanceView';
            }
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
            
            const targetPanel = document.getElementById(viewId);
            if (targetPanel) targetPanel.classList.add('active');

            const activeTab = Array.from(document.querySelectorAll('#nav-menu .nav-tab')).find(t => t.getAttribute('onclick')?.includes(requestedViewId));
            if (activeTab) activeTab.classList.add('active');
            const dashboardTab = Array.from(document.querySelectorAll('#nav-menu [data-dashboard-view]')).find(tab => tab.dataset.dashboardView === requestedViewId);
            if (dashboardTab) dashboardTab.classList.add('active');
            if (requestedViewId === 'tradeView') {
                document.querySelector(`[data-trade-market-mode="${tradingMarketMode}"]`)?.classList.add('active');
            }
            document.querySelectorAll('#nav-menu .nav-dropdown').forEach(dropdown => {
                dropdown.classList.toggle('has-active', Boolean(dropdown.querySelector('.nav-tab.active')));
                dropdown.removeAttribute('open');
            });

            toggleMobileMenu(true);

            if (viewId === 'adminView') {
                loadAdminOperationsDashboard();
                loadAdminWithdrawals();
                loadAdminHedgingAlerts();
                loadAdminPlans();
                loadAdminTickets();
                loadAdminReviews();
                loadAdminSupportStaff();
                if (document.getElementById('admin-creators-panel')?.hidden === false) {
                    loadAdminCreatorApplications();
                    loadAdminPromoManagement();
                }
                if (document.getElementById('admin-battlepass-panel')?.hidden === false) loadAdminBattlePass();
                if (document.getElementById('admin-maintenance-panel')?.hidden === false) loadAdminMaintenanceSettings();
            }
            else if (viewId === 'supportStaffView') {
                switchSupportStaffSection('tickets');
            }
            else if (viewId === 'leaderboardView') loadLeaderboard(currentLeaderboardMode);
            else if (viewId === 'accountsView' && connectedWallet) loadUserAccounts(connectedWallet);
            else if (viewId === 'copyTradingView' && connectedWallet) loadCopyTradingPage();
            else if (viewId === 'blastrrPassView' && connectedWallet) loadBattlePass();
        }

        async function loadMaintenanceStatus() {
            try {
                const response = await fetch('/api/maintenance/status');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load maintenance status.');
                maintenanceStatuses = Object.fromEntries(
                    (data.pages || []).map(page => [page.page_id, Number(page.is_offline) === 1])
                );
                maintenanceMessage = data.outage_message || '';
                updateMaintenanceNavigation();
                const activeView = document.querySelector('.view-panel.active')?.id;
                const activePageId = maintenanceViewPages[activeView];
                if (activePageId && maintenanceStatuses[activePageId] && !currentWalletIsAdmin &&
                    dashboardAuthenticated && activeView !== 'maintenanceView') {
                    switchView(activeView);
                }
            } catch (error) {
                console.error('Unable to load maintenance status:', error);
            }
        }

        function updateMaintenanceNavigation() {
            document.querySelectorAll('[data-maintenance-page]').forEach(link => {
                const offline = maintenanceStatuses[link.dataset.maintenancePage];
                link.hidden = Boolean(offline && !currentWalletIsAdmin);
            });
        }

        function renderMaintenanceView(pageId) {
            const title = document.getElementById('maintenance-view-title');
            const message = document.getElementById('maintenance-view-message');
            if (title) title.textContent = `${maintenancePageLabels[pageId] || 'This service'} is temporarily unavailable`;
            if (message) message.textContent = maintenanceMessage || 'This service is temporarily unavailable while we make updates.';
        }

        function switchAdminSection(panelId) {
            const sections = [
                ['admin-operations-panel', 'admin-operations-tab'],
                ['admin-support-inbox-panel', 'admin-support-tab'],
                ['admin-creators-panel', 'admin-creators-tab'],
                ['admin-battlepass-panel', 'admin-battlepass-tab'],
                ['admin-maintenance-panel', 'admin-maintenance-tab']
            ];
            if (!sections.some(([id]) => id === panelId)) return;
            sections.forEach(([id, tabId]) => {
                const selected = id === panelId;
                const panel = document.getElementById(id);
                const tab = document.getElementById(tabId);
                if (panel) panel.hidden = !selected;
                tab?.classList.toggle('active', selected);
                tab?.setAttribute('aria-selected', String(selected));
            });
            if (panelId === 'admin-creators-panel') {
                loadAdminCreatorApplications();
                loadAdminPromoManagement();
            }
            if (panelId === 'admin-support-inbox-panel') loadAdminTickets();
            if (panelId === 'admin-battlepass-panel') loadAdminBattlePass();
            if (panelId === 'admin-maintenance-panel') loadAdminMaintenanceSettings();
        }

        function setSupportStaffWorkspace(enabled) {
            document.body.classList.toggle('support-staff-mode', enabled);
            const supportNav = document.getElementById('support-nav-item');
            const supportView = document.getElementById('supportStaffView');
            if (supportNav) supportNav.hidden = !enabled;
            if (supportView) supportView.hidden = !enabled;
            const adminNav = document.getElementById('admin-nav-item');
            if (adminNav) adminNav.style.display = currentWalletIsAdmin ? 'inline-block' : 'none';
        }

        function switchSupportStaffSection(section) {
            if (!['tickets', 'reviews'].includes(section)) return;
            const ticketsSelected = section === 'tickets';
            const ticketsPanel = document.getElementById('support-staff-tickets-panel');
            const reviewsPanel = document.getElementById('support-staff-reviews-panel');
            const ticketsTab = document.getElementById('support-staff-tickets-tab');
            const reviewsTab = document.getElementById('support-staff-reviews-tab');
            if (ticketsPanel) ticketsPanel.hidden = !ticketsSelected;
            if (reviewsPanel) reviewsPanel.hidden = ticketsSelected;
            ticketsTab?.classList.toggle('active', ticketsSelected);
            reviewsTab?.classList.toggle('active', !ticketsSelected);
            ticketsTab?.setAttribute('aria-selected', String(ticketsSelected));
            reviewsTab?.setAttribute('aria-selected', String(!ticketsSelected));
            if (ticketsSelected) loadSupportStaffTickets();
            else loadSupportStaffReviews();
        }

        function switchProfileSection(panelId) {
            const sections = [
                ['profile-referrals-panel', 'profile-referrals-tab'],
                ['profile-promo-panel', 'profile-promo-tab'],
                ['profile-creator-panel', 'profile-creator-tab'],
                ['profile-support-panel', 'profile-support-tab'],
                ['profile-reviews-panel', 'profile-reviews-tab'],
                ['profile-achievements-panel', 'profile-achievements-tab']
            ];
            if (!sections.some(([id]) => id === panelId)) return;
            sections.forEach(([id, tabId]) => {
                const selected = id === panelId;
                const panel = document.getElementById(id);
                const tab = document.getElementById(tabId);
                if (panel) panel.hidden = !selected;
                tab?.classList.toggle('active', selected);
                tab?.setAttribute('aria-selected', String(selected));
            });
            if (panelId === 'profile-support-panel' && connectedWallet) loadUserTickets(connectedWallet);
            if (['profile-referrals-panel', 'profile-promo-panel'].includes(panelId) && connectedWallet) {
                loadReferralTransactions(connectedWallet);
            }
            if (panelId === 'profile-achievements-panel' && connectedWallet) loadWithdrawalCertificates();
        }

        function battlePassLevelForXp(xp) {
            return Math.min(12, Math.floor(Math.max(0, Number(xp) || 0) / 10000));
        }

        function compactBattlePassXp(xp) {
            const value = Math.max(0, Number(xp) || 0);
            return value >= 1000 ? `${Math.floor(value / 1000)}k` : String(value);
        }

        function setBattlePassAvatar(container, imageUrl, username) {
            if (!container) return;
            container.replaceChildren();
            const fallback = document.createElement('span');
            fallback.textContent = (username || 'B').charAt(0).toUpperCase();
            container.append(fallback);
            const defaultImageUrl = '/favicon.png';
            const image = document.createElement('img');
            image.src = imageUrl || defaultImageUrl;
            image.alt = imageUrl ? `${username || 'Trader'} profile` : 'Blastrr';
            image.addEventListener('error', () => {
                if (imageUrl) {
                    imageUrl = '';
                    image.src = defaultImageUrl;
                    image.alt = 'Blastrr';
                    const feedback = document.getElementById('battlepass-profile-feedback');
                    if (feedback) feedback.textContent = 'The saved image could not be loaded. Showing the Blastrr default image instead.';
                } else {
                    image.remove();
                }
            });
            container.append(image);
        }

        function validateBattlePassImageUrl(imageUrl) {
            return new Promise((resolve, reject) => {
                const image = new Image();
                const timeout = setTimeout(() => {
                    image.src = '';
                    reject(new Error('The image took too long to load. Check the direct image URL and try again.'));
                }, 15000);
                image.onload = () => {
                    clearTimeout(timeout);
                    if (image.naturalWidth > 0) resolve();
                    else reject(new Error('That URL did not load a usable image. Use the direct image address, not a Google Images results page.'));
                };
                image.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('That URL did not load as an image. Open the image itself and copy its direct image address, not the Google Images page URL.'));
                };
                image.referrerPolicy = 'strict-origin-when-cross-origin';
                image.src = imageUrl;
            });
        }

        async function loadBattlePass() {
            const note = document.getElementById('battlepass-wallet-note');
            if (!connectedWallet) {
                if (note) note.textContent = 'Connect your wallet to view your XP, points, tasks, and level titles.';
                return;
            }
            if (note) note.textContent = 'Loading your BlastrrPass...';
            try {
                const response = await walletFetch(`/api/battlepass?wallet=${encodeURIComponent(connectedWallet)}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load your BlastrrPass.');
                battlePassProfile = data.profile;
                battlePassTasks = data.tasks || [];
                battlePassLevels = data.levels || [];
                const [packsResponse, vaultResponse] = await Promise.all([
                    walletFetch('/api/battlepass/packs'),
                    walletFetch('/api/battlepass/vault')
                ]);
                const [packsData, vaultData] = await Promise.all([packsResponse.json(), vaultResponse.json()]);
                if (!packsResponse.ok) throw new Error(packsData.error || 'Unable to load Battle Pass packs.');
                if (!vaultResponse.ok) throw new Error(vaultData.error || 'Unable to load your reward vault.');
                battlePassPacks = packsData.packs || [];
                battlePassProfile.points = Number(packsData.points ?? battlePassProfile.points);
                battlePassVault = {
                    rewards: vaultData.rewards || [],
                    certificates: vaultData.certificates || [],
                    promotional_packs: vaultData.promotional_packs || []
                };
                if (note) note.textContent = '';
                renderBattlePass();
            } catch (error) {
                console.error(error);
                if (note) note.textContent = error.message || 'Unable to load your BlastrrPass.';
            }
        }

        function renderBattlePass() {
            if (!battlePassProfile) return;
            const profileCard = document.getElementById('battlepass-profile-card');
            const profileForm = document.getElementById('battlepass-profile-form');
            const username = battlePassProfile.username || connectedWallet || 'Trader';
            const shareButton = document.getElementById('battlepass-share');
            const xp = Number(battlePassProfile.xp || 0);
            const points = Number(battlePassProfile.points || 0);
            const level = Number(battlePassProfile.level ?? battlePassLevelForXp(xp));
            const rank = level ? `Level ${level}` : 'Unranked';
            if (profileCard) profileCard.hidden = false;
            if (profileForm) profileForm.hidden = false;
            if (shareButton) {
                shareButton.disabled = !battlePassProfile.username;
                shareButton.title = battlePassProfile.username ? '' : 'Set up a profile username before sharing.';
            }
            document.getElementById('battlepass-username').textContent = `@${username}`;
            document.getElementById('battlepass-rank').textContent = rank;
            document.getElementById('battlepass-title').textContent = battlePassProfile.title || 'No title claimed';
            document.getElementById('battlepass-xp').textContent = xp.toLocaleString();
            document.getElementById('battlepass-points').textContent = points.toLocaleString();
            const progressLabel = document.getElementById('battlepass-progress-label');
            const withinLevel = Math.min(10000, Math.max(0, xp - level * 10000));
            if (progressLabel) {
                progressLabel.textContent = level >= 12
                    ? `${xp.toLocaleString()} XP · max level`
                    : `${withinLevel.toLocaleString()} / 10,000 XP to Level ${level + 1}`;
            }
            const segments = document.getElementById('battlepass-level-segments');
            if (segments) {
                segments.innerHTML = Array.from({ length: 12 }, (_, index) => {
                    const earnedFraction = index < level ? 1 : index === level && level < 12 ? withinLevel / 10000 : 0;
                    return `<span class="battlepass-level-segment"><i style="width:${earnedFraction * 100}%"></i></span>`;
                }).join('');
                segments.setAttribute('aria-label', `${level} levels completed, ${withinLevel.toLocaleString()} of 10,000 XP toward the next level`);
            }
            const imageInput = document.getElementById('battlepass-profile-image');
            if (imageInput && document.activeElement !== imageInput) imageInput.value = battlePassProfile.profile_image_url || '';
            setBattlePassAvatar(document.getElementById('battlepass-avatar-wrap'), battlePassProfile.profile_image_url, username);
            setBattlePassAvatar(document.getElementById('profile-battlepass-avatar'), battlePassProfile.profile_image_url, username);
            renderBattlePassTasks();
            renderBattlePassLevels();
            renderBattlePassShop();
            renderBattlePassVault();
            selectBattlePassTab(battlePassActiveTab);
        }

        const BATTLE_PASS_PACK_SPRITE = '/images/battlepass/packs/reward-pack-sprite.svg';
        const BATTLE_PASS_PACK_ARTWORK = Object.freeze({
            paper: { symbol: 'paper-pack', viewBox: '100 70 320 460', accent: '#cbd5e1' },
            wood: { symbol: 'wood-pack', viewBox: '590 70 320 460', accent: '#d7aa7d' },
            copper: { symbol: 'copper-pack', viewBox: '1080 70 320 460', accent: '#f0a36c' },
            bronze: { symbol: 'bronze-pack', viewBox: '100 670 320 460', accent: '#e4a17b' },
            iron: { symbol: 'iron-pack', viewBox: '590 670 320 460', accent: '#aeb8c6' },
            steel: { symbol: 'steel-pack', viewBox: '1080 670 320 460', accent: '#d5e0ed' },
            titanium: { symbol: 'titanium-pack', viewBox: '100 1270 320 460', accent: '#a9d8e8' },
            silver: { symbol: 'silver-pack', viewBox: '590 1270 320 460', accent: '#e3e7ed' },
            gold: { symbol: 'gold-pack', viewBox: '1080 1270 320 460', accent: '#ffe7a0' }
        });

        function getBattlePassPackArtwork(packName) {
            const tierName = String(packName || '').trim().replace(/\s+pack$/i, '').toLowerCase();
            return BATTLE_PASS_PACK_ARTWORK[tierName] || null;
        }

        function renderBattlePassPackArt(pack) {
            const artwork = getBattlePassPackArtwork(pack.name);
            return artwork
                ? `<svg class="battlepass-pack-art" viewBox="${artwork.viewBox}" aria-hidden="true" focusable="false"><use href="${BATTLE_PASS_PACK_SPRITE}#${artwork.symbol}"></use></svg>`
                : `<span class="battlepass-pack-fallback-mark" aria-hidden="true">✦</span><strong>${escapeHTML(pack.name)}</strong>`;
        }

        function renderBattlePassShop() {
            const container = document.getElementById('battlepass-pack-shop');
            const points = document.getElementById('battlepass-shop-points');
            const result = document.getElementById('battlepass-pack-reveal');
            if (!container) return;
            if (points) points.textContent = Number(battlePassProfile?.points || 0).toLocaleString();
            if (!battlePassPacks.length) {
                container.innerHTML = '<p class="account-chart-empty">No reward packs are available yet.</p>';
                battlePassSelectedPackId = null;
                return;
            }
            if (!battlePassPacks.some(pack => Number(pack.id) === Number(battlePassSelectedPackId))) {
                battlePassSelectedPackId = Number(battlePassPacks[0].id);
            }
            const selectedPack = battlePassPacks.find(pack => Number(pack.id) === Number(battlePassSelectedPackId)) || battlePassPacks[0];
            const selectedArtwork = getBattlePassPackArtwork(selectedPack.name);
            const pointBalance = Number(battlePassProfile?.points || 0);
            const selector = battlePassPacks.map(pack => {
                const selected = Number(pack.id) === Number(selectedPack.id);
                const outOfStock = Boolean(pack.out_of_stock);
                const artwork = getBattlePassPackArtwork(pack.name);
                return `<button class="battlepass-pack-selector-item${selected ? ' is-selected' : ''}${outOfStock ? ' is-out-of-stock' : ''}"
                    type="button" aria-pressed="${selected}" data-select-pack="${Number(pack.id)}" style="--pack-accent: ${artwork?.accent || '#a78bfa'}">
                    <span class="battlepass-pack-selector-art" aria-hidden="true">${renderBattlePassPackArt(pack)}</span>
                    <strong>${escapeHTML(pack.name)}</strong>
                    <small>${Number(pack.points_cost).toLocaleString()} points${outOfStock ? ' · sold out' : ''}</small>
                </button>`;
            }).join('');
            const selectedOutOfStock = Boolean(selectedPack.out_of_stock);
            const rewards = (selectedPack.rewards || []).map(reward => `
                <li><span class="battlepass-pack-reward-name">${escapeHTML(reward.name)}</span><strong>${Number(reward.odds).toLocaleString()}%</strong></li>
            `).join('');
            const detail = `
                <article class="battlepass-pack-detail${selectedOutOfStock ? ' is-out-of-stock' : ''}" data-pack-card="${Number(selectedPack.id)}" style="--pack-accent: ${selectedArtwork?.accent || '#a78bfa'}">
                    <div class="battlepass-pack-detail-art battlepass-pack-graphic" aria-hidden="true">${renderBattlePassPackArt(selectedPack)}</div>
                    <div class="battlepass-pack-copy">
                        <div class="battlepass-pack-heading">
                            <span class="battlepass-pack-eyebrow">Blastrr reward series · selected tier</span>
                            <h3>${escapeHTML(selectedPack.name)} Pack</h3>
                        </div>
                        <p class="battlepass-pack-description">A sealed reward, opened instantly. One item is drawn from this pack’s reward pool.</p>
                        <section class="battlepass-pack-odds" aria-label="Potential pulls">
                            <div class="battlepass-pack-odds-heading">
                                <div><h4>Potential pulls</h4><p>Rewards are awarded automatically</p></div>
                                <span>${Number(selectedPack.odds_total || 0).toLocaleString()}% total odds</span>
                            </div>
                            <ul>${rewards || '<li><span class="battlepass-pack-reward-name">Reward pool unavailable</span><strong>—</strong></li>'}</ul>
                        </section>
                        <div class="battlepass-pack-purchase">
                            <div class="battlepass-pack-price">
                                <span>Pack price</span>
                                <strong>${Number(selectedPack.points_cost).toLocaleString()} <small>points</small></strong>
                                <small>Balance: ${pointBalance.toLocaleString()} points</small>
                            </div>
                        ${selectedOutOfStock
                            ? `<span class="battlepass-out-of-stock" role="status">Out of stock</span>`
                            : `<button class="battlepass-pack-open" type="button" data-open-pack="${Number(selectedPack.id)}" ${pointBalance < Number(selectedPack.points_cost) ? 'disabled' : ''}>${pointBalance < Number(selectedPack.points_cost) ? 'Not enough points' : 'Buy & open pack'}</button>`}
                        </div>
                    </div>
                </article>`;
            container.innerHTML = `
                <div class="battlepass-pack-layout">
                    <div class="battlepass-pack-selector" role="group" aria-label="Choose a reward pack">${selector}</div>
                    ${detail}
                </div>`;
            container.onclick = event => {
                const selectorItem = event.target.closest('[data-select-pack]');
                if (selectorItem) {
                    const selectedPackId = Number(selectorItem.dataset.selectPack);
                    battlePassSelectedPackId = selectedPackId;
                    renderBattlePassShop();
                    container.querySelector(`[data-select-pack="${selectedPackId}"]`)?.focus({ preventScroll: true });
                    return;
                }
                const button = event.target.closest('[data-open-pack]');
                if (button && !button.disabled) openBattlePassPack(button);
            };
            if (result) {
                if (!lastPackReveal) {
                    result.replaceChildren();
                } else {
                    const reward = lastPackReveal.opening;
                    const copy = document.createElement('p');
                    copy.className = 'battlepass-pack-reveal-copy';
                    copy.textContent = `${lastPackReveal.pack_name}: ${reward.reward_name} — ${reward.reward_description}`;
                    result.replaceChildren(copy);
                    if (reward.reward_type === 'ACCOUNT') {
                        const detail = document.createElement('p');
                        detail.textContent = `${reward.quantity} account${reward.quantity === 1 ? '' : 's'} automatically allocated to your account.`;
                        result.append(detail);
                    } else if (reward.reward_type === 'DISCOUNT') {
                        const detail = document.createElement('p');
                        detail.textContent = `${lastPackReveal.certificates.length} single-use discount certificate${lastPackReveal.certificates.length === 1 ? '' : 's'} added to your vault.`;
                        result.append(detail);
                    } else if (reward.xp_awarded || reward.points_awarded) {
                        const detail = document.createElement('p');
                        detail.textContent = `Credited instantly: ${Number(reward.xp_awarded).toLocaleString()} XP and ${Number(reward.points_awarded).toLocaleString()} points.`;
                        result.append(detail);
                    }
                }
            }
        }

        function renderBattlePassVault() {
            const container = document.getElementById('battlepass-vault-rewards');
            const certificates = document.getElementById('battlepass-vault-certificates');
            const promotionalPacks = document.getElementById('battlepass-vault-promotional-packs');
            if (promotionalPacks) {
                promotionalPacks.innerHTML = battlePassVault.promotional_packs.length
                    ? battlePassVault.promotional_packs.map(pack => {
                        return `<article class="battlepass-vault-card battlepass-promotional-pack-card" data-promotional-pack-card="${escapeHTML(pack.id)}">
                            <div class="battlepass-pack-graphic" aria-hidden="true">${renderBattlePassPackArt({ name: pack.pack_name })}</div>
                            <div><strong>${escapeHTML(pack.pack_name)} Pack</strong><small>Promotional pack · received ${new Date(pack.created_at).toLocaleString()}</small></div>
                            <button class="battlepass-pack-open" type="button" data-open-promotional-pack="${escapeHTML(pack.id)}">Rip pack</button>
                        </article>`;
                    }).join('')
                    : '<p class="account-chart-empty">No unopened promotional packs.</p>';
                promotionalPacks.onclick = event => {
                    const button = event.target.closest('[data-open-promotional-pack]');
                    if (button && !button.disabled) openBattlePassPromotionalPack(button);
                };
            }
            if (container) {
                container.innerHTML = battlePassVault.rewards.length ? battlePassVault.rewards.map(reward => {
                    const details = reward.reward_type === 'ACCOUNT'
                        ? `${Number(reward.quantity)} account${Number(reward.quantity) === 1 ? '' : 's'} automatically allocated${reward.account_plan_name ? ` · ${escapeHTML(reward.account_plan_name)}` : ''}`
                        : reward.reward_type === 'DISCOUNT'
                            ? `${Number(reward.certificate_count)} discount certificate${Number(reward.certificate_count) === 1 ? '' : 's'} issued`
                            : `${Number(reward.xp_awarded).toLocaleString()} XP · ${Number(reward.points_awarded).toLocaleString()} points credited`;
                    return `<article class="battlepass-vault-card">
                        <div><strong>${escapeHTML(reward.reward_name)}</strong><small>${escapeHTML(reward.pack_name)} Pack · ${new Date(reward.created_at).toLocaleString()}</small></div>
                        <p>${escapeHTML(reward.reward_description)}</p>
                        <span>${details}</span>
                    </article>`;
                }).join('') : '<p class="account-chart-empty">Your reward history will appear here after you open a pack.</p>';
            }
            if (certificates) {
                certificates.innerHTML = battlePassVault.certificates.length ? battlePassVault.certificates.map(certificate => `
                    <article class="battlepass-certificate-card">
                        <div><strong>${Number(certificate.discount_pct)}% account discount</strong>
                            <small>${escapeHTML(certificate.eligible_plan_name || 'Any active account type')} · single use · wallet-bound</small></div>
                        <p>${escapeHTML(certificate.reward_description || '')}</p>
                        <code>${escapeHTML(certificate.code)}</code>
                        ${certificate.redeemed_at
                            ? '<span class="battlepass-certificate-used">Used</span>'
                            : `<button class="battlepass-task-action" type="button" data-use-certificate="${escapeHTML(certificate.code)}" data-certificate-plan="${certificate.eligible_plan_id == null ? '' : Number(certificate.eligible_plan_id)}">Use discount</button>`}
                    </article>
                `).join('') : '<p class="account-chart-empty">No unused discount certificates.</p>';
                certificates.onclick = event => {
                    const button = event.target.closest('[data-use-certificate]');
                    if (button) useBattlePassCertificate(button.dataset.useCertificate, button.dataset.certificatePlan);
                };
            }
        }

        async function openBattlePassPack(button) {
            const packCard = button.closest('[data-pack-card]');
            const pack = battlePassPacks.find(item => Number(item.id) === Number(button.dataset.openPack));
            if (!pack || !connectedWallet) return;
            button.disabled = true;
            button.textContent = 'Opening…';
            packCard?.querySelector('.battlepass-pack-graphic')?.classList.add('is-opening');
            if (packCard) packCard.setAttribute('aria-busy', 'true');
            const requestKey = window.crypto?.randomUUID
                ? window.crypto.randomUUID()
                : `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
            const requestStorageKey = `blastrr-pack-open:${getConnectedWalletOwnerKey()}:${pack.id}`;
            let stableRequestKey = requestKey;
            try {
                stableRequestKey = localStorage.getItem(requestStorageKey) || requestKey;
                localStorage.setItem(requestStorageKey, stableRequestKey);
            } catch (storageError) {
                console.warn('Unable to persist the pack-opening retry key:', storageError);
            }
            try {
                const [response] = await Promise.all([
                    walletFetch('/api/battlepass/packs/open', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pack_id: Number(pack.id), request_key: stableRequestKey })
                    }),
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches
                        ? Promise.resolve()
                        : new Promise(resolve => window.setTimeout(resolve, 900))
                ]);
                const data = await readApiJson(response, '/api/battlepass/packs/open');
                if (!response.ok) throw new Error(data.error || 'Unable to open this reward pack.');
                try {
                    localStorage.removeItem(requestStorageKey);
                } catch (storageError) {
                    console.warn('Unable to clear the completed pack-opening retry key:', storageError);
                }
                lastPackReveal = { ...data, pack_name: pack.name };
                battlePassActiveTab = 'shop';
                await loadBattlePass();
            } catch (error) {
                console.error(error);
                const feedback = document.getElementById('battlepass-shop-feedback');
                if (feedback) feedback.textContent = error.message || 'Unable to open this reward pack.';
                await loadBattlePass();
            } finally {
                if (packCard) packCard.removeAttribute('aria-busy');
            }
        }

        async function openBattlePassPromotionalPack(button) {
            const packCard = button.closest('[data-promotional-pack-card]');
            const feedback = document.getElementById('battlepass-vault-pack-feedback');
            const grantId = button.dataset.openPromotionalPack;
            if (!grantId || !connectedWallet) return;
            button.disabled = true;
            button.textContent = 'Opening…';
            packCard?.querySelector('.battlepass-pack-graphic')?.classList.add('is-opening');
            if (packCard) packCard.setAttribute('aria-busy', 'true');
            if (feedback) feedback.textContent = '';
            try {
                const [response] = await Promise.all([
                    walletFetch('/api/battlepass/promotional-packs/open', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ grant_id: grantId })
                    }),
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches
                        ? Promise.resolve()
                        : new Promise(resolve => window.setTimeout(resolve, 900))
                ]);
                const data = await readApiJson(response, '/api/battlepass/promotional-packs/open');
                if (!response.ok) throw new Error(data.error || 'Unable to open this promotional pack.');
                await loadBattlePass();
                if (feedback) feedback.textContent = `${data.opening.reward_name}: ${data.opening.reward_description}`;
            } catch (error) {
                console.error(error);
                if (feedback) feedback.textContent = error.message || 'Unable to open this promotional pack.';
                await loadBattlePass();
            } finally {
                if (packCard) packCard.removeAttribute('aria-busy');
            }
        }

        async function useBattlePassCertificate(code, planId) {
            if (!connectedWallet) return;
            switchView('buyView');
            activePromoCode = code;
            activePromoDetails = null;
            const codeInput = document.getElementById('applied-promo');
            if (codeInput) codeInput.value = code;
            renderPlans();
            await applyPromo();
            const eligiblePlan = Number(planId);
            if (eligiblePlan) {
                document.getElementById(`plan-buy-${eligiblePlan}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function renderBattlePassTasks() {
            const groups = {
                PURCHASES: document.getElementById('battlepass-purchases-tasks'),
                DAILY: document.getElementById('battlepass-daily-tasks'),
                WEEKLY: document.getElementById('battlepass-weekly-tasks'),
                MONTHLY: document.getElementById('battlepass-monthly-tasks'),
                ONCE: document.getElementById('battlepass-once-tasks')
            };
            Object.values(groups).forEach(container => { if (container) container.replaceChildren(); });
            for (const [cadence, container] of Object.entries(groups)) {
                if (!container) continue;
                const isPurchaseCategory = cadence === 'PURCHASES';
                const tasks = battlePassTasks.filter(task => isPurchaseCategory
                    ? ['PURCHASE_ANY', 'PURCHASE_PLAN'].includes(task.task_type)
                    : task.cadence === cadence && !['PURCHASE_ANY', 'PURCHASE_PLAN'].includes(task.task_type));
                const count = document.getElementById(`battlepass-${cadence.toLowerCase()}-count`);
                const steps = document.getElementById(`battlepass-${cadence.toLowerCase()}-progress`);
                if (count) {
                    const done = tasks.filter(task => task.claimed).length;
                    count.textContent = `${done} of ${tasks.length} done`;
                    if (steps) {
                        const segmentCount = Math.max(5, Math.min(10, tasks.length));
                        steps.innerHTML = Array.from({ length: segmentCount }, (_, index) =>
                            `<span class="${index < done ? 'is-complete' : ''}"></span>`
                        ).join('');
                    }
                }
                if (!tasks.length) {
                    container.innerHTML = isPurchaseCategory
                        ? '<p class="account-chart-empty">No purchase tasks are available.</p>'
                        : '<p class="account-chart-empty">No tasks in this period yet.</p>';
                    continue;
                }
                container.innerHTML = tasks.map(task => {
                    const url = typeof task.action_url === 'string' ? task.action_url : '';
                    const safeUrl = escapeHTML(url);
                    let xPostUrl = '';
                    try {
                        const parsedUrl = new URL(url);
                        if (['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(parsedUrl.hostname.toLowerCase()) &&
                            /^\/[^/]+\/status\/\d+/.test(parsedUrl.pathname)) xPostUrl = safeUrl;
                    } catch { /* Invalid action links are not rendered. */ }
                    const action = task.task_type === 'SOCIAL_CLICK' && url
                        ? `<a class="battlepass-task-action" href="${safeUrl}" target="_blank" rel="noopener noreferrer" data-task-link="${Number(task.id)}">${task.claimed ? 'Open task again' : 'Open task &amp; earn reward'}</a>`
                        : '';
                    const isJournalTask = ['JOURNAL_DAY', 'JOURNAL_WEEK', 'JOURNAL_MONTH'].includes(task.task_type);
                    const isPurchaseTask = ['PURCHASE_ANY', 'PURCHASE_PLAN'].includes(task.task_type);
                    const purchaseClaimCount = Number(task.eligible_purchase_count || 0);
                    const purchaseClaimLabel = purchaseClaimCount > 100
                        ? `Claim first 100 of ${purchaseClaimCount}`
                        : `Claim rewards (${purchaseClaimCount})`;
                    const state = task.task_type === 'PLATFORM_REVIEW'
                        ? task.claimed ? 'Earned once' : 'Automatically applied when you submit a review'
                        : isPurchaseTask && Number(task.eligible_purchase_count) > 0
                            ? `${Number(task.eligible_purchase_count)} account purchase${Number(task.eligible_purchase_count) === 1 ? '' : 's'} ready to claim`
                        : isPurchaseTask && Number(task.purchase_count) > 0
                            ? 'All eligible purchases claimed'
                        : isPurchaseTask
                            ? 'Make a new paid plan purchase to unlock'
                        : isJournalTask && !task.claimed && !task.eligible
                            ? `${Number(task.progress || 0)} of ${Number(task.progress_target || (task.task_type === 'JOURNAL_DAY' ? 1 : task.task_type === 'JOURNAL_WEEK' ? 5 : 0))} journal days`
                        : task.claimed ? 'Earned this period' : task.eligible ? 'Reward ready to claim' : 'Complete the activity to unlock';
                    const claimButton = !['SOCIAL_CLICK', 'PLATFORM_REVIEW'].includes(task.task_type) && !task.claimed
                        ? `<button class="btn-wallet" type="button" data-task-claim="${Number(task.id)}" ${task.eligible ? '' : 'disabled'}>${task.eligible ? isPurchaseTask ? purchaseClaimLabel : 'Claim reward' : 'Not ready'}</button>`
                        : '';
                    const reviewButton = task.task_type === 'PLATFORM_REVIEW' && !task.claimed
                        ? '<button class="battlepass-task-action" type="button" data-review-task>Write a review</button>'
                        : '';
                    const embed = xPostUrl
                        ? `<details class="battlepass-x-preview"><summary>Preview X post</summary><blockquote class="twitter-tweet"><a href="${xPostUrl}" target="_blank" rel="noopener noreferrer">View post on X</a></blockquote></details>`
                        : '';
                    const journalProgress = isJournalTask
                        ? `<div class="battlepass-journal-progress" role="progressbar" aria-label="Journal task progress" aria-valuemin="0" aria-valuemax="${Number(task.progress_target || (task.task_type === 'JOURNAL_DAY' ? 1 : task.task_type === 'JOURNAL_WEEK' ? 5 : 0))}" aria-valuenow="${Number(task.progress || 0)}"><i style="width:${Math.min(100, Number(task.progress || 0) / Number(task.progress_target || 1) * 100)}%"></i></div>`
                        : '';
                    return `<article class="battlepass-task dashboard-tile" data-battlepass-task="${Number(task.id)}">
                        <div class="battlepass-task-copy"><div class="battlepass-task-heading"><strong>${escapeHTML(task.title)}</strong>
                        <span class="battlepass-task-awards"><span><i class="battlepass-gem" aria-hidden="true">◆</i> +${Number(task.points_reward)}</span><span class="battlepass-award-divider"></span><span><i class="battlepass-xp-mark" aria-hidden="true">XP</i> +${Number(task.xp_reward).toLocaleString()}</span></span></div>
                        <p>${escapeHTML(task.description)}</p>${journalProgress}<div class="battlepass-task-action-row"><span class="battlepass-task-status ${task.claimed ? 'is-claimed' : task.eligible ? 'is-ready' : ''}">${state}</span>${embed}${action}${reviewButton}${claimButton}</div></div></article>`;
                }).join('');
                container.onclick = event => {
                    const button = event.target.closest('[data-task-claim]');
                    const link = event.target.closest('[data-task-link]');
                    const reviewLink = event.target.closest('[data-review-task]');
                    if (button && !button.disabled) claimBattlePassTask(button.dataset.taskClaim, button);
                    if (reviewLink) {
                        switchView('profileView');
                        switchProfileSection('profile-reviews-panel');
                    }
                    if (link && !link.closest('[data-battlepass-task]')?.querySelector('.battlepass-task-status.is-claimed')) {
                        claimBattlePassTask(link.dataset.taskLink);
                    }
                };
            }
            if (battlePassTasks.some(task => task.task_type === 'SOCIAL_CLICK' && /(?:x\.com|twitter\.com)\/[^/]+\/status\/\d+/i.test(task.action_url || ''))) {
                const embedScriptId = 'battlepass-x-embed-script';
                if (window.twttr?.widgets?.load) {
                    window.twttr.widgets.load(document.getElementById('battlepass-user-content'));
                } else if (!document.getElementById(embedScriptId)) {
                    const script = document.createElement('script');
                    script.id = embedScriptId;
                    script.async = true;
                    script.src = 'https://platform.twitter.com/widgets.js';
                    script.addEventListener('load', () => window.twttr?.widgets?.load?.(document.getElementById('battlepass-user-content')), { once: true });
                    document.head.append(script);
                }
            }
        }

        function renderBattlePassLevels() {
            const container = document.getElementById('battlepass-level-list');
            if (!container) return;
            const xpTotal = document.getElementById('battlepass-xp');
            if (xpTotal) xpTotal.textContent = Number(battlePassProfile?.xp || 0).toLocaleString();
            const readyLevels = battlePassLevels.filter(level => level.unlocked && !level.title_claimed);
            const readyTitle = document.getElementById('battlepass-ready-title');
            const readySummary = document.getElementById('battlepass-ready-summary');
            const claimAll = document.getElementById('battlepass-claim-all');
            if (readyTitle) readyTitle.textContent = readyLevels.length
                ? `${readyLevels.length} title${readyLevels.length === 1 ? '' : 's'} ready to claim`
                : 'No titles ready to claim';
            if (readySummary) readySummary.textContent = readyLevels.length
                ? 'Claim these titles for free; your points are not spent.'
                : 'Complete missions and purchases to earn XP and points.';
            if (claimAll) {
                claimAll.disabled = !readyLevels.length;
                claimAll.textContent = readyLevels.length ? `Claim all titles (${readyLevels.length})` : 'Claim all titles';
                claimAll.dataset.claimLevels = JSON.stringify(readyLevels.map(level => Number(level.level)));
            }
            container.innerHTML = battlePassLevels.map(level => {
                const unlocked = Boolean(level.unlocked);
                const claimed = Boolean(level.title_claimed);
                const button = claimed
                    ? ''
                    : `<button class="battlepass-task-action" type="button" data-claim-level="${Number(level.level)}" ${unlocked ? '' : 'disabled'}>${unlocked ? 'Claim title' : 'Locked'}</button>`;
                const status = claimed
                    ? 'Title claimed'
                    : unlocked ? 'Title unlocked · ready to claim' : `Unlock at ${Number(level.xp_required).toLocaleString()} XP`;
                return `<article class="battlepass-task dashboard-tile battlepass-reward-item">
                    <div class="battlepass-task-copy">
                        <div class="battlepass-task-heading">
                            <strong>Level ${Number(level.level)} · ${escapeHTML(level.title)}</strong>
                            <span class="battlepass-task-awards"><span><i class="battlepass-xp-mark" aria-hidden="true">XP</i> ${Number(level.xp_required).toLocaleString()}</span></span>
                        </div>
                        <div class="battlepass-task-action-row"><span class="battlepass-task-status ${claimed ? 'is-claimed' : unlocked ? 'is-ready' : ''}">${status}</span>${button}</div>
                    </div>
                </article>`;
            }).join('');
            container.onclick = event => {
                const claimButton = event.target.closest('[data-claim-level]');
                if (claimButton && !claimButton.disabled) claimBattlePassLevel(claimButton.dataset.claimLevel);
            };
        }

        function selectBattlePassTab(tabName) {
            const validTabs = ['missions', 'titles', 'shop', 'vault', 'leaderboard', 'profile'];
            if (!validTabs.includes(tabName)) return;
            battlePassActiveTab = tabName;
            document.querySelectorAll('#battlepass-user-content [data-battlepass-tab]').forEach(button => {
                const selected = button.dataset.battlepassTab === tabName;
                button.classList.toggle('active', selected);
                button.setAttribute('aria-selected', String(selected));
            });
            document.querySelectorAll('#battlepass-user-content [data-battlepass-panel]').forEach(panel => {
                const selected = panel.dataset.battlepassPanel === tabName;
                panel.hidden = !selected;
                panel.classList.toggle('active', selected);
            });
        }

        async function claimAllBattlePassTitles(button) {
            const levels = JSON.parse(button?.dataset.claimLevels || '[]');
            if (!levels.length) return;
            button.disabled = true;
            const feedback = document.getElementById('battlepass-reward-feedback');
            if (feedback) feedback.textContent = '';
            try {
                for (const level of levels) {
                    const response = await walletFetch('/api/battlepass/titles/claim', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ level })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || `Unable to claim level ${level}.`);
                }
                if (feedback) feedback.textContent = `${levels.length} title${levels.length === 1 ? '' : 's'} claimed.`;
                battlePassActiveTab = 'titles';
                await loadBattlePass();
            } catch (error) {
                console.error(error);
                if (feedback) feedback.textContent = error.message;
                await loadBattlePass();
            } finally {
                button.disabled = false;
            }
        }

        async function claimBattlePassTask(taskId, button) {
            if (!connectedWallet) return;
            if (button) button.disabled = true;
            try {
                const response = await walletFetch('/api/battlepass/tasks/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task_id: Number(taskId) })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to claim this task reward.');
                await loadBattlePass();
            } catch (error) {
                console.error(error);
                const note = document.getElementById('battlepass-wallet-note');
                if (note) note.textContent = error.message;
                if (button) button.disabled = false;
            }
        }

        async function claimBattlePassLevel(level) {
            const feedback = document.getElementById('battlepass-reward-feedback');
            if (feedback) feedback.textContent = '';
            try {
                const response = await walletFetch('/api/battlepass/titles/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ level: Number(level) })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to claim this level title.');
                if (feedback) feedback.textContent = `Title claimed: ${data.title}.`;
                await loadBattlePass();
            } catch (error) {
                console.error(error);
                if (feedback) feedback.textContent = error.message;
            }
        }

        async function loadPublicBattlePassProfile(username) {
            const container = document.getElementById('battlepass-shared-profile');
            if (!container) return;
            container.hidden = false;
            container.textContent = 'Loading BlastrrPass profile...';
            try {
                const response = await fetch(`/api/battlepass/profile?username=${encodeURIComponent(username)}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load this public profile.');
                const profile = data.profile;
                const level = Number(profile.level || 0);
                const xp = Number(profile.xp || 0);
                const title = profile.title || 'No title claimed';
                const shareUrl = new URL(window.location.href);
                shareUrl.searchParams.set('passprofile', profile.username);
                container.innerHTML = `<div class="card-title">BlastrrPass profile</div>
                    <div class="battlepass-profile-card">
                        <div id="battlepass-public-avatar" class="battlepass-avatar-wrap"></div>
                        <div class="battlepass-profile-details"><strong>@${escapeHTML(profile.username)}</strong>
                        <span>${escapeHTML(title)}</span><span>${level ? `Level ${level}` : 'Unranked'}</span><span>${xp.toLocaleString()} XP (${compactBattlePassXp(xp)})</span></div>
                        <button class="btn-share-x" type="button" id="battlepass-public-share">Share profile on X</button>
                    </div>`;
                setBattlePassAvatar(document.getElementById('battlepass-public-avatar'), profile.profile_image_url, profile.username);
                document.getElementById('battlepass-public-share')?.addEventListener('click', () => {
                    const text = `I'm ${title} in BlastrrPass with ${xp.toLocaleString()} XP!`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl.toString())}`, '_blank', 'noopener,noreferrer');
                });
            } catch (error) {
                console.error(error);
                container.textContent = error.message;
            }
        }

        function shareBattlePassProfile() {
            if (!battlePassProfile?.username) return;
            const url = new URL(window.location.href);
            url.search = '';
            url.searchParams.set('passprofile', battlePassProfile.username);
            const level = battlePassLevelForXp(battlePassProfile.xp);
            const xp = Number(battlePassProfile.xp || 0);
            const title = battlePassProfile.title;
            const rank = title || (level ? `Level ${level}` : 'starting out');
            const text = `I'm ${rank} in BlastrrPass with ${xp.toLocaleString()} XP (${compactBattlePassXp(xp)})!`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url.toString())}`, '_blank', 'noopener,noreferrer');
        }

        async function saveBattlePassProfileImage(event) {
            event.preventDefault();
            const feedback = document.getElementById('battlepass-profile-feedback');
            const imageUrl = document.getElementById('battlepass-profile-image')?.value.trim() || '';
            if (feedback) feedback.textContent = '';
            try {
                if (imageUrl) await validateBattlePassImageUrl(imageUrl);
                const response = await walletFetch('/api/battlepass/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profile_image_url: imageUrl })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to save the profile image.');
                battlePassProfile.profile_image_url = data.profile_image_url;
                if (feedback) feedback.textContent = 'Profile image saved.';
                renderBattlePass();
            } catch (error) {
                console.error(error);
                if (feedback) feedback.textContent = error.message;
            }
        }

        async function loadAdminBattlePass() {
            const levels = document.getElementById('admin-battlepass-level-titles');
            if (!levels) return;
            levels.innerHTML = '<p class="account-chart-empty">Loading BlastrrPass settings...</p>';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/battlepass/load', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readAdminApiResponse(response, '/api/admin/battlepass/load');
                if (!response.ok) throw new Error(data.error || 'Unable to load BlastrrPass settings.');
                document.getElementById('admin-standard-discount').value = data.settings.standard_discount_pct;
                renderAdminBattlePassPlans(data.plans || []);
                renderAdminBattlePassLevels(data.levels || []);
                renderAdminBattlePassTasks(data.tasks || []);
                await loadAdminBattlePassShop();
            } catch (error) {
                console.error(error);
                levels.innerHTML = `<p class="support-feedback">${escapeHTML(error.message)}</p>`;
            }
        }

        function renderAdminBattlePassPlans(plans) {
            const container = document.getElementById('admin-battlepass-plan-rewards');
            if (!container) return;
            container.innerHTML = plans.length ? plans.map(plan => `<article class="battlepass-admin-row" data-plan-id="${Number(plan.plan_id)}">
                <strong>${escapeHTML(plan.name)} · $${Number(plan.simulated_capital).toLocaleString()}</strong>
                <label>XP <input type="number" min="0" step="1" value="${Number(plan.xp_reward)}" data-plan-xp></label>
                <label>Points <input type="number" min="0" step="1" value="${Number(plan.points_reward)}" data-plan-points></label>
                <button class="btn-wallet" type="button" data-save-plan-reward>Save</button>
            </article>`).join('') : '<p class="account-chart-empty">No active plans.</p>';
            container.onclick = event => {
                const button = event.target.closest('[data-save-plan-reward]');
                const row = button?.closest('[data-plan-id]');
                if (!row) return;
                saveAdminBattlePass('/api/admin/battlepass/plan-rewards/save', {
                    plan_id: Number(row.dataset.planId),
                    xp_reward: Number(row.querySelector('[data-plan-xp]').value),
                    points_reward: Number(row.querySelector('[data-plan-points]').value)
                }, button);
            };
        }

        function renderAdminBattlePassLevels(levels) {
            const container = document.getElementById('admin-battlepass-level-titles');
            if (!container) return;
            container.innerHTML = levels.map(level => `<article class="battlepass-admin-row" data-level="${Number(level.level)}">
                <strong>Level ${Number(level.level)} · ${Number(level.xp_required).toLocaleString()} XP</strong>
                <label>Title <input type="text" minlength="2" maxlength="40" value="${escapeHTML(level.title)}" data-level-title></label>
                <button class="btn-wallet" type="button" data-save-level-title>Save</button>
            </article>`).join('');
            container.onclick = event => {
                const button = event.target.closest('[data-save-level-title]');
                const row = button?.closest('[data-level]');
                if (!row) return;
                saveAdminBattlePass('/api/admin/battlepass/levels/save', {
                    level: Number(row.dataset.level),
                    title: row.querySelector('[data-level-title]').value
                }, button);
            };
        }

        function renderAdminBattlePassTasks(tasks) {
            adminBattlePassTasks = tasks;
            const builtIn = document.getElementById('admin-battlepass-built-in-tasks');
            const custom = document.getElementById('admin-battlepass-custom-tasks');
            const builtIns = tasks.filter(task => Number(task.is_builtin) === 1);
            const customTasks = tasks.filter(task => Number(task.is_builtin) !== 1);
            if (builtIn) {
                builtIn.innerHTML = builtIns.map(task => `<article class="battlepass-admin-row" data-task-id="${Number(task.id)}">
                    <strong>${escapeHTML(task.title)}</strong><label>XP <input type="number" min="0" step="1" value="${Number(task.xp_reward)}" data-task-xp></label>
                    <label>Points <input type="number" min="0" step="1" value="${Number(task.points_reward)}" data-task-points></label>
                    <button class="btn-wallet" type="button" data-save-built-in-task>Save</button>
                </article>`).join('');
                builtIn.onclick = event => {
                    const button = event.target.closest('[data-save-built-in-task]');
                    const row = button?.closest('[data-task-id]');
                    if (row) saveAdminBattlePass('/api/admin/battlepass/tasks/rewards', {
                        task_id: Number(row.dataset.taskId),
                        xp_reward: Number(row.querySelector('[data-task-xp]').value),
                        points_reward: Number(row.querySelector('[data-task-points]').value)
                    }, button);
                };
            }
            if (!custom) return;
            custom.innerHTML = customTasks.length ? customTasks.map(task => `<article class="battlepass-admin-task" data-task-id="${Number(task.id)}">
                <div class="battlepass-admin-task-fields">
                    <label>Title <input type="text" maxlength="100" value="${escapeHTML(task.title)}" data-custom-title></label>
                    <label>Description <input type="text" maxlength="500" value="${escapeHTML(task.description)}" data-custom-description></label>
                    <label>Type <select data-custom-type><option value="SOCIAL_CLICK" ${task.task_type === 'SOCIAL_CLICK' ? 'selected' : ''}>Social action</option><option value="WITHDRAWAL" ${task.task_type === 'WITHDRAWAL' ? 'selected' : ''}>Paid withdrawal</option></select></label>
                    <label>Period <select data-custom-cadence>${['DAILY', 'WEEKLY', 'MONTHLY'].map(cadence => `<option value="${cadence}" ${task.cadence === cadence ? 'selected' : ''}>${cadence.toLowerCase()}</option>`).join('')}</select></label>
                    <label>Action URL <input type="url" maxlength="2048" value="${escapeHTML(task.action_url)}" data-custom-url></label>
                    <label>XP <input type="number" min="0" step="1" value="${Number(task.xp_reward)}" data-custom-xp></label>
                    <label>Points <input type="number" min="0" step="1" value="${Number(task.points_reward)}" data-custom-points></label>
                </div>
                <label class="battlepass-active-toggle"><input type="checkbox" data-custom-active ${task.active ? 'checked' : ''}> Active</label>
                <button class="btn-wallet" type="button" data-save-custom-task>Save task</button>
            </article>`).join('') : '<p class="account-chart-empty">No custom tasks yet.</p>';
            custom.onclick = event => {
                const button = event.target.closest('[data-save-custom-task]');
                const row = button?.closest('[data-task-id]');
                if (!row) return;
                saveAdminBattlePass('/api/admin/battlepass/tasks/save', {
                    task_id: Number(row.dataset.taskId),
                    title: row.querySelector('[data-custom-title]').value,
                    description: row.querySelector('[data-custom-description]').value,
                    task_type: row.querySelector('[data-custom-type]').value,
                    cadence: row.querySelector('[data-custom-cadence]').value,
                    action_url: row.querySelector('[data-custom-url]').value,
                    xp_reward: Number(row.querySelector('[data-custom-xp]').value),
                    points_reward: Number(row.querySelector('[data-custom-points]').value),
                    active: row.querySelector('[data-custom-active]').checked
                }, button);
            };
        }

        async function loadAdminBattlePassShop() {
            const packList = document.getElementById('admin-battlepass-pack-list');
            if (packList) packList.innerHTML = '<p class="account-chart-empty">Loading packs and rewards...</p>';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/battlepass/shop/load', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readAdminApiResponse(response, '/api/admin/battlepass/shop/load');
                if (!response.ok) throw new Error(data.error || 'Unable to load Battle Pass pack settings.');
                adminBattlePassPacks = data.packs || [];
                adminBattlePassRewards = data.rewards || [];
                adminBattlePassPlans = data.plans || [];
                renderAdminBattlePassPromotionPacks();
                const planSelect = document.getElementById('admin-battlepass-reward-plan');
                if (planSelect) {
                    planSelect.innerHTML = '<option value="">Any active account type</option>' +
                        adminBattlePassPlans.map(plan => `<option value="${Number(plan.id)}" ${Number(plan.active) !== 1 ? 'disabled' : ''}>${escapeHTML(plan.name)}${Number(plan.active) !== 1 ? ' (inactive)' : ''}</option>`).join('');
                }
                renderAdminBattlePassShop();
            } catch (error) {
                console.error(error);
                if (packList) packList.innerHTML = `<p class="support-feedback">${escapeHTML(error.message)}</p>`;
            }
        }

        function renderAdminBattlePassPromotionPacks() {
            const select = document.getElementById('admin-battlepass-promotion-pack');
            if (!select) return;
            const selectedPackId = select.value;
            const activePacks = adminBattlePassPacks.filter(pack => pack.active);
            select.innerHTML = '<option value="">Select an active pack</option>' +
                activePacks.map(pack => `<option value="${Number(pack.id)}">${escapeHTML(pack.name)} Pack</option>`).join('');
            if (activePacks.some(pack => Number(pack.id) === Number(selectedPackId))) {
                select.value = String(selectedPackId);
            }
        }

        function invalidateAdminBattlePassPromotionRequest() {
            adminBattlePassPromotionRequestKey = null;
        }

        function updateAdminBattlePassPromotionAudience() {
            const audience = document.querySelector('input[name="admin-battlepass-promotion-audience"]:checked')?.value;
            const picker = document.getElementById('admin-battlepass-promotion-user-picker');
            if (picker) picker.hidden = audience !== 'SELECTED';
            invalidateAdminBattlePassPromotionRequest();
        }

        function renderAdminBattlePassPromotionSelection() {
            const container = document.getElementById('admin-battlepass-promotion-selected');
            if (!container) return;
            const users = [...adminBattlePassPromotionRecipients.values()];
            container.innerHTML = users.length
                ? `<strong>${users.length} selected</strong>${users.map(user => `
                    <div class="battlepass-promotion-user-row">
                        <span>${escapeHTML(user.username ? `@${user.username}` : 'User without username')} · <code>${escapeHTML(user.wallet_address)}</code></span>
                        <button class="battlepass-secondary-button" type="button" data-remove-promo-recipient="${escapeHTML(user.wallet_address)}">Remove</button>
                    </div>
                `).join('')}`
                : '<small>No recipients selected.</small>';
        }

        async function loadAdminBattlePassPromotionUsers() {
            const query = document.getElementById('admin-battlepass-promotion-search')?.value.trim() || '';
            const container = document.getElementById('admin-battlepass-promotion-search-results');
            if (!container) return;
            if (query.length < 2) {
                container.innerHTML = '<p class="account-chart-empty">Enter at least 2 characters to search.</p>';
                return;
            }
            container.innerHTML = '<p class="account-chart-empty">Searching eligible users...</p>';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/users/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, query })
                });
                const data = await readAdminApiResponse(response, '/api/admin/users/search');
                if (!response.ok) throw new Error(data.error || 'Unable to search user profiles.');
                const users = data.users || [];
                if (!users.length) {
                    container.innerHTML = '<p class="account-chart-empty">No matching users found.</p>';
                    return;
                }
                container.innerHTML = users.map(user => {
                    const eligible = Number(user.eligible_trade_account_count) > 0 && Number(user.admin_suspended) !== 1;
                    const selected = adminBattlePassPromotionRecipients.has(user.wallet_address);
                    return `<div class="battlepass-promotion-user-row">
                        <label>
                            <input type="checkbox" data-promo-recipient="${escapeHTML(user.wallet_address)}" ${selected ? 'checked' : ''} ${eligible ? '' : 'disabled'}>
                            ${escapeHTML(user.username ? `@${user.username}` : 'User without username')} · <code>${escapeHTML(user.wallet_address)}</code>
                        </label>
                        <span>${eligible ? `${Number(user.eligible_trade_account_count)} eligible account${Number(user.eligible_trade_account_count) === 1 ? '' : 's'}` : 'Not currently eligible'}</span>
                    </div>`;
                }).join('');
                container.onchange = event => {
                    const checkbox = event.target.closest('[data-promo-recipient]');
                    if (!checkbox) return;
                    const wallet = checkbox.dataset.promoRecipient;
                    const user = users.find(candidate => candidate.wallet_address === wallet);
                    if (!user) return;
                    if (checkbox.checked) {
                        if (!adminBattlePassPromotionRecipients.has(wallet) && adminBattlePassPromotionRecipients.size >= 100) {
                            checkbox.checked = false;
                            const feedback = document.getElementById('admin-battlepass-promotion-feedback');
                            if (feedback) feedback.textContent = 'Select up to 100 users per promotion.';
                            return;
                        }
                        adminBattlePassPromotionRecipients.set(wallet, user);
                    } else {
                        adminBattlePassPromotionRecipients.delete(wallet);
                    }
                    invalidateAdminBattlePassPromotionRequest();
                    renderAdminBattlePassPromotionSelection();
                };
            } catch (error) {
                console.error(error);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(error.message)}</p>`;
            }
        }

        async function issueAdminBattlePassPromotion() {
            const feedback = document.getElementById('admin-battlepass-promotion-feedback');
            const button = document.getElementById('admin-battlepass-promotion-issue');
            const packId = Number(document.getElementById('admin-battlepass-promotion-pack')?.value);
            const pack = adminBattlePassPacks.find(item => Number(item.id) === packId && item.active);
            const audienceType = document.querySelector('input[name="admin-battlepass-promotion-audience"]:checked')?.value;
            const recipients = [...adminBattlePassPromotionRecipients.keys()];
            if (!pack || !['ALL_ACTIVE', 'SELECTED'].includes(audienceType)) {
                if (feedback) feedback.textContent = 'Choose an active reward pack and a recipient group.';
                return;
            }
            if (audienceType === 'SELECTED' && !recipients.length) {
                if (feedback) feedback.textContent = 'Select at least one eligible user.';
                return;
            }
            const recipientSummary = audienceType === 'ALL_ACTIVE'
                ? 'all users with currently eligible trading accounts'
                : `${recipients.length} selected eligible user${recipients.length === 1 ? '' : 's'}`;
            if (!window.confirm(`Issue one ${pack.name} Pack to ${recipientSummary}?`)) return;
            if (!adminBattlePassPromotionRequestKey) {
                adminBattlePassPromotionRequestKey = window.crypto?.randomUUID
                    ? window.crypto.randomUUID()
                    : `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
            }
            if (button) button.disabled = true;
            if (feedback) feedback.textContent = 'Issuing promotional packs...';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/battlepass/promotions/issue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...authorization,
                        pack_id: packId,
                        audience_type: audienceType,
                        wallets: audienceType === 'SELECTED' ? recipients : undefined,
                        request_key: adminBattlePassPromotionRequestKey
                    })
                });
                const data = await readAdminApiResponse(response, '/api/admin/battlepass/promotions/issue');
                if (!response.ok) throw new Error(data.error || 'Unable to issue promotional packs.');
                adminBattlePassPromotionRequestKey = null;
                if (feedback) {
                    feedback.textContent = `Issued ${pack.name} Pack to ${Number(data.promotion.recipient_count).toLocaleString()} user${Number(data.promotion.recipient_count) === 1 ? '' : 's'}.`;
                }
            } catch (error) {
                console.error(error);
                if (feedback) feedback.textContent = error.message || 'Unable to issue promotional packs.';
            } finally {
                if (button) button.disabled = false;
            }
        }

        function renderAdminBattlePassShop() {
            renderAdminBattlePassPacks();
            renderAdminBattlePassRewards();
            updateAdminBattlePassRewardFields();
        }

        function getAdminPackOddsTotal(entries) {
            return Math.round(entries.reduce((total, entry) => total + Number(entry.odds || 0), 0) * 100) / 100;
        }

        function renderAdminBattlePassPacks() {
            const container = document.getElementById('admin-battlepass-pack-list');
            if (!container) return;
            container.innerHTML = adminBattlePassPacks.length ? adminBattlePassPacks.map(pack => {
                const oddsTotal = getAdminPackOddsTotal(pack.rewards);
                const capped = pack.rewards.filter(reward => reward.cap_reached);
                const status = capped.length
                    ? `Out of stock · cap reached: ${capped.map(reward => escapeHTML(reward.name)).join(', ')}`
                    : pack.active ? `Active · ${oddsTotal}% odds` : 'Disabled · out of stock';
                return `<article class="battlepass-admin-shop-row">
                    <div><strong>${escapeHTML(pack.name)}</strong><small>${Number(pack.points_cost).toLocaleString()} points · ${status}</small></div>
                    <button class="battlepass-secondary-button" type="button" data-edit-battlepass-pack="${Number(pack.id)}">Edit pack</button>
                </article>`;
            }).join('') : '<p class="account-chart-empty">No packs have been created.</p>';
            container.onclick = event => {
                const button = event.target.closest('[data-edit-battlepass-pack]');
                const pack = adminBattlePassPacks.find(item => Number(item.id) === Number(button?.dataset.editBattlepassPack));
                if (!pack) return;
                document.getElementById('admin-battlepass-pack-id').value = String(pack.id);
                document.getElementById('admin-battlepass-pack-name').value = pack.name;
                document.getElementById('admin-battlepass-pack-cost').value = String(pack.points_cost);
                document.getElementById('admin-battlepass-pack-active').checked = Boolean(pack.active);
                const rows = document.getElementById('admin-battlepass-pack-reward-rows');
                rows.replaceChildren();
                pack.rewards.forEach(reward => addAdminBattlePassPackRewardRow(reward));
                document.getElementById('admin-battlepass-pack-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
        }

        function addAdminBattlePassPackRewardRow(entry = {}) {
            const container = document.getElementById('admin-battlepass-pack-reward-rows');
            if (!container) return;
            const row = document.createElement('div');
            row.className = 'battlepass-admin-pool-row';
            const options = adminBattlePassRewards.map(reward => `
                <option value="${Number(reward.id)}" ${Number(reward.id) === Number(entry.reward_id) ? 'selected' : ''}>
                    ${escapeHTML(reward.name)}${Number(reward.active) !== 1 ? ' (inactive)' : ''}
                </option>
            `).join('');
            row.innerHTML = `
                <label>Reward <select data-pack-reward-id><option value="">Choose reward</option>${options}</select></label>
                <label>Odds (%) <input data-pack-reward-odds type="number" min="0.01" max="100" step="0.01" value="${entry.odds == null ? '' : Number(entry.odds)}"></label>
                <label>Max drops (0 = unlimited) <input data-pack-reward-cap type="number" min="0" step="1" value="${entry.max_drops == null ? 0 : Number(entry.max_drops)}"></label>
                <button class="battlepass-secondary-button" type="button" data-remove-pack-reward aria-label="Remove reward from pack">Remove</button>
            `;
            row.dataset.drops = String(Number(entry.drops || 0));
            container.append(row);
            row.querySelector('[data-remove-pack-reward]')?.addEventListener('click', () => row.remove());
        }

        function resetAdminBattlePassPackForm() {
            const form = document.getElementById('admin-battlepass-pack-form');
            if (!form) return;
            form.reset();
            document.getElementById('admin-battlepass-pack-id').value = '';
            document.getElementById('admin-battlepass-pack-active').checked = true;
            document.getElementById('admin-battlepass-pack-reward-rows')?.replaceChildren();
            const feedback = document.getElementById('admin-battlepass-pack-feedback');
            if (feedback) feedback.textContent = '';
        }

        function renderAdminBattlePassRewards() {
            const container = document.getElementById('admin-battlepass-reward-list');
            if (!container) return;
            container.innerHTML = adminBattlePassRewards.length ? adminBattlePassRewards.map(reward => {
                const details = reward.reward_type === 'ACCOUNT'
                    ? `Account · ${escapeHTML(reward.plan_name || 'Unavailable account type')} ×${Number(reward.quantity)}`
                    : reward.reward_type === 'DISCOUNT'
                        ? `${Number(reward.discount_pct)}% discount · ${escapeHTML(reward.plan_name || 'any active account type')} ×${Number(reward.quantity)}`
                        : reward.reward_type === 'XP'
                            ? `${Number(reward.xp_amount).toLocaleString()} XP ×${Number(reward.quantity)}`
                            : `${Number(reward.points_amount).toLocaleString()} points ×${Number(reward.quantity)}`;
                return `<article class="battlepass-admin-shop-row">
                    <div><strong>${escapeHTML(reward.name)}</strong><small>${details} · ${Number(reward.active) === 1 ? 'Active' : 'Inactive'}${reward.total_drops ? ` · ${Number(reward.total_drops).toLocaleString()} drops` : ''}</small><p>${escapeHTML(reward.description)}</p></div>
                    <button class="battlepass-secondary-button" type="button" data-edit-battlepass-reward="${Number(reward.id)}">Edit reward</button>
                </article>`;
            }).join('') : '<p class="account-chart-empty">No rewards have been created.</p>';
            container.onclick = event => {
                const button = event.target.closest('[data-edit-battlepass-reward]');
                const reward = adminBattlePassRewards.find(item => Number(item.id) === Number(button?.dataset.editBattlepassReward));
                if (!reward) return;
                document.getElementById('admin-battlepass-reward-id').value = String(reward.id);
                document.getElementById('admin-battlepass-reward-name').value = reward.name;
                document.getElementById('admin-battlepass-reward-description').value = reward.description;
                document.getElementById('admin-battlepass-reward-type').value = reward.reward_type;
                document.getElementById('admin-battlepass-reward-plan').value = reward.plan_id == null ? '' : String(reward.plan_id);
                document.getElementById('admin-battlepass-reward-discount').value = reward.discount_pct == null ? '' : String(reward.discount_pct);
                document.getElementById('admin-battlepass-reward-xp').value = String(reward.xp_amount);
                document.getElementById('admin-battlepass-reward-points').value = String(reward.points_amount);
                document.getElementById('admin-battlepass-reward-quantity').value = String(reward.quantity);
                document.getElementById('admin-battlepass-reward-active').checked = Number(reward.active) === 1;
                updateAdminBattlePassRewardFields();
                document.getElementById('admin-battlepass-reward-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
        }

        function updateAdminBattlePassRewardFields() {
            const type = document.getElementById('admin-battlepass-reward-type')?.value || 'ACCOUNT';
            const fields = document.querySelectorAll('[data-reward-field]');
            fields.forEach(field => {
                const selected = field.dataset.rewardField === 'plan'
                    ? ['ACCOUNT', 'DISCOUNT'].includes(type)
                    : field.dataset.rewardField === 'discount'
                        ? type === 'DISCOUNT'
                        : field.dataset.rewardField.toUpperCase() === type;
                field.hidden = !selected;
            });
            const planSelect = document.getElementById('admin-battlepass-reward-plan');
            if (planSelect) planSelect.required = type === 'ACCOUNT';
        }

        function resetAdminBattlePassRewardForm() {
            const form = document.getElementById('admin-battlepass-reward-form');
            if (!form) return;
            form.reset();
            document.getElementById('admin-battlepass-reward-id').value = '';
            document.getElementById('admin-battlepass-reward-active').checked = true;
            document.getElementById('admin-battlepass-reward-xp').value = '0';
            document.getElementById('admin-battlepass-reward-points').value = '0';
            document.getElementById('admin-battlepass-reward-quantity').value = '1';
            const feedback = document.getElementById('admin-battlepass-reward-feedback');
            if (feedback) feedback.textContent = '';
            updateAdminBattlePassRewardFields();
        }

        async function saveAdminBattlePassShop(endpoint, values, feedbackId) {
            const feedback = document.getElementById(feedbackId);
            if (feedback) feedback.textContent = '';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, ...values })
                });
                const data = await readAdminApiResponse(response, endpoint);
                if (!response.ok) throw new Error(data.error || 'Unable to save Battle Pass shop settings.');
                if (feedback) feedback.textContent = 'Saved.';
                await loadAdminBattlePassShop();
                return true;
            } catch (error) {
                console.error(error);
                if (feedback) feedback.textContent = error.message || 'Unable to save Battle Pass shop settings.';
                return false;
            }
        }

        async function saveAdminBattlePass(endpoint, values, button) {
            if (button) button.disabled = true;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, ...values })
                });
                const data = await readAdminApiResponse(response, endpoint);
                if (!response.ok) throw new Error(data.error || 'Unable to save BlastrrPass settings.');
                if (endpoint === '/api/admin/battlepass/settings') {
                    standardDiscountPct = Number(data.standard_discount_pct);
                    renderPlans();
                }
                if (endpoint === '/api/admin/battlepass/tasks/rewards') {
                    const task = adminBattlePassTasks.find(item => Number(item.id) === Number(values.task_id));
                    if (task) {
                        task.xp_reward = values.xp_reward;
                        task.points_reward = values.points_reward;
                    }
                    renderAdminBattlePassTasks(adminBattlePassTasks);
                } else if (endpoint === '/api/admin/battlepass/tasks/save') {
                    const savedTask = { ...values, id: data.task_id, active: values.active === false ? 0 : 1 };
                    const existingIndex = adminBattlePassTasks.findIndex(task => Number(task.id) === Number(data.task_id));
                    if (existingIndex < 0) adminBattlePassTasks.push(savedTask);
                    else adminBattlePassTasks[existingIndex] = savedTask;
                    renderAdminBattlePassTasks(adminBattlePassTasks);
                }
                const feedback = document.getElementById(endpoint.includes('/tasks/')
                    ? 'admin-battlepass-task-feedback'
                    : 'admin-battlepass-settings-feedback');
                if (feedback) feedback.textContent = 'BlastrrPass settings saved.';
                return true;
            } catch (error) {
                console.error(error);
                const feedback = document.getElementById(endpoint.includes('/tasks/')
                    ? 'admin-battlepass-task-feedback'
                    : 'admin-battlepass-settings-feedback');
                if (feedback) feedback.textContent = error.message;
                return false;
            } finally {
                if (button) button.disabled = false;
            }
        }

        function switchLeaderboardMode(mode) {
            currentLeaderboardMode = mode;
            ['lb-btn-daily', 'lb-btn-monthly', 'lb-btn-payouts'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('active');
            });

            const subtitle = document.getElementById('lb-mode-subtitle');
            const colHeader = document.getElementById('lb-metric-col-header');

            if (mode === 'DAILY') {
                document.getElementById('lb-btn-daily')?.classList.add('active');
                if (colHeader) colHeader.innerText = 'Daily Realized Profit (PnL)';
                if (subtitle) subtitle.innerText = 'Realized trading PnL from trades closed today.';
            } else if (mode === 'MONTHLY') {
                document.getElementById('lb-btn-monthly')?.classList.add('active');
                if (colHeader) colHeader.innerText = 'Monthly Realized Profit (PnL)';
                if (subtitle) subtitle.innerText = 'Realized trading PnL from trades closed during the current calendar month.';
            } else if (mode === 'PAYOUTS') {
                document.getElementById('lb-btn-payouts')?.classList.add('active');
                if (colHeader) colHeader.innerText = 'Total Lifetime Payouts';
                if (subtitle) subtitle.innerText = 'Cumulative USDT trading payouts approved by admins, including payouts awaiting payment.';
            }

            loadLeaderboard(mode);
        }

        async function loadLeaderboard(mode = 'DAILY') {
            try {
                const res = await fetch(`/api/leaderboard?mode=${mode}`);
                const data = await res.json();
                renderLeaderboardTable(data.leaderboard || []);
            } catch (err) { alert(err.message || 'Unable to execute trade.'); }
        }

        async function saveLeaderboardPreference(event) {
            const checkbox = event.currentTarget;
            const previousValue = !checkbox.checked;
            const feedback = document.getElementById('leaderboard-preference-feedback');
            checkbox.disabled = true;
            if (feedback) feedback.textContent = 'Saving preference…';
            try {
                const response = await walletFetch('/api/user/leaderboard-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hidden: checkbox.checked })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to save leaderboard preference.');
                if (feedback) feedback.textContent = checkbox.checked
                    ? 'Your profile is now excluded from rankings.'
                    : 'Your profile will appear in rankings when eligible.';
                loadLeaderboard(currentLeaderboardMode);
            } catch (error) {
                checkbox.checked = previousValue;
                if (feedback) feedback.textContent = error.message || 'Unable to save leaderboard preference.';
            } finally {
                checkbox.disabled = !currentUserProfile;
            }
        }

        function renderLeaderboardTable(dataRows) {
            const container = document.getElementById('leaderboard-table-body');
            if (!container) return;
            container.replaceChildren();
            const myRankLabel = document.getElementById('lb-my-rank-label');
            if (myRankLabel) myRankLabel.style.display = 'none';

            if (!dataRows || dataRows.length === 0) {
                container.innerHTML = '<p class="workspace-empty-state">No records available for this leaderboard mode.</p>';
                return;
            }

            let userFoundRank = null;

            dataRows.forEach((row, index) => {
                const isUser = currentUserProfile && row.wallet_address && row.wallet_address.toLowerCase() === currentUserProfile.wallet_address.toLowerCase();
                if (isUser) userFoundRank = index + 1;

                const metricColor = row.metric_value >= 0 ? '#34d399' : '#ef4444';
                const battlePassXp = Number(row.battlepass_xp || 0);
                const battlePassLevel = Math.min(12, Math.floor(battlePassXp / 10000));
                const battlePassRank = battlePassLevel ? `Level ${battlePassLevel}` : 'Unranked';
                const rankDisplay = `#${index + 1}`;
                const metricLabel = currentLeaderboardMode === 'PAYOUTS'
                    ? 'LIFETIME PAYOUTS'
                    : `${currentLeaderboardMode} PNL`;
                const playerCardId = `leaderboard-battlepass-${index + 1}`;

                container.insertAdjacentHTML('beforeend', `
                    <article class="battlepass-task leaderboard-card${isUser ? ' is-current-user' : ''}">
                        <div class="leaderboard-card-top">
                            <div class="leaderboard-trader">
                                <span class="leaderboard-position${index < 3 ? ' is-top-three' : ''}">${rankDisplay}</span>
                                <span class="leaderboard-avatar-wrap">
                                    <button class="battlepass-avatar-wrap leaderboard-avatar" type="button" aria-label="View @${escapeHTML(row.username)} Battle Pass details" aria-describedby="${playerCardId}"></button>
                                    <span class="leaderboard-player-card" id="${playerCardId}" role="tooltip">
                                        <strong>BlastrrPass</strong>
                                        <span>${battlePassRank} · ${battlePassXp.toLocaleString()} XP</span>
                                        <span class="leaderboard-player-title">${escapeHTML(row.battlepass_title || 'No title claimed')}</span>
                                    </span>
                                </span>
                                <div class="leaderboard-identity">
                                    <strong>@${escapeHTML(row.username)}</strong>
                                    ${isUser ? '<small class="leaderboard-you">Your profile</small>' : ''}
                                </div>
                            </div>
                        </div>
                        <div class="leaderboard-metric">
                            <strong style="color: ${metricColor}">$${Number(row.metric_value).toFixed(2)} USDT</strong>
                            <small>${metricLabel}</small>
                        </div>
                        <div class="leaderboard-card-actions">
                            <button class="battlepass-task-action" type="button" data-leaderboard-promo="${escapeHTML(row.discount_code)}">Use code</button>
                            ${isUser ? `<button class="battlepass-task-action" type="button" data-share-rank="${index + 1}" data-share-username="${escapeHTML(row.username)}" data-share-metric="${Number(row.metric_value)}">Share rank on X</button>` : ''}
                        </div>
                    </article>
                `);
                setBattlePassAvatar(container.lastElementChild?.querySelector('.leaderboard-avatar'), row.profile_image_url, row.username);
            });

            if (userFoundRank && myRankLabel) {
                myRankLabel.innerText = `Your Rank: #${userFoundRank}`;
                myRankLabel.style.display = 'inline-block';
            }
            container.onclick = event => {
                const promoButton = event.target.closest('[data-leaderboard-promo]');
                if (promoButton) {
                    usePromoCode(promoButton.dataset.leaderboardPromo);
                    return;
                }
                const shareButton = event.target.closest('[data-share-rank]');
                if (shareButton) {
                    shareRankOnX(
                        Number(shareButton.dataset.shareRank),
                        shareButton.dataset.shareUsername,
                        Number(shareButton.dataset.shareMetric)
                    );
                }
            };
        }

        function shareRankOnX(rank, username, metricValue) {
            const modeText = currentLeaderboardMode === 'DAILY' ? 'Daily Profit' : (currentLeaderboardMode === 'MONTHLY' ? 'Monthly Profit' : 'Lifetime Payouts');
            const text = `I'm ranked #${rank} on @BlastrrProp for ${modeText} with $${metricValue.toFixed(2)} USDT! 🚀\n\nTrade live crypto prop accounts with ${standardDiscountPct}% off using my referral code: ${currentUserProfile?.discount_code || 'BLASTRR'}\n\nhttps://blastrr.com/?ref=${currentUserProfile?.discount_code || ''}`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        }

        function shareTradeOnX(tradeId, symbol, side, pnl, entryPrice) {
            const emoji = pnl >= 0 ? '🟢' : '🔴';
            const text = `${emoji} Just closed a ${side} trade on ${symbol} via @BlastrrProp!\nEntry: $${entryPrice.toFixed(2)} | Realized PnL: $${pnl.toFixed(2)} USDT 📈\n\nTrade direct-to-live crypto prop accounts on Blastrr: https://blastrr.com`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        }

        function shareCreatorCodeOnX() {
            if (!currentUserProfile) return;
            const text = `Get ${standardDiscountPct}% OFF your @BlastrrProp evaluation trading accounts using my referral code: ${currentUserProfile.discount_code} 🔥\n\nDirect-to-live crypto prop trading terminal with instant executions:\nhttps://blastrr.com/?ref=${currentUserProfile.discount_code}`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        }

        function usePromoCode(code) {
            const promoInput = document.getElementById('applied-promo');
            if (promoInput) promoInput.value = code;
            switchView('buyView');
            applyPromo();
        }

        function getProvider() {
            return window.ethereum?.providers ? window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0] : window.ethereum;
        }

        function setWalletLoginStatus(message, signing = false) {
            const button = document.getElementById('wallet-login-button');
            const status = document.getElementById('wallet-login-status');
            if (button) {
                button.disabled = signing;
                button.textContent = signing ? 'Waiting for wallet signature...' : 'Connect wallet & sign in';
            }
            if (status) status.textContent = message || '';
        }

        function lockDashboard(message = 'Sign a message with your wallet to unlock your trading dashboard.') {
            disconnectMarketDataStream();
            if (walletSecurityPollTimer) clearInterval(walletSecurityPollTimer);
            walletSecurityPollTimer = null;
            dashboardAuthenticated = false;
            updateMarketChatControls();
            resolvePurchaseDisclaimer(false);
            document.body.classList.add('auth-locked');
            const header = document.querySelector('body > header');
            const main = document.querySelector('main');
            const gate = document.getElementById('wallet-login-gate');
            const disclaimerGate = document.getElementById('disclaimer-gate');
            if (header) header.hidden = true;
            if (main) main.hidden = true;
            if (gate) gate.hidden = false;
            if (disclaimerGate) disclaimerGate.hidden = true;
            setWalletLoginStatus(message);
        }

        function showDisclaimerGate(mode = 'login') {
            disclaimerGateMode = mode;
            if (mode === 'login') {
                dashboardAuthenticated = false;
                updateMarketChatControls();
                document.body.classList.add('auth-locked');
            }
            const header = document.querySelector('body > header');
            const main = document.querySelector('main');
            const loginGate = document.getElementById('wallet-login-gate');
            const disclaimerGate = document.getElementById('disclaimer-gate');
            const scrollArea = document.getElementById('disclaimer-scroll-area');
            if (header) header.hidden = true;
            if (main) main.hidden = true;
            if (loginGate) loginGate.hidden = true;
            if (disclaimerGate) disclaimerGate.hidden = false;
            if (scrollArea) scrollArea.scrollTop = 0;
            ['disclaimer-accept-terms', 'disclaimer-simulated-funds'].forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.checked = false;
                    checkbox.disabled = true;
                }
            });
            const remember = document.getElementById('disclaimer-remember');
            if (remember) remember.checked = true;
            const rememberLabel = document.querySelector('.disclaimer-remember');
            if (rememberLabel) rememberLabel.hidden = mode === 'purchase';
            const cancelButton = document.getElementById('disclaimer-cancel-purchase');
            if (cancelButton) cancelButton.hidden = mode !== 'purchase';
            const title = document.getElementById('disclaimer-title');
            if (title) title.textContent = mode === 'purchase' ? 'Review Terms Before Purchase' : 'Simulated Trading Terms & Rules';
            const copy = document.querySelector('.disclaimer-header .wallet-login-copy');
            if (copy) copy.textContent = mode === 'purchase'
                ? 'Review the terms for this purchase. You must reach the end and confirm both acknowledgements each time you buy.'
                : 'Read to the end and confirm both acknowledgements to unlock your dashboard.';
            const continueButton = document.getElementById('disclaimer-continue-button');
            if (continueButton) continueButton.textContent = mode === 'purchase' ? 'Agree and continue to checkout' : 'Agree and continue';
            const hint = document.getElementById('disclaimer-scroll-hint');
            if (hint) hint.textContent = 'Scroll to the end of the terms to enable the acknowledgements.';
            const feedback = document.getElementById('disclaimer-feedback');
            if (feedback) feedback.textContent = '';
            updateDisclaimerScrollState();
            updateDisclaimerContinueState();
        }

        function updateDisclaimerScrollState() {
            const scrollArea = document.getElementById('disclaimer-scroll-area');
            if (!scrollArea) return;
            const reachedEnd = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 4;
            if (!reachedEnd) return;
            ['disclaimer-accept-terms', 'disclaimer-simulated-funds'].forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) checkbox.disabled = false;
            });
            const hint = document.getElementById('disclaimer-scroll-hint');
            if (hint) hint.textContent = 'You have reached the end. Confirm both acknowledgements to continue.';
        }

        function updateDisclaimerContinueState() {
            const reachedEnd = document.getElementById('disclaimer-accept-terms')?.disabled === false &&
                document.getElementById('disclaimer-simulated-funds')?.disabled === false;
            const acceptedTerms = document.getElementById('disclaimer-accept-terms')?.checked === true;
            const acknowledgedSimulation = document.getElementById('disclaimer-simulated-funds')?.checked === true;
            const button = document.getElementById('disclaimer-continue-button');
            if (button) button.disabled = !(reachedEnd && acceptedTerms && acknowledgedSimulation);
        }

        async function acceptDisclaimer() {
            const button = document.getElementById('disclaimer-continue-button');
            const feedback = document.getElementById('disclaimer-feedback');
            const owner = getConnectedWalletOwnerKey();
            if (!owner || !button || button.disabled) return;
            button.disabled = true;
            if (feedback) feedback.textContent = 'Saving your selection...';
            try {
                if (disclaimerGateMode === 'purchase') {
                    if (getConnectedWalletOwnerKey() !== owner) return;
                    resolvePurchaseDisclaimer(true);
                    return;
                }
                if (document.getElementById('disclaimer-remember')?.checked) {
                    const response = await walletFetch('/api/user/disclaimer-consent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            version: DISCLAIMER_VERSION,
                            accepted_terms: true,
                            simulated_funds: true
                        })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Unable to remember your selection.');
                }
                if (getConnectedWalletOwnerKey() !== owner) return;
                await continueAfterDisclaimer();
            } catch (error) {
                console.error('Disclaimer acceptance failed:', error);
                if (feedback) feedback.textContent = error.message || 'Unable to save your selection. Please try again.';
                updateDisclaimerContinueState();
            }
        }

        async function continueAfterDisclaimer() {
            disclaimerGateMode = 'login';
            try {
                await refreshWalletSecurityStatus();
            } catch (error) {
                console.warn('Unable to refresh wallet security status:', error);
            }
            unlockDashboard();
            setWalletLoginStatus('');
            const roles = await checkRole();
            adminOperationsLoaded = false;
            if (roles?.isSupportStaff && !roles.isAdmin) {
                setSupportStaffWorkspace(true);
                switchView('supportStaffView');
                return;
            }
            setSupportStaffWorkspace(false);
            await initializeDashboard();
            if (roles?.isAdmin) startAdminOperationsPolling();
            const accountsLoaded = await loadUserAccounts(connectedWallet);
            loadUserProfile(connectedWallet);
            loadUserTickets(connectedWallet);
            loadBattlePass();
            if (accountsLoaded && userAccounts.length === 0) switchView('buyView');
        }

        function unlockDashboard() {
            dashboardAuthenticated = true;
            startWalletSecurityStatusPolling();
            updateMarketChatControls();
            document.body.classList.remove('auth-locked');
            const header = document.querySelector('body > header');
            const main = document.querySelector('main');
            const gate = document.getElementById('wallet-login-gate');
            const disclaimerGate = document.getElementById('disclaimer-gate');
            if (header) header.hidden = false;
            if (main) main.hidden = false;
            if (gate) gate.hidden = true;
            if (disclaimerGate) disclaimerGate.hidden = true;
        }

        function requestPurchaseDisclaimer() {
            return new Promise(resolve => {
                pendingPurchaseDisclaimer = resolve;
                showDisclaimerGate('purchase');
            });
        }

        function resolvePurchaseDisclaimer(accepted) {
            if (!pendingPurchaseDisclaimer) return;
            const resolve = pendingPurchaseDisclaimer;
            pendingPurchaseDisclaimer = null;
            disclaimerGateMode = 'login';
            const gate = document.getElementById('disclaimer-gate');
            if (gate) gate.hidden = true;
            const rememberLabel = document.querySelector('.disclaimer-remember');
            if (rememberLabel) rememberLabel.hidden = false;
            const cancelButton = document.getElementById('disclaimer-cancel-purchase');
            if (cancelButton) cancelButton.hidden = true;
            if (dashboardAuthenticated &&
                walletSessionToken &&
                walletSessionOwner === getConnectedWalletOwnerKey() &&
                walletSessionExpiresAt > Date.now()) {
                const header = document.querySelector('body > header');
                const main = document.querySelector('main');
                if (header) header.hidden = false;
                if (main) main.hidden = false;
            }
            resolve(accepted);
        }

        function resetDashboardToTradeView() {
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById('tradeView')?.classList.add('active');
            document.querySelectorAll('#nav-menu .nav-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tradeMarketMode === tradingMarketMode);
            });
        }

        async function initializeDashboard() {
            if (dashboardInitialized) return;
            dashboardInitialized = true;
            try {
                await loadMarketConfig();
            } catch (error) {
                console.error('Market configuration failed:', error);
                const select = document.getElementById('order-symbol');
                if (select) {
                    select.replaceChildren(new Option('Market configuration unavailable', ''));
                    select.disabled = true;
                }
            }
            loadPlans();
            loadLeaderboard(currentLeaderboardMode);
            if (!autoSyncInterval) {
                autoSyncInterval = setInterval(() => {
                    if (connectedWallet && dashboardAuthenticated) silentSyncUserData(connectedWallet);
                }, 5000);
            }

            const urlParams = new URLSearchParams(window.location.search);
            const sharedProfile = urlParams.get('passprofile');
            if (sharedProfile) {
                document.getElementById('battlepass-user-content')?.setAttribute('hidden', '');
                switchView('blastrrPassView');
                loadPublicBattlePassProfile(sharedProfile);
            }
            const refCode = urlParams.get('ref');
            if (refCode) {
                const promoInput = document.getElementById('applied-promo');
                if (promoInput) promoInput.value = refCode;
            }
        }

        async function connectWallet() {
            const walletType = document.getElementById('wallet-login-type')?.value || 'EVM';
            const walletName = document.getElementById('wallet-login-solana-provider')?.value || 'phantom';
            try {
                setWalletLoginStatus('Connect your wallet, then sign the access message.', true);
                if (walletType === 'SOLANA') {
                    const provider = getSolanaWalletProvider(walletName);
                    if (!provider) {
                        setWalletLoginStatus(`${walletName === 'solflare' ? 'Solflare' : 'Phantom'} was not detected. Install or enable that wallet.`);
                        return;
                    }
                    await provider.connect();
                    const address = provider.publicKey?.toString();
                    if (!address) {
                        setWalletLoginStatus('No Solana wallet account was selected.');
                        return;
                    }
                    connectedSolanaProviderName = walletName;
                    if (provider.on && !solanaProviderListeners.has(provider)) {
                        provider.on('accountChanged', publicKey => {
                            if (connectedWalletType !== 'SOLANA' || connectedSolanaProviderName !== walletName) return;
                            if (!publicKey) return disconnectWallet();
                            const nextAddress = publicKey.toString();
                            addAvailableWallet({ address: nextAddress, type: 'SOLANA', provider: walletName });
                            onWalletSwitched(nextAddress, 'SOLANA', walletName);
                        });
                        solanaProviderListeners.add(provider);
                    }
                    addAvailableWallet({ address, type: 'SOLANA', provider: walletName });
                    await onWalletSwitched(address, 'SOLANA', walletName);
                    return;
                }

                const provider = getProvider();
                if (!provider) {
                    setWalletLoginStatus('No compatible EVM wallet was found. Install or enable an EVM wallet to continue.');
                    return;
                }
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    setWalletLoginStatus('No wallet account was selected.');
                    return;
                }
                availableWallets = [
                    ...availableWallets.filter(item => item.type !== 'EVM'),
                    ...accounts.map(address => ({ address, type: 'EVM' }))
                ];
                await onWalletSwitched(accounts[0], 'EVM');
            } catch (err) {
                console.error("Wallet Connection Error:", err);
                setWalletLoginStatus(err?.code === 4001 ? 'Wallet signature was rejected. Sign the message to unlock the dashboard.' : (err.message || 'Unable to sign in with this wallet.'));
            }
        }

        async function connectNewWallet() {
            const walletType = document.getElementById('wallet-add-type')?.value || 'EVM';
            const walletName = document.getElementById('wallet-add-solana-provider')?.value || 'phantom';
            try {
                if (walletType === 'SOLANA') {
                    const provider = getSolanaWalletProvider(walletName);
                    if (!provider) { alert(`${walletName === 'solflare' ? 'Solflare' : 'Phantom'} was not detected.`); return; }
                    await provider.connect();
                    const address = provider.publicKey?.toString();
                    if (!address) { alert('No Solana wallet account was selected.'); return; }
                    connectedSolanaProviderName = walletName;
                    if (provider.on && !solanaProviderListeners.has(provider)) {
                        provider.on('accountChanged', publicKey => {
                            if (connectedWalletType !== 'SOLANA' || connectedSolanaProviderName !== walletName) return;
                            if (!publicKey) return disconnectWallet();
                            const nextAddress = publicKey.toString();
                            addAvailableWallet({ address: nextAddress, type: 'SOLANA', provider: walletName });
                            onWalletSwitched(nextAddress, 'SOLANA', walletName);
                        });
                        solanaProviderListeners.add(provider);
                    }
                    addAvailableWallet({ address, type: 'SOLANA', provider: walletName });
                    await onWalletSwitched(address, 'SOLANA', walletName);
                    return;
                }

                const provider = getProvider();
                if (!provider) { alert('No compatible EVM wallet was found.'); return; }
                const permissions = await provider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
                const accountsPermission = permissions.find(p => p.parentCapability === 'eth_accounts');
                if (accountsPermission) {
                    const accounts = await provider.request({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        availableWallets = [
                            ...availableWallets.filter(item => item.type !== 'EVM'),
                            ...accounts.map(address => ({ address, type: 'EVM' }))
                        ];
                        await onWalletSwitched(accounts[0], 'EVM');
                    }
                }
            } catch (err) {
                console.error(err);
                setWalletLoginStatus(err?.code === 4001 ? 'Wallet signature was rejected. Sign the message to unlock the dashboard.' : (err.message || 'Unable to sign in with this wallet.'));
            }
        }

        function toggleWalletMenu() {
            const panel = document.getElementById('wallet-menu-panel');
            const trigger = document.getElementById('wallet-menu-trigger');
            if (!panel || !trigger) return;
            const isOpen = panel.hidden;
            panel.hidden = !isOpen;
            trigger.setAttribute('aria-expanded', String(isOpen));
        }

        function closeWalletMenu() {
            const panel = document.getElementById('wallet-menu-panel');
            const trigger = document.getElementById('wallet-menu-trigger');
            if (panel) panel.hidden = true;
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }

        function updateWalletDropdown() {
            const accounts = document.getElementById('wallet-menu-accounts');
            const preview = document.getElementById('wallet-active-preview');
            if (!accounts || !preview) return;
            preview.textContent = connectedWallet
                ? `${connectedWalletType === 'SOLANA' ? 'Solana' : 'EVM'} · ${connectedWallet.substring(0, 6)}...${connectedWallet.slice(-4)}`
                : 'Wallet';
            accounts.replaceChildren();
            availableWallets.forEach(wallet => {
                const isActive = wallet.type === connectedWalletType &&
                    (wallet.type === 'EVM'
                        ? wallet.address.toLowerCase() === connectedWallet?.toLowerCase()
                        : wallet.address === connectedWallet);
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `wallet-menu-account${isActive ? ' is-active' : ''}`;
                button.setAttribute('aria-current', isActive ? 'true' : 'false');
                button.textContent = `${wallet.type === 'SOLANA' ? 'Solana' : 'EVM'} · ${wallet.address.substring(0, 6)}...${wallet.address.slice(-4)}`;
                button.addEventListener('click', () => {
                    closeWalletMenu();
                    switchToAvailableWallet(wallet);
                });
                accounts.append(button);
            });
        }

        async function switchToAvailableWallet(wallet) {
            if (wallet.type === 'SOLANA') {
                const provider = getSolanaWalletProvider(wallet.provider);
                if (!provider) {
                    setWalletLoginStatus(`${wallet.provider === 'solflare' ? 'Solflare' : 'Phantom'} is unavailable. Reconnect that wallet to continue.`);
                    return;
                }
                try {
                    await provider.connect();
                    if (provider.publicKey?.toString() !== wallet.address) {
                        setWalletLoginStatus('The selected Solana account changed. Select it again from the wallet menu.');
                        return;
                    }
                    await onWalletSwitched(wallet.address, 'SOLANA', wallet.provider);
                } catch (error) {
                    setWalletLoginStatus(error.message || 'Unable to connect the selected Solana wallet.');
                }
                return;
            }
            await onWalletSwitched(wallet.address, 'EVM');
        }

        function updateWalletUIState(isConnected) {
            const connectBtn = document.getElementById('connect-btn');
            const walletMenu = document.getElementById('wallet-menu');
            const statusPill = document.getElementById('wallet-status');

            if (connectBtn) connectBtn.style.display = isConnected ? 'none' : 'inline-block';
            if (walletMenu) walletMenu.hidden = !isConnected;
            if (!isConnected) closeWalletMenu();
            
            if (statusPill) {
                statusPill.innerText = isConnected ? "Connected" : "Disconnected";
                statusPill.classList.toggle("connected", isConnected);
            }
        }

        async function onWalletSwitched(walletAddress, walletType = 'EVM', solanaProviderName = null) {
            if (!walletAddress) return;
            const owner = walletType === 'SOLANA' ? `solana:${walletAddress}` : walletAddress.toLowerCase();
            const changedWallet = getConnectedWalletOwnerKey() !== owner;
            if (changedWallet) {
                disconnectMarketDataStream();
                resetDashboardToTradeView();
                userAccounts = [];
                accountHistoryWallet = null;
                clearAccountFinancialHistory();
                accountPerformanceData = { overall: null, accounts: [] };
                selectedAccountsPerformanceTab = 'overall';
                renderPerformanceUnavailable();
                renderAccountsPerformanceTabs();
                tradeCopyGroups = [];
                tradeCopyGroupsLoadedWallet = null;
                tradeCopyGroupsPromise = null;
                renderCopyTradingGroups();
                renderCopyAccountOverview();
                walletSessionGeneration++;
                walletSessionToken = null;
                walletSessionOwner = null;
                walletSessionExpiresAt = 0;
                walletSessionPromise = null;
                walletSoftLocked = false;
                document.body.classList.remove('wallet-soft-locked');
                const securityWarning = document.getElementById('wallet-security-warning');
                if (securityWarning) securityWarning.hidden = true;
                lockDashboard('Sign the access message with the selected wallet to continue.');
            }
            connectedWallet = walletAddress;
            connectedWalletType = walletType;
            connectedSolanaProviderName = walletType === 'SOLANA' ? solanaProviderName : null;
            const loginType = document.getElementById('wallet-login-type');
            if (loginType) loginType.value = walletType;
            const loginSolanaProvider = document.getElementById('wallet-login-solana-provider');
            if (loginSolanaProvider && solanaProviderName) loginSolanaProvider.value = solanaProviderName;
            const paymentSolanaProvider = document.getElementById('solana-wallet-select');
            if (paymentSolanaProvider && solanaProviderName) paymentSolanaProvider.value = solanaProviderName;
            updateWalletConnectionControls();
            updateWalletNetworkOptions();
            updatePayoutOptions('account');
            updatePayoutOptions('referral');
            updateWalletUIState(true);
            updateWalletDropdown();
            setWalletLoginStatus('Sign the access message in your wallet.', true);
            try {
                await ensureWalletSession();
            } catch (error) {
                if (getConnectedWalletOwnerKey() === owner) {
                    console.error('Wallet sign-in failed:', error);
                    lockDashboard(error?.code === 4001 ? 'Wallet signature was rejected. Sign the message to unlock the dashboard.' : (error.message || 'Unable to sign in with this wallet.'));
                }
                return;
            }
            if (getConnectedWalletOwnerKey() !== owner) return;
            try {
                const consentResponse = await walletFetch('/api/user/disclaimer-consent');
                const consent = await consentResponse.json();
                if (!consentResponse.ok) throw new Error(consent.error || 'Unable to check disclaimer acceptance.');
                if (getConnectedWalletOwnerKey() !== owner) return;
                if (consent.accepted && consent.version === DISCLAIMER_VERSION) {
                    await continueAfterDisclaimer();
                } else {
                    showDisclaimerGate();
                }
            } catch (error) {
                if (getConnectedWalletOwnerKey() === owner) {
                    console.error('Disclaimer status check failed:', error);
                    lockDashboard(error.message || 'Unable to check disclaimer acceptance. Sign in again to continue.');
                }
            }
        }

        function isRiskLockedAccount(account) {
            return account?.lock_reason === 'DLL' ||
                account?.lock_reason === 'MLL' ||
                Number(account?.permanent_lock) === 1;
        }

        function isPermanentlyLockedCopyAccount(account) {
            return account?.status === 'PERMANENTLY_LOCKED' ||
                account?.status === 'FAILED' ||
                account?.status === 'MLL_FAILED' ||
                account?.status === 'CLOSED' ||
                account?.lock_reason === 'MLL' ||
                Number(account?.permanent_lock) === 1;
        }

        function isSelectableTradingAccount(account) {
            return account?.status === 'ACTIVE' &&
                !isRiskLockedAccount(account) &&
                Number(account.admin_frozen) !== 1 &&
                Number(account.withdrawal_pending) !== 1 &&
                Number(account.pending_withdrawal_amount || 0) <= 0;
        }

        function populateTicketAccountOptions() {
            const select = document.getElementById('ticket-account-select');
            if (!select) return;
            const selected = select.value;
            select.innerHTML = '<option value="">General support (no account)</option>' +
                userAccounts.map(account => `<option value="${escapeHTML(account.id)}">${escapeHTML(account.plan_name)} (${escapeHTML(account.id)})</option>`).join('');
            if (userAccounts.some(account => account.id === selected)) select.value = selected;
        }

        async function silentSyncUserData(wallet) {
            try {
                const res = await walletFetch(`/api/accounts?wallet=${encodeURIComponent(wallet)}`);
                if (!res.ok) throw new Error('Unable to load wallet accounts.');
                const data = await res.json();
                if (!Array.isArray(data.accounts)) throw new Error('The wallet account list is unavailable.');
                userAccounts = data.accounts;
                updateMarketChatControls();
                populateTicketAccountOptions();

                const selectElem = document.getElementById('active-account-select');
                if (!selectElem) return true;
                const currentSelected = selectElem.value;
                const selectableAccounts = userAccounts.filter(isSelectableTradingAccount);
                const nextSelected = selectableAccounts.find(account => account.id === currentSelected)?.id ||
                    selectableAccounts.find(account => account.id === selectedAccountId)?.id ||
                    selectableAccounts[0]?.id ||
                    null;
                selectedAccountId = nextSelected;
                activeAccount = selectableAccounts.find(account => account.id === nextSelected) || null;

                if (selectableAccounts.length === 0) {
                    selectElem.innerHTML = '<option value="">No Unlocked Accounts Available</option>';
                    const openList = document.getElementById('open-trades-list');
                    if (openList) openList.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #6b7280; padding: 24px;">No unlocked accounts available.</td></tr>';
                    displayedOpenTrades = [];
                    renderChartTradeOverlays([]);
                    calculateMetrics();
                } else {
                    let selectHtml = '';
                    selectableAccounts.forEach((acc) => {
                        selectHtml += `<option value="${acc.id}" ${acc.id === selectedAccountId ? 'selected' : ''}>${acc.plan_name} (${acc.id}) - Bal: $${acc.current_balance.toLocaleString()}</option>`;
                    });
                    if (selectElem.innerHTML !== selectHtml) selectElem.innerHTML = selectHtml;

                    selectElem.value = selectedAccountId;
                }

                if (selectedAccountId) {
                    calculateMetrics();
                    loadOpenTrades(selectedAccountId);
                }

                if (document.getElementById('accountsView')?.classList.contains('active')) renderAccountsPortfolioFlickerFree();
                return true;
            } catch (err) {
                console.error("Auto-sync error:", err);
                return false;
            }
        }

        function manualRefreshData() {
            if (!connectedWallet) { alert("Connect wallet first!"); return; }
            silentSyncUserData(connectedWallet);
            loadLeaderboard(currentLeaderboardMode);
            alert("Data refreshed successfully!");
        }

        function disconnectWallet() {
            resetDashboardToTradeView();
            currentWalletIsAdmin = false;
            currentWalletIsSupport = false;
            setSupportStaffWorkspace(false);
            connectedWallet = null;
            connectedWalletType = 'EVM';
            connectedSolanaProviderName = null;
            walletSessionGeneration++;
            disconnectMarketDataStream();
            walletSessionToken = null;
            walletSessionOwner = null;
            walletSessionExpiresAt = 0;
            walletSessionPromise = null;
            walletSoftLocked = false;
            document.body.classList.remove('wallet-soft-locked');
            const securityWarning = document.getElementById('wallet-security-warning');
            if (securityWarning) securityWarning.hidden = true;
            lockDashboard('Your wallet has been disconnected. Sign in again to access your dashboard.');
            availableWallets = [];
            updateWalletNetworkOptions();
            updatePayoutOptions('account');
            updatePayoutOptions('referral');
            updateWithdrawalPayoutSummary();
            userAccounts = [];
            accountHistoryWallet = null;
            clearAccountFinancialHistory();
            accountPerformanceData = { overall: null, accounts: [] };
            selectedAccountsPerformanceTab = 'overall';
            renderPerformanceUnavailable();
            renderAccountsPerformanceTabs();
            tradeCopyGroups = [];
            tradeCopyGroupsLoadedWallet = null;
            tradeCopyGroupsPromise = null;
            renderCopyTradingGroups();
            renderCopyAccountOverview();
            updateMarketChatControls();
            selectedAccountId = null;
            activeAccount = null;
            currentUserProfile = null;
            battlePassProfile = null;
            document.getElementById('battlepass-profile-card')?.setAttribute('hidden', '');
            document.getElementById('battlepass-profile-form')?.setAttribute('hidden', '');
            document.getElementById('battlepass-wallet-note').textContent = 'Connect your wallet to view your XP, points, tasks, and level titles.';

            updateWalletUIState(false);
            const adminNav = document.getElementById('admin-nav-item');
            if (adminNav) adminNav.style.display = 'none';
            if (document.getElementById('adminView')?.classList.contains('active')) switchView('tradeView');

            const actSelect = document.getElementById('active-account-select');
            if (actSelect) actSelect.innerHTML = '<option value="">No Accounts Available</option>';
            
            const accPort = document.getElementById('accounts-portfolio-container');
            if (accPort) accPort.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 30px;">Connect wallet to view your accounts.</p>';
            
            const openList = document.getElementById('open-trades-list');
            if (openList) openList.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #6b7280; padding: 24px;">Select an account to view open positions.</td></tr>';
            const ticketList = document.getElementById('user-ticket-list');
            if (ticketList) ticketList.innerHTML = '<p class="account-chart-empty">Connect your wallet to view tickets.</p>';
            const ticketAccount = document.getElementById('ticket-account-select');
            if (ticketAccount) ticketAccount.innerHTML = '<option value="">General support (no account)</option>';
            const reviewUsername = document.getElementById('review-username');
            if (reviewUsername) reviewUsername.value = '';
            const reviewSubmit = document.querySelector('#user-review-form button[type="submit"]');
            if (reviewSubmit) reviewSubmit.disabled = true;
            userReviewAccounts = [];
            const reviewAccountSelect = document.getElementById('review-account');
            if (reviewAccountSelect) {
                reviewAccountSelect.disabled = true;
                reviewAccountSelect.innerHTML = '<option value="">Connect wallet to check eligibility</option>';
            }
            const reviewComment = document.getElementById('review-comment');
            if (reviewComment) reviewComment.value = '';
            const reviewFeedback = document.getElementById('review-form-feedback');
            if (reviewFeedback) reviewFeedback.textContent = 'Connect your wallet and set up a profile username to submit a review.';
            
            const setupBox = document.getElementById('profile-setup-box');
            const dispBox = document.getElementById('profile-display-box');
            const editBtn = document.getElementById('btn-toggle-edit');
            if (setupBox) setupBox.style.display = 'block';
            if (dispBox) dispBox.style.display = 'none';
            if (editBtn) editBtn.style.display = 'none';

        }

        async function checkRole() {
            try {
                const res = await walletFetch('/api/auth/role');
                if (!res.ok) throw new Error('Unable to verify wallet role.');
                const data = await res.json();
                currentWalletIsAdmin = Boolean(data.isAdmin);
                currentWalletIsSupport = Boolean(data.isSupportStaff) && !currentWalletIsAdmin;
                const adminNav = document.getElementById('admin-nav-item');
                if (adminNav) adminNav.style.display = currentWalletIsAdmin ? 'inline-block' : 'none';
                const supportNav = document.getElementById('support-nav-item');
                if (supportNav) supportNav.hidden = !currentWalletIsSupport;
                updateMaintenanceNavigation();
                const activeView = document.querySelector('.view-panel.active')?.id;
                const pageId = maintenanceViewPages[activeView];
                if (!currentWalletIsAdmin && pageId && maintenanceStatuses[pageId]) switchView(activeView);
                return { isAdmin: currentWalletIsAdmin, isSupportStaff: currentWalletIsSupport };
            } catch (err) {
                console.error(err);
                currentWalletIsAdmin = false;
                currentWalletIsSupport = false;
                const adminNav = document.getElementById('admin-nav-item');
                if (adminNav) adminNav.style.display = 'none';
                const supportNav = document.getElementById('support-nav-item');
                if (supportNav) supportNav.hidden = true;
                return { isAdmin: false, isSupportStaff: false };
            }
        }

        async function loadUserAccounts(wallet, waitForPortfolio = false) {
            const walletKey = getConnectedWalletOwnerKey() || wallet || null;
            if (accountHistoryWallet !== walletKey) {
                clearAccountFinancialHistory();
                accountHistoryWallet = walletKey;
            }
            const synced = await silentSyncUserData(wallet);
            const portfolioRender = renderAccountsPortfolioFlickerFree();
            if (waitForPortfolio) await portfolioRender;
            return synced;
        }

        function clearAccountFinancialHistory() {
            closeWithdrawalRequest();
            const withdrawalList = document.getElementById('account-withdrawals-list');
            const purchaseList = document.getElementById('account-purchases-list');
            if (withdrawalList) withdrawalList.innerHTML = '<p class="workspace-empty-state">Connect your wallet to view withdrawal history.</p>';
            if (purchaseList) purchaseList.innerHTML = '<p class="workspace-empty-state">Connect your wallet to view account purchase history.</p>';
            accountPurchases = [];
            accountWithdrawals = [];
            accountStatementOwner = null;
            const downloadButton = document.getElementById('download-account-purchase-statement');
            if (downloadButton) downloadButton.disabled = true;
            const withdrawalDownloadButton = document.getElementById('download-account-withdrawal-statement');
            if (withdrawalDownloadButton) withdrawalDownloadButton.disabled = true;
            const withdrawalFeedback = document.getElementById('account-withdrawals-feedback');
            const purchaseFeedback = document.getElementById('account-purchases-feedback');
            if (withdrawalFeedback) withdrawalFeedback.textContent = '';
            if (purchaseFeedback) purchaseFeedback.textContent = '';
            withdrawalAvailability = [];
            selectedWithdrawalAccountId = null;
        }

        function switchAccountsSection(section) {
            if (!['portfolio', 'withdrawals', 'payments'].includes(section)) return;
            const sectionCopy = {
                portfolio: ['ACCOUNT OVERVIEW', 'Your accounts', 'Review account performance, limits, and status. Expand an account for trade history and daily results.'],
                withdrawals: ['ACCOUNT PAYOUTS', 'Withdrawals', 'Request a payout, choose your payout network, and track each withdrawal through completion.'],
                payments: ['TRANSACTION HISTORY', 'Transactions', 'Review verified account purchases and download printable payment statements.']
            }[section];
            const eyebrow = document.getElementById('accounts-view-eyebrow');
            const title = document.getElementById('accounts-view-title');
            const description = document.getElementById('accounts-view-description');
            if (eyebrow) eyebrow.textContent = sectionCopy[0];
            if (title) title.textContent = sectionCopy[1];
            if (description) description.textContent = sectionCopy[2];
            document.querySelectorAll('[data-accounts-section-tab]').forEach(tab => {
                const active = tab.dataset.accountsSectionTab === section;
                tab.classList.toggle('is-active', active);
                tab.setAttribute('aria-selected', String(active));
            });
            document.querySelectorAll('#accountsView [id^="accounts-panel-"]').forEach(panel => {
                panel.hidden = panel.id !== `accounts-panel-${section}`;
            });
            if (section === 'withdrawals') loadAccountWithdrawalHistory();
            if (section === 'payments') loadAccountPurchaseHistory();
        }

        function switchDashboardSection(section) {
            const sections = {
                portfolio: { view: 'accountsView', accountSection: 'portfolio' },
                withdrawals: { view: 'accountsView', accountSection: 'withdrawals' },
                payments: { view: 'accountsView', accountSection: 'payments' },
                profile: { view: 'profileView' }
            };
            const destination = sections[section];
            if (!destination) return;
            switchView(destination.view);
            if (destination.accountSection) switchAccountsSection(destination.accountSection);
            document.querySelectorAll('#nav-menu [data-dashboard-section]').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.dashboardSection === section);
            });
        }

        function formatAccountCurrency(value) {
            const amount = Number(value);
            return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

        function formatAccountHistoryDate(value) {
            if (!value) return '—';
            const timestamp = String(value).includes('T') ? String(value) : `${String(value).replace(' ', 'T')}Z`;
            const date = new Date(timestamp);
            return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
        }

        function transactionHashMarkup(chainId, transactionHash) {
            if (!transactionHash) return '<span class="account-finance-muted">Transaction ID not added yet</span>';
            const explorerUrl = getTransactionExplorerUrl(chainId, transactionHash);
            const displayHash = `${String(transactionHash).slice(0, 10)}…${String(transactionHash).slice(-8)}`;
            return explorerUrl
                ? `<a href="${escapeHTML(explorerUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(displayHash)}</a>`
                : `<code>${escapeHTML(transactionHash)}</code>`;
        }

        function renderAccountFinanceTable(headers, rows) {
            const headerCells = headers.map(header => `<th scope="col">${escapeHTML(header)}</th>`).join('');
            return `<div class="table-responsive"><table class="account-finance-table"><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table></div>`;
        }

        async function loadAccountWithdrawalHistory() {
            const list = document.getElementById('account-withdrawals-list');
            const feedback = document.getElementById('account-withdrawals-feedback');
            if (!list) return;
            if (!connectedWallet) {
                list.innerHTML = '<p class="workspace-empty-state">Connect your wallet to view withdrawal history.</p>';
                return;
            }
            const walletKey = getConnectedWalletOwnerKey();
            list.innerHTML = '<p class="workspace-empty-state">Loading withdrawal history…</p>';
            if (feedback) feedback.textContent = '';
            try {
                const response = await walletFetch('/api/user/account-withdrawals');
                const data = await readApiJson(response, 'Withdrawal history');
                if (!response.ok) throw new Error(data.error || 'Unable to load withdrawal history.');
                if (walletKey !== getConnectedWalletOwnerKey()) return;
                const withdrawals = data.withdrawals || [];
                accountWithdrawals = withdrawals;
                accountStatementOwner = data.statement_owner || accountStatementOwner;
                const downloadButton = document.getElementById('download-account-withdrawal-statement');
                if (downloadButton) downloadButton.disabled = withdrawals.length === 0;
                if (!withdrawals.length) {
                    list.innerHTML = '<p class="workspace-empty-state">No account withdrawals have been requested.</p>';
                    return;
                }
                const rows = withdrawals.map(withdrawal => {
                    const status = String(withdrawal.status || 'UNKNOWN').toUpperCase();
                    const statusClass = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'].includes(status) ? status.toLowerCase() : 'unknown';
                    const gross = Number(withdrawal.gross_amount) || 0;
                    const userAmount = withdrawal.user_amount == null ? gross * 0.9 : Number(withdrawal.user_amount);
                    const destination = withdrawal.payout_chain_id
                        ? `${escapeHTML(withdrawal.payout_asset || 'USDT')} · ${escapeHTML(getPayoutNetworkLabel(withdrawal.payout_chain_id))}`
                        : 'Not recorded';
                    return `
                        <tr>
                            <td><strong>${escapeHTML(withdrawal.plan_name || 'Trading account')}</strong><small>Account ${escapeHTML(withdrawal.account_id || '—')}</small></td>
                            <td class="account-finance-amount">${formatAccountCurrency(gross)} USDT</td>
                            <td class="account-finance-amount">${formatAccountCurrency(userAmount)} USDT</td>
                            <td>${destination}</td>
                            <td>${escapeHTML(formatAccountHistoryDate(withdrawal.created_at))}</td>
                            <td><span class="account-finance-status is-${statusClass}">${escapeHTML(status)}</span></td>
                            <td class="account-finance-transaction">${transactionHashMarkup(withdrawal.payout_chain_id, withdrawal.payout_tx_hash)}</td>
                        </tr>
                    `;
                }).join('');
                list.innerHTML = renderAccountFinanceTable(
                    ['Account', 'Requested', 'Your share', 'Destination', 'Requested on', 'Status', 'Transaction ID'],
                    rows
                );
            } catch (error) {
                if (walletKey !== getConnectedWalletOwnerKey()) return;
                list.innerHTML = '';
                if (feedback) feedback.textContent = error.message || 'Unable to load withdrawal history.';
            }
        }

        async function loadAccountPurchaseHistory() {
            const list = document.getElementById('account-purchases-list');
            const feedback = document.getElementById('account-purchases-feedback');
            if (!list) return;
            if (!connectedWallet) {
                list.innerHTML = '<p class="workspace-empty-state">Connect your wallet to view account purchase history.</p>';
                return;
            }
            const walletKey = getConnectedWalletOwnerKey();
            list.innerHTML = '<p class="workspace-empty-state">Loading account purchases…</p>';
            if (feedback) feedback.textContent = '';
            try {
                const response = await walletFetch('/api/user/account-purchases');
                const data = await readApiJson(response, 'Account purchase history');
                if (!response.ok) throw new Error(data.error || 'Unable to load account purchase history.');
                if (walletKey !== getConnectedWalletOwnerKey()) return;
                const purchases = data.purchases || [];
                accountPurchases = purchases;
                accountStatementOwner = data.statement_owner || accountStatementOwner;
                const downloadButton = document.getElementById('download-account-purchase-statement');
                if (downloadButton) downloadButton.disabled = purchases.length === 0;
                if (!purchases.length) {
                    list.innerHTML = '<p class="workspace-empty-state">No verified account purchases found.</p>';
                    return;
                }
                const rows = purchases.map(purchase => `
                    <tr>
                        <td><strong>${escapeHTML(purchase.plan_name || 'Trading account')}</strong><small>${Number(purchase.quantity) || 1} account${Number(purchase.quantity) === 1 ? '' : 's'} purchased</small></td>
                        <td class="account-finance-amount">${formatAccountCurrency(purchase.amount_usdt)} USDT</td>
                        <td>${escapeHTML(purchase.payment_asset || 'USDT')}</td>
                        <td>${escapeHTML(getPayoutNetworkLabel(purchase.chain_id))}</td>
                        <td>${escapeHTML(formatAccountHistoryDate(purchase.created_at))}</td>
                        <td><span class="account-finance-status is-paid">VERIFIED</span></td>
                        <td class="account-finance-transaction">${transactionHashMarkup(purchase.chain_id, purchase.tx_hash)}</td>
                    </tr>
                `).join('');
                list.innerHTML = renderAccountFinanceTable(
                    ['Purchase', 'Total paid', 'Payment asset', 'Network', 'Purchased on', 'Status', 'Transaction ID'],
                    rows
                );
            } catch (error) {
                if (walletKey !== getConnectedWalletOwnerKey()) return;
                list.innerHTML = '';
                if (feedback) feedback.textContent = error.message || 'Unable to load account purchase history.';
            }
        }

        function statementDateParts(value) {
            const rawTimestamp = String(value || '');
            const timestamp = rawTimestamp.includes('T') ? rawTimestamp : `${rawTimestamp.replace(' ', 'T')}Z`;
            const date = new Date(timestamp);
            if (Number.isNaN(date.getTime())) return ['', rawTimestamp, ''];
            const iso = date.toISOString();
            const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
            return [day, iso.slice(0, 10), `${iso.slice(11, 19)} UTC`];
        }

        function formatStatementAmount(value) {
            const amount = Number(value);
            return (Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        async function accountStatementLogoDataUrl() {
            const response = await fetch('/favicon.png');
            if (!response.ok) throw new Error('Unable to load the Blastrr logo for the statement.');
            const logoBlob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Unable to prepare the statement logo.'));
                reader.readAsDataURL(logoBlob);
            });
        }

        async function downloadAccountFinancialStatement(filename, title, columns, rows, feedbackId) {
            if (!rows.length) return;
            const feedback = document.getElementById(feedbackId);
            const owner = { ...(accountStatementOwner || {}) };
            const profileName = currentUserProfile?.username || '';
            const walletAddress = connectedWallet || '';
            try {
                const logo = await accountStatementLogoDataUrl();
                const name = owner.name || profileName || 'Not set';
                const wallet = owner.wallet_address || walletAddress || 'Not available';
                const tableRows = rows.map(row => `<tr>${row.map(value => `<td>${escapeHTML(value)}</td>`).join('')}</tr>`).join('');
                const documentHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(title)} - Blastrr</title>
<style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #172033; background: #fff; font: 14px/1.5 Arial, Helvetica, sans-serif; }
    .sheet { max-width: 900px; margin: 0 auto; padding: 34px; }
    .letterhead { display: flex; align-items: center; gap: 14px; padding-bottom: 18px; border-bottom: 3px solid #6d35c5; }
    .letterhead img { width: 52px; height: 52px; object-fit: contain; }
    .brand { display: grid; gap: 2px; }
    .brand strong { color: #26123e; font-size: 22px; letter-spacing: .08em; }
    .brand a { color: #5b2ca0; text-decoration: none; }
    .document-type { margin-left: auto; color: #4b5563; font-size: 13px; font-weight: 700; text-align: right; }
    h1 { margin: 24px 0 16px; color: #171326; font-size: 24px; }
    .owner { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 0 0 24px; padding: 15px; border: 1px solid #d9dce4; border-radius: 8px; background: #f8f8fb; }
    .owner div { min-width: 0; }
    .owner dt { color: #5b6472; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .owner dd { margin: 3px 0 0; overflow-wrap: anywhere; }
    .owner code { font: 12px/1.5 Consolas, monospace; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 9px; border-bottom: 1px solid #e1e4eb; text-align: left; vertical-align: top; }
    th { background: #f0edf7; color: #33204e; font-size: 11px; text-transform: uppercase; }
    td:last-child, th:last-child { text-align: right; white-space: nowrap; }
    footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #d9dce4; color: #667085; font-size: 11px; }
    .print-button { margin-top: 22px; padding: 10px 15px; border: 0; border-radius: 6px; background: #6034a6; color: white; font-weight: 700; cursor: pointer; }
    @media print { .sheet { padding: 0; } .print-button { display: none; } }
    @media (max-width: 600px) { .sheet { padding: 18px; } .owner { grid-template-columns: 1fr; } .document-type { font-size: 11px; } }
</style>
</head>
<body>
<main class="sheet">
    <header class="letterhead">
        <img src="${logo}" alt="Blastrr logo">
        <div class="brand"><strong>BLASTRR</strong><a href="https://blastrr.com">https://blastrr.com</a></div>
        <span class="document-type">ACCOUNT STATEMENT</span>
    </header>
    <h1>${escapeHTML(title)}</h1>
    <dl class="owner">
        <div><dt>Name / username</dt><dd>${escapeHTML(name)}</dd></div>
        <div><dt>Wallet</dt><dd><code>${escapeHTML(wallet)}</code></dd></div>
        <div><dt>Period</dt><dd>All time</dd></div>
        <div><dt>Generated (UTC)</dt><dd>${escapeHTML(new Date().toISOString().replace('T', ' ').replace('Z', ' UTC'))}</dd></div>
    </dl>
    <table>
        <thead><tr>${columns.map(column => `<th>${escapeHTML(column)}</th>`).join('')}</tr></thead>
        <tbody>${tableRows || `<tr><td colspan="${columns.length}">No statement entries found.</td></tr>`}</tbody>
    </table>
    <footer>Generated from account records available in the Blastrr platform. Visit <a href="https://blastrr.com">blastrr.com</a>.</footer>
    <button class="print-button" type="button" onclick="window.print()">Print / Save as PDF</button>
</main>
</body>
</html>`;
                const blobUrl = URL.createObjectURL(new Blob([documentHtml], { type: 'text/html;charset=utf-8' }));
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                if (feedback) feedback.textContent = '';
            } catch (error) {
                if (feedback) feedback.textContent = error.message || 'Unable to create the account statement.';
            }
        }

        function downloadAccountPurchaseStatement() {
            const purchases = [...accountPurchases].sort((left, right) => (
                new Date(String(left.created_at || '').replace(' ', 'T') + (String(left.created_at || '').includes('T') ? '' : 'Z')) -
                new Date(String(right.created_at || '').replace(' ', 'T') + (String(right.created_at || '').includes('T') ? '' : 'Z'))
            ));
            const rows = purchases.map(purchase => [
                ...statementDateParts(purchase.created_at),
                formatStatementAmount(purchase.amount_usdt)
            ]);
            return downloadAccountFinancialStatement(
                'account-purchase-statement.html',
                'Account Purchase Statement',
                ['Day', 'Date', 'Time (UTC)', 'Amount (USDT)'],
                rows,
                'account-purchases-feedback'
            );
        }

        function downloadAccountWithdrawalStatement() {
            const withdrawals = [...accountWithdrawals].sort((left, right) => (
                new Date(String(left.created_at || '').replace(' ', 'T') + (String(left.created_at || '').includes('T') ? '' : 'Z')) -
                new Date(String(right.created_at || '').replace(' ', 'T') + (String(right.created_at || '').includes('T') ? '' : 'Z'))
            ));
            const rows = withdrawals.map(withdrawal => {
                const gross = Number(withdrawal.gross_amount) || 0;
                const netAmount = withdrawal.user_amount == null ? gross * 0.9 : Number(withdrawal.user_amount);
                return [
                    ...statementDateParts(withdrawal.created_at),
                    formatStatementAmount(netAmount),
                    String(withdrawal.status || 'UNKNOWN').toUpperCase()
                ];
            });
            return downloadAccountFinancialStatement(
                'account-withdrawal-statement.html',
                'Account Withdrawal Statement',
                ['Day', 'Date', 'Time (UTC)', 'Amount (USDT)', 'Status'],
                rows,
                'account-withdrawals-feedback'
            );
        }

        async function loadTradeCopyGroups(forceRefresh = false) {
            const walletKey = getConnectedWalletOwnerKey();
            if (!walletKey || (!forceRefresh && tradeCopyGroupsLoadedWallet === walletKey)) return;
            if (tradeCopyGroupsPromise) await tradeCopyGroupsPromise;
            if (!forceRefresh && tradeCopyGroupsLoadedWallet === walletKey) return;

            const request = (async () => {
                const response = await walletFetch('/api/trade-copy/groups');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load copy-trading groups.');
                if (getConnectedWalletOwnerKey() !== walletKey) return;
                tradeCopyGroups = data.groups || [];
                tradeCopyGroupsLoadedWallet = walletKey;
                renderCopyTradingGroups();
                renderCopyAccountOverview();
                refreshAccountMinimizedOverviews();
                const accountsStatus = document.getElementById('accounts-copy-trading-status');
                if (accountsStatus) accountsStatus.textContent = '';
            })();
            tradeCopyGroupsPromise = request;
            try {
                await request;
            } finally {
                if (tradeCopyGroupsPromise === request) tradeCopyGroupsPromise = null;
            }
        }

        async function loadCopyTradingPage() {
            const status = document.getElementById('copy-trading-status');
            try {
                await loadUserAccounts(connectedWallet, true);
                await loadTradeCopyGroups(true);
                renderCopyTradingGroups();
                renderCopyAccountOverview();
                if (status) status.textContent = '';
            } catch (error) {
                if (status) status.textContent = error.message || 'Unable to load copy-trading groups.';
            }
        }

        function formatPerformanceMoney(value) {
            if (value === null || value === undefined || value === '') return '—';
            const amount = Number(value);
            if (!Number.isFinite(amount)) return '—';
            const sign = amount < 0 ? '−' : '';
            return `${sign}$${Math.abs(amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

        function renderPerformanceMetrics(container, metrics, { scope = 'overall' } = {}) {
            if (!container) return;
            if (!metrics) {
                container.innerHTML = '<p class="workspace-empty-state">Performance data is unavailable. Refresh to try again.</p>';
                return;
            }
            const items = [];
            if (scope === 'overall') {
                items.push(
                    ['Active accounts', Number(metrics.activeAccountCount ?? metrics.accountCount ?? 0).toLocaleString()],
                    ['DLL-locked accounts', Number(metrics.dllLockedAccountCount || 0).toLocaleString()],
                    ['Starting capital', formatPerformanceMoney(metrics.initialBalance)],
                    ['Current balance', formatPerformanceMoney(metrics.currentBalance)]
                );
            }
            items.push(
                ['Closed trades', Number(metrics.closedTrades || 0).toLocaleString()],
                ['Wins / losses', `${Number(metrics.winningTrades || 0).toLocaleString()} / ${Number(metrics.losingTrades || 0).toLocaleString()}`],
                ['Win rate', metrics.winRatePercent != null && Number.isFinite(Number(metrics.winRatePercent)) ? `${Number(metrics.winRatePercent).toFixed(1)}%` : '—'],
                ['Average win', formatPerformanceMoney(metrics.averageWin)],
                ['Average loss', formatPerformanceMoney(metrics.averageLoss)],
                ['Break-even trades', Number(metrics.breakEvenTrades || 0).toLocaleString()],
                ['Avg win/loss (R:R)', metrics.winLossRatio != null && Number.isFinite(Number(metrics.winLossRatio)) ? `${Number(metrics.winLossRatio).toFixed(2)} : 1` : '—'],
                ['Profit factor', metrics.profitFactor != null && Number.isFinite(Number(metrics.profitFactor)) ? Number(metrics.profitFactor).toFixed(2) : '—'],
                ['Net realized P&L', formatPerformanceMoney(metrics.netRealizedPnl)],
                ['Expectancy / trade', formatPerformanceMoney(metrics.expectancy)],
                ['Best trade', formatPerformanceMoney(metrics.bestTrade)],
                ['Worst trade', formatPerformanceMoney(metrics.worstTrade)],
                ['Open positions', Number(metrics.openTrades || 0).toLocaleString()],
                ['Pending orders', Number(metrics.pendingOrders || 0).toLocaleString()]
            );
            container.innerHTML = items.map(([label, value]) => {
                const numericValue = Number(String(value).replace(/[−$,]/g, ''));
                const hasNumericValue = value !== '—' && Number.isFinite(numericValue);
                let tone = '';
                if (hasNumericValue && (label === 'Net realized P&L' || label === 'Expectancy / trade')) {
                    tone = numericValue >= 0 ? ' is-positive' : ' is-negative';
                } else if (hasNumericValue && (label === 'Average win' || label === 'Best trade')) {
                    tone = ' is-positive';
                } else if (hasNumericValue && (label === 'Average loss' || label === 'Worst trade')) {
                    tone = ' is-negative';
                }
                const title = label === 'Avg win/loss (R:R)'
                    ? 'Average winning PnL divided by the absolute average losing PnL.'
                    : label === 'Profit factor'
                        ? 'Gross profit divided by gross losses.'
                        : '';
                return `<div class="performance-stat"><span${title ? ` title="${title}"` : ''}>${label}</span><strong class="performance-stat-value${tone}">${value}</strong></div>`;
            }).join('');
        }

        function renderAccountsPerformanceTabs() {
            const tabs = document.getElementById('accounts-performance-tabs');
            const summary = document.getElementById('accounts-performance-summary');
            if (!tabs || !summary) return;
            const accounts = accountPerformanceData.accounts || [];
            const selectedExists = selectedAccountsPerformanceTab === 'overall' ||
                accounts.some(account => String(account.accountId) === selectedAccountsPerformanceTab);
            if (!selectedExists) selectedAccountsPerformanceTab = 'overall';
            tabs.innerHTML = [
                { id: 'overall', label: 'Overall' },
                ...accounts.map(account => ({ id: String(account.accountId), label: account.planName }))
            ].map(tab => `<button id="account-performance-tab-${escapeHTML(tab.id)}" class="account-performance-tab${selectedAccountsPerformanceTab === tab.id ? ' is-active' : ''}"
                type="button" role="tab" aria-selected="${selectedAccountsPerformanceTab === tab.id}"
                aria-controls="accounts-performance-summary"
                data-performance-account="${escapeHTML(tab.id)}">${escapeHTML(tab.label)}</button>`).join('');
            const selectedAccount = accounts.find(account => String(account.accountId) === selectedAccountsPerformanceTab);
            const overall = selectedAccountsPerformanceTab === 'overall';
            const heading = document.getElementById('accounts-performance-heading');
            summary.setAttribute('aria-labelledby', `account-performance-tab-${selectedAccountsPerformanceTab}`);
            if (heading) heading.textContent = overall
                ? 'Lifetime account performance'
                : `${selectedAccount.planName} performance`;
            renderPerformanceMetrics(summary, overall ? accountPerformanceData.overall : selectedAccount?.metrics, {
                scope: overall ? 'overall' : 'account'
            });
        }

        function selectAccountsPerformanceTab(accountId) {
            if (accountId !== 'overall' &&
                !(accountPerformanceData.accounts || []).some(account => String(account.accountId) === accountId)) return;
            selectedAccountsPerformanceTab = accountId;
            renderAccountsPerformanceTabs();
        }

        function renderPortfolioPerformance() {
            renderPerformanceMetrics(
                document.getElementById('copy-overall-performance'),
                accountPerformanceData.overall,
                { scope: 'overall' }
            );
            renderAccountsPerformanceTabs();
            for (const account of accountPerformanceData.accounts || []) {
                const container = document.getElementById(`account-performance-${account.accountId}`);
                if (container) renderPerformanceMetrics(container, account.metrics, { scope: 'account' });
            }
        }

        function renderPerformanceUnavailable() {
            const message = '<p class="workspace-empty-state">Performance data is unavailable. Refresh to try again.</p>';
            for (const id of ['accounts-performance-summary', 'copy-overall-performance']) {
                const container = document.getElementById(id);
                if (container) container.innerHTML = message;
            }
            document.querySelectorAll('.account-performance-header').forEach(container => {
                container.innerHTML = message;
            });
        }

        async function loadAccountPerformance() {
            const wallet = getConnectedWalletOwnerKey();
            if (!wallet) return false;
            if (accountPerformanceRequest && accountPerformanceRequestWallet === wallet) {
                return accountPerformanceRequest;
            }
            const request = Promise.resolve().then(async () => {
                try {
                    const response = await walletFetch('/api/accounts/performance');
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Unable to load account performance.');
                    if (wallet !== getConnectedWalletOwnerKey()) return false;
                    accountPerformanceData = data;
                    renderPortfolioPerformance();
                    return true;
                } catch (error) {
                    console.error('Unable to load portfolio performance:', error);
                    if (wallet === getConnectedWalletOwnerKey()) renderPerformanceUnavailable();
                    return false;
                } finally {
                    if (accountPerformanceRequest === request) {
                        accountPerformanceRequest = null;
                        accountPerformanceRequestWallet = null;
                    }
                }
            });
            accountPerformanceRequest = request;
            accountPerformanceRequestWallet = wallet;
            return request;
        }

        function renderAccountProgressStats(metrics, { compact = false } = {}) {
            if (!metrics) return '';
            const stats = [
                {
                    label: 'Profit target',
                    percentage: metrics.profitTargetPercent,
                    current: metrics.currentProfit,
                    target: metrics.profitTarget,
                    detail: `Profit ${formatPerformanceMoney(metrics.currentProfit)} of ${formatPerformanceMoney(metrics.profitTarget)} · ${Number(metrics.profitProgress || 0).toFixed(1)}% earned`,
                    tone: 'profit'
                },
                {
                    label: 'Daily loss (DLL)',
                    percentage: metrics.dllProgress,
                    current: metrics.currentDLL,
                    target: metrics.maxAllowedDLL,
                    detail: `Loss used ${formatPerformanceMoney(metrics.currentDLL)} of ${formatPerformanceMoney(metrics.maxAllowedDLL)}`,
                    tone: 'dll'
                },
                {
                    label: 'Trailing MLL',
                    percentage: metrics.ddProgress,
                    current: metrics.currentDD,
                    target: metrics.maxAllowedDD,
                    detail: `Drawdown used ${formatPerformanceMoney(metrics.currentDD)} of ${formatPerformanceMoney(metrics.maxAllowedDD)}`,
                    tone: 'mll'
                }
            ];
            return stats.map(stat => {
                const percentage = Number(stat.percentage);
                const target = Number(stat.target);
                const current = Number(stat.current);
                if (!Number.isFinite(percentage) || !Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return '';
                const progress = Math.min(100, Math.max(0, percentage));
                const percentLabel = `${progress.toFixed(1)}%`;
                return `<div class="account-risk-item account-progress-item${compact ? ' is-compact' : ''} account-progress-${stat.tone}">
                    <div class="account-progress-heading"><span>${stat.label}</span><strong>${percentLabel}</strong></div>
                    <div class="account-progress" role="progressbar" aria-label="${stat.label} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" aria-valuetext="${percentLabel}">
                        <i style="width:${progress}%"></i>
                    </div>
                    <small>${stat.detail}</small>
                </div>`;
            }).join('');
        }

        function getCopyAccountAssignments() {
            const assignments = new Map();
            for (const group of tradeCopyGroups) {
                if (group.leader?.id != null) assignments.set(String(group.leader.id), { name: group.name, role: 'Leader' });
                for (const follower of group.followers || []) {
                    if (follower?.id != null) {
                        assignments.set(String(follower.id), {
                            name: group.name,
                            role: 'Follower',
                            sizePct: follower.size_pct
                        });
                    }
                }
            }
            return assignments;
        }

        function renderAccountOverviewContent(account, assignment, copyGroupsAvailable) {
            const permanentlyLocked = isPermanentlyLockedCopyAccount(account);
            const progressMarkup = renderAccountProgressStats(
                accountProgressMetrics.get(String(account.id)),
                { compact: true }
            );
            const status = `${escapeHTML(account.status || 'Unknown')}${Number(account.admin_frozen) === 1 ? ' · Admin frozen' : ''}${permanentlyLocked ? ' · Unavailable for copy trading' : ''}`;
            const assignmentLabel = permanentlyLocked
                ? 'Cannot join a copy group'
                : assignment
                    ? `${assignment.role} · ${escapeHTML(assignment.name || 'Copy group')}`
                    : copyGroupsAvailable ? 'Available' : 'Copy group status unavailable';

            return `<div class="copy-overview-heading">
                    <div class="copy-overview-identity"><strong>${escapeHTML(account.plan_name || 'Trading account')}</strong><code>${escapeHTML(account.id)}</code></div>
                    <span class="copy-overview-balance"><span>Balance</span><strong>$${Number(account.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                </div>
                <div class="copy-overview-meta">
                    <span class="copy-overview-status">${status}</span>
                    <span class="copy-overview-assignment">${assignmentLabel}</span>
                </div>
                ${progressMarkup ? `<div class="copy-overview-progress">${progressMarkup}</div>` : ''}`;
        }

        function renderAccountsPortfolioMinimizedContent(account, assignment, copyGroupsAvailable) {
            const permanentlyLocked = isPermanentlyLockedCopyAccount(account);
            const role = permanentlyLocked
                ? 'PERMANENTLY LOCKED · REMOVE FROM GROUP'
                : assignment
                    ? `${assignment.role.toUpperCase()} · ${escapeHTML(assignment.name || 'Copy group')}`
                    : copyGroupsAvailable ? 'AVAILABLE FOR COPY TRADING' : 'COPY GROUP STATUS UNAVAILABLE';
            const status = `${escapeHTML(account.status || 'Unknown')}${Number(account.admin_frozen) === 1 ? ' · Admin frozen' : ''}`;
            const progressMarkup = renderAccountProgressStats(
                accountProgressMetrics.get(String(account.id)),
                { compact: true }
            );
            const sizePct = Number(assignment?.sizePct);

            return `<div>
                    <span class="copy-account-role">${role}</span>
                    <strong>${escapeHTML(account.plan_name || 'Trading account')} · ${escapeHTML(account.id)}</strong>
                    <small>${status}</small>
                </div>
                <div class="copy-account-balance">
                    <span>Balance</span>
                    <strong>$${Number(account.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    ${assignment?.role === 'Follower' && Number.isFinite(sizePct) ? `<small>${sizePct.toLocaleString()}% size</small>` : ''}
                </div>
                ${progressMarkup ? `<div class="copy-group-account-progress">${progressMarkup}</div>` : ''}`;
        }

        function refreshAccountMinimizedOverviews() {
            const assignments = getCopyAccountAssignments();
            const copyGroupsAvailable = tradeCopyGroupsLoadedWallet === getConnectedWalletOwnerKey();
            for (const account of userAccounts) {
                const card = document.getElementById(`acc-card-${account.id}`);
                const summary = card?.querySelector(`#account-minimized-overview-${CSS.escape(account.id)}`);
                if (!card || !summary) continue;
                card.classList.toggle('is-permanently-locked', isPermanentlyLockedCopyAccount(account));
                summary.innerHTML = renderAccountsPortfolioMinimizedContent(
                    account,
                    assignments.get(String(account.id)),
                    copyGroupsAvailable
                );
            }
        }

        function renderCopyAccountOverview() {
            const container = document.getElementById('copy-account-overview');
            if (!container) return;
            if (!userAccounts.length) {
                container.innerHTML = '<p class="workspace-empty-state">No trading accounts are attached to this wallet.</p>';
                return;
            }
            const visibleAccounts = userAccounts.filter(account =>
                !hidePermanentlyLockedCopyAccounts || !isPermanentlyLockedCopyAccount(account)
            );
            if (!visibleAccounts.length) {
                container.innerHTML = '<p class="workspace-empty-state">No accounts to show. Turn off “Hide permanently locked accounts” to review permanently locked accounts.</p>';
                return;
            }
            const assignments = getCopyAccountAssignments();
            container.innerHTML = visibleAccounts.map(account => {
                const assignment = assignments.get(String(account.id));
                const permanentlyLocked = isPermanentlyLockedCopyAccount(account);
                return `<article class="copy-overview-account${permanentlyLocked ? ' is-permanently-locked' : ''}">
                    ${renderAccountOverviewContent(account, assignment, true)}
                </article>`;
            }).join('');
        }

        function togglePermanentlyLockedCopyAccounts(checked) {
            hidePermanentlyLockedCopyAccounts = checked;
            renderCopyAccountOverview();
        }

        function renderCopyTradingGroups() {
            const container = document.getElementById('copy-groups-container');
            if (!container) return;
            if (!tradeCopyGroups.length) {
                container.innerHTML = '<p class="workspace-empty-state">No copy-trading groups yet. Create a group to get started.</p>';
                return;
            }
            container.innerHTML = tradeCopyGroups.map(group => {
                const accountsMarkup = [group.leader, ...group.followers].filter(Boolean).map(account => `
                    <article class="copy-account-card ${account === group.leader ? 'is-leader' : ''}${isPermanentlyLockedCopyAccount(account) ? ' is-permanently-locked' : ''}">
                        <div>
                            <span class="copy-account-role">${isPermanentlyLockedCopyAccount(account) ? 'PERMANENTLY LOCKED · REMOVE FROM GROUP' : account === group.leader ? 'LEADER' : 'FOLLOWER'}</span>
                            <strong>${escapeHTML(account.plan_name)} · ${escapeHTML(account.id)}</strong>
                            <small>${escapeHTML(account.status)}${account.admin_frozen ? ' · Admin frozen' : ''}</small>
                        </div>
                        <div class="copy-account-balance">
                            <span>Balance</span><strong>$${Number(account.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                            ${account === group.leader ? '' : `<small>${Number(account.size_pct).toLocaleString()}% size</small>`}
                        </div>
                        ${accountProgressMetrics.has(String(account.id)) ? `<div class="copy-group-account-progress">${renderAccountProgressStats(accountProgressMetrics.get(String(account.id)), { compact: true })}</div>` : ''}
                    </article>
                `).join('');
                const hasLeader = Boolean(group.leader);
                return `<article class="card copy-group-card" data-copy-group="${escapeHTML(group.id)}">
                    <div class="copy-group-heading">
                        <div><span class="battlepass-eyebrow">${!hasLeader ? 'LEADER LOCKED · GROUP PAUSED' : group.active ? 'ACTIVE GROUP' : 'PAUSED GROUP'}</span><h2>${escapeHTML(group.name)}</h2></div>
                        <label class="copy-group-toggle"><input type="checkbox" data-copy-action="toggle" ${group.active ? 'checked' : ''}><span>Active</span></label>
                    </div>
                    ${!hasLeader ? '<p class="copy-wizard-help">The permanently locked leader was removed. Edit this group to choose a replacement before resuming it.</p>' : ''}
                    <div class="copy-group-members">${accountsMarkup}</div>
                    <div class="copy-group-actions">
                        <button class="battlepass-secondary-button" type="button" data-copy-action="trade" ${hasLeader ? '' : 'disabled'}>Trade with leader</button>
                        <button class="battlepass-secondary-button" type="button" data-copy-action="edit">Edit</button>
                        <button class="copy-group-delete" type="button" data-copy-action="delete">Delete group</button>
                    </div>
                </article>`;
            }).join('');
        }

        function startCopyGroupWizard(groupId = null) {
            const group = tradeCopyGroups.find(item => item.id === groupId);
            tradeCopyWizard = group ? {
                groupId: group.id,
                name: group.name,
                leaderId: isPermanentlyLockedCopyAccount(group.leader) ? '' : group.leader?.id || '',
                followers: Object.fromEntries(group.followers
                    .filter(account => !isPermanentlyLockedCopyAccount(account))
                    .map(account => [account.id, Number(account.size_pct)])),
                active: group.active,
                step: 1
            } : { groupId: null, name: '', leaderId: '', followers: {}, active: false, step: 1 };
            const wizard = document.getElementById('copy-group-wizard');
            if (wizard) wizard.hidden = false;
            renderCopyGroupWizard();
            wizard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function renderCopyGroupWizard() {
            const wizard = document.getElementById('copy-group-wizard');
            const content = document.getElementById('copy-wizard-content');
            const title = document.getElementById('copy-wizard-title');
            const stepLabel = document.getElementById('copy-wizard-step-label');
            const back = document.getElementById('copy-wizard-back');
            const next = document.getElementById('copy-wizard-next');
            const save = document.getElementById('copy-wizard-save');
            const error = document.getElementById('copy-wizard-error');
            if (!wizard || !content || !tradeCopyWizard) return;
            const step = tradeCopyWizard.step;
            const assignedAccountIds = new Set(tradeCopyGroups
                .filter(group => group.id !== tradeCopyWizard.groupId)
                .flatMap(group => [group.leader?.id, ...group.followers.map(account => account.id)]));
            const eligibleAccounts = userAccounts.filter(account =>
                !isPermanentlyLockedCopyAccount(account) &&
                (isSelectableTradingAccount(account) || [tradeCopyWizard.leaderId, ...Object.keys(tradeCopyWizard.followers)].includes(account.id)) &&
                (!assignedAccountIds.has(account.id) || account.id === tradeCopyWizard.leaderId || tradeCopyWizard.followers[account.id] != null)
            );
            const accountLabel = account => `${escapeHTML(account.plan_name || 'Trading account')} · ${escapeHTML(account.id)}`;
            if (step === 1) {
                title.textContent = 'Choose a leader';
                content.innerHTML = `<p class="copy-wizard-help">The leader is the account you select in the Trade Terminal. Orders submitted there are copied to the followers.</p>
                    <div class="copy-wizard-account-list">${eligibleAccounts.map(account => `
                        <label class="copy-wizard-account">
                            <input type="radio" name="copy-leader" value="${escapeHTML(account.id)}" ${tradeCopyWizard.leaderId === account.id ? 'checked' : ''}>
                            <span><strong>${accountLabel(account)}</strong><small>Balance $${Number(account.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${escapeHTML(account.status)}</small></span>
                        </label>`).join('') || '<p class="workspace-empty-state">No available accounts. Accounts already assigned to another group cannot be reused.</p>'}</div>`;
            } else if (step === 2) {
                title.textContent = 'Choose followers';
                const followerAccounts = eligibleAccounts.filter(account => account.id !== tradeCopyWizard.leaderId);
                content.innerHTML = `<p class="copy-wizard-help">Choose one or more follower accounts and set each order size as a percentage of the leader’s submitted size. 100% matches it; 200% doubles it.</p>
                    <div class="copy-wizard-account-list">${followerAccounts.map(account => {
                        const selected = tradeCopyWizard.followers[account.id] != null;
                        return `<div class="copy-wizard-account copy-follower-choice">
                            <label><input type="checkbox" data-copy-follower="${escapeHTML(account.id)}" ${selected ? 'checked' : ''}>
                                <span><strong>${accountLabel(account)}</strong><small>Balance $${Number(account.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${escapeHTML(account.status)}</small></span></label>
                            <label class="copy-size-input"><span>Size %</span><input type="number" min="0.01" step="any" data-copy-size="${escapeHTML(account.id)}" value="${selected ? escapeHTML(tradeCopyWizard.followers[account.id]) : '100'}" ${selected ? '' : 'disabled'}></label>
                        </div>`;
                    }).join('') || '<p class="workspace-empty-state">No other available accounts to use as followers.</p>'}</div>`;
            } else {
                title.textContent = 'Review and save';
                const leader = eligibleAccounts.find(account => account.id === tradeCopyWizard.leaderId);
                const followerSummary = Object.entries(tradeCopyWizard.followers).map(([id, sizePct]) => {
                    const account = userAccounts.find(item => item.id === id);
                    return `<li>${accountLabel(account || { id, plan_name: 'Trading account' })} — ${Number(sizePct).toLocaleString()}%</li>`;
                }).join('');
                content.innerHTML = `<div class="copy-wizard-review">
                    <p><strong>Leader:</strong> ${leader ? accountLabel(leader) : 'Not selected'}</p>
                    <p><strong>Followers:</strong></p><ul>${followerSummary}</ul>
                    <label class="form-group"><span>Group name</span><input id="copy-group-name" type="text" maxlength="60" value="${escapeHTML(tradeCopyWizard.name)}" placeholder="e.g. Main portfolio"></label>
                    <label class="copy-group-toggle"><input id="copy-group-active" type="checkbox" ${tradeCopyWizard.active ? 'checked' : ''}><span>Activate this group after saving</span></label>
                    <p class="copy-wizard-help">Each follower executes independently and can fail if its balance or account status does not allow the order. The leader’s linked exits continue to close follower positions if this group is later paused or deleted.</p>
                </div>`;
            }
            stepLabel.textContent = `STEP ${step} OF 3`;
            back.hidden = step === 1;
            next.hidden = step === 3;
            save.hidden = step !== 3;
            error.textContent = '';
        }

        function closeCopyGroupWizard() {
            tradeCopyWizard = null;
            const wizard = document.getElementById('copy-group-wizard');
            if (wizard) wizard.hidden = true;
        }

        async function saveCopyGroup() {
            if (!tradeCopyWizard) return;
            const name = document.getElementById('copy-group-name')?.value.trim();
            const active = document.getElementById('copy-group-active')?.checked === true;
            const saveButton = document.getElementById('copy-wizard-save');
            const error = document.getElementById('copy-wizard-error');
            const selectedIds = [tradeCopyWizard.leaderId, ...Object.keys(tradeCopyWizard.followers)];
            if (selectedIds.some(id => isPermanentlyLockedCopyAccount(userAccounts.find(account => account.id === id)))) {
                error.textContent = 'Permanently locked accounts cannot be added to copy-trading groups.';
                return;
            }
            if (!name) {
                error.textContent = 'Enter a name for this group.';
                return;
            }
            saveButton.disabled = true;
            try {
                const response = await walletFetch('/api/trade-copy/groups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        group_id: tradeCopyWizard.groupId,
                        name,
                        leader_account_id: tradeCopyWizard.leaderId,
                        followers: Object.entries(tradeCopyWizard.followers).map(([account_id, size_pct]) => ({ account_id, size_pct })),
                        active
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to save copy-trading group.');
                closeCopyGroupWizard();
                await loadCopyTradingPage();
            } catch (saveError) {
                error.textContent = saveError.message || 'Unable to save copy-trading group.';
            } finally {
                saveButton.disabled = false;
            }
        }

        async function handleCopyGroupAction(event) {
            const button = event.target.closest('[data-copy-action]');
            if (!button) return;
            const card = button.closest('[data-copy-group]');
            const group = tradeCopyGroups.find(item => item.id === card?.dataset.copyGroup);
            if (!group) return;
            const status = document.getElementById('copy-trading-status');
            const action = button.dataset.copyAction;
            try {
                if (action === 'toggle' && event.type !== 'change') return;
                if (action === 'edit') return startCopyGroupWizard(group.id);
                if (action === 'trade') {
                    if (!group.leader) throw new Error('Choose a replacement leader before trading with this group.');
                    switchActiveAccount(group.leader.id);
                    switchView('tradeView');
                    return;
                }
                if (action === 'toggle') {
                    const response = await walletFetch(`/api/trade-copy/groups/${encodeURIComponent(group.id)}/active`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ active: button.checked })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Unable to update group status.');
                    group.active = data.active;
                    renderCopyTradingGroups();
                } else if (action === 'delete') {
                    if (!confirm(`Delete “${group.name}”? Existing copied positions remain linked for leader exits and flattening.`)) return;
                    const response = await walletFetch(`/api/trade-copy/groups/${encodeURIComponent(group.id)}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Unable to delete copy-trading group.');
                    await loadCopyTradingPage();
                }
            } catch (error) {
                if (status) status.textContent = error.message || 'Unable to update copy-trading group.';
                if (action === 'toggle') renderCopyTradingGroups();
            }
        }

        async function flattenCopyTrades(button) {
            if (!confirm('Emergency stop: pause all copy groups and close every open or pending copy-trading position across your accounts?')) return;
            const status = document.getElementById('copy-trading-status');
            button.disabled = true;
            if (status) status.textContent = 'Closing open and pending copy trades…';
            try {
                const response = await walletFetch('/api/trade-copy/flatten', { method: 'POST' });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to flatten copy trades.');
                const failures = data.failed || [];
                const summary = failures.length
                    ? `Closed ${data.closed} position(s); ${failures.length} could not be closed. ${failures.map(item => `${item.trade_id}: ${item.error}`).join(' ')}`
                    : `Emergency stop complete. Paused all copy groups and closed ${data.closed} open or pending copy-trading position(s).`;
                await loadCopyTradingPage();
                if (status) status.textContent = summary;
            } catch (error) {
                if (status) status.textContent = error.message || 'Unable to flatten copy trades.';
            } finally {
                button.disabled = false;
            }
        }

        function isActivePortfolioAccount(account) {
            return account?.status === 'ACTIVE' &&
                !account.lock_reason &&
                Number(account.permanent_lock) !== 1 &&
                Number(account.admin_frozen) !== 1;
        }

        function toggleMllAccounts(show) {
            showPermanentlyLockedPortfolioAccounts = Boolean(show);
            renderAccountsPortfolioFlickerFree();
        }

        async function renderAccountsPortfolioFlickerFree() {
            const container = document.getElementById('accounts-portfolio-container');
            if (!container) return;
            if (userAccounts.length === 0) {
                await loadAccountPerformance();
                const copyStatus = document.getElementById('accounts-copy-trading-status');
                if (copyStatus) copyStatus.textContent = '';
                container.innerHTML = '<p class="workspace-empty-state">No accounts found. Purchase a plan in the marketplace!</p>';
                return;
            }

            const copyStatus = document.getElementById('accounts-copy-trading-status');
            let copyGroupsAvailable = false;
            try {
                await loadTradeCopyGroups();
                copyGroupsAvailable = tradeCopyGroupsLoadedWallet === getConnectedWalletOwnerKey();
                if (copyStatus) copyStatus.textContent = '';
            } catch (error) {
                if (copyStatus) copyStatus.textContent = `Copy-group status is unavailable: ${error.message || 'Unable to load copy-trading groups.'}`;
            }
            const copyAssignments = getCopyAccountAssignments();
            const accountIds = new Set(userAccounts.map(account => `acc-card-${account.id}`));
            container.querySelectorAll('[id^="acc-card-"]').forEach(card => {
                if (!accountIds.has(card.id)) card.remove();
            });
            if (!container.querySelector('[id^="acc-card-"]')) container.replaceChildren();

            for (const acc of userAccounts) {
                const detailsRes = await walletFetch(`/api/accounts/details?account_id=${encodeURIComponent(acc.id)}&wallet=${encodeURIComponent(connectedWallet)}`);
                const details = await detailsRes.json();
                if (!detailsRes.ok || !details.account) throw new Error(details.error || 'Unable to load account details.');
                Object.assign(acc, details.account);
                const m = details.metrics;
                const trades = details.trades;
                accountProgressMetrics.set(String(acc.id), m);
                const isMllAccount = isPermanentlyLockedCopyAccount(acc);
                if (!isActivePortfolioAccount(acc) && !(showPermanentlyLockedPortfolioAccounts && isMllAccount)) {
                    document.getElementById(`acc-card-${acc.id}`)?.remove();
                    continue;
                }

                let cardElem = document.getElementById(`acc-card-${acc.id}`);
                if (!cardElem) {
                    const cardHtml = `
                        <article id="acc-card-${acc.id}" class="account-card copy-account-card${isMllAccount ? ' is-permanently-locked' : ''}">
                            <div id="account-minimized-overview-${acc.id}" class="account-minimized-overview">
                                ${renderAccountsPortfolioMinimizedContent(acc, copyAssignments.get(String(acc.id)), copyGroupsAvailable)}
                            </div>
                            <details class="account-expanded">
                                <summary>Account details, performance and trades</summary>
                                <div class="account-expanded-content">
                                    <div class="account-card-header">
                                        <div>
                                            <span class="account-plan-name">${acc.plan_name}</span>
                                            <code class="account-id">${acc.id}</code>
                                        </div>
                                        <div class="account-card-actions">
                                            <button id="withdraw-btn-${acc.id}" class="btn-wallet" onclick="requestWithdrawal('${acc.id}')">Request Withdrawal</button>
                                            <button class="btn-wallet" onclick="selectAccountAndTrade('${acc.id}')">Select in Terminal</button>
                                        </div>
                                    </div>
                                    <div id="account-performance-${acc.id}" class="account-performance-header">
                                        <div id="profit-target-${acc.id}" class="account-profit-target">
                                            <span>Profit target</span>
                                            <strong>${Number(m.profitTargetPercent || 0).toFixed(1)}%</strong>
                                            <small>Target: $${acc.profit_target.toLocaleString()}</small>
                                        </div>
                                        ${renderAccountProgressStats(m)}
                                    </div>
                                    <div class="account-preview-grid">
                                        <div class="account-preview-stat dashboard-tile"><span>Initial capital</span><strong>$${acc.initial_balance.toLocaleString()}</strong></div>
                                        <div class="account-preview-stat dashboard-tile"><span>Current balance</span><strong id="bal-val-${acc.id}">$${acc.current_balance.toLocaleString()}</strong></div>
                                        <div class="account-preview-stat dashboard-tile"><span>Total profit</span><strong id="profit-val-${acc.id}">$${m.currentProfit.toLocaleString()}</strong></div>
                                        <div class="account-preview-stat dashboard-tile"><span>Account status</span><strong id="status-val-${acc.id}">${acc.status}</strong></div>
                                    </div>
                                    <div class="account-card-footer">
                                        <span>Consistency score: <strong id="cs-val-${acc.id}">${m.consistencyScore}%</strong></span>
                                    </div>
                                    <section class="account-profit-section">
                                        <h3>Daily profit</h3>
                                        <div id="profit-chart-${acc.id}" class="account-profit-chart"></div>
                                    </section>
                                    <section class="account-trade-calendar-section" aria-label="Trade calendar and journal">
                                        <div class="account-calendar-heading">
                                            <div><h3>Trade calendar</h3><p>Daily results from closed trades. Select a day to write or edit your journal.</p></div>
                                            <div class="account-calendar-month-controls">
                                                <button class="btn-wallet" type="button" data-calendar-step="-1" aria-label="Previous month">‹</button>
                                                <strong id="account-calendar-month-${acc.id}" class="account-calendar-month"></strong>
                                                <button class="btn-wallet" type="button" data-calendar-step="1" aria-label="Next month">›</button>
                                            </div>
                                        </div>
                                        <div id="account-calendar-${acc.id}" class="account-trade-calendar"></div>
                                        <div id="account-journal-editor-${acc.id}" class="account-journal-editor" hidden>
                                            <div class="account-journal-editor-heading">
                                                <h4 id="account-journal-date-${acc.id}"></h4>
                                                <span>No file uploads · text only</span>
                                            </div>
                                            <label class="sr-only" for="account-journal-text-${acc.id}">Journal entry for this trading day</label>
                                            <textarea id="account-journal-text-${acc.id}" maxlength="5000" placeholder="Describe the trades you took and what you were thinking. What was your plan, what went well, and what would you change?"></textarea>
                                            <div class="account-journal-editor-actions">
                                                <span id="account-journal-status-${acc.id}" class="account-journal-status" role="status"></span>
                                                <button class="btn-wallet" type="button" data-journal-save>Save entry</button>
                                            </div>
                                            <p class="account-journal-help">Up to 5,000 characters. Saving an empty entry removes it.</p>
                                        </div>
                                    </section>
                                    <h3 class="account-trades-heading">Trade history</h3>
                                    <div class="table-responsive">
                                        <table>
                                            <thead><tr><th>Trade ID</th><th>Symbol</th><th>Side</th><th>Entry Price</th><th>Size ($)</th><th>SL / TP</th><th>Realized PnL</th><th>Status</th><th>Share</th></tr></thead>
                                            <tbody id="trades-body-${acc.id}"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </details>
                        </article>
                    `;
                    container.insertAdjacentHTML('beforeend', cardHtml);
                    cardElem = document.getElementById(`acc-card-${acc.id}`);
                    bindAccountCalendarControls(cardElem);
                }

                cardElem.classList.toggle('is-permanently-locked', isMllAccount);
                const minimizedOverview = cardElem.querySelector(`#account-minimized-overview-${CSS.escape(acc.id)}`);
                if (minimizedOverview) {
                    minimizedOverview.innerHTML = renderAccountsPortfolioMinimizedContent(
                        acc,
                        copyAssignments.get(String(acc.id)),
                        copyGroupsAvailable
                    );
                }
                const accountPerformance = accountPerformanceData.accounts.find(item => String(item.accountId) === String(acc.id));
                renderPerformanceMetrics(
                    cardElem.querySelector(`#account-performance-${CSS.escape(acc.id)}`),
                    accountPerformance?.metrics,
                    { scope: 'account' }
                );
                cardElem.querySelector(`#bal-val-${CSS.escape(acc.id)}`).innerText = `$${acc.current_balance.toLocaleString()}`;
                cardElem.querySelector(`#profit-val-${CSS.escape(acc.id)}`).innerText = `$${m.currentProfit.toLocaleString()}`;
                cardElem.querySelector(`#cs-val-${CSS.escape(acc.id)}`).innerText = `${m.consistencyScore}%`;
                const statusLabel = acc.lock_reason === 'MLL' || Number(acc.permanent_lock) === 1
                    ? 'PERMANENTLY LOCKED — MLL'
                    : acc.lock_reason === 'DLL'
                        ? `LOCKED — DLL until ${new Date(acc.locked_until).toLocaleString()}`
                        : acc.admin_frozen
                            ? 'FROZEN — ADMIN'
                            : m.withdrawalPending
                                ? 'PAUSED — WITHDRAWAL REVIEW'
                                : acc.status;
                const statusElement = cardElem.querySelector(`#status-val-${CSS.escape(acc.id)}`);
                statusElement.innerText = statusLabel;
                statusElement.style.color = acc.lock_reason || acc.admin_frozen || m.withdrawalPending ? '#ef4444' : '#34d399';
                const withdrawButton = cardElem.querySelector(`#withdraw-btn-${CSS.escape(acc.id)}`);
                if (withdrawButton) {
                    withdrawButton.disabled = m.withdrawalPending || Boolean(acc.admin_frozen) || m.withdrawableAmount <= 0;
                    withdrawButton.textContent = m.withdrawalPending ? 'Withdrawal under review' : 'Request Withdrawal';
                    withdrawButton.title = m.withdrawalPending
                        ? 'Trading is paused until the administrator resolves this request.'
                        : `Up to $${m.withdrawableAmount.toFixed(2)} gross available`;
                }

                let tradesRows = '';
                if (trades.length === 0) {
                    tradesRows = '<tr><td colspan="9" style="text-align: center; color: #6b7280; padding: 20px;">No trades recorded for this account.</td></tr>';
                } else {
                    trades.forEach(t => {
                        const pnlColor = t.pnl >= 0 ? '#34d399' : '#ef4444';
                        tradesRows += `
                            <tr>
                                <td><code>${t.id}</code></td>
                                <td>${t.symbol}</td>
                                <td><span style="color: ${t.side === 'BUY' ? '#34d399' : '#ef4444'}; font-weight: bold;">${t.side}</span></td>
                                <td>$${t.entry_price.toFixed(2)}</td>
                                <td>$${t.size_usd.toLocaleString()}</td>
                                <td>SL: ${t.sl || 'None'} / TP: ${t.tp || 'None'}</td>
                                <td><span style="color: ${pnlColor}; font-weight: bold;">$${t.pnl.toFixed(2)}</span></td>
                                <td><span style="color: ${t.status === 'OPEN' ? '#fbbf24' : '#9ca3af'}; font-weight: 600;">${t.status}</span></td>
                                <td>
                                    ${t.status === 'CLOSED' ? `<button class="btn-share-x" onclick="shareTradeOnX('${t.id}', '${t.symbol}', '${t.side}', ${t.pnl}, ${t.entry_price})">𝕏 Share</button>` : '-'}
                                </td>
                            </tr>
                        `;
                    });
                }
                const bodyElem = document.getElementById(`trades-body-${acc.id}`);
                if (bodyElem) bodyElem.innerHTML = tradesRows;

                const dailyHistory = [...(details.dailySummaries || [])];
                dailyHistory.push({
                    day: acc.risk_day || new Date().toISOString().slice(0, 10),
                    profit: m.riskBalance - acc.daily_starting_balance
                });
                renderDailyProfitChart(cardElem.querySelector(`#profit-chart-${CSS.escape(acc.id)}`), dailyHistory);
                cardElem._calendarAccount = acc;
                cardElem._calendarTrades = trades;
                cardElem._calendarJournals = details.journalEntries || [];
                renderAccountTradeCalendar(cardElem, acc, trades, details.journalEntries || []);
            }
            await loadAccountPerformance();
            if (!container.querySelector('[id^="acc-card-"]')) {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'account-chart-empty';
                emptyMessage.textContent = showPermanentlyLockedPortfolioAccounts
                    ? 'No active, unlocked, or MLL-failed accounts are available to display. Soft-locked DLL accounts remain included in the portfolio summary above.'
                    : 'No active, unlocked accounts available to display. Select “Show MLL-failed accounts” to review permanently locked accounts. Soft-locked DLL accounts remain included in the portfolio summary above.';
                container.replaceChildren(emptyMessage);
            }
        }

        function bindAccountCalendarControls(card) {
            if (!card || card.dataset.calendarBound === 'true') return;
            card.dataset.calendarBound = 'true';
            card.addEventListener('click', event => {
                const monthButton = event.target.closest('[data-calendar-step]');
                if (monthButton) {
                    const accountId = card.id.slice('acc-card-'.length);
                    changeAccountCalendarMonth(accountId, Number(monthButton.dataset.calendarStep));
                    return;
                }
                const dayButton = event.target.closest('[data-calendar-day]');
                if (dayButton) {
                    selectAccountJournalDay(card.id.slice('acc-card-'.length), dayButton.dataset.calendarDay);
                    return;
                }
                const saveButton = event.target.closest('[data-journal-save]');
                if (saveButton) saveAccountJournalEntry(card.id.slice('acc-card-'.length), saveButton);
            });
            card.addEventListener('input', event => {
                if (!event.target.matches('[id^="account-journal-text-"]')) return;
                const accountId = card.id.slice('acc-card-'.length);
                const day = accountJournalDays.get(accountId);
                if (day) accountJournalDrafts.set(`${accountId}:${day}`, event.target.value);
            });
        }

        function getUtcMonthKey(date) {
            return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
        }

        function renderAccountTradeCalendar(card, account, trades, journalEntries) {
            const accountId = account.id;
            const calendar = card.querySelector(`#account-calendar-${CSS.escape(accountId)}`);
            const monthLabel = card.querySelector(`#account-calendar-month-${CSS.escape(accountId)}`);
            if (!calendar || !monthLabel) return;

            const now = new Date();
            const currentMonth = getUtcMonthKey(now);
            const monthKey = accountCalendarMonths.get(accountId) || currentMonth;
            const [year, month] = monthKey.split('-').map(Number);
            const firstDay = new Date(Date.UTC(year, month - 1, 1));
            const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
            const monthStartDay = firstDay.getUTCDay();
            const monthDate = new Date(Date.UTC(year, month - 1, 1));
            monthLabel.textContent = monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });

            const tradesByDay = new Map();
            (trades || []).filter(trade => trade.status === 'CLOSED').forEach(trade => {
                const tradeDay = String(trade.closed_at || trade.created_at || '').slice(0, 10);
                if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDay)) return;
                const totals = tradesByDay.get(tradeDay) || { profit: 0, count: 0 };
                totals.profit += Number(trade.pnl) || 0;
                totals.count++;
                tradesByDay.set(tradeDay, totals);
            });
            const journalsByDay = new Map((journalEntries || []).map(entry => [entry.day, entry]));
            const cells = [];

            for (let index = 0; index < monthStartDay; index++) {
                cells.push('<span class="account-calendar-blank" aria-hidden="true"></span>');
            }
            for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
                const day = `${monthKey}-${String(dayNumber).padStart(2, '0')}`;
                const totals = tradesByDay.get(day) || { profit: 0, count: 0 };
                const journal = journalsByDay.get(day);
                const isFuture = day > now.toISOString().slice(0, 10);
                const resultClass = totals.count === 0
                    ? 'is-empty'
                    : totals.profit > 0
                        ? 'is-winning'
                        : totals.profit < 0
                            ? 'is-losing'
                            : 'is-flat';
                const signedProfit = `${totals.profit > 0 ? '+' : totals.profit < 0 ? '−' : ''}$${Math.abs(totals.profit).toFixed(2)}`;
                cells.push(`
                    <button class="account-calendar-day ${resultClass}${journal ? ' has-journal' : ''}" type="button"
                        data-calendar-day="${day}" aria-label="${day}: ${totals.count} closed trades, ${signedProfit}${journal ? ', journal entry saved' : ''}"
                        ${isFuture ? 'disabled' : ''}>
                        <span class="account-calendar-day-number">${dayNumber}</span>
                        ${totals.count ? `<strong class="account-calendar-profit">${signedProfit}</strong><span class="account-calendar-trade-count">${totals.count} ${totals.count === 1 ? 'trade' : 'trades'}</span>` : '<span class="account-calendar-no-trades">No closed trades</span>'}
                        ${journal ? '<span class="account-calendar-journal-indicator" aria-label="Journal entry saved">Journal saved</span>' : ''}
                    </button>
                `);
            }

            calendar.innerHTML = `
                <div class="account-calendar-weekdays" aria-hidden="true">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<span>${day}</span>`).join('')}
                </div>
                <div class="account-calendar-grid">${cells.join('')}</div>
                <p class="account-calendar-legend"><span><i class="is-winning"></i> Winning day</span><span><i class="is-losing"></i> Losing day</span><span><i class="is-flat"></i> Break-even</span><span><i class="is-empty"></i> No closed trades</span></p>
            `;

            const nextMonthButton = card.querySelector('[data-calendar-step="1"]');
            if (nextMonthButton) nextMonthButton.disabled = monthKey >= currentMonth;
            const selectedDay = accountJournalDays.get(accountId);
            const editor = card.querySelector(`#account-journal-editor-${CSS.escape(accountId)}`);
            if (selectedDay && selectedDay.startsWith(`${monthKey}-`)) {
                const journal = journalsByDay.get(selectedDay);
                const dateHeading = card.querySelector(`#account-journal-date-${CSS.escape(accountId)}`);
                const textarea = card.querySelector(`#account-journal-text-${CSS.escape(accountId)}`);
                if (editor && dateHeading && textarea) {
                    editor.hidden = false;
                    dateHeading.textContent = new Date(`${selectedDay}T00:00:00Z`).toLocaleDateString(undefined, {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
                    });
                    const draftKey = `${accountId}:${selectedDay}`;
                    if (document.activeElement !== textarea) {
                        textarea.value = accountJournalDrafts.has(draftKey)
                            ? accountJournalDrafts.get(draftKey)
                            : journal?.body || '';
                    }
                }
            } else if (editor) editor.hidden = true;
        }

        function changeAccountCalendarMonth(accountId, step) {
            const card = document.getElementById(`acc-card-${accountId}`);
            if (!card) return;
            const currentKey = accountCalendarMonths.get(accountId) || getUtcMonthKey(new Date());
            const [year, month] = currentKey.split('-').map(Number);
            const target = new Date(Date.UTC(year, month - 1 + step, 1));
            const targetKey = getUtcMonthKey(target);
            if (targetKey > getUtcMonthKey(new Date())) return;
            accountCalendarMonths.set(accountId, targetKey);
            renderAccountTradeCalendar(card, card._calendarAccount, card._calendarTrades, card._calendarJournals);
        }

        function selectAccountJournalDay(accountId, day) {
            const card = document.getElementById(`acc-card-${accountId}`);
            if (!card || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
            accountJournalDays.set(accountId, day);
            const journal = (card._calendarJournals || []).find(entry => entry.day === day);
            const editor = card.querySelector(`#account-journal-editor-${CSS.escape(accountId)}`);
            const dateHeading = card.querySelector(`#account-journal-date-${CSS.escape(accountId)}`);
            const textarea = card.querySelector(`#account-journal-text-${CSS.escape(accountId)}`);
            const status = card.querySelector(`#account-journal-status-${CSS.escape(accountId)}`);
            if (!editor || !dateHeading || !textarea) return;
            dateHeading.textContent = new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
            });
            textarea.value = accountJournalDrafts.get(`${accountId}:${day}`) ?? journal?.body ?? '';
            if (status) status.textContent = '';
            editor.hidden = false;
            editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            textarea.focus({ preventScroll: true });
        }

        async function saveAccountJournalEntry(accountId, button) {
            const card = document.getElementById(`acc-card-${accountId}`);
            const day = accountJournalDays.get(accountId);
            const textarea = card?.querySelector(`#account-journal-text-${CSS.escape(accountId)}`);
            const status = card?.querySelector(`#account-journal-status-${CSS.escape(accountId)}`);
            if (!card || !day || !textarea || !status) return;
            button.disabled = true;
            status.textContent = 'Saving…';
            try {
                const response = await walletFetch(`/api/accounts/${encodeURIComponent(accountId)}/journal`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ day, body: textarea.value })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to save journal entry.');
                const entries = card._calendarJournals || [];
                const entryIndex = entries.findIndex(entry => entry.day === day);
                if (data.entry) {
                    if (entryIndex >= 0) entries[entryIndex] = data.entry;
                    else entries.push(data.entry);
                    accountJournalDrafts.set(`${accountId}:${day}`, data.entry.body);
                    status.textContent = 'Journal entry saved.';
                } else {
                    if (entryIndex >= 0) entries.splice(entryIndex, 1);
                    accountJournalDrafts.delete(`${accountId}:${day}`);
                    status.textContent = 'Journal entry removed.';
                }
                card._calendarJournals = entries;
                renderAccountTradeCalendar(card, card._calendarAccount, card._calendarTrades, entries);
                await loadBattlePass();
            } catch (error) {
                status.textContent = error.message || 'Unable to save journal entry.';
            } finally {
                button.disabled = false;
            }
        }

        function renderDailyProfitChart(container, dailyHistory) {
            if (!container) return;
            const points = dailyHistory
                .filter(point => /^\d{4}-\d{2}-\d{2}$/.test(point.day) && Number.isFinite(Number(point.profit)))
                .sort((left, right) => left.day.localeCompare(right.day))
                .slice(-14);
            if (!points.length) {
                container.innerHTML = '<p class="account-chart-empty">Daily profit history will appear here.</p>';
                return;
            }

            const width = 640;
            const height = 220;
            const left = 54;
            const right = width - 18;
            const top = 20;
            const bottom = 166;
            const values = points.map(point => Number(point.profit));
            const minValue = Math.min(0, ...values);
            const maxValue = Math.max(0, ...values);
            const range = Math.max(1, maxValue - minValue);
            const x = index => points.length === 1 ? (left + right) / 2 : left + index * (right - left) / (points.length - 1);
            const y = value => bottom - ((value - minValue) / range) * (bottom - top);
            const zeroY = y(0);
            const coordinates = points.map((point, index) => `${x(index)},${y(Number(point.profit))}`).join(' ');
            const circles = points.map((point, index) => (
                `<circle cx="${x(index)}" cy="${y(Number(point.profit))}" r="4" fill="#c084fc"><title>${point.day}: $${Number(point.profit).toFixed(2)}</title></circle>`
            )).join('');
            const dateLabels = points.map((point, index) => (
                index % Math.max(1, Math.ceil(points.length / 7)) === 0 || index === points.length - 1
                    ? `<text x="${x(index)}" y="194" text-anchor="middle">${point.day.slice(5)}</text>`
                    : ''
            )).join('');
            const rows = [...points].reverse().map(point => `
                <tr><td>${point.day}</td><td class="${Number(point.profit) >= 0 ? 'profit-positive' : 'profit-negative'}">$${Number(point.profit).toFixed(2)}</td></tr>
            `).join('');

            container.innerHTML = `
                <svg class="daily-profit-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily profit by date">
                    <line x1="${left}" y1="${zeroY}" x2="${right}" y2="${zeroY}" class="profit-zero-line"></line>
                    <polyline points="${coordinates}" class="profit-line"></polyline>
                    ${circles}${dateLabels}
                </svg>
                <div class="table-responsive">
                    <table class="daily-profit-table"><thead><tr><th>Date (UTC)</th><th>Profit</th></tr></thead><tbody>${rows}</tbody></table>
                </div>
            `;
        }

        async function requestWithdrawal(accountId) {
            const modal = document.getElementById('withdrawal-request-modal');
            const feedback = document.getElementById('withdrawal-modal-feedback');
            if (!connectedWallet) {
                if (feedback) feedback.textContent = 'Connect the wallet that owns the account to request a withdrawal.';
                return;
            }
            if (!modal) return;
            switchAccountsSection('withdrawals');
            const walletKey = getConnectedWalletOwnerKey();
            if (!modal.open) modal.showModal();
            if (feedback) feedback.textContent = '';
            const list = document.getElementById('withdrawal-request-account-list');
            if (list) list.innerHTML = '<p class="workspace-empty-state">Loading account availability…</p>';
            withdrawalAvailability = [];
            selectedWithdrawalAccountId = null;
            const amount = document.getElementById('withdrawal-request-amount');
            const submit = document.getElementById('submit-withdrawal-request');
            if (amount) {
                amount.value = '';
                amount.disabled = true;
                amount.removeAttribute('max');
            }
            if (submit) submit.disabled = true;
            updateWithdrawalAmountSummary();
            try {
                const response = await walletFetch('/api/withdrawals/availability');
                const data = await readApiJson(response, 'Withdrawal availability');
                if (!response.ok) throw new Error(data.error || 'Unable to load account availability.');
                if (walletKey !== getConnectedWalletOwnerKey()) return;
                withdrawalAvailability = data.accounts || [];
                renderWithdrawalAccountOptions();
                const requestedAccount = accountId == null
                    ? null
                    : withdrawalAvailability.find(account => String(account.account_id) === String(accountId));
                const preferred = requestedAccount?.can_withdraw ? requestedAccount : null;
                const firstAvailable = withdrawalAvailability.find(account => account.can_withdraw);
                if (preferred || (accountId == null && firstAvailable)) {
                    selectWithdrawalAccount(String((preferred || firstAvailable).account_id));
                } else if (requestedAccount && feedback) {
                    feedback.textContent = requestedAccount.unavailable_reason || 'This account is not currently available for withdrawal.';
                }
                updateWithdrawalPayoutSummary();
            } catch (error) {
                if (walletKey !== getConnectedWalletOwnerKey()) return;
                if (list) list.innerHTML = '';
                if (feedback) feedback.textContent = error.message || 'Unable to load account availability.';
            }
        }

        function renderWithdrawalAccountOptions() {
            const list = document.getElementById('withdrawal-request-account-list');
            const form = document.getElementById('withdrawal-request-form');
            if (!list) return;
            if (!withdrawalAvailability.length) {
                list.innerHTML = '<p class="workspace-empty-state">No trading accounts are available yet. Purchase an account plan to get started.</p>';
                if (form) form.classList.add('is-disabled');
                return;
            }
            if (form) form.classList.remove('is-disabled');
            list.innerHTML = withdrawalAvailability.map(account => {
                const accountId = String(account.account_id);
                const progress = Math.min(100, Math.max(0, Number(account.balance_progress_pct) || 0));
                const available = Boolean(account.can_withdraw);
                return `
                    <button class="withdrawal-account-choice${available ? '' : ' is-unavailable'}" type="button"
                        data-withdrawal-account="${escapeHTML(accountId)}" aria-pressed="false" ${available ? '' : 'disabled'}>
                        <span class="withdrawal-account-choice-heading">
                            <span><strong>${escapeHTML(account.plan_name || 'Trading account')}</strong><small>Account ${escapeHTML(accountId)}</small></span>
                            <span class="withdrawal-account-choice-amount">${formatAccountCurrency(account.max_withdrawable)}<small>gross available</small></span>
                        </span>
                        <span class="withdrawal-account-choice-details">
                            <span>Balance ${formatAccountCurrency(account.current_balance)} · Protected balance ${formatAccountCurrency(account.withdrawal_floor)}</span>
                            <span>${available ? 'Available to request' : escapeHTML(account.unavailable_reason || 'Not currently available')}</span>
                        </span>
                        <span class="withdrawal-progress-track" aria-hidden="true"><span style="width:${progress}%"></span></span>
                        <span class="withdrawal-account-choice-progress">Progress toward protected balance: ${progress.toFixed(0)}%</span>
                    </button>
                `;
            }).join('');
        }

        function selectWithdrawalAccount(accountId) {
            const account = withdrawalAvailability.find(item => String(item.account_id) === String(accountId));
            if (!account || !account.can_withdraw) return;
            selectedWithdrawalAccountId = String(account.account_id);
            document.querySelectorAll('[data-withdrawal-account]').forEach(option => {
                const selected = option.dataset.withdrawalAccount === selectedWithdrawalAccountId;
                option.classList.toggle('is-selected', selected);
                option.setAttribute('aria-pressed', String(selected));
            });
            const amount = document.getElementById('withdrawal-request-amount');
            const submit = document.getElementById('submit-withdrawal-request');
            if (amount) {
                amount.disabled = false;
                amount.max = String(Number(account.max_withdrawable).toFixed(2));
                amount.value = Number(account.max_withdrawable).toFixed(2);
            }
            if (submit) submit.disabled = false;
            const maximum = document.getElementById('withdrawal-max-amount');
            if (maximum) maximum.textContent = `${formatAccountCurrency(account.max_withdrawable)} USDT`;
            updateWithdrawalAmountSummary();
        }

        function updateWithdrawalAmountSummary() {
            const selected = withdrawalAvailability.find(account => String(account.account_id) === selectedWithdrawalAccountId);
            const amount = Number(document.getElementById('withdrawal-request-amount')?.value) || 0;
            const maxAmount = document.getElementById('withdrawal-max-amount');
            const netAmount = document.getElementById('withdrawal-net-amount');
            const adminShare = document.getElementById('withdrawal-admin-share');
            const submit = document.getElementById('submit-withdrawal-request');
            if (maxAmount) maxAmount.textContent = selected ? `${formatAccountCurrency(selected.max_withdrawable)} USDT` : '$0.00 USDT';
            if (netAmount) netAmount.textContent = `${formatAccountCurrency(amount * 0.9)} USDT`;
            if (adminShare) adminShare.textContent = `${formatAccountCurrency(amount * 0.1)} USDT`;
            if (submit) {
                submit.disabled = !selected || amount <= 0 || amount > Number(selected.max_withdrawable);
            }
        }

        function updateWithdrawalPayoutSummary() {
            const destination = document.getElementById('withdrawal-payout-destination');
            if (!destination) return;
            try {
                const payout = getSelectedPayoutOptions('account');
                destination.textContent = `${payout.payout_asset} · ${getPayoutNetworkLabel(payout.payout_chain_id)}`;
            } catch (error) {
                destination.textContent = error.message || 'Choose a supported network and asset';
            }
        }

        function closeWithdrawalRequest() {
            const modal = document.getElementById('withdrawal-request-modal');
            if (modal?.open) modal.close();
        }

        async function submitWithdrawalRequest(event) {
            event.preventDefault();
            const feedback = document.getElementById('withdrawal-modal-feedback');
            const selected = withdrawalAvailability.find(account => String(account.account_id) === selectedWithdrawalAccountId);
            const amountInput = document.getElementById('withdrawal-request-amount');
            const amount = Math.round(Number(amountInput?.value) * 100) / 100;
            if (!connectedWallet || !selected || !selected.can_withdraw || !Number.isFinite(amount) ||
                amount <= 0 || amount > Number(selected.max_withdrawable)) {
                if (feedback) feedback.textContent = 'Choose an available account and enter an amount within its maximum.';
                return;
            }
            let payout;
            try {
                payout = getSelectedPayoutOptions('account');
            } catch (error) {
                if (feedback) feedback.textContent = error.message;
                return;
            }
            const submit = document.getElementById('submit-withdrawal-request');
            if (submit) submit.disabled = true;
            if (feedback) feedback.textContent = 'Confirm the signed wallet request…';
            const walletKey = getConnectedWalletOwnerKey();
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/withdrawals/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...authorization,
                        wallet_address: connectedWallet,
                        account_id: selected.account_id,
                        amount,
                        ...payout
                    })
                });
                const data = await readApiJson(response, 'Withdrawal request');
                if (!response.ok || !data.success) throw new Error(data.error || 'Unable to submit withdrawal request.');
                if (walletKey !== getConnectedWalletOwnerKey()) return;
                const historyFeedback = document.getElementById('account-withdrawals-feedback');
                if (historyFeedback) {
                    historyFeedback.textContent = `Withdrawal request submitted: ${formatAccountCurrency(data.gross_amount)} gross; you receive ${formatAccountCurrency(data.user_amount)} and the admin share is ${formatAccountCurrency(data.admin_share)}.`;
                }
                closeWithdrawalRequest();
                await Promise.all([
                    loadAccountWithdrawalHistory(),
                    loadUserAccounts(connectedWallet)
                ]);
            } catch (error) {
                if (feedback) feedback.textContent = error.message || 'Unable to submit withdrawal request.';
            } finally {
                updateWithdrawalAmountSummary();
            }
        }

        async function requestCommissionWithdrawal() {
            let payout;
            try {
                payout = getSelectedPayoutOptions('referral');
            } catch (error) {
                alert(error.message);
                return;
            }
            const payoutLabel = `${payout.payout_asset} on ${getPayoutNetworkLabel(payout.payout_chain_id)}`;
            const amountInput = prompt(`Enter commission amount in ${payout.payout_asset} (Available: $${availableCommissionBalance.toFixed(2)}; payout to ${connectedWallet} on ${payoutLabel}):`);
            if (!amountInput) return;
            const amount = parseFloat(amountInput);
            if (isNaN(amount) || amount <= 0 || amount > availableCommissionBalance) { alert("Invalid amount."); return; }

            try {
                const authorization = await signedTradeAuthorization();
                const res = await fetch('/api/referrals/withdraw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, amount, ...payout })
                });
                const data = await res.json();
                if (data.success) { alert("Commission withdrawal submitted!"); loadUserProfile(connectedWallet); }
                else alert("Error: " + data.error);
            } catch (err) { console.error(err); }
        }

        function formatAdminUsdt(value) {
            const amount = Number(value);
            return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} USDT`;
        }

        function formatAdminStablecoin(value, asset = 'USDT') {
            const amount = Number(value);
            return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} ${asset}`;
        }

        function formatAdminStablecoinTotals(usdt, usdc) {
            return `${formatAdminStablecoin(usdt, 'USDT')} · ${formatAdminStablecoin(usdc, 'USDC')}`;
        }

        function getPayoutNetworkLabel(chainId) {
            if (Number(chainId) === 101) return 'Solana Mainnet';
            return SUPPORTED_EVM_CHAINS[Number(chainId)]?.name || 'Unknown network';
        }

        function getTransactionExplorerUrl(chainId, transactionHash) {
            if (typeof transactionHash !== 'string') return '';
            const explorers = {
                1: 'https://etherscan.io/tx/',
                8453: 'https://basescan.org/tx/',
                137: 'https://polygonscan.com/tx/',
                43114: 'https://snowtrace.io/tx/',
                56: 'https://bscscan.com/tx/',
                101: 'https://solscan.io/tx/'
            };
            const baseUrl = explorers[Number(chainId)];
            if (Number(chainId) === 101) {
                if (!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(transactionHash)) return '';
            } else if (!/^0x[0-9a-f]{64}$/i.test(transactionHash)) {
                return '';
            }
            return baseUrl ? `${baseUrl}${encodeURIComponent(transactionHash)}` : '';
        }

        function adminEventLabel(event) {
            const walletLabel = event.username
                ? `@${event.username}`
                : `${String(event.wallet_address || '').slice(0, 6)}…${String(event.wallet_address || '').slice(-4)}`;
            switch (event.event_type) {
                case 'ACCOUNT_PURCHASE': return `${walletLabel} purchased ${event.plan_name} ×${event.quantity}`;
                case 'PERFORMANCE_PAYOUT_REQUESTED': return `${walletLabel} requested a trading performance payout`;
                case 'PERFORMANCE_PAYOUT_APPROVED': return `Trading performance payout approved for ${walletLabel}`;
                case 'PERFORMANCE_PAYOUT_PAID': return `Trading performance payout paid to ${walletLabel}`;
                case 'PERFORMANCE_PAYOUT_REJECTED': return `Trading performance payout rejected for ${walletLabel}`;
                case 'REFERRAL_PAYOUT_REQUESTED': return `${walletLabel} requested a referral payout`;
                case 'REFERRAL_PAYOUT_PAID': return `Referral payout paid to ${walletLabel}`;
                case 'REFERRAL_PAYOUT_REJECTED': return `Referral payout rejected for ${walletLabel}`;
                case 'TICKET_OPENED': return `New support ticket from ${walletLabel}: ${event.plan_name}`;
                case 'REVIEW_PENDING': return `New homepage review from ${walletLabel}`;
                case 'REWARD_PACK_OUT_OF_STOCK': return event.plan_name || 'A Battle Pass reward pack is out of stock.';
                default: return 'Platform activity';
            }
        }

        function renderAdminOperationsFeed(events) {
            const feed = document.getElementById('admin-operations-feed');
            if (!feed) return;
            if (!events.length) {
                feed.innerHTML = '<li class="account-chart-empty">No recent operations activity.</li>';
                return;
            }
            feed.innerHTML = events.map(event => {
                const explorerUrl = getTransactionExplorerUrl(event.chain_id, event.tx_hash);
                const isTicket = event.event_type === 'TICKET_OPENED';
                const isWithdrawal = event.event_type.includes('PAYOUT_');
                const isReview = event.event_type === 'REVIEW_PENDING';
                const action = isTicket
                    ? '<button type="button" class="btn-wallet" data-admin-ops-open="tickets">Open tickets</button>'
                    : isWithdrawal
                        ? '<button type="button" class="btn-wallet" data-admin-ops-open="withdrawals">Open payouts</button>'
                        : isReview
                            ? '<button type="button" class="btn-wallet" data-admin-ops-open="reviews">Open reviews</button>'
                            : '';
                return `
                    <li class="admin-operations-event">
                        <div>
                            <strong>${escapeHTML(adminEventLabel(event))}</strong>
                            <small>${escapeHTML(new Date(event.occurred_at).toLocaleString())}${isWithdrawal || event.event_type === 'ACCOUNT_PURCHASE' ? ` · ${escapeHTML(isWithdrawal ? `${formatAdminStablecoin(event.amount_usdt, event.payment_asset || 'USDT')} on ${getPayoutNetworkLabel(event.chain_id)}` : formatAdminStablecoin(event.amount_usdt, event.payment_asset || 'USDT'))}` : ''}</small>
                            ${event.tx_hash ? `<small>Transaction: ${explorerUrl ? `<a href="${escapeHTML(explorerUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(event.tx_hash)}</a>` : `<code>${escapeHTML(event.tx_hash)}</code>`}</small>` : ''}
                        </div>
                        ${action}
                    </li>
                `;
            }).join('');
            feed.onclick = event => {
                const button = event.target.closest('[data-admin-ops-open]');
                if (!button) return;
                if (button.dataset.adminOpsOpen === 'tickets') {
                    switchAdminSection('admin-support-inbox-panel');
                    return;
                }
                const targetId = button.dataset.adminOpsOpen === 'reviews'
                    ? 'admin-review-list'
                    : 'admin-payout-queue';
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
        }

        function showAdminOperationsNotice(event) {
            const host = document.getElementById('admin-ops-notices');
            if (!host) return;
            const notice = document.createElement('div');
            notice.className = 'admin-ops-notice';
            const text = document.createElement('strong');
            text.textContent = adminEventLabel(event);
            notice.append(text);
            host.prepend(notice);
            window.setTimeout(() => notice.remove(), 15000);
        }

        async function loadAdminOperationsDashboard() {
            if (!currentWalletIsAdmin || adminOperationsPollInFlight) return;
            adminOperationsPollInFlight = true;
            try {
                const response = await walletFetch('/api/admin/operations/dashboard');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load operations dashboard.');
                const metrics = data.metrics || {};
                const setText = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = String(value);
                };
                setText('admin-active-wallets', Number(metrics.active_wallets || 0).toLocaleString());
                setText('admin-all-time-wallets', Number(metrics.all_time_wallets || 0).toLocaleString());
                const verifiedPurchases = Number(metrics.verified_purchases || 0);
                const unpricedPurchases = Number(metrics.unpriced_legacy_purchases || 0);
                const salesTotal = Number(metrics.sales_stablecoins_usd ?? metrics.sales_usdt ?? 0);
                setText('admin-verified-sales-count', verifiedPurchases.toLocaleString());
                setText('admin-sales-total', `${formatAdminStablecoin(salesTotal, 'USD')} face value recorded`);
                setText('admin-sales-breakdown', `${formatAdminStablecoin(metrics.sales_usdt, 'USDT')} · ${formatAdminStablecoin(metrics.sales_usdc, 'USDC')}`);
                setText('admin-paid-out-total', formatAdminStablecoinTotals(metrics.paid_withdrawal_usdt, metrics.paid_withdrawal_usdc));
                setText('admin-paid-out-count', `${Number(metrics.paid_withdrawals || 0).toLocaleString()} payouts marked paid`);
                setText('admin-withdrawal-count', Number(metrics.withdrawal_requests || 0).toLocaleString());
                setText('admin-pending-out-total', formatAdminStablecoinTotals(metrics.pending_withdrawal_usdt, metrics.pending_withdrawal_usdc));
                setText('admin-pending-out-count', `${Number(metrics.pending_withdrawals || 0).toLocaleString()} requests awaiting review`);
                setText('admin-approved-out-total', formatAdminStablecoinTotals(metrics.approved_withdrawal_usdt, metrics.approved_withdrawal_usdc));
                setText('admin-approved-out-count', `${Number(metrics.approved_withdrawals || 0).toLocaleString()} approved payouts awaiting payment`);
                setText('admin-open-tickets', Number(metrics.pending_tickets || 0).toLocaleString());
                setText('admin-pending-reviews', Number(metrics.pending_reviews || 0).toLocaleString());
                const salesCaveat = document.getElementById('admin-sales-caveat');
                if (salesCaveat) {
                    salesCaveat.hidden = !unpricedPurchases;
                    salesCaveat.textContent = `${unpricedPurchases.toLocaleString()} verified purchase${unpricedPurchases === 1 ? '' : 's'} have no recorded payment amount, so they are excluded from the sales total. The exact historical value cannot be recovered from current purchase records.`;
                }
                const adminNav = document.getElementById('admin-nav-item');
                if (adminNav) {
                    const totalPending = Number(metrics.pending_withdrawals || 0) +
                        Number(metrics.approved_withdrawals || 0) +
                        Number(metrics.pending_tickets || 0) + Number(metrics.pending_reviews || 0);
                    adminNav.innerHTML = `Admin Control${totalPending ? ` <span class="admin-nav-badge">${totalPending}</span>` : ''}`;
                }

                const events = Array.isArray(data.events) ? data.events : [];
                renderAdminOperationsFeed(events);
                const storageKey = `blastrr-admin-seen-operations:${getConnectedWalletOwnerKey() || ''}`;
                let seenIds = [];
                try {
                    seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    if (!Array.isArray(seenIds)) seenIds = [];
                } catch {
                    seenIds = [];
                }
                const seen = new Set(seenIds);
                const isInitialLoad = !adminOperationsLoaded;
                const newEvents = isInitialLoad ? [] : events.filter(event => !seen.has(event.event_id));
                events.forEach(event => seen.add(event.event_id));
                try {
                    localStorage.setItem(storageKey, JSON.stringify([...seen].slice(-100)));
                } catch (storageError) {
                    console.warn('Unable to persist admin activity notifications:', storageError);
                }
                adminOperationsLoaded = true;
                newEvents.forEach(showAdminOperationsNotice);
                if (newEvents.some(event => event.event_type === 'TICKET_OPENED')) loadAdminTickets();
                if (newEvents.some(event => event.event_type.includes('PAYOUT_'))) loadAdminWithdrawals();
                if (newEvents.some(event => event.event_type === 'REVIEW_PENDING')) loadAdminReviews();
            } catch (error) {
                console.error('Unable to refresh admin operations dashboard:', error);
                const feed = document.getElementById('admin-operations-feed');
                if (feed && !feed.querySelector('.admin-operations-event')) {
                    feed.innerHTML = `<li class="support-feedback">${escapeHTML(error.message)}</li>`;
                }
            } finally {
                adminOperationsPollInFlight = false;
            }
        }

        function startAdminOperationsPolling() {
            if (adminOperationsPollTimer) clearInterval(adminOperationsPollTimer);
            adminOperationsPollTimer = setInterval(() => {
                if (currentWalletIsAdmin && dashboardAuthenticated &&
                    document.getElementById('adminView')?.classList.contains('active')) {
                    loadAdminOperationsDashboard();
                    if (document.getElementById('admin-support-inbox-panel')?.hidden === false) loadAdminTickets();
                }
            }, 15000);
        }

        function renderWithdrawalInvestigation(withdrawal) {
            const accounts = withdrawal.accounts || [];
            const loginIps = withdrawal.login_ips || [];
            const relatedWallets = withdrawal.related_wallets || [];
            const referralTransactions = withdrawal.referral_transactions || [];
            const accountDetails = accounts.length
                ? accounts.map(account => `
                    <details class="admin-withdrawal-account">
                        <summary>${escapeHTML(account.plan_name || 'Trading account')} · ${escapeHTML(account.id)} · ${escapeHTML(account.status)} · ${account.trades?.length || 0} trades</summary>
                        <p class="support-ticket-meta">Balance ${escapeHTML(formatAdminUsdt(account.current_balance))} · Equity ${escapeHTML(formatAdminUsdt(account.current_equity))}${Number(account.admin_frozen) ? ' · Admin frozen' : ''}</p>
                        ${renderAdminTradeTable(account.trades || [])}
                    </details>
                `).join('')
                : '<p class="support-note">No trading accounts found for this wallet.</p>';
            const ipDetails = loginIps.length
                ? `<ul>${loginIps.map(ip => `<li><code>${escapeHTML(ip.ip_address)}</code> · ${Number(ip.login_count)} logins · ${escapeHTML(ip.first_seen)} to ${escapeHTML(ip.last_seen)}</li>`).join('')}</ul>`
                : '<p class="support-note">No login IP history in the 180-day retention window.</p>';
            const relatedDetails = relatedWallets.length
                ? `<ul>${relatedWallets.map(related => `
                    <li><code>${escapeHTML(related.wallet_address)}</code>${related.username ? ` · @${escapeHTML(related.username)}` : ''}
                        · shared IP <code>${escapeHTML(related.ip_address)}</code>
                        ${related.accounts?.length ? `<ul>${related.accounts.map(account => `<li>${escapeHTML(account.plan_name || 'Trading account')} · <code>${escapeHTML(account.account_id)}</code> · ${escapeHTML(account.status)}</li>`).join('')}</ul>` : ' · no trading accounts'}
                    </li>
                `).join('')}</ul>`
                : '<p class="support-note">No other wallets with retained login records were found on these IPs.</p>';
            const referralDetails = referralTransactions.length
                ? `${withdrawal.referral_transactions_exact ? '' : '<p class="support-note">This historical withdrawal has no recorded transaction allocation; the full commission ledger below is context only and cannot be attributed exactly to this payout.</p>'}${referralTransactions.map(referral => {
                    const explorerUrl = getTransactionExplorerUrl(referral.purchase_chain_id, referral.purchase_tx_hash);
                    return `
                        <article class="admin-referral-evidence">
                            <strong>Level ${Number(referral.level)} referral · ${escapeHTML(referral.plan_name || 'Account purchase')}</strong>
                            <p class="support-ticket-meta">Referee <code>${escapeHTML(referral.referee_wallet)}</code> · Commission ${escapeHTML(formatAdminUsdt(referral.commission_earned))} (${Number(referral.commission_pct)}%)${referral.allocated_amount != null ? ` · Allocated to this withdrawal ${escapeHTML(formatAdminUsdt(referral.allocated_amount))}` : ''} · Purchase ${escapeHTML(formatAdminUsdt(referral.purchase_amount_usdt ?? referral.paid_amount))} · ${escapeHTML(referral.created_at)}</p>
                            ${referral.purchase_tx_hash
                                ? `<p>Purchase transaction: ${explorerUrl ? `<a href="${escapeHTML(explorerUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(referral.purchase_tx_hash)}</a>` : `<code>${escapeHTML(referral.purchase_tx_hash)}</code> · no verified explorer configured for chain ${escapeHTML(referral.purchase_chain_id)}`}</p>`
                                : '<p class="support-note">Historical commission has no unambiguous linked purchase transaction.</p>'}
                        </article>
                    `;
                }).join('')}`
                : '<p class="support-note">No linked referral commissions were found.</p>';
            return `
                <details class="admin-withdrawal-investigation">
                    <summary>Investigation · ${accounts.length} accounts · ${loginIps.length} login IPs · ${relatedWallets.length} related wallets</summary>
                    <p class="support-ticket-meta">${withdrawal.username ? `@${escapeHTML(withdrawal.username)} · ` : ''}<code>${escapeHTML(withdrawal.wallet_address)}</code></p>
                    ${withdrawal.user_ip ? `<p>Withdrawal request IP: <code>${escapeHTML(withdrawal.user_ip)}</code></p>` : ''}
                    <details><summary>Accounts and trade history</summary>${accountDetails}</details>
                    <details><summary>Login IP history</summary>${ipDetails}</details>
                    <details><summary>Other wallets and accounts sharing those IPs</summary>${relatedDetails}</details>
                    ${withdrawal.type === 'COMMISSION' ? `<details><summary>Transactions creating this referral payout</summary>${referralDetails}</details>` : ''}
                </details>
            `;
        }

        async function loadAdminSupportStaff() {
            const container = document.getElementById('admin-support-staff-list');
            const form = document.getElementById('admin-support-staff-form');
            if (!container) return;
            if (form && form.dataset.listenerAttached !== 'true') {
                form.dataset.listenerAttached = 'true';
                form.addEventListener('submit', async event => {
                    event.preventDefault();
                    const feedback = document.getElementById('admin-support-staff-feedback');
                    if (feedback) feedback.textContent = '';
                    const wallet = document.getElementById('admin-support-staff-wallet')?.value.trim();
                    const role = document.getElementById('admin-support-staff-role')?.value;
                    try {
                        const authorization = await signedTradeAuthorization();
                        const response = await fetch('/api/admin/support-staff/action', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...authorization, staff_wallet: wallet, role, action: 'ADD' })
                        });
                        const data = await readAdminApiResponse(response, '/api/admin/support-staff/action');
                        if (!response.ok) throw new Error(data.error || 'Unable to add support staff.');
                        if (feedback) feedback.textContent = `Support access added for ${wallet}.`;
                        form.reset();
                        await loadAdminSupportStaff();
                    } catch (error) {
                        console.error(error);
                        if (feedback) feedback.textContent = error.message;
                    }
                });
            }
            try {
                const response = await walletFetch('/api/admin/support-staff');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load support staff.');
                if (!data.staff?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No active support staff.</p>';
                    return;
                }
                container.innerHTML = data.staff.map(member => `
                    <article class="support-ticket-card admin-support-staff-card">
                        <div>
                            <strong>Support</strong>
                            <p class="support-ticket-meta"><code>${escapeHTML(member.wallet_address)}</code><br>
                                Added ${escapeHTML(new Date(member.created_at).toLocaleString())}</p>
                        </div>
                        <button class="btn-sell" type="button" data-support-staff-remove="${escapeHTML(member.wallet_address)}">Remove access</button>
                    </article>
                `).join('');
                container.onclick = async event => {
                    const button = event.target.closest('[data-support-staff-remove]');
                    if (!button || !confirm(`Remove Support access from ${button.dataset.supportStaffRemove}?`)) return;
                    try {
                        const authorization = await signedTradeAuthorization();
                        const response = await fetch('/api/admin/support-staff/action', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...authorization,
                                staff_wallet: button.dataset.supportStaffRemove,
                                action: 'REMOVE'
                            })
                        });
                        const result = await readAdminApiResponse(response, '/api/admin/support-staff/action');
                        if (!response.ok) throw new Error(result.error || 'Unable to remove support staff.');
                        await loadAdminSupportStaff();
                    } catch (error) {
                        console.error(error);
                        alert(error.message);
                    }
                };
            } catch (error) {
                console.error(error);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(error.message)}</p>`;
            }
        }

        async function loadSupportStaffTickets() {
            const container = document.getElementById('support-staff-ticket-list');
            if (!container) return;
            try {
                const response = await walletFetch('/api/staff/tickets');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load support tickets.');
                if (!data.tickets?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No unassigned or assigned-to-you support tickets.</p>';
                    return;
                }
                container.innerHTML = data.tickets.map(ticket => {
                    const assignedToMe = ticket.assigned_staff_wallet && (
                        connectedWalletType === 'SOLANA'
                            ? ticket.assigned_staff_wallet === connectedWallet
                            : ticket.assigned_staff_wallet.toLowerCase() === String(connectedWallet || '').toLowerCase()
                    );
                    return `
                        <article class="support-ticket-card" data-staff-ticket-id="${escapeHTML(ticket.id)}">
                            <div class="support-ticket-heading">
                                <h3>${escapeHTML(ticket.subject)}</h3>
                                <span class="support-status ${supportStatusClass(ticket.status)}">${supportStatusLabel(ticket.status)}</span>
                            </div>
                            <p class="support-ticket-meta">
                                ${escapeHTML(ticket.username || 'Trader')} · <code>${escapeHTML(ticket.wallet_address)}</code><br>
                                ${ticket.account_id ? `${escapeHTML(ticket.plan_name || 'Account')} · ${escapeHTML(ticket.account_id)}` : 'General support'} · Created ${escapeHTML(new Date(ticket.created_at).toLocaleString())}
                            </p>
                            ${assignedToMe
                                ? '<p class="admin-inbox-assignment">Assigned to you</p>'
                                : '<div class="support-ticket-buttons"><button class="btn-wallet" type="button" data-staff-ticket-action="ACCEPT">Accept ticket</button></div>'}
                            ${renderSupportMessages(ticket.messages || [])}
                            ${assignedToMe ? `
                                <div class="support-ticket-actions">
                                    <label for="staff-ticket-reply-${escapeHTML(ticket.id)}">Reply</label>
                                    <textarea id="staff-ticket-reply-${escapeHTML(ticket.id)}" maxlength="5000" rows="4" placeholder="Write a response or ask for the information needed to resolve this ticket."></textarea>
                                    <div class="support-ticket-buttons">
                                        <button class="btn-wallet" type="button" data-staff-ticket-action="REPLY">Send reply</button>
                                        <button class="btn-sell" type="button" data-staff-ticket-action="CLOSE">Close ticket</button>
                                    </div>
                                </div>
                            ` : ''}
                        </article>
                    `;
                }).join('');
                container.onclick = event => {
                    const button = event.target.closest('[data-staff-ticket-action]');
                    const card = button?.closest('[data-staff-ticket-id]');
                    if (button && card) processSupportStaffTicket(card.dataset.staffTicketId, button.dataset.staffTicketAction, card);
                };
            } catch (error) {
                console.error(error);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(error.message)}</p>`;
            }
        }

        async function processSupportStaffTicket(ticketId, action, card) {
            const message = card.querySelector('textarea')?.value.trim() || '';
            if (action === 'REPLY' && !message) return alert('Write a reply before sending it.');
            if (action === 'CLOSE' && !confirm('Close this support ticket?')) return;
            try {
                const endpoint = action === 'ACCEPT' ? '/api/staff/tickets/accept' : '/api/staff/tickets/action';
                const response = await walletFetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticket_id: ticketId, action, message })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to update support ticket.');
                await loadSupportStaffTickets();
            } catch (error) {
                console.error(error);
                alert(error.message);
            }
        }

        async function loadSupportStaffReviews() {
            const container = document.getElementById('support-staff-review-list');
            if (!container) return;
            try {
                const response = await walletFetch('/api/staff/reviews');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load pending reviews.');
                if (!data.reviews?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No reviews awaiting moderation.</p>';
                    return;
                }
                container.innerHTML = data.reviews.map(review => `
                    <article class="support-review-card">
                        <div class="support-review-heading">
                            <div><h3>${escapeHTML(review.username)}</h3>${renderStarRating(review.rating)}</div>
                            <div class="admin-review-actions">
                                <button class="btn-wallet" type="button" data-staff-review-action="APPROVE" data-review-account="${escapeHTML(review.account_id)}">Approve</button>
                                <button class="btn-sell" type="button" data-staff-review-action="REJECT" data-review-account="${escapeHTML(review.account_id)}">Reject</button>
                            </div>
                        </div>
                        <p class="support-review-meta">${escapeHTML(review.plan_name || 'Purchased account')} · <code>${escapeHTML(review.account_id)}</code><br>
                            <code>${escapeHTML(review.wallet_address)}</code> · Submitted ${escapeHTML(new Date(review.updated_at).toLocaleString())}</p>
                        <p class="support-review-comment">${escapeHTML(review.comment)}</p>
                    </article>
                `).join('');
                container.onclick = async event => {
                    const button = event.target.closest('[data-staff-review-action]');
                    if (!button) return;
                    if (button.dataset.staffReviewAction === 'REJECT' && !confirm('Reject this review?')) return;
                    try {
                        const response = await walletFetch('/api/staff/reviews/action', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                review_account_id: button.dataset.reviewAccount,
                                action: button.dataset.staffReviewAction
                            })
                        });
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.error || 'Unable to moderate review.');
                        await loadSupportStaffReviews();
                    } catch (error) {
                        console.error(error);
                        alert(error.message);
                    }
                };
            } catch (error) {
                console.error(error);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(error.message)}</p>`;
            }
        }

        async function loadAdminWithdrawals() {
            try {
                const res = await walletFetch('/api/admin/withdrawals');
                const data = await readAdminApiResponse(res, '/api/admin/withdrawals');
                const tbody = document.getElementById('admin-payout-queue');
                if (!tbody) return;
                if (!res.ok) throw new Error(data.error || 'Unable to load withdrawal queue.');
                tbody.innerHTML = '';

                if (!data.withdrawals || data.withdrawals.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 24px;">No withdrawal requests.</td></tr>';
                    return;
                }

                data.withdrawals.forEach(w => {
                    const statusColor = w.status === 'PAID' ? '#34d399'
                        : w.status === 'APPROVED' ? '#60a5fa'
                            : w.status === 'REJECTED' ? '#ef4444' : '#fbbf24';
                    let actionsHtml = '<span style="color: #9ca3af;">Processed</span>';
                    if (w.status === 'PENDING') {
                        actionsHtml = `
                            <button class="btn-wallet" style="padding: 4px 10px; font-size: 11px; background: #059669;" data-withdrawal-id="${escapeHTML(w.id)}" data-withdrawal-action="${w.type === 'ACCOUNT' ? 'APPROVE' : 'PAID'}" data-withdrawal-type="${escapeHTML(w.type)}">${w.type === 'ACCOUNT' ? 'Approve payout' : 'Mark paid'}</button>
                            <button class="btn-sell" style="padding: 4px 10px; font-size: 11px;" data-withdrawal-id="${escapeHTML(w.id)}" data-withdrawal-action="REJECT" data-withdrawal-type="${escapeHTML(w.type)}">Reject</button>
                            ${w.type === 'ACCOUNT' ? `<button class="btn-sell" style="padding: 4px 10px; font-size: 11px;" data-admin-account-id="${escapeHTML(w.account_id)}" data-admin-account-action="FREEZE">Freeze account</button>` : ''}
                        `;
                    } else if (w.status === 'APPROVED' && w.type === 'ACCOUNT') {
                        actionsHtml = `
                            <button class="btn-wallet" style="padding: 4px 10px; font-size: 11px; background: #059669;" data-withdrawal-id="${escapeHTML(w.id)}" data-withdrawal-action="PAID" data-withdrawal-type="ACCOUNT">Add tx &amp; mark paid</button>
                            <button class="btn-sell" style="padding: 4px 10px; font-size: 11px;" data-withdrawal-id="${escapeHTML(w.id)}" data-withdrawal-action="REJECT" data-withdrawal-type="ACCOUNT">Reject &amp; return funds</button>
                        `;
                    }
                    const accountDetails = w.type === 'ACCOUNT'
                        ? `<strong>${escapeHTML(w.plan_name)}</strong><br>Balance: ${escapeHTML(formatAdminUsdt(w.account_balance))}<br>${Number(w.admin_frozen) ? 'Admin freeze: ' + escapeHTML(w.admin_freeze_reason || 'active') : (w.trades?.some(trade => trade.status === 'OPEN') ? 'Open trades: ' + w.trades.filter(trade => trade.status === 'OPEN').length : 'No open trades')}`
                        : `<strong>${escapeHTML(w.plan_name)}</strong>`;
                    const investigationHtml = renderWithdrawalInvestigation(w);
                    const payoutLabel = `${escapeHTML(w.payout_asset || 'USDT')} on ${escapeHTML(getPayoutNetworkLabel(w.payout_chain_id))}`;
                    const amountDetails = w.type === 'ACCOUNT'
                        ? `<strong>$${Number(w.amount).toFixed(2)} gross</strong><br>User: $${Number(w.user_amount).toFixed(2)}<br>Admin: $${Number(w.admin_share).toFixed(2)}<br>Payout: ${payoutLabel}`
                        : `<strong>$${Number(w.amount).toFixed(2)}</strong><br>Payout: ${payoutLabel}`;

                    tbody.innerHTML += `
                        <tr>
                            <td><code>${escapeHTML(w.id)}</code></td>
                            <td><span style="color: ${w.type === 'COMMISSION' ? '#c084fc' : '#60a5fa'}; font-weight: bold;">${w.type === 'COMMISSION' ? 'Referral' : 'Trading performance'}</span></td>
                            <td>${w.username ? `<strong>@${escapeHTML(w.username)}</strong><br>` : ''}<code style="color: #c084fc;" title="${escapeHTML(w.wallet_address)}">${escapeHTML(String(w.wallet_address || '').substring(0,6))}...${escapeHTML(String(w.wallet_address || '').slice(-4))}</code></td>
                            <td>${accountDetails}${investigationHtml}</td>
                            <td>${amountDetails}</td>
                            <td><span style="color: ${statusColor}; font-weight: bold;">${w.status}</span>${w.approved_at ? `<br><small>Approved ${escapeHTML(new Date(w.approved_at).toLocaleString())}</small>` : ''}${w.payout_tx_hash ? `<br><code title="${escapeHTML(w.payout_tx_hash)}">${escapeHTML(String(w.payout_tx_hash).slice(0, 14))}…</code>` : ''}</td>
                            <td>${actionsHtml}</td>
                        </tr>
                    `;
                });
                tbody.onclick = event => {
                    const withdrawalButton = event.target.closest('[data-withdrawal-id]');
                    if (withdrawalButton) {
                        processWithdrawal(
                            withdrawalButton.dataset.withdrawalId,
                            withdrawalButton.dataset.withdrawalAction,
                            withdrawalButton.dataset.withdrawalType
                        );
                        return;
                    }
                    const accountButton = event.target.closest('[data-admin-account-action]');
                    if (accountButton) adminAccountAction(accountButton.dataset.adminAccountId, accountButton.dataset.adminAccountAction);
                };
            } catch (err) {
                console.error(err);
                const tbody = document.getElementById('admin-payout-queue');
                if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:#f87171;padding:18px;">${escapeHTML(err.message)}</td></tr>`;
            }
        }

        async function loadAdminHedgingAlerts() {
            const container = document.getElementById('admin-hedging-alert-list');
            if (!container) return;
            container.innerHTML = '<p class="account-chart-empty">Loading hedging alerts...</p>';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/hedging-alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readAdminApiResponse(response, '/api/admin/hedging-alerts');
                if (!response.ok) throw new Error(data.error || 'Unable to load hedging alerts.');
                const alerts = data.alerts || [];
                if (!alerts.length) {
                    container.innerHTML = '<p class="account-chart-empty">No active hedging alerts.</p>';
                    return;
                }
                container.innerHTML = alerts.map(alert => {
                    const conflictingAccounts = (alert.conflicting_account_ids || '').split(',').filter(Boolean);
                    return `
                        <article class="admin-hedging-alert">
                            <div>
                                <strong>Prohibited hedge · ${escapeHTML(alert.symbol)}</strong>
                                <p>${escapeHTML(alert.username ? `@${alert.username}` : 'User')} · <code>${escapeHTML(alert.wallet_address)}</code></p>
                                <p>${escapeHTML(alert.attempted_side)} attempted on <code>${escapeHTML(alert.attempted_account_id)}</code> against open ${escapeHTML(alert.conflicting_side)} position${conflictingAccounts.length === 1 ? '' : 's'} on ${conflictingAccounts.map(id => `<code>${escapeHTML(id)}</code>`).join(', ') || 'another account'}.</p>
                                <small>${escapeHTML(new Date(alert.created_at).toLocaleString())} · ${Number(alert.frozen_account_count)} involved account${Number(alert.frozen_account_count) === 1 ? '' : 's'} currently frozen</small>
                            </div>
                            <button class="btn-wallet" type="button" data-hedging-review-wallet="${escapeHTML(alert.wallet_address)}">Review user</button>
                        </article>
                    `;
                }).join('');
                container.onclick = event => {
                    const button = event.target.closest('[data-hedging-review-wallet]');
                    if (!button) return;
                    const wallet = button.dataset.hedgingReviewWallet;
                    const search = document.getElementById('admin-user-search');
                    if (search) search.value = wallet;
                    loadAdminUserSearch(wallet);
                };
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        function renderAdminTradeTable(trades) {
            if (!trades.length) return '<p class="account-chart-empty">No trades recorded.</p>';
            const rows = trades.map(trade => `
                <tr>
                    <td><code>${escapeHTML(trade.id)}</code></td>
                    <td>${escapeHTML(trade.symbol)}</td>
                    <td>${escapeHTML(trade.side)}</td>
                    <td>${escapeHTML(trade.status)}</td>
                    <td>$${Number(trade.entry_price).toFixed(2)}</td>
                    <td>$${Number(trade.size_usd).toFixed(2)}</td>
                    <td>$${Number(trade.pnl || 0).toFixed(2)}</td>
                </tr>
            `).join('');
            return `<div class="table-responsive"><table class="admin-trade-table"><thead><tr><th>Trade</th><th>Pair</th><th>Side</th><th>Status</th><th>Entry</th><th>Size</th><th>PnL</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }

        function renderAdminAccountCard(account) {
            const mllCap = Number(account.initial_balance) * (1 + Number(account.max_drawdown_pct) / 100);
            const riskLock = account.permanent_lock
                ? `Permanent risk lock: ${escapeHTML(account.lock_reason || 'MLL')}`
                : account.locked_until ? `Risk lock until ${escapeHTML(account.locked_until)}` : '';
            const adminFreeze = Number(account.admin_frozen) === 1;
            const automaticPause = Number(account.withdrawal_pending) === 1;
            return `
                <article class="admin-account-card">
                    <div class="admin-account-heading">
                        <div><strong>${escapeHTML(account.plan_name)}</strong> · <code>${escapeHTML(account.id)}</code><br><code>${escapeHTML(account.wallet_address)}</code></div>
                        <button class="${adminFreeze ? 'btn-sell' : 'btn-wallet'}" data-admin-account-action="${adminFreeze ? 'UNFREEZE' : 'FREEZE'}" data-admin-account-id="${escapeHTML(account.id)}">${adminFreeze ? 'Unfreeze account' : 'Freeze account'}</button>
                    </div>
                    <div class="admin-account-stats">
                        <span>Status: <strong>${escapeHTML(account.status)}</strong></span>
                        <span>Balance: <strong>$${Number(account.current_balance).toFixed(2)}</strong></span>
                        <span>Risk balance: <strong>$${Number(account.risk_balance).toFixed(2)}</strong></span>
                        <span>Equity: <strong>$${Number(account.current_equity).toFixed(2)}</strong></span>
                        <span>Protected floor: <strong>$${mllCap.toFixed(2)}</strong></span>
                        ${adminFreeze ? `<span class="admin-account-flag">Admin freeze: ${escapeHTML(account.admin_freeze_reason || '')}</span>` : ''}
                        ${automaticPause ? '<span class="admin-account-flag">Withdrawal review pause active</span>' : ''}
                        ${riskLock ? `<span class="admin-account-flag">${riskLock}</span>` : ''}
                    </div>
                    <details><summary>Review ${account.trades?.length || 0} trades</summary>${renderAdminTradeTable(account.trades || [])}</details>
                </article>
            `;
        }

        async function loadAdminUserSearch(query = adminUserSearchQuery) {
            const container = document.getElementById('admin-user-search-results');
            const feedback = document.getElementById('admin-user-search-feedback');
            if (!container) return;
            adminUserSearchQuery = query.trim();
            if (feedback) feedback.textContent = '';
            if (adminUserSearchQuery.length < 2) {
                container.innerHTML = '<p class="account-chart-empty">Enter at least 2 characters to search.</p>';
                return;
            }
            container.innerHTML = '<p class="account-chart-empty">Searching users...</p>';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/users/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, query: adminUserSearchQuery })
                });
                const data = await readAdminApiResponse(response, '/api/admin/users/search');
                if (!response.ok) throw new Error(data.error || 'Unable to search user profiles.');
                if (!data.users?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No matching users found.</p>';
                    return;
                }
                container.innerHTML = data.users.map(user => `
                    <article class="admin-account-card">
                        <div class="admin-account-heading">
                            <div><strong>${escapeHTML(user.username ? `@${user.username}` : 'User without username')}</strong><br><code>${escapeHTML(user.wallet_address)}</code></div>
                            <span>${Number(user.account_count)} account${Number(user.account_count) === 1 ? '' : 's'}</span>
                        </div>
                        <div class="admin-account-stats">
                            <span>User access: <strong>${Number(user.admin_suspended) === 1 ? 'SUSPENDED' : 'ACTIVE'}</strong></span>
                            ${Number(user.admin_suspended) === 1 ? `<span class="admin-account-flag">Suspension reason: ${escapeHTML(user.admin_suspend_reason || 'No reason recorded')}</span>` : ''}
                            ${user.security_locked_at ? `<span class="admin-account-flag">IP session-limit lock · ${escapeHTML(user.security_lock_ip || 'IP unavailable')} · ${escapeHTML(new Date(Number(user.security_locked_at)).toLocaleString())}</span>` : ''}
                            ${Number(user.new_ip_count) > 0 ? `<span class="admin-account-flag">⚠ ${Number(user.new_ip_count)} new-IP login warning${Number(user.new_ip_count) === 1 ? '' : 's'} in the last 180 days</span>` : ''}
                            <button class="${Number(user.admin_suspended) === 1 ? 'btn-wallet' : 'btn-sell'}"
                                data-admin-user-action="${Number(user.admin_suspended) === 1 ? 'RESTORE' : 'SUSPEND'}"
                                data-admin-user-wallet="${escapeHTML(user.wallet_address)}">
                                ${Number(user.admin_suspended) === 1 ? 'Restore user access' : 'Suspend user'}
                            </button>
                            ${user.security_locked_at ? `<button class="btn-wallet" data-admin-user-action="CLEAR_IP_SOFT_LOCK" data-admin-user-wallet="${escapeHTML(user.wallet_address)}">Clear IP security lock</button>` : ''}
                        </div>
                        <details data-admin-user-wallet="${escapeHTML(user.wallet_address)}">
                            <summary>Show accounts, login security, and financial transactions</summary>
                            <div class="admin-user-accounts">
                                <p class="account-chart-empty">Expand to load account details...</p>
                            </div>
                        </details>
                    </article>
                `).join('');
                container.querySelectorAll('details[data-admin-user-wallet]').forEach(details => {
                    details.addEventListener('toggle', () => {
                        if (details.open && details.dataset.loaded !== 'true') {
                            loadAdminUserAccounts(details.dataset.adminUserWallet, details);
                        }
                    });
                });
                container.onclick = event => {
                    const button = event.target.closest('[data-admin-account-action]');
                    if (button) adminAccountAction(button.dataset.adminAccountId, button.dataset.adminAccountAction);
                    const userButton = event.target.closest('[data-admin-user-action]');
                    if (userButton) adminUserAction(userButton.dataset.adminUserWallet, userButton.dataset.adminUserAction);
                };
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="account-chart-empty">${escapeHTML(err.message)}</p>`;
            }
        }

        async function loadAdminUserAccounts(wallet, details) {
            const container = details?.querySelector('.admin-user-accounts');
            if (!container || details.dataset.loading === 'true') return;
            details.dataset.loading = 'true';
            container.innerHTML = '<p class="account-chart-empty">Loading account details...</p>';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/users/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, user_wallet: wallet })
                });
                const data = await readAdminApiResponse(response, '/api/admin/users/accounts');
                if (!response.ok) throw new Error(data.error || "Unable to load this user's accounts.");
                const accounts = data.accounts || [];
                const financialTransactions = data.financial_transactions || [];
                const live = accounts.filter(account => account.status === 'ACTIVE');
                const archived = accounts.filter(account => account.status !== 'ACTIVE');
                const loginIps = data.login_ips || [];
                const newIpEvents = loginIps.filter(event => Number(event.is_new_ip) === 1);
                const securityPanel = `
                    <section class="admin-user-security">
                        <h4>Login security · last 180 days</h4>
                        ${newIpEvents.length
                            ? newIpEvents.map(event => `<p class="admin-account-flag">New IP detected: <code>${escapeHTML(event.ip_address)}</code> · ${escapeHTML(new Date(event.created_at).toLocaleString())}</p>`).join('')
                            : '<p>No new-IP warnings in the retention window.</p>'}
                        <details>
                            <summary>Recent login IPs (${loginIps.length})</summary>
                            ${loginIps.length ? `<ul>${loginIps.map(event => `<li>${Number(event.is_new_ip) === 1 ? '<strong>New IP · </strong>' : ''}<code>${escapeHTML(event.ip_address)}</code> · ${escapeHTML(new Date(event.created_at).toLocaleString())}</li>`).join('')}</ul>` : '<p>No recorded logins in the retention window.</p>'}
                        </details>
                        <details>
                            <summary>Admin suspension history (${(data.admin_actions || []).length})</summary>
                            ${(data.admin_actions || []).length ? `<ul>${data.admin_actions.map(item => `<li><strong>${escapeHTML(item.action)}</strong> · ${escapeHTML(new Date(item.created_at).toLocaleString())} · by <code>${escapeHTML(item.admin_wallet)}</code>${item.reason ? `<br>${escapeHTML(item.reason)}` : ''}</li>`).join('')}</ul>` : '<p>No admin suspension actions recorded.</p>'}
                        </details>
                    </section>
                `;
                const transactionRows = financialTransactions.length
                    ? financialTransactions.map(transaction => {
                        const typeLabel = transaction.transaction_type === 'PURCHASE'
                            ? 'Purchase'
                            : transaction.transaction_type === 'ACCOUNT_WITHDRAWAL'
                                ? 'Trading withdrawal'
                                : 'Referral withdrawal';
                        const amountLabel = transaction.asset === 'FREE'
                            ? formatAdminStablecoin(0, 'USD') + ' · free'
                            : transaction.amount == null
                                ? 'Amount not recorded'
                                : formatAdminStablecoin(transaction.amount, transaction.asset || 'USDT');
                        const withdrawalDetails = transaction.transaction_type !== 'PURCHASE'
                            ? `<small>Gross ${escapeHTML(formatAdminStablecoin(transaction.gross_amount, transaction.asset || 'USDT'))}${transaction.admin_share != null ? ` · Admin share ${escapeHTML(formatAdminStablecoin(transaction.admin_share, transaction.asset || 'USDT'))}` : ''}</small>`
                            : '';
                        const explorerUrl = getTransactionExplorerUrl(transaction.chain_id, transaction.tx_hash);
                        const transactionId = transaction.tx_hash
                            ? explorerUrl
                                ? `<a href="${escapeHTML(explorerUrl)}" target="_blank" rel="noopener noreferrer"><code>${escapeHTML(transaction.tx_hash)}</code></a>`
                                : `<code>${escapeHTML(transaction.tx_hash)}</code>`
                            : '<span>Not recorded</span>';
                        const recordId = transaction.transaction_type === 'PURCHASE'
                            ? ''
                            : `<small>Request ID: <code>${escapeHTML(transaction.transaction_id || '')}</code></small>`;
                        return `<tr>
                            <td>${escapeHTML(new Date(transaction.created_at).toLocaleString())}${transaction.paid_at ? `<small>Paid ${escapeHTML(new Date(transaction.paid_at).toLocaleString())}</small>` : ''}</td>
                            <td>${escapeHTML(typeLabel)}<small>${escapeHTML(transaction.description || '')}</small></td>
                            <td>${transaction.asset === 'FREE' ? 'Redemption ID' : 'Transaction ID'}<small>${transactionId}</small>${recordId}</td>
                            <td>${escapeHTML(amountLabel)}${withdrawalDetails}</td>
                            <td>${escapeHTML(transaction.status || '')}${Number(transaction.chain_id) > 0 ? `<small>${escapeHTML(getPayoutNetworkLabel(transaction.chain_id))}</small>` : ''}</td>
                        </tr>`;
                    }).join('')
                    : '<tr><td colspan="5" class="account-chart-empty">No purchases or withdrawals recorded.</td></tr>';
                const financialPanel = `
                    <section class="admin-user-financial">
                        <details open>
                            <summary>Financial transactions · ${financialTransactions.length}</summary>
                            <div class="table-responsive">
                                <table class="admin-user-financial-table">
                                    <thead><tr><th>Date</th><th>Transaction</th><th>Transaction / request ID</th><th>Amount</th><th>Status / network</th></tr></thead>
                                    <tbody>${transactionRows}</tbody>
                                </table>
                            </div>
                        </details>
                    </section>
                `;
                const renderGroup = (title, items) => `
                    <section class="admin-user-account-group">
                        <h4>${title} (${items.length})</h4>
                        ${items.length ? items.map(renderAdminAccountCard).join('') : '<p class="account-chart-empty">No accounts in this group.</p>'}
                    </section>
                `;
                container.innerHTML = accounts.length
                    ? `${financialPanel}${securityPanel}${renderGroup('Live accounts', live)}${renderGroup('Archived accounts', archived)}`
                    : `${financialPanel}${securityPanel}<p class="account-chart-empty">This user has no accounts.</p>`;
                details.dataset.loaded = 'true';
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            } finally {
                details.dataset.loading = 'false';
            }
        }

        const adminPlanFields = [
            ['name', 'Plan name', 'text', '', ''],
            ['base_price_usdt', 'Full account price (USDT)', 'number', '0.01', '0.01'],
            ['simulated_capital', 'Simulated capital', 'number', '0.01', '0.01'],
            ['profit_target', 'Profit target', 'number', '0', '0.01'],
            ['max_drawdown_pct', 'Max drawdown / MLL (%)', 'number', '0', '0.01'],
            ['daily_loss_pct', 'Daily loss / DLL (%)', 'number', '0', '0.01'],
            ['max_single_day_profit_pct', 'Max single-day profit / consistency (%)', 'number', '0', '0.01']
        ];

        function renderAdminPlanEditor(plan) {
            const fields = adminPlanFields.map(([name, label, type, min, step]) => `
                <div class="form-group">
                    <label>${label}</label>
                    <input name="${name}" type="${type}" value="${escapeHTML(plan[name] ?? '')}" ${min ? `min="${min}"` : ''} ${step ? `step="${step}"` : ''} ${name === 'name' ? 'maxlength="100"' : ''} required>
                </div>
            `).join('');
            return `
                <article class="admin-plan-card">
                    <h3>${escapeHTML(plan.name)} · ${Number(plan.active) === 1 ? 'Active' : 'Inactive'}</h3>
                    <p class="support-note">Full price: $${Number(plan.base_price_usdt).toFixed(2)} USDT. Discounts apply only after a buyer applies a code.</p>
                    <form class="admin-plan-form admin-plan-edit-form" data-admin-plan-id="${Number(plan.id)}">
                        ${fields}
                        <label class="admin-plan-active"><input name="active" type="checkbox" ${Number(plan.active) === 1 ? 'checked' : ''}> Active for sale</label>
                        <button class="btn-wallet" type="submit">Save plan</button>
                    </form>
                </article>
            `;
        }

        async function loadAdminPlans() {
            const container = document.getElementById('admin-plan-list');
            if (!container) return;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/plans/list', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readAdminApiResponse(response, '/api/admin/plans/list');
                if (!response.ok) throw new Error(data.error || 'Unable to load account plans.');
                container.innerHTML = data.plans?.length
                    ? data.plans.map(plan => renderAdminPlanEditor(plan)).join('')
                    : '<p class="account-chart-empty">No plans have been created.</p>';
                container.querySelectorAll('.admin-plan-edit-form').forEach(form => {
                    form.addEventListener('submit', event => {
                        event.preventDefault();
                        saveAdminPlan(form, Number(form.dataset.adminPlanId));
                    });
                });
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        async function saveAdminPlan(form, planId = null) {
            const feedback = document.getElementById('admin-plan-feedback');
            const button = form.querySelector('button[type="submit"]');
            if (feedback) feedback.textContent = '';
            if (button) button.disabled = true;
            const formValues = Object.fromEntries(new FormData(form));
            const payload = {
                ...formValues,
                plan_id: planId,
                active: Boolean(form.elements.namedItem('active')?.checked)
            };
            for (const [name] of adminPlanFields.slice(1)) payload[name] = Number(formValues[name]);
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/plans/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, ...payload })
                });
                const data = await readAdminApiResponse(response, '/api/admin/plans/save');
                if (!response.ok) throw new Error(data.error || 'Unable to save the plan.');
                if (feedback) feedback.textContent = planId ? 'Plan updated.' : 'Plan created.';
                if (!planId) form.reset();
                await Promise.all([loadAdminPlans(), loadAdminPromoPlans()]);
            } catch (err) {
                console.error(err);
                if (feedback) feedback.textContent = err.message;
            } finally {
                if (button) button.disabled = false;
            }
        }

        async function loadAdminLevelTwoSettings() {
            const levelOneInput = document.getElementById('admin-level-one-pct');
            const levelTwoInput = document.getElementById('admin-level-two-pct');
            if (!levelOneInput || !levelTwoInput) return;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/referrals/settings/load', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readAdminApiResponse(response, '/api/admin/referrals/settings/load');
                if (!response.ok) throw new Error(data.error || 'Unable to load the general referral commission rates.');
                levelOneInput.value = Number(data.level_one_pct ?? 2);
                levelTwoInput.value = Number(data.level_two_pct ?? 2);
            } catch (err) {
                console.error(err);
                const feedback = document.getElementById('admin-level-two-feedback');
                if (feedback) feedback.textContent = err.message;
            }
        }

        async function saveAdminLevelTwoRate(form) {
            const feedback = document.getElementById('admin-level-two-feedback');
            const button = form.querySelector('button[type="submit"]');
            if (feedback) feedback.textContent = '';
            if (button) button.disabled = true;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/referrals/settings/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...authorization,
                        level_one_pct: Number(document.getElementById('admin-level-one-pct')?.value),
                        level_two_pct: Number(document.getElementById('admin-level-two-pct')?.value)
                    })
                });
                const data = await readAdminApiResponse(response, '/api/admin/referrals/settings/save');
                if (!response.ok) throw new Error(data.error || 'Unable to save the general referral commission rates.');
                if (feedback) feedback.textContent = `General rates saved: level 1 ${Number(data.level_one_pct)}%, level 2 ${Number(data.level_two_pct)}%.`;
            } catch (err) {
                console.error(err);
                if (feedback) feedback.textContent = err.message;
            } finally {
                if (button) button.disabled = false;
            }
        }

        async function loadAdminTickets() {
            const container = document.getElementById('admin-ticket-list');
            if (!container) return;
            const draft = document.getElementById(`admin-ticket-reply-${adminSelectedTicketId}`)?.value || '';
            try {
                const response = await walletFetch('/api/admin/tickets');
                const data = await readAdminApiResponse(response, '/api/admin/tickets');
                if (!response.ok) throw new Error(data.error || 'Unable to load support tickets.');
                adminTickets = data.tickets || [];
                renderAdminTicketInbox();
                const replyBox = document.getElementById(`admin-ticket-reply-${adminSelectedTicketId}`);
                if (replyBox && draft) replyBox.value = draft;
                const selectedTicket = adminTickets.find(ticket => ticket.id === adminSelectedTicketId);
                if (document.getElementById('admin-support-inbox-panel')?.hidden === false &&
                    selectedTicket && Number(selectedTicket.is_unread) === 1) {
                    await selectAdminTicket(selectedTicket.id);
                }
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        function setAdminTicketFilter(filter) {
            if (!['UNREAD', 'READ', 'CLOSED'].includes(filter)) return;
            adminTicketFilter = filter;
            adminSelectedTicketId = null;
            renderAdminTicketInbox();
        }

        function renderAdminTicketInbox() {
            const container = document.getElementById('admin-ticket-list');
            const conversation = document.getElementById('admin-ticket-main');
            if (!container || !conversation) return;
            const isUnread = ticket => Number(ticket.is_unread) === 1;
            const activeTickets = adminTickets.filter(ticket => ticket.status !== 'CLOSED');
            const unreadCount = activeTickets.filter(isUnread).length;
            const readCount = activeTickets.filter(ticket => !isUnread(ticket)).length;
            const closedCount = adminTickets.filter(ticket => ticket.status === 'CLOSED').length;
            const counts = {
                UNREAD: document.getElementById('admin-ticket-unread-count'),
                READ: document.getElementById('admin-ticket-read-count'),
                CLOSED: document.getElementById('admin-ticket-closed-count')
            };
            const values = { UNREAD: unreadCount, READ: readCount, CLOSED: closedCount };
            Object.keys(counts).forEach(filter => {
                if (counts[filter]) counts[filter].textContent = String(values[filter]);
            });
            document.querySelectorAll('[data-admin-ticket-filter]').forEach(button => {
                const selected = button.dataset.adminTicketFilter === adminTicketFilter;
                button.classList.toggle('active', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
            const badge = document.getElementById('admin-support-tab-badge');
            if (badge) {
                badge.textContent = String(unreadCount);
                badge.hidden = unreadCount === 0;
            }

            const tickets = adminTickets.filter(ticket => {
                if (adminTicketFilter === 'CLOSED') return ticket.status === 'CLOSED';
                if (ticket.status === 'CLOSED') return false;
                return adminTicketFilter === 'UNREAD' ? isUnread(ticket) : !isUnread(ticket);
            });
            if (!adminTickets.some(ticket => ticket.id === adminSelectedTicketId)) {
                adminSelectedTicketId = tickets[0]?.id || null;
            }
            const groupedUsers = new Map();
            tickets.forEach(ticket => {
                const walletAddress = String(ticket.wallet_address || '');
                const walletKey = walletAddress.startsWith('0x') ? walletAddress.toLowerCase() : walletAddress;
                if (!groupedUsers.has(walletKey)) groupedUsers.set(walletKey, []);
                groupedUsers.get(walletKey).push(ticket);
            });
            container.innerHTML = tickets.length ? [...groupedUsers.entries()].map(([wallet, userTickets]) => {
                const userName = userTickets[0].username || 'Trader';
                const isOpen = userTickets.some(ticket => ticket.id === adminSelectedTicketId);
                return `
                    <details class="admin-inbox-user" ${isOpen ? 'open' : ''}>
                        <summary>
                            <span class="admin-inbox-user-name">${escapeHTML(userName)} <span class="admin-inbox-user-meta">(${userTickets.length})</span></span>
                            <span class="admin-inbox-user-meta">${escapeHTML(wallet)}</span>
                        </summary>
                        <div class="admin-inbox-ticket-list">
                            ${userTickets.map(ticket => `
                                <button type="button" class="admin-inbox-ticket ${ticket.id === adminSelectedTicketId ? 'active' : ''}" data-admin-ticket-select="${escapeHTML(ticket.id)}" aria-pressed="${ticket.id === adminSelectedTicketId}">
                                    <span class="admin-inbox-ticket-subject">${isUnread(ticket) ? '<span class="admin-inbox-unread-dot" aria-label="Unread"></span> ' : ''}${escapeHTML(ticket.subject)}</span>
                                    <span class="admin-inbox-ticket-date">${escapeHTML(new Date(ticket.updated_at || ticket.created_at).toLocaleDateString())}</span>
                                    <span class="admin-inbox-ticket-status">${escapeHTML(supportStatusLabel(ticket.status))}</span>
                                </button>
                            `).join('')}
                        </div>
                    </details>`;
            }).join('') : `<p class="admin-inbox-empty">No ${adminTicketFilter.toLowerCase()} conversations.</p>`;

            const selectedTicket = adminTickets.find(ticket => ticket.id === adminSelectedTicketId);
            if (!selectedTicket) {
                conversation.innerHTML = '<p class="admin-inbox-empty">Select a conversation to view its messages.</p>';
            } else {
                conversation.innerHTML = `
                    <header class="admin-inbox-conversation-header">
                        <div>
                            <h3>${escapeHTML(selectedTicket.subject)}</h3>
                            <p class="admin-inbox-conversation-meta">
                                ${escapeHTML(selectedTicket.username || 'Trader')} · <code>${escapeHTML(selectedTicket.wallet_address)}</code><br>
                                ${selectedTicket.account_id ? `${escapeHTML(selectedTicket.plan_name || 'Account')} · ${escapeHTML(selectedTicket.account_id)}` : 'General support'} · Created ${escapeHTML(new Date(selectedTicket.created_at).toLocaleString())}<br>
                                ${selectedTicket.assigned_staff_wallet ? `Assigned to support wallet <code>${escapeHTML(selectedTicket.assigned_staff_wallet)}</code>` : 'Unassigned'}
                            </p>
                        </div>
                        <span class="support-status ${supportStatusClass(selectedTicket.status)}">${supportStatusLabel(selectedTicket.status)}</span>
                    </header>
                    <div class="admin-inbox-thread">${renderSupportMessages(selectedTicket.messages || [])}</div>
                    ${selectedTicket.status !== 'CLOSED' ? `
                        <div class="support-ticket-actions">
                            <label for="admin-ticket-reply-${escapeHTML(selectedTicket.id)}">Reply (sending a reply marks “Needs your info”)</label>
                            <textarea id="admin-ticket-reply-${escapeHTML(selectedTicket.id)}" maxlength="5000" rows="4" placeholder="Write a clear response or request the details needed to resolve this issue."></textarea>
                            <div class="support-ticket-buttons">
                                <button class="btn-wallet" type="button" data-admin-ticket-action="REPLY">Send reply</button>
                                <button class="btn-sell" type="button" data-admin-ticket-action="CLOSE">Close ticket</button>
                            </div>
                        </div>
                    ` : ''}
                    <p class="support-feedback admin-inbox-feedback" role="status" aria-live="polite"></p>`;
            }

            container.onclick = event => {
                const button = event.target.closest('[data-admin-ticket-select]');
                if (button) selectAdminTicket(button.dataset.adminTicketSelect);
            };
            conversation.onclick = event => {
                const button = event.target.closest('[data-admin-ticket-action]');
                if (button && selectedTicket) processAdminTicket(selectedTicket.id, button.dataset.adminTicketAction);
            };
        }

        async function selectAdminTicket(ticketId) {
            const draft = adminSelectedTicketId === ticketId
                ? document.getElementById(`admin-ticket-reply-${ticketId}`)?.value || ''
                : '';
            adminSelectedTicketId = ticketId;
            renderAdminTicketInbox();
            const replyBox = document.getElementById(`admin-ticket-reply-${ticketId}`);
            if (replyBox && draft) replyBox.value = draft;
            const ticket = adminTickets.find(item => item.id === ticketId);
            if (!ticket || Number(ticket.is_unread) !== 1) return;
            try {
                const response = await walletFetch('/api/admin/tickets/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticket_id: ticketId })
                });
                const data = await readAdminApiResponse(response, '/api/admin/tickets/read');
                if (!response.ok) throw new Error(data.error || 'Unable to mark ticket as read.');
                ticket.is_unread = 0;
                renderAdminTicketInbox();
            } catch (err) {
                console.error(err);
                const feedback = document.querySelector('.admin-inbox-feedback');
                if (feedback) feedback.textContent = err.message;
            }
        }

        async function processAdminTicket(ticketId, action) {
            const message = document.getElementById(`admin-ticket-reply-${ticketId}`)?.value.trim() || '';
            if (action === 'REPLY' && !message) {
                alert('Write a reply before sending it.');
                return;
            }
            if (action === 'CLOSE' && !confirm('Close this support ticket?')) return;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/tickets/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, ticket_id: ticketId, action, message })
                });
                const data = await readAdminApiResponse(response, '/api/admin/tickets/action');
                if (!response.ok) throw new Error(data.error || 'Unable to update support ticket.');
                if (action === 'REPLY') {
                    const replyBox = document.getElementById(`admin-ticket-reply-${ticketId}`);
                    if (replyBox) replyBox.value = '';
                }
                if (action === 'CLOSE') adminTicketFilter = 'CLOSED';
                await loadAdminTickets();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        }

        function renderStarRating(rating) {
            const value = Math.max(0, Math.min(5, Number(rating) || 0));
            return `<span class="support-stars" aria-label="${value} out of 5 stars">${'★'.repeat(value)}${'☆'.repeat(5 - value)}</span>`;
        }

        async function loadAdminReviews() {
            const container = document.getElementById('admin-review-list');
            if (!container) return;
            try {
                const response = await walletFetch('/api/admin/reviews');
                const data = await readAdminApiResponse(response, '/api/admin/reviews');
                if (!response.ok) throw new Error(data.error || 'Unable to load reviews.');
                if (!data.reviews?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No customer reviews submitted.</p>';
                    return;
                }
                container.innerHTML = data.reviews.map(review => `
                    <article class="support-review-card">
                        <div class="support-review-heading">
                            <div><h3>${escapeHTML(review.username)}</h3>${renderStarRating(review.rating)}</div>
                            <div class="admin-review-actions">
                                <span class="support-status ${Number(review.published) ? 'support-status-open' : 'support-status-needs-info'}">${Number(review.published) ? 'Published' : 'Awaiting approval'}</span>
                                <button class="${Number(review.published) ? 'btn-sell' : 'btn-wallet'}" data-review-account="${escapeHTML(review.account_id)}" data-review-action="${Number(review.published) ? 'HIDE' : 'PUBLISH'}">${Number(review.published) ? 'Hide from homepage' : 'Publish to homepage'}</button>
                            </div>
                        </div>
                        <p class="support-review-meta">${escapeHTML(review.plan_name || 'Purchased account')} · <code>${escapeHTML(review.account_id)}</code><br><code>${escapeHTML(review.wallet_address)}</code> · Updated ${escapeHTML(new Date(review.updated_at).toLocaleString())}</p>
                        <p class="support-review-comment">${escapeHTML(review.comment)}</p>
                    </article>
                `).join('');
                container.onclick = event => {
                    const button = event.target.closest('[data-review-action]');
                    if (button) processAdminReview(button.dataset.reviewAccount, button.dataset.reviewAction);
                };
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        async function loadAdminCreatorSearch(username) {
            const container = document.getElementById('admin-creator-search-results');
            if (!container) return;
            container.innerHTML = '<p class="account-chart-empty">Searching users...</p>';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/referrals/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, username })
                });
                const data = await readAdminApiResponse(response, '/api/admin/referrals/search');
                if (!response.ok) throw new Error(data.error || 'Unable to search users.');
                if (!data.users?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No users matched that username.</p>';
                    return;
                }
                container.innerHTML = data.users.map((user, index) => `
                    <article class="admin-creator-card" data-creator-wallet="${escapeHTML(user.wallet_address)}">
                        <div>
                            <strong>@${escapeHTML(user.username)}</strong><br>
                            <code>${escapeHTML(user.wallet_address)}</code>
                        </div>
                        <div class="admin-creator-rate">
                            <div class="form-group">
                                <label for="admin-referral-pct-${index}">Level-1 commission (%)</label>
                                <input id="admin-referral-pct-${index}" type="number" min="0" max="100" step="0.01" value="${Number(user.referral_pct ?? 2)}">
                            </div>
                            <div class="form-group">
                                <label for="admin-level-two-user-pct-${index}">Level-2 commission (%)</label>
                                <input id="admin-level-two-user-pct-${index}" type="number" min="0" max="100" step="0.01" value="${Number(user.level_two_pct ?? 2)}">
                            </div>
                            <button class="btn-wallet" type="button" data-save-referral-rate>Save</button>
                        </div>
                    </article>
                `).join('');
                container.onclick = event => {
                    const button = event.target.closest('[data-save-referral-rate]');
                    const card = button?.closest('[data-creator-wallet]');
                    const inputs = card?.querySelectorAll('input[type="number"]');
                    if (card && inputs?.length === 2) {
                        saveAdminReferralRate(card.dataset.creatorWallet, inputs[0].value, inputs[1].value, button);
                    }
                };
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        async function loadAdminCreatorApplications() {
            const container = document.getElementById('admin-creator-applications');
            if (!container) return;
            container.innerHTML = '<p class="account-chart-empty">Loading creator applications...</p>';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/creator-applications/list', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readAdminApiResponse(response, '/api/admin/creator-applications/list');
                if (!response.ok) throw new Error(data.error || 'Unable to load creator applications.');
                if (!data.applications?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No creator applications have been submitted.</p>';
                    return;
                }

                const socialLinks = [
                    ['X', 'x_url'],
                    ['YouTube', 'youtube_url'],
                    ['TikTok', 'tiktok_url'],
                    ['Instagram', 'instagram_url'],
                    ['Twitch', 'twitch_url'],
                    ['Discord', 'discord_url'],
                    ['Website', 'website_url']
                ];
                container.innerHTML = data.applications.map((application, index) => {
                    const links = socialLinks
                        .filter(([, key]) => application[key])
                        .map(([label, key]) => `<a href="${escapeHTML(application[key])}" target="_blank" rel="noopener noreferrer">${label}</a>`)
                        .join('');
                    const status = String(application.status || 'PENDING').toLowerCase().replaceAll('_', ' ');
                    return `
                        <article class="creator-application-admin-card" data-creator-application-wallet="${escapeHTML(application.wallet_address)}">
                            <div class="creator-application-admin-heading">
                                <div>
                                    <h3>${application.username ? `@${escapeHTML(application.username)}` : 'Creator applicant'}</h3>
                                    <code>${escapeHTML(application.wallet_address)}</code>
                                </div>
                                <span class="creator-application-admin-status">${escapeHTML(status)}</span>
                            </div>
                            <div class="creator-application-admin-links">${links || '<span>No social profile links</span>'}</div>
                            <p><span>Community size</span>${escapeHTML(application.community_size)}</p>
                            <p><span>Community</span>${escapeHTML(application.community_description)}</p>
                            <p><span>Why Blastrr</span>${escapeHTML(application.creator_motivation)}</p>
                            <div class="creator-application-admin-actions">
                                <label for="creator-application-rate-${index}">Referral bonus (%)</label>
                                <input id="creator-application-rate-${index}" type="number" min="0" max="100" step="0.01" value="${Number(application.referral_pct ?? 2)}">
                                <button class="btn-wallet" type="button" data-creator-application-action="APPROVE">${application.status === 'APPROVED' ? 'Save bonus' : 'Approve'}</button>
                                <button class="creator-application-reject" type="button" data-creator-application-action="REJECT">Reject</button>
                            </div>
                        </article>
                    `;
                }).join('');
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        async function loadAdminMaintenanceSettings() {
            const container = document.getElementById('admin-maintenance-pages');
            const message = document.getElementById('admin-maintenance-message');
            const feedback = document.getElementById('admin-maintenance-feedback');
            if (!container) return;
            if (feedback) feedback.textContent = 'Loading maintenance settings...';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/maintenance/load', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readAdminApiResponse(response, '/api/admin/maintenance/load');
                if (!response.ok) throw new Error(data.error || 'Unable to load maintenance settings.');
                const settings = new Map((data.pages || []).map(page => [page.page_id, Number(page.is_offline) === 1]));
                container.querySelectorAll('input[type="checkbox"]').forEach(input => {
                    input.checked = Boolean(settings.get(input.value));
                });
                if (message) message.value = data.outage_message || '';
                if (feedback) feedback.textContent = '';
            } catch (error) {
                console.error(error);
                if (feedback) feedback.textContent = error.message;
            }
        }

        async function saveAdminMaintenanceSettings(button) {
            const container = document.getElementById('admin-maintenance-pages');
            const message = document.getElementById('admin-maintenance-message')?.value.trim() || '';
            const feedback = document.getElementById('admin-maintenance-feedback');
            const offlinePages = Array.from(container?.querySelectorAll('input[type="checkbox"]:checked') || [])
                .map(input => input.value);
            if (offlinePages.length && !message) {
                if (feedback) feedback.textContent = 'Add an outage message before taking pages offline.';
                return;
            }
            if (button) button.disabled = true;
            if (feedback) feedback.textContent = 'Saving maintenance settings...';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/maintenance/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, offline_pages: offlinePages, outage_message: message })
                });
                const data = await readAdminApiResponse(response, '/api/admin/maintenance/save');
                if (!response.ok) throw new Error(data.error || 'Unable to save maintenance settings.');
                await loadMaintenanceStatus();
                if (feedback) feedback.textContent = offlinePages.length
                    ? `Maintenance enabled for ${offlinePages.length} ${offlinePages.length === 1 ? 'page' : 'pages'}.`
                    : 'All selected services are online.';
            } catch (error) {
                console.error(error);
                if (feedback) feedback.textContent = error.message;
            } finally {
                if (button) button.disabled = false;
            }
        }

        async function reviewCreatorApplication(wallet, action, card, button) {
            const input = card?.querySelector('input[type="number"]');
            const referralPct = action === 'APPROVE' ? Number(input?.value) : undefined;
            if (action === 'APPROVE' && (!Number.isFinite(referralPct) || referralPct < 0 || referralPct > 100)) {
                alert('Enter a referral bonus from 0% to 100%.');
                return;
            }
            if (button) button.disabled = true;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/creator-applications/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, user_wallet: wallet, action, referral_pct: referralPct })
                });
                const data = await readAdminApiResponse(response, '/api/admin/creator-applications/action');
                if (!response.ok) throw new Error(data.error || 'Unable to review creator application.');
                await loadAdminCreatorApplications();
                const search = document.getElementById('admin-creator-search')?.value.trim();
                if (search?.length >= 2) await loadAdminCreatorSearch(search);
            } catch (err) {
                console.error(err);
                alert(err.message);
                if (button) button.disabled = false;
            }
        }

        async function saveAdminReferralRate(wallet, referralPct, levelTwoPct, button) {
            if (button) button.disabled = true;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/referrals/commission', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...authorization,
                        user_wallet: wallet,
                        referral_pct: Number(referralPct),
                        level_two_pct: Number(levelTwoPct)
                    })
                });
                const data = await readAdminApiResponse(response, '/api/admin/referrals/commission');
                if (!response.ok) throw new Error(data.error || 'Unable to update the commission rate.');
                await loadAdminCreatorSearch(document.getElementById('admin-creator-search')?.value.trim());
            } catch (err) {
                console.error(err);
                alert(err.message);
                if (button) button.disabled = false;
            }
        }

        async function loadAdminPromoManagement() {
            await Promise.all([loadAdminPromoPlans(), loadAdminPromoCodes(), loadAdminLevelTwoSettings()]);
        }

        async function loadAdminPromoPlans() {
            const select = document.getElementById('admin-promo-plan');
            if (!select) return;
            try {
                const response = await fetch('/api/plans');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load account plans.');
                const plans = data.plans || [];
                select.innerHTML = plans.length
                    ? `<option value="">Select a plan</option>${plans.map(plan => `<option value="${Number(plan.id)}">${escapeHTML(plan.name)} · $${Number(plan.simulated_capital).toLocaleString()} capital</option>`).join('')}`
                    : '<option value="">No active plans available</option>';
            } catch (err) {
                console.error(err);
                select.innerHTML = '<option value="">Plans unavailable</option>';
                const feedback = document.getElementById('admin-promo-feedback');
                if (feedback) feedback.textContent = err.message;
            }
        }

        async function loadAdminPromoCodes() {
            const container = document.getElementById('admin-promo-code-list');
            if (!container) return;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/promo-codes/list', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readAdminApiResponse(response, '/api/admin/promo-codes/list');
                if (!response.ok) throw new Error(data.error || 'Unable to load free account codes.');
                if (!data.codes?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No free account codes generated.</p>';
                    return;
                }
                container.innerHTML = data.codes.map(code => `
                    <article class="promo-code-card">
                        <div class="promo-code-card-header">
                            <code>${escapeHTML(code.code)}</code>
                            <span class="promo-code-status ${code.claimed_at ? 'claimed' : ''}">${code.claimed_at ? 'Claimed' : 'Available'}</span>
                        </div>
                        <p class="support-review-meta">${escapeHTML(code.plan_name)} · Created ${escapeHTML(new Date(code.created_at).toLocaleString())}</p>
                        ${code.claimed_at ? `<p class="support-review-meta">Claimed by <code>${escapeHTML(code.claimed_by)}</code> · ${escapeHTML(new Date(code.claimed_at).toLocaleString())}</p>` : ''}
                    </article>
                `).join('');
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        async function createAdminPromoCode(planId) {
            const feedback = document.getElementById('admin-promo-feedback');
            if (feedback) feedback.textContent = '';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/promo-codes/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, plan_id: planId })
                });
                const data = await readAdminApiResponse(response, '/api/admin/promo-codes/create');
                if (!response.ok) throw new Error(data.error || 'Unable to generate a free account code.');
                if (feedback) feedback.textContent = `Generated ${data.code} for ${data.plan_name}. Share this code with its recipient.`;
                await loadAdminPromoCodes();
            } catch (err) {
                console.error(err);
                if (feedback) feedback.textContent = err.message;
            }
        }

        async function processAdminReview(accountId, action) {
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/reviews/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, review_account_id: accountId, action })
                });
                const data = await readAdminApiResponse(response, '/api/admin/reviews/action');
                if (!response.ok) throw new Error(data.error || 'Unable to update review publication.');
                await loadAdminReviews();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        }

        async function adminAccountAction(accountId, action) {
            const reason = action === 'FREEZE' ? prompt('Why is this account being frozen?')?.trim() : '';
            if (action === 'FREEZE' && !reason) return;
            const promptText = action === 'FREEZE'
                ? `Freeze this account? New trades and withdrawals will be blocked.`
                : 'Remove the administrator freeze? Any DLL/MLL risk lock will remain.';
            if (!confirm(promptText)) return;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/accounts/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, account_id: accountId, action, reason })
                });
                const data = await readAdminApiResponse(response, '/api/admin/accounts/action');
                if (!response.ok) throw new Error(data.error || 'Unable to update account freeze.');
                alert(data.message);
                if (adminUserSearchQuery) loadAdminUserSearch();
                loadAdminWithdrawals();
                loadAdminHedgingAlerts();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        }

        async function adminUserAction(wallet, action) {
            const reason = action === 'SUSPEND'
                ? prompt('Why is this user being suspended?')?.trim()
                : action === 'CLEAR_IP_SOFT_LOCK'
                    ? (prompt('Optional note for clearing this IP security lock:') || '').trim()
                    : '';
            if (action === 'SUSPEND' && !reason) return;
            const promptText = action === 'SUSPEND'
                ? 'Suspend this user? They will retain sign-in and read access and may close existing trades, but purchases, new trades, and withdrawals will be blocked.'
                : action === 'CLEAR_IP_SOFT_LOCK'
                    ? 'Clear this wallet’s IP session-limit security lock?'
                    : 'Restore this user? Any per-account freezes and risk locks will remain.';
            if (!confirm(promptText)) return;
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/admin/users/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, user_wallet: wallet, action, reason })
                });
                const data = await readAdminApiResponse(response, '/api/admin/users/action');
                if (!response.ok) throw new Error(data.error || 'Unable to update user suspension.');
                alert(data.message);
                if (adminUserSearchQuery) loadAdminUserSearch();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        }

        async function processWithdrawal(withdrawalId, action, type) {
            const payoutTxHash = action === 'PAID'
                ? window.prompt('Enter the payout transaction ID (EVM transaction hash or Solana signature):')?.trim()
                : '';
            if (action === 'PAID' && !payoutTxHash) return;
            const confirmation = action === 'APPROVE'
                ? 'Approve this payout? The gross amount will be deducted from the account and trading will be unlocked. You can record the payout transaction later.'
                : action === 'PAID'
                    ? `Confirm this payout was sent with transaction ID ${payoutTxHash}?`
                    : type === 'ACCOUNT'
                        ? 'Reject this withdrawal? Any previously deducted account funds will be returned.'
                        : 'Reject this referral payout request?';
            if (!confirm(confirmation)) return;
            try {
                const authorization = await signedTradeAuthorization();
                const res = await fetch('/api/admin/withdrawals/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...authorization, withdrawal_id: withdrawalId, action, type, payout_tx_hash: payoutTxHash })
                });
                const data = await readAdminApiResponse(res, '/api/admin/withdrawals/action');
                if (data.success) { alert(data.message); loadAdminWithdrawals(); if (adminUserSearchQuery) loadAdminUserSearch(); if (connectedWallet) loadUserAccounts(connectedWallet); }
                else alert("Error: " + data.error);
            } catch (err) { console.error(err); }
        }

        function switchActiveAccount(accId) {
            activeAccount = userAccounts.find(a => a.id === accId && isSelectableTradingAccount(a)) || null;
            selectedAccountId = activeAccount?.id || null;
            if (!activeAccount) {
                const selectElem = document.getElementById('active-account-select');
                if (selectElem) selectElem.value = '';
                calculateMetrics();
                return;
            }
            calculateMetrics();
            loadOpenTrades(selectedAccountId);
        }

        function selectAccountAndTrade(accId) {
            activeAccount = userAccounts.find(a => a.id === accId && isSelectableTradingAccount(a)) || null;
            if (!activeAccount) {
                setTradeFeedback('This account is locked or unavailable for trading.');
                return;
            }
            selectedAccountId = activeAccount.id;
            const selectElem = document.getElementById('active-account-select');
            if (selectElem) selectElem.value = accId;
            calculateMetrics();
            switchView('tradeView');
            loadOpenTrades(accId);
        }

        function updateAvailableBalanceLabel(estimatedMargin) {
            const balanceLabel = document.getElementById('available-bal-label');
            const balanceDetail = document.getElementById('available-bal-detail');
            const balanceValue = document.getElementById('selected-account-balance-value');
            const orderSize = parseFloat(document.getElementById('order-size-usd')?.value) || 0;
            const balance = activeAccount ? Math.max(0, Number(activeAccount.current_balance) || 0) : 0;
            const hasEstimate = Boolean(activeAccount && Number.isFinite(estimatedMargin) && estimatedMargin > 0);
            const remainingBalance = hasEstimate ? balance - estimatedMargin : balance;
            const formatMoney = amount => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const selectedMarket = marketsData.find(market => market.symbol === document.getElementById('order-symbol')?.value);
            if (balanceLabel) balanceLabel.textContent = hasEstimate ? 'Available after estimated margin' : activeAccount ? 'Available account balance' : 'Selected account balance';
            if (balanceDetail) {
                balanceDetail.textContent = hasEstimate
                    ? `Account ${formatMoney(balance)} · Estimated margin ${formatMoney(estimatedMargin)}`
                    : !activeAccount
                        ? 'Select an active account to estimate available balance.'
                        : orderSize > 0 && selectedMarket?.asset_class === 'FOREX'
                            ? 'Waiting for a live price to estimate required margin.'
                            : 'Enter a position size to estimate margin used.';
            }
            if (balanceValue) {
                balanceValue.textContent = formatMoney(remainingBalance);
                balanceValue.classList.toggle('is-insufficient', hasEstimate && remainingBalance < 0);
            }
            document.querySelectorAll('.balance-shortcut').forEach(button => { button.disabled = !activeAccount || balance <= 0; });
        }

        function setOrderSizeFromBalance(percentage) {
            if (!activeAccount || ![25, 50, 100].includes(percentage)) return;
            const balance = Math.max(0, Number(activeAccount.current_balance) || 0);
            const amount = Math.floor(balance * percentage) / 100;
            const input = document.getElementById('order-size-usd');
            if (!input || amount <= 0) return;
            input.value = amount.toFixed(2);
            calculateMetrics();
        }

        async function monitorClientStops() {
            if (!connectedWallet || !selectedAccountId) return;
            const accountId = selectedAccountId;
            const selectedSymbol = document.getElementById('order-symbol')?.value;
            try {
                const response = await walletFetch(`/api/trades/active?account_id=${encodeURIComponent(accountId)}&wallet=${encodeURIComponent(connectedWallet)}`);
                const data = await response.json();
                const trades = data.trades || [];
                const filledLimits = trades.filter(trade =>
                    trade.symbol === selectedSymbol && trade.status === 'OPEN' && trade.order_type === 'LIMIT' &&
                    displayedOpenTrades.some(previous => previous.id === trade.id && previous.status === 'PENDING')
                );
                if (filledLimits.length && selectedAccountId === accountId) {
                    await loadOpenTrades(accountId);
                    const fill = filledLimits[0];
                    const fillPrice = Number(fill.entry_price).toLocaleString(undefined, { maximumFractionDigits: 8 });
                    setTradeFeedback(`${fill.symbol} limit order filled at ${fillPrice}.`);
                }
            } catch (error) {
                console.warn('Unable to check pending limit fills:', error);
            }
        }

        async function signedTradeAuthorization() {
            if (!connectedWallet) throw new Error('Connect the wallet that owns this account first.');
            const challengeResponse = await fetch('/api/auth/trade-challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet_address: connectedWallet, wallet_type: connectedWalletType })
            });
            const challengeData = await readApiJson(challengeResponse, '/api/auth/trade-challenge');
            if (!challengeResponse.ok) throw new Error(challengeData.error || 'Unable to request wallet authorization.');

            let signature;
            if (connectedWalletType === 'SOLANA') {
                const provider = getSolanaWalletProvider(connectedSolanaProviderName);
                if (!provider?.signMessage) throw new Error('The active Solana wallet does not support message signing.');
                const result = await provider.signMessage(new TextEncoder().encode(challengeData.challenge), 'utf8');
                const signatureBytes = result?.signature || result;
                signature = btoa(String.fromCharCode(...signatureBytes));
            } else {
                const provider = getProvider();
                if (!provider) throw new Error('Connect the EVM wallet that owns this account first.');
                const encodedMessage = `0x${Array.from(new TextEncoder().encode(challengeData.challenge), byte => byte.toString(16).padStart(2, '0')).join('')}`;
                signature = await provider.request({
                    method: 'personal_sign',
                    params: [encodedMessage, connectedWallet]
                });
            }
            return {
                wallet_address: connectedWallet,
                wallet_type: connectedWalletType,
                challenge: challengeData.challenge,
                signature
            };
        }

        async function ensureWalletSession() {
            const owner = getConnectedWalletOwnerKey();
            if (!owner) throw new Error('Connect a wallet to view private account data.');
            if (walletSessionToken && walletSessionOwner === owner && walletSessionExpiresAt > Date.now()) {
                return walletSessionToken;
            }
            if (walletSessionPromise && walletSessionOwner === owner) return walletSessionPromise;

            const generation = walletSessionGeneration;
            const sessionPromise = (async () => {
                const authorization = await signedTradeAuthorization();
                if (generation !== walletSessionGeneration || owner !== getConnectedWalletOwnerKey()) {
                    throw new Error('Wallet changed before authorization completed.');
                }
                const response = await fetch('/api/auth/wallet-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authorization)
                });
                const data = await readApiJson(response, '/api/auth/wallet-session');
                if (!response.ok) throw new Error(data.error || 'Unable to establish a wallet session.');
                walletSessionToken = data.token;
                walletSessionOwner = owner;
                walletSessionExpiresAt = data.expires_at;
                setWalletSoftLockState(data.wallet_soft_locked === true);
                return walletSessionToken;
            })();
            walletSessionOwner = owner;
            walletSessionPromise = sessionPromise;
            try {
                return await sessionPromise;
            } finally {
                if (walletSessionPromise === sessionPromise) walletSessionPromise = null;
            }
        }

        async function walletFetch(url, options = {}, authenticationRetry = true, reauthenticationRetry = true) {
            if (dashboardAuthenticated && (!walletSessionToken || walletSessionExpiresAt <= Date.now())) {
                lockDashboard('Your wallet session expired. Sign in again to continue.');
                throw new Error('Wallet session expired. Sign in again to continue.');
            }
            let token = await ensureWalletSession();
            const fetchWithToken = sessionToken => fetch(url, {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${sessionToken}`
                }
            });
            let response = await fetchWithToken(token);
            if (response.status === 401 && authenticationRetry && connectedWallet) {
                walletSessionGeneration++;
                walletSessionToken = null;
                walletSessionExpiresAt = 0;
                walletSessionOwner = getConnectedWalletOwnerKey();
                walletSessionPromise = null;
                token = await ensureWalletSession();
                response = await fetchWithToken(token);
            }
            if (response.headers.get('X-Wallet-Reauthentication-Required') === 'true' && reauthenticationRetry) {
                await reauthorizeWalletSession();
                response = await fetchWithToken(walletSessionToken);
            }
            if (response.headers.get('X-Wallet-Soft-Locked') === 'true') setWalletSoftLockState(true);
            return response;
        }

        async function reauthorizeWalletSession() {
            const token = await ensureWalletSession();
            const authorization = await signedTradeAuthorization();
            const response = await fetch('/api/auth/wallet-session/reauthorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(authorization)
            });
            const data = await readApiJson(response, '/api/auth/wallet-session/reauthorize');
            if (!response.ok) throw new Error(data.error || 'Unable to reauthorize this wallet session.');
            setWalletSoftLockState(data.wallet_soft_locked === true);
            return data;
        }

        async function refreshWalletSecurityStatus() {
            const response = await walletFetch('/api/user/security-status');
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to load wallet security status.');
            setWalletSoftLockState(data.wallet_soft_locked === true);
            if (data.wallet_soft_locked && data.reauthentication_required) {
                return reauthorizeWalletSession();
            }
            return data;
        }

        function startWalletSecurityStatusPolling() {
            if (walletSecurityPollTimer) clearInterval(walletSecurityPollTimer);
            walletSecurityPollTimer = setInterval(() => {
                if (!dashboardAuthenticated || document.visibilityState !== 'visible') return;
                refreshWalletSecurityStatus().catch(error => {
                    console.warn('Unable to refresh wallet security status:', error);
                });
            }, 60000);
        }

        async function loadOpenTrades(accountId) {
            if (!accountId) return;
            const selectedAccount = userAccounts.find(account => String(account.id) === String(accountId));
            if (selectedAccount && isPermanentlyLockedCopyAccount(selectedAccount)) {
                displayedOpenTrades = [];
                renderChartTradeOverlays([]);
                const tbody = document.getElementById('open-trades-list');
                if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #6b7280; padding: 24px;">No open positions for a failed or permanently locked account.</td></tr>';
                return;
            }
            const res = await walletFetch(`/api/trades/active?account_id=${encodeURIComponent(accountId)}&wallet=${encodeURIComponent(connectedWallet)}`);
            const data = await res.json();
            const tbody = document.getElementById('open-trades-list');
            if (!tbody) return;
            tbody.innerHTML = '';
            displayedOpenTrades = data.trades || [];
            const isLimitMode = document.getElementById('order-type')?.value === 'LIMIT';
            const visibleTrades = displayedOpenTrades.filter(trade =>
                trade.status === (isLimitMode ? 'PENDING' : 'OPEN')
            );
            renderChartTradeOverlays(displayedOpenTrades);

            if (visibleTrades.length === 0) {
                const emptyMessage = isLimitMode
                    ? 'No pending limit orders for this account.'
                    : 'No open positions for this account.';
                tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #6b7280; padding: 24px;">${emptyMessage}</td></tr>`;
                return;
            }

            const formatOpenTradeValue = value => Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
            const formatProtectionValue = value => value == null
                ? 'None'
                : `$${formatOpenTradeValue(value)}`;
            visibleTrades.forEach(trd => {
                const currentPrice = trd.current_price || currentLivePrice || trd.entry_price;
                const priceDiff = trd.side === 'BUY' ? (currentPrice - trd.entry_price) : (trd.entry_price - currentPrice);
                const tradeMarket = findConfiguredMarket(trd.symbol);
                const isForex = trd.market_type === 'FOREX';
                const quoteToUsdRate = isForex ? getClientForexQuoteToUsdRate(tradeMarket?.quote_currency) : 1;
                const pnl = trd.status === 'PENDING'
                    ? 0
                    : Number.isFinite(Number(trd.live_pnl))
                        ? Number(trd.live_pnl)
                        : priceDiff * trd.units * quoteToUsdRate;
                const pnlColor = pnl >= 0 ? '#34d399' : '#ef4444';
                const leverageDisplay = isForex
                    ? `${Number(trd.lot_size).toFixed(2)} lots · ${trd.leverage || 1}x`
                    : trd.leverage && trd.leverage > 1 ? `${trd.leverage}x Perp` : '1x Spot';
                const margin = Number(trd.size_usd);
                const notional = isForex
                    ? Number(trd.units) * Number(trd.entry_price) * quoteToUsdRate
                    : Number(trd.units) * Number(trd.entry_price);
                const stop = trd.sl_tp_mode === 'amount' ? trd.sl_amount : trd.sl;
                const target = trd.sl_tp_mode === 'amount' ? trd.tp_amount : trd.tp;
                const pricePrecision = isForex ? (tradeMarket?.quote_currency === 'JPY' ? 3 : 5) : 0;
                const isPending = trd.status === 'PENDING';
                const tradeStatusLabel = isPending
                    ? 'Pending limit order'
                    : trd.order_type === 'LIMIT' ? 'Filled limit order' : '';
                const tradeStatusMarkup = tradeStatusLabel ? `<br><small>${tradeStatusLabel}</small>` : '';
                const entryDisplay = Number(trd.entry_price).toLocaleString(undefined, {
                    minimumFractionDigits: pricePrecision,
                    maximumFractionDigits: pricePrecision
                });
                const stopDisplay = isForex && stop != null
                    ? `${(Math.abs(Number(trd.entry_price) - Number(stop)) / Number(tradeMarket?.pip_size)).toFixed(1)} pips`
                    : formatProtectionValue(stop);
                const targetDisplay = isForex && target != null
                    ? `${(Math.abs(Number(target) - Number(trd.entry_price)) / Number(tradeMarket?.pip_size)).toFixed(1)} pips`
                    : formatProtectionValue(target);

                tbody.innerHTML += `
                    <tr>
                        <td><code>${trd.id}</code></td>
                        <td>${trd.symbol}${tradeStatusMarkup}</td>
                        <td><span style="color: ${trd.side === 'BUY' ? '#34d399' : '#ef4444'}; font-weight: bold;">${trd.side}</span></td>
                        <td>${leverageDisplay}</td>
                        <td class="open-trade-value">${isForex ? entryDisplay : `$${formatOpenTradeValue(trd.entry_price)}`}</td>
                        <td class="open-trade-value">$${formatOpenTradeValue(margin)} / $${formatOpenTradeValue(notional)}</td>
                        <td class="open-trade-value">SL: ${stopDisplay} / TP: ${targetDisplay}</td>
                        <td class="open-trade-value"><span data-trade-pnl="${trd.id}" style="color: ${pnlColor}; font-weight: bold;">$${formatOpenTradeValue(pnl)}</span></td>
                        <td><button class="btn-sell" style="padding:5px 10px; font-size:11px;" onclick="closeTrade('${trd.id}', ${currentPrice})">${isPending ? 'Cancel Order' : 'Close Early'}</button></td>
                    </tr>
                `;
            });
        }

        function updateDisplayedOpenTradePnls(currentPrice) {
            if (!Number.isFinite(currentPrice) || currentPrice <= 0) return;
            const selectedSymbol = document.getElementById('order-symbol')?.value;
            const tbody = document.getElementById('open-trades-list');
            if (!selectedSymbol || !tbody) return;

            for (const trade of displayedOpenTrades) {
                if (trade.status !== 'OPEN' || trade.symbol !== selectedSymbol) continue;
                const priceDiff = trade.side === 'BUY'
                    ? currentPrice - Number(trade.entry_price)
                    : Number(trade.entry_price) - currentPrice;
                const tradeMarket = findConfiguredMarket(trade.symbol);
                const quoteToUsdRate = trade.market_type === 'FOREX'
                    ? getClientForexQuoteToUsdRate(tradeMarket?.quote_currency)
                    : 1;
                const pnl = priceDiff * Number(trade.units) * quoteToUsdRate;
                if (!Number.isFinite(pnl)) continue;
                const pnlCell = Array.from(tbody.querySelectorAll('[data-trade-pnl]'))
                    .find(cell => cell.dataset.tradePnl === trade.id);
                if (!pnlCell) continue;
                pnlCell.textContent = `$${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                pnlCell.style.color = pnl >= 0 ? '#34d399' : '#ef4444';
            }
        }

        async function executeTrade(side) {
            if (tradeExecutionInProgress) return;
            if (walletSoftLocked) {
                setTradeFeedback('New trades are disabled for this wallet. Re-sign each active wallet session; closing existing positions remains available.');
                return;
            }
            if (!selectedAccountId || !activeAccount) { setTradeFeedback('Select or purchase an active trading account first.'); return; }
            const symbol = document.getElementById('order-symbol').value;
            const selectedMarket = marketsData.find(market => market.symbol === symbol);
            const isForex = selectedMarket?.asset_class === 'FOREX';
            const orderType = document.getElementById('order-type')?.value || 'MARKET';
            const price = parseFloat(document.getElementById('order-price').value) || currentLivePrice;
            const enteredSize = parseFloat(document.getElementById('order-size-usd').value);
            const leverage = parseInt(document.getElementById('order-leverage').value) || 1;
            const amountMode = document.getElementById('order-sl-tp-amount-mode')?.checked === true;
            const slValue = document.getElementById('order-sl').value;
            const tpValue = document.getElementById('order-tp').value;
            const sl = slValue === '' ? null : Number(slValue);
            const tp = tpValue === '' ? null : Number(tpValue);
            const lotSize = isForex ? enteredSize * leverage : null;
            const quoteToUsdRate = isForex ? getClientForexQuoteToUsdRate(selectedMarket.quote_currency) : 1;
            const forexNotional = isForex
                ? lotSize * Number(selectedMarket.lot_units) * price * quoteToUsdRate
                : null;
            const marginUsed = isForex ? forexNotional / leverage : enteredSize;
            const sizeUsd = isForex ? marginUsed : enteredSize;

            if (orderType === 'LIMIT' && (!Number.isFinite(price) || price <= 0)) {
                setTradeFeedback('Enter a valid limit trigger price before submitting the order.');
                return;
            }
            if (isForex && (!Number.isFinite(quoteToUsdRate) || quoteToUsdRate <= 0)) {
                setTradeFeedback('Waiting for live currency-conversion prices. Please retry when the feed is live.');
                return;
            }
            if (!Number.isFinite(enteredSize) || enteredSize <= 0 ||
                (isForex && lotSize < 0.01) ||
                !Number.isFinite(sizeUsd) || sizeUsd <= 0 || sizeUsd > activeAccount.current_balance) {
                setTradeFeedback('Please check position size and available balance.');
                return;
            }
            if ([sl, tp].some(value => value !== null && (!Number.isFinite(value) || value <= 0))) {
                setTradeFeedback(amountMode
                    ? 'SL/TP dollar amounts must be positive numbers.'
                    : 'SL/TP trigger prices must be positive numbers.');
                return;
            }

            const totalNotional = isForex ? forexNotional : sizeUsd * leverage;
            const buyButton = document.querySelector('.btn-buy[onclick*="executeTrade"]');
            const sellButton = document.querySelector('.btn-sell[onclick*="executeTrade"]');
            setTradeFeedback('');
            tradeExecutionInProgress = true;
            if (buyButton) buyButton.disabled = true;
            if (sellButton) sellButton.disabled = true;

            try {
                const res = await walletFetch('/api/trades/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        wallet_address: connectedWallet,
                        account_id: selectedAccountId, 
                        symbol, 
                        side, 
                        price, 
                        size_usd: totalNotional,
                        margin_used: marginUsed,
                        lot_size: lotSize,
                        leverage: leverage,
                        is_perp: leverage > 1,
                        order_type: orderType,
                        trigger_price: orderType === 'LIMIT' ? price : null,
                        sl: amountMode ? null : sl,
                        tp: amountMode ? null : tp,
                        sl_tp_mode: amountMode ? 'amount' : isForex ? 'pips' : 'price',
                        sl_amount: amountMode ? sl : null,
                        tp_amount: amountMode ? tp : null
                    })
                });
                const data = await res.json();
                if (data.success) {
                    const resultPrice = Number(data.execution_price ?? price).toLocaleString(undefined, { maximumFractionDigits: 8 });
                    if (data.status === 'PENDING' && !data.copy_results) {
                        const triggerText = Number(price).toLocaleString(undefined, { maximumFractionDigits: 8 });
                        setTradeFeedback(`Limit order queued at ${triggerText}; waiting for the market to reach the trigger.`);
                    } else if (orderType === 'LIMIT' && data.status === 'OPEN' && !data.copy_results) {
                        setTradeFeedback(`Limit order filled at ${resultPrice}.`);
                    } else if (orderType === 'MARKET' && !data.copy_results) {
                        setTradeFeedback(`Market order opened at ${resultPrice}.`);
                    }
                    if (data.copy_results) {
                        const succeeded = data.copy_results.filter(result => result.success).length;
                        const failed = data.copy_results.filter(result => !result.success);
                        const orderLabel = data.status === 'PENDING' ? 'Limit order queued' : 'Leader trade opened';
                        const copySummary = failed.length
                            ? ` ${orderLabel}; ${succeeded} follower(s) copied, ${failed.length} failed: ${failed.map(result => `${result.account_id}: ${result.error}`).join(' ')}`
                            : ` ${data.status === 'PENDING' ? 'Limit order copied' : 'Order copied'} to all ${succeeded} follower account(s).`;
                        setTradeFeedback(data.copy_error
                            ? `${data.copy_error}${copySummary}`
                            : copySummary.trim());
                    } else if (data.copy_error) {
                        setTradeFeedback(data.copy_error);
                    }
                    await loadUserAccounts(connectedWallet);
                    await loadOpenTrades(selectedAccountId);
                } else setTradeFeedback(data.error || 'Unable to execute trade.');
            } catch (err) {
                console.error('Unable to execute trade:', err);
                setTradeFeedback(err.message || 'Unable to execute trade.');
            } finally {
                tradeExecutionInProgress = false;
                if (buyButton) buyButton.disabled = false;
                if (sellButton) sellButton.disabled = false;
            }
        }

        async function closeTrade(tradeId, currentPrice, automatic = false) {
            const closingAccountId = selectedAccountId;
            try {
                const res = await walletFetch('/api/trades/close', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallet_address: connectedWallet, trade_id: tradeId, current_market_price: currentPrice })
                });
                const data = await res.json();
                if (data.success) {
                    try {
                        await loadOpenTrades(closingAccountId);
                    } catch (refreshError) {
                        console.warn('Trade closed but the open-trades list could not be refreshed:', refreshError);
                    }
                    if (data.lock) {
                        const limitName = data.lock.reason === 'MLL' ? 'MLL' : 'DLL';
                        setTradeFeedback(data.risk_breach_settled
                            ? `${limitName} risk limit reached; remaining open and pending orders were closed.`
                            : `Trade closed. The account remains locked due to ${limitName}.`);
                    } else if (Array.isArray(data.copy_close_results)) {
                        const failedCopies = data.copy_close_results.filter(result => !result.success);
                        setTradeFeedback(failedCopies.length
                            ? `Leader position closed; ${failedCopies.length} copied follower position(s) could not be closed.`
                            : `Leader position closed with ${data.copy_close_results.length} copied follower position(s).`);
                    } else if (data.copy_close_error) {
                        setTradeFeedback(data.copy_close_error);
                    }
                    loadUserAccounts(connectedWallet);
                    loadLeaderboard(currentLeaderboardMode);
                } else if (!automatic) setTradeFeedback(data.error || 'Unable to close position.');
            } catch (err) {
                console.error('Unable to close trade:', err);
                if (!automatic) setTradeFeedback(err.message || 'Unable to close trade.');
            } finally {
                closingTradeIds.delete(tradeId);
            }
        }

        async function loadPlans() {
            try {
                const res = await fetch('/api/plans');
                const data = await res.json();
                plansData = data.plans || [];
                standardDiscountPct = Number(data.standard_discount_pct ?? 90);
                if (plansData.length === 0 && planLoadAttempts < 5) {
                    planLoadAttempts++;
                    setTimeout(loadPlans, 400);
                    return;
                }
                planLoadAttempts = 0;
                renderPlans();
            } catch(e) { console.error("Plans load error:", e); }
        }

        function renderPlans() {
            const container = document.getElementById('plans-container');
            if (!container) return;
            container.innerHTML = '';

            plansData.forEach(plan => {
                const basePrice = Number(plan.base_price_usdt);
                const isCertificate = activePromoDetails?.type === 'PACK_DISCOUNT';
                const planEligible = !isCertificate || activePromoDetails.eligible_plan_id == null ||
                    Number(activePromoDetails.eligible_plan_id) === Number(plan.id);
                const discountPct = activePromoDetails && planEligible ? Number(activePromoDetails.discount_pct) : 0;
                const displayPrice = Math.round(basePrice * (100 - discountPct)) / 100;
                const capital = Number(plan.simulated_capital);
                const price = `$${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
                const oldPrice = `$${basePrice.toLocaleString()} USDT`;
                const profitTarget = `$${Number(plan.profit_target).toLocaleString()}`;
                const dailyLossLimit = `$${(capital * Number(plan.daily_loss_pct) / 100).toLocaleString()}`;
                const maxDrawdown = `$${(capital * Number(plan.max_drawdown_pct) / 100).toLocaleString()}`;
                const isFeatured = plan.name.replace(/\s+\$[\d,]+.*$/, '') === 'Pro';
                const initialTotal = `$${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

                container.innerHTML += `
                    <article class="card dashboard-tile purchase-plan-card${isFeatured ? ' is-featured' : ''}">
                        <div class="purchase-plan-header">
                            <div>
                                <h3 class="purchase-plan-name">${escapeHTML(plan.name)}</h3>
                                <div class="purchase-plan-capital">$${capital.toLocaleString()}</div>
                                <div class="purchase-plan-caption">SIMULATED CAPITAL</div>
                            </div>
                            ${isFeatured ? '<span class="battlepass-period-tag">POPULAR</span>' : ''}
                        </div>
                        <span class="purchase-plan-status" title="Straight-to-funded plan model. Account capital is simulated; eligibility and current terms apply."><span class="purchase-plan-status-icon" aria-hidden="true">↗</span>STRAIGHT TO FUNDED</span>
                        <div class="purchase-plan-market-hours"><span aria-hidden="true"></span>Crypto markets · 24/7/365</div>
                        <section class="purchase-plan-reward" aria-label="Account price">
                            <span class="purchase-plan-reward-label">${discountPct ? 'Code discount applied' : 'Account price'}</span>
                            <div class="purchase-plan-price">${price}<small>${discountPct ? `${discountPct}% off · <span class="purchase-plan-old-price">${oldPrice}</span>` : 'Full price · apply an eligible code to receive a discount'}</small></div>
                        </section>
                        <div class="purchase-plan-rules" aria-label="${escapeHTML(plan.name)} account rules">
                            <div class="purchase-plan-rule"><span>Profit target</span><strong>${profitTarget}</strong></div>
                            <div class="purchase-plan-rule"><span>Daily loss limit (${Number(plan.daily_loss_pct)}%)</span><strong>${dailyLossLimit}</strong></div>
                            <div class="purchase-plan-rule"><span>Max drawdown (${Number(plan.max_drawdown_pct)}%)</span><strong>${maxDrawdown}</strong></div>
                            <div class="purchase-plan-rule"><span>Profit consistency</span><strong>${Number(plan.max_single_day_profit_pct)}% max single-day profit</strong></div>
                            <div class="purchase-plan-rule"><span>Trading availability</span><strong>24/7/365</strong></div>
                        </div>
                        <div class="purchase-plan-quantity">
                            <label for="plan-quantity-${Number(plan.id)}">Quantity</label>
                            <input id="plan-quantity-${Number(plan.id)}" type="number" min="1" max="${isCertificate ? 1 : 10}" step="1" value="1" inputmode="numeric" ${planEligible ? '' : 'disabled'} oninput="updatePlanPurchaseTotal(${Number(plan.id)}, ${displayPrice})">
                            <span>${isCertificate ? 'Discount certificates apply to one account only' : 'Up to 10 accounts per checkout'}</span>
                        </div>
                        <p class="purchase-plan-total">Checkout total <strong id="plan-total-${Number(plan.id)}">${initialTotal}</strong></p>
                        <button id="plan-buy-${Number(plan.id)}" class="btn-wallet purchase-plan-buy" ${planEligible ? '' : 'disabled'} onclick="buyPlan(${Number(plan.id)}, ${displayPrice})">${planEligible ? `Buy 1 account · ${initialTotal}` : 'Certificate is for another account type'}</button>
                    </article>
                `;
            });
        }

        function updatePlanPurchaseTotal(planId, unitPrice) {
            const input = document.getElementById(`plan-quantity-${planId}`);
            const total = document.getElementById(`plan-total-${planId}`);
            const button = document.getElementById(`plan-buy-${planId}`);
            if (!input || !total || !button) return;
            const quantity = Number(input.value);
            const quantityLimit = activePromoDetails?.type === 'PACK_DISCOUNT' ? 1 : 10;
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > quantityLimit) {
                total.textContent = `Enter a quantity from 1 to ${quantityLimit}`;
                button.disabled = true;
                return;
            }
            const amount = Math.round(Number(unitPrice) * quantity * 100) / 100;
            const formattedAmount = `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
            total.textContent = formattedAmount;
            button.textContent = `Buy ${quantity} account${quantity === 1 ? '' : 's'} · ${formattedAmount}`;
            button.disabled = false;
        }

        async function applyPromo() {
            const code = document.getElementById('applied-promo')?.value.trim();
            const feedback = document.getElementById('promo-feedback');
            if (!code) {
                activePromoCode = null;
                battlePassDiscountBonusPct = 0;
                activePromoDetails = null;
                if (feedback) feedback.textContent = '';
                renderPlans();
                return;
            }

            const res = await walletFetch('/api/promo/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();

            if (res.ok && data.valid) {
                activePromoCode = code.toUpperCase();
                battlePassDiscountBonusPct = data.type === 'BATTLEPASS' ? Number(data.bonus_discount_pct || 0) : 0;
                activePromoDetails = {
                    type: data.type,
                    discount_pct: Number(data.discount_pct || 0),
                    eligible_plan_id: data.eligible_plan_id == null ? null : Number(data.eligible_plan_id),
                    eligible_plan_name: data.eligible_plan_name || null
                };
                const eligibleCopy = activePromoDetails.eligible_plan_name ? ` for ${activePromoDetails.eligible_plan_name}` : '';
                const oneAccountCopy = data.type === 'PACK_DISCOUNT' ? ' · one account only · replaces other discount codes' : '';
                if (feedback) feedback.innerText = `✓ Code '${activePromoCode}' applied! ${activePromoDetails.discount_pct}% off${eligibleCopy}${oneAccountCopy}.`;
                renderPlans();
            } else {
                activePromoCode = null;
                battlePassDiscountBonusPct = 0;
                activePromoDetails = null;
                if (feedback) feedback.innerText = `✕ ${data.error || 'Invalid promo code.'}`;
                renderPlans();
            }
        }

        async function loadUserProfile(wallet) {
            try {
                const res = await walletFetch(`/api/user/profile?wallet=${encodeURIComponent(wallet)}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Unable to load your profile.');
                
                const setupBox = document.getElementById('profile-setup-box');
                const dispBox = document.getElementById('profile-display-box');
                const editBtn = document.getElementById('btn-toggle-edit');

                if (data.user) {
                    currentUserProfile = data.user;
                    const leaderboardPreference = document.getElementById('leaderboard-exclude-self');
                    if (leaderboardPreference) {
                        leaderboardPreference.checked = Number(data.user.leaderboard_hidden) === 1;
                        leaderboardPreference.disabled = false;
                    }
                    if (setupBox) setupBox.style.display = 'none';
                    if (dispBox) dispBox.style.display = 'block';
                    if (editBtn) editBtn.style.display = 'inline-block';

                    const dUser = document.getElementById('disp-username');
                    const dCode = document.getElementById('disp-code');
                    const dLink = document.getElementById('disp-link');
                    const dReferralPct = document.getElementById('disp-referral-pct');
                    if (dUser) dUser.innerText = data.user.username;
                    if (dCode) dCode.innerText = data.user.discount_code;
                    if (dLink) dLink.value = `https://blastrr.com/?ref=${data.user.discount_code}`;
                    if (dReferralPct) dReferralPct.innerText = `${Number(data.user.effective_referral_pct ?? data.user.referral_pct ?? 2)}%`;
                    const dLevelTwoPct = document.getElementById('disp-level-two-pct');
                    if (dLevelTwoPct) dLevelTwoPct.innerText = `${Number(data.user.effective_level_two_pct ?? 2)}%`;

                    const pUser = document.getElementById('prof-username');
                    const pCode = document.getElementById('prof-code');
                    if (pUser) pUser.value = data.user.username;
                    if (pCode) pCode.value = data.user.discount_code;

                    const refCount = document.getElementById('stat-ref-count');
                    const refEarn = document.getElementById('stat-ref-earnings');
                    if (refCount) refCount.innerText = data.stats.total_referrals || 0;
                    availableCommissionBalance = data.stats.available_commission || 0;
                    if (refEarn) refEarn.innerText = `$${availableCommissionBalance.toFixed(2)} USDT`;

                    loadReferralTransactions(wallet);
                } else {
                    currentUserProfile = null;
                    const leaderboardPreference = document.getElementById('leaderboard-exclude-self');
                    if (leaderboardPreference) {
                        leaderboardPreference.checked = false;
                        leaderboardPreference.disabled = true;
                    }
                    if (setupBox) setupBox.style.display = 'block';
                    if (dispBox) dispBox.style.display = 'none';
                    if (editBtn) editBtn.style.display = 'none';
                }
                renderCreatorApplication(data.application);

                const reviewUsername = document.getElementById('review-username');
                if (reviewUsername) reviewUsername.value = currentUserProfile?.username || '';
                await loadUserReview(wallet);
                loadLeaderboard(currentLeaderboardMode);
            } catch (err) { console.error(err); }
        }

        function renderCreatorApplication(application) {
            const form = document.getElementById('creator-application-form');
            const status = document.getElementById('creator-application-status');
            const startButton = document.getElementById('creator-application-start');
            if (!form || !status || !startButton) return;

            const fields = {
                'creator-x-url': application?.x_url,
                'creator-youtube-url': application?.youtube_url,
                'creator-tiktok-url': application?.tiktok_url,
                'creator-instagram-url': application?.instagram_url,
                'creator-twitch-url': application?.twitch_url,
                'creator-discord-url': application?.discord_url,
                'creator-website-url': application?.website_url,
                'creator-community-size': application?.community_size,
                'creator-community-description': application?.community_description,
                'creator-motivation': application?.creator_motivation
            };
            Object.entries(fields).forEach(([id, value]) => {
                const field = document.getElementById(id);
                if (field) field.value = value || '';
            });

            const intro = document.getElementById('creator-application-intro');
            startButton.hidden = false;
            if (application) {
                const statusText = {
                    PENDING: 'Under review',
                    APPROVED: 'Approved',
                    REJECTED: 'Not approved'
                }[application.status] || 'Under review';
                status.textContent = statusText;
                status.hidden = false;
                intro?.classList.add('creator-application-existing');
                startButton.textContent = 'Edit application';
            } else {
                status.hidden = true;
                intro?.classList.remove('creator-application-existing');
                startButton.textContent = 'Apply to become a creator';
            }
            form.hidden = true;
            const feedback = document.getElementById('creator-application-feedback');
            if (feedback) feedback.textContent = '';
        }

        async function submitCreatorApplication(event) {
            event.preventDefault();
            const form = event.currentTarget;
            const feedback = document.getElementById('creator-application-feedback');
            const button = form.querySelector('button[type="submit"]');
            const linkIds = [
                'creator-x-url', 'creator-youtube-url', 'creator-tiktok-url',
                'creator-instagram-url', 'creator-twitch-url', 'creator-discord-url',
                'creator-website-url'
            ];
            if (!linkIds.some(id => document.getElementById(id)?.value.trim())) {
                if (feedback) feedback.textContent = 'Add at least one social profile link.';
                return;
            }
            if (!connectedWallet) {
                if (feedback) feedback.textContent = 'Connect your wallet before applying.';
                return;
            }

            if (button) button.disabled = true;
            if (feedback) feedback.textContent = 'Submitting your application...';
            try {
                const authorization = await signedTradeAuthorization();
                const response = await fetch('/api/user/creator-application', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...authorization,
                        x_url: document.getElementById('creator-x-url').value.trim(),
                        youtube_url: document.getElementById('creator-youtube-url').value.trim(),
                        tiktok_url: document.getElementById('creator-tiktok-url').value.trim(),
                        instagram_url: document.getElementById('creator-instagram-url').value.trim(),
                        twitch_url: document.getElementById('creator-twitch-url').value.trim(),
                        discord_url: document.getElementById('creator-discord-url').value.trim(),
                        website_url: document.getElementById('creator-website-url').value.trim(),
                        community_size: document.getElementById('creator-community-size').value,
                        community_description: document.getElementById('creator-community-description').value.trim(),
                        creator_motivation: document.getElementById('creator-motivation').value.trim()
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to submit creator application.');
                if (feedback) feedback.textContent = 'Application submitted. You can edit it while it is under review.';
                form.hidden = true;
                await loadUserProfile(connectedWallet);
            } catch (err) {
                console.error(err);
                if (feedback) feedback.textContent = err.message;
            } finally {
                if (button) button.disabled = false;
            }
        }

        async function claimFreeAccountCode() {
            const input = document.getElementById('free-account-code');
            const feedback = document.getElementById('free-account-feedback');
            const button = document.getElementById('claim-free-account');
            const code = input?.value.trim();
            if (!connectedWallet) {
                if (feedback) feedback.textContent = 'Connect your wallet before claiming a code.';
                return;
            }
            if (!code) {
                if (feedback) feedback.textContent = 'Enter a free account code.';
                return;
            }
            if (button) button.disabled = true;
            if (feedback) feedback.textContent = 'Claiming your account...';
            try {
                const response = await walletFetch('/api/promo/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to claim this code.');
                if (feedback) feedback.textContent = `${data.plan_name} account added to your wallet.`;
                if (input) input.value = '';
                await loadUserAccounts(connectedWallet);
                switchView('accountsView');
            } catch (err) {
                console.error(err);
                if (feedback) feedback.textContent = err.message;
            } finally {
                if (button) button.disabled = false;
            }
        }

        function supportStatusLabel(status) {
            if (status === 'NEEDS_INFO') return 'Needs your info';
            if (status === 'CLOSED') return 'Closed';
            return 'Open';
        }

        function supportStatusClass(status) {
            if (status === 'NEEDS_INFO') return 'support-status-needs-info';
            if (status === 'CLOSED') return 'support-status-closed';
            return 'support-status-open';
        }

        function renderSupportMessages(messages) {
            return `<div class="support-message-list">${messages.map(message => `
                <article class="support-message ${message.author_role === 'ADMIN' ? 'support-message-admin' : 'support-message-user'}">
                    <div class="support-message-header"><strong>${escapeHTML(message.author_name)}</strong><time>${escapeHTML(new Date(message.created_at).toLocaleString())}</time></div>
                    <p>${escapeHTML(message.body)}</p>
                </article>
            `).join('')}</div>`;
        }

        async function loadUserTickets(wallet) {
            const container = document.getElementById('user-ticket-list');
            if (!container || !wallet) return;
            populateTicketAccountOptions();
            try {
                const response = await walletFetch(`/api/user/tickets?wallet=${encodeURIComponent(wallet)}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load support tickets.');
                if (!data.tickets?.length) {
                    container.innerHTML = '<p class="account-chart-empty">No support tickets yet. Create one above if you need help.</p>';
                    return;
                }
                container.innerHTML = data.tickets.map(ticket => `
                    <article class="support-ticket-card" data-ticket-id="${escapeHTML(ticket.id)}">
                        <div class="support-ticket-heading">
                            <h3>${escapeHTML(ticket.subject)}</h3>
                            <span class="support-status ${supportStatusClass(ticket.status)}">${supportStatusLabel(ticket.status)}</span>
                        </div>
                        <p class="support-ticket-meta">${ticket.account_id ? `${escapeHTML(ticket.plan_name || 'Account')} · ${escapeHTML(ticket.account_id)}` : 'General support'} · Updated ${escapeHTML(new Date(ticket.updated_at).toLocaleString())}</p>
                        ${renderSupportMessages(ticket.messages || [])}
                        ${ticket.status !== 'CLOSED' ? `<div class="support-ticket-actions"><label for="user-ticket-reply-${escapeHTML(ticket.id)}">Reply to this ticket</label><textarea id="user-ticket-reply-${escapeHTML(ticket.id)}" maxlength="5000" rows="4" placeholder="Add details or answer the support team (up to 5,000 characters)."></textarea><button class="btn-wallet" data-user-ticket-reply="${escapeHTML(ticket.id)}">Send reply</button></div>` : ''}
                    </article>
                `).join('');
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        async function submitUserTicketReply(ticketId, card) {
            const textarea = card.querySelector('textarea');
            const button = card.querySelector('[data-user-ticket-reply]');
            const message = textarea?.value.trim();
            if (!message) return;
            if (button) button.disabled = true;
            try {
                const response = await walletFetch(`/api/user/tickets/${encodeURIComponent(ticketId)}/reply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to send ticket reply.');
                await loadUserTickets(connectedWallet);
            } catch (err) {
                console.error(err);
                alert(err.message);
            } finally {
                if (button) button.disabled = false;
            }
        }

        async function loadUserReview(wallet) {
            const form = document.getElementById('user-review-form');
            if (!form || !wallet) return;
            const feedback = document.getElementById('review-form-feedback');
            const submit = form.querySelector('button[type="submit"]');
            const usernameField = document.getElementById('review-username');
            const accountSelect = document.getElementById('review-account');
            if (usernameField) usernameField.value = currentUserProfile?.username || '';
            if (submit) submit.disabled = true;
            document.getElementById('review-comment').value = '';
            document.getElementById('review-rating').value = '5';
            if (feedback) feedback.textContent = 'Loading your review…';
            try {
                const response = await walletFetch(`/api/user/review?wallet=${encodeURIComponent(wallet)}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load your review.');
                userReviewAccounts = Array.isArray(data.accounts) ? data.accounts : [];
                if (!accountSelect) return;
                const previouslySelected = accountSelect.value;
                accountSelect.innerHTML = userReviewAccounts.length
                    ? userReviewAccounts.map(account => `<option value="${escapeHTML(account.account_id)}">${escapeHTML(account.plan_name || 'Account')} · ${escapeHTML(account.account_id)}</option>`).join('')
                    : '<option value="">No assigned accounts available</option>';
                accountSelect.disabled = userReviewAccounts.length === 0;
                if (userReviewAccounts.some(account => account.account_id === previouslySelected)) {
                    accountSelect.value = previouslySelected;
                }
                renderSelectedUserReview();
            } catch (err) {
                console.error(err);
                if (feedback) feedback.textContent = err.message;
                if (accountSelect) {
                    accountSelect.disabled = true;
                    accountSelect.innerHTML = '<option value="">Unable to load eligible accounts</option>';
                }
            }
        }

        function renderSelectedUserReview() {
            const form = document.getElementById('user-review-form');
            const accountSelect = document.getElementById('review-account');
            const feedback = document.getElementById('review-form-feedback');
            const submit = form?.querySelector('button[type="submit"]');
            const selectedAccount = userReviewAccounts.find(account => account.account_id === accountSelect?.value);
            const hasUsername = Boolean(currentUserProfile?.username);
            document.getElementById('review-comment').value = selectedAccount?.comment || '';
            document.getElementById('review-rating').value = String(selectedAccount?.rating || 5);
            if (submit) submit.disabled = !selectedAccount || !hasUsername;
            if (!feedback) return;
            if (!userReviewAccounts.length) {
                feedback.textContent = hasUsername
                    ? 'An account assigned to your wallet is required before you can submit a review.'
                    : 'Set up your profile username and claim or purchase an account before submitting a review.';
            } else if (!hasUsername) {
                feedback.textContent = 'Set up your profile username before submitting a review.';
            } else if (!selectedAccount) {
                feedback.textContent = 'Select an assigned account to write its review.';
            } else if (selectedAccount.rating) {
                feedback.textContent = selectedAccount.published
                    ? 'Your review is published. Saving changes will send it for approval again.'
                    : 'Your review is awaiting admin approval. You may edit this account review.';
            } else {
                feedback.textContent = 'One review is allowed per assigned account. Reviews are approved before appearing on the homepage.';
            }
        }

        async function submitUserReview(event) {
            event.preventDefault();
            const feedback = document.getElementById('review-form-feedback');
            if (!connectedWallet || !currentUserProfile?.username) {
                if (feedback) feedback.textContent = 'Set up your profile username before submitting a review.';
                return;
            }
            try {
                const response = await walletFetch('/api/user/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account_id: document.getElementById('review-account').value,
                        rating: Number(document.getElementById('review-rating').value),
                        comment: document.getElementById('review-comment').value
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to submit review.');
                await Promise.all([loadUserReview(connectedWallet), loadBattlePass()]);
                if (feedback) feedback.textContent = data.message;
            } catch (err) {
                console.error(err);
                if (feedback) feedback.textContent = err.message;
            }
        }

        async function submitSupportTicket(event) {
            event.preventDefault();
            if (!connectedWallet) return;
            const form = event.currentTarget;
            const feedback = document.getElementById('ticket-form-feedback');
            const submit = form.querySelector('button[type="submit"]');
            if (submit) submit.disabled = true;
            try {
                const response = await walletFetch('/api/user/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account_id: document.getElementById('ticket-account-select').value || null,
                        subject: document.getElementById('ticket-subject').value,
                        message: document.getElementById('ticket-message').value
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to create support ticket.');
                form.reset();
                populateTicketAccountOptions();
                if (feedback) feedback.textContent = 'Ticket created. The support team will respond here.';
                await loadUserTickets(connectedWallet);
            } catch (err) {
                console.error(err);
                if (feedback) feedback.textContent = err.message;
            } finally {
                if (submit) submit.disabled = false;
            }
        }

        async function loadWithdrawalCertificates() {
            const list = document.getElementById('withdrawal-certificates-list');
            const feedback = document.getElementById('withdrawal-certificates-feedback');
            if (!list || !connectedWallet) return;
            list.innerHTML = '<p class="workspace-empty-state">Loading your certificates…</p>';
            if (feedback) feedback.textContent = '';
            try {
                const response = await walletFetch('/api/user/withdrawal-certificates');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to load withdrawal certificates.');
                const username = data.username || 'Blastrr Trader';
                const certificates = Array.isArray(data.certificates) ? data.certificates : [];
                if (!certificates.length) {
                    list.innerHTML = '<p class="workspace-empty-state">No approved withdrawals yet. Your certificate will appear here after a withdrawal is marked paid.</p>';
                    return;
                }
                list.innerHTML = certificates.map(certificate => {
                    const paidDate = certificate.paid_at || certificate.created_at;
                    const parsedDate = new Date(`${String(paidDate || '').replace(' ', 'T')}Z`);
                    const dateText = Number.isNaN(parsedDate.getTime()) ? 'Date unavailable' : parsedDate.toLocaleDateString();
                    return `<article class="withdrawal-certificate-card" data-certificate-id="${escapeHTML(certificate.id)}" data-certificate-amount="${Number(certificate.amount || 0)}" data-certificate-date="${escapeHTML(dateText)}" data-certificate-username="${escapeHTML(username)}">
                        <div><strong>Performance bonus</strong><span>Paid ${escapeHTML(dateText)}</span></div>
                        <strong class="withdrawal-certificate-amount">$${Number(certificate.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</strong>
                        <canvas class="withdrawal-certificate-preview" width="480" height="300" role="img" aria-label="Performance bonus certificate for ${escapeHTML(username)}"></canvas>
                        <div class="withdrawal-certificate-actions">
                            <button class="battlepass-secondary-button" type="button" data-share-withdrawal-certificate>Share on X</button>
                            <button class="battlepass-secondary-button" type="button" data-withdrawal-certificate>Download JPG</button>
                        </div>
                    </article>`;
                }).join('');
                await Promise.all([...list.querySelectorAll('.withdrawal-certificate-preview')].map(canvas => {
                    const card = canvas.closest('.withdrawal-certificate-card');
                    return renderWithdrawalCertificate(canvas, {
                        id: card.dataset.certificateId,
                        amount: Number(card.dataset.certificateAmount),
                        date: card.dataset.certificateDate,
                        username: card.dataset.certificateUsername
                    });
                }));
            } catch (error) {
                console.error(error);
                list.innerHTML = '';
                if (feedback) feedback.textContent = error.message || 'Unable to load withdrawal certificates.';
            }
        }

        async function renderWithdrawalCertificate(canvas, certificate) {
            const width = 1600;
            const height = 1000;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Your browser could not prepare the certificate preview.');
            context.save();
            context.scale(canvas.width / width, canvas.height / height);

            const background = context.createLinearGradient(0, 0, width, height);
            background.addColorStop(0, '#080b12');
            background.addColorStop(0.48, '#111827');
            background.addColorStop(1, '#080b10');
            context.fillStyle = background;
            context.fillRect(0, 0, width, height);

            const glow = context.createRadialGradient(1280, 250, 30, 1280, 250, 650);
            glow.addColorStop(0, 'rgba(77, 117, 121, 0.22)');
            glow.addColorStop(1, 'rgba(77, 117, 121, 0)');
            context.fillStyle = glow;
            context.fillRect(0, 0, width, height);

            context.save();
            context.beginPath();
            context.rect(60, 60, 1480, 880);
            context.clip();
            context.strokeStyle = 'rgba(180, 203, 218, 0.045)';
            context.lineWidth = 1;
            for (let x = 70; x < width; x += 64) {
                context.beginPath();
                context.moveTo(x, 60);
                context.lineTo(x, 940);
                context.stroke();
            }
            for (let y = 70; y < height; y += 64) {
                context.beginPath();
                context.moveTo(60, y);
                context.lineTo(1540, y);
                context.stroke();
            }
            context.beginPath();
            context.moveTo(990, 650);
            [[1080, 590], [1160, 625], [1240, 495], [1320, 530], [1410, 390], [1540, 430]].forEach(([x, y]) => context.lineTo(x, y));
            context.strokeStyle = 'rgba(119, 205, 179, 0.22)';
            context.lineWidth = 6;
            context.stroke();
            context.restore();

            context.strokeStyle = 'rgba(190, 209, 219, 0.44)';
            context.lineWidth = 2;
            context.strokeRect(42, 42, 1516, 916);
            context.strokeStyle = 'rgba(190, 209, 219, 0.12)';
            context.strokeRect(60, 60, 1480, 880);
            context.fillStyle = '#7ccbb4';
            context.fillRect(84, 83, 90, 4);
            context.fillRect(width - 174, height - 87, 90, 4);

            const logo = new Image();
            logo.src = '/favicon.png';
            await new Promise((resolve, reject) => {
                logo.onload = resolve;
                logo.onerror = () => reject(new Error('Could not load the Blastrr logo for the certificate.'));
            });
            context.drawImage(logo, 105, 104, 68, 68);
            context.fillStyle = '#f3f6f7';
            context.font = '800 30px Inter, Arial, sans-serif';
            context.fillText('BLASTRR', 193, 139);
            context.fillStyle = '#8fa0ad';
            context.font = '600 14px Inter, Arial, sans-serif';
            context.letterSpacing = '3px';
            context.fillText('PERFORMANCE PROGRAM', 195, 164);
            context.letterSpacing = '0px';

            context.textAlign = 'right';
            context.fillStyle = '#8fa0ad';
            context.font = '600 16px Inter, Arial, sans-serif';
            context.fillText(`CERTIFICATE  ${certificate.id}`, 1490, 137);
            context.textAlign = 'center';
            context.fillStyle = '#7ccbb4';
            context.font = '700 17px Inter, Arial, sans-serif';
            context.letterSpacing = '6px';
            context.fillText('PERFORMANCE BONUS', 800, 292);
            context.letterSpacing = '0px';
            context.fillStyle = '#f7f8fa';
            context.font = '700 62px Inter, Arial, sans-serif';
            context.fillText('Certificate of Achievement', 800, 382);

            context.fillStyle = '#94a3b0';
            context.font = '500 20px Inter, Arial, sans-serif';
            context.fillText('AWARDED TO', 800, 458);
            context.fillStyle = '#fff';
            let usernameFontSize = 58;
            context.font = `700 ${usernameFontSize}px Inter, Arial, sans-serif`;
            while (context.measureText(certificate.username).width > 1280 && usernameFontSize > 34) {
                usernameFontSize -= 2;
                context.font = `700 ${usernameFontSize}px Inter, Arial, sans-serif`;
            }
            context.fillText(certificate.username, 800, 532);

            const amount = `$${Number(certificate.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            context.fillStyle = 'rgba(3, 10, 14, 0.55)';
            context.beginPath();
            context.roundRect(350, 590, 900, 150, 18);
            context.fill();
            context.strokeStyle = 'rgba(124, 203, 180, 0.32)';
            context.lineWidth = 2;
            context.stroke();
            context.fillStyle = '#9bdfc9';
            let amountFontSize = 78;
            context.font = `700 ${amountFontSize}px Inter, Arial, sans-serif`;
            while (context.measureText(`${amount} USDT`).width > 820 && amountFontSize > 48) {
                amountFontSize -= 2;
                context.font = `700 ${amountFontSize}px Inter, Arial, sans-serif`;
            }
            context.fillText(`${amount} USDT`, 800, 686);

            context.fillStyle = '#b5c0ca';
            context.font = '500 20px Inter, Arial, sans-serif';
            context.fillText('Approved performance bonus', 800, 805);
            context.fillStyle = '#8795a1';
            context.font = '400 17px Inter, Arial, sans-serif';
            context.fillText(`PAID ${certificate.date}`, 800, 846);

            context.beginPath();
            context.arc(1408, 820, 58, 0, Math.PI * 2);
            context.fillStyle = 'rgba(124, 203, 180, 0.08)';
            context.fill();
            context.strokeStyle = 'rgba(124, 203, 180, 0.4)';
            context.lineWidth = 2;
            context.stroke();
            context.beginPath();
            context.arc(1408, 820, 47, 0, Math.PI * 2);
            context.strokeStyle = 'rgba(124, 203, 180, 0.2)';
            context.stroke();
            context.fillStyle = '#9bdfc9';
            context.font = '700 13px Inter, Arial, sans-serif';
            context.letterSpacing = '1px';
            context.fillText('PAID', 1408, 825);
            context.letterSpacing = '0px';

            context.textAlign = 'left';
            context.fillStyle = 'rgba(174, 186, 197, 0.72)';
            context.font = '500 14px Inter, Arial, sans-serif';
            context.fillText('BLASTRR.COM  ·  SIMULATED TRADING PLATFORM', 108, 911);
            context.restore();
        }

        async function downloadWithdrawalCertificate(event) {
            const button = event.target.closest('[data-withdrawal-certificate]');
            const shareButton = event.target.closest('[data-share-withdrawal-certificate]');
            const actionButton = shareButton || button;
            if (!actionButton) return;
            const card = actionButton.closest('.withdrawal-certificate-card');
            const preview = card?.querySelector('.withdrawal-certificate-preview');
            const feedback = document.getElementById('withdrawal-certificates-feedback');
            if (!card || !preview) return;
            actionButton.disabled = true;
            let shareWindow;
            if (shareButton) {
                const text = 'My performance bonus certificate from @Blastrr. #Blastrr';
                shareWindow = window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
            }
            if (feedback) feedback.textContent = shareButton ? 'Preparing your certificate and X post…' : 'Preparing JPG…';
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 1600;
                canvas.height = 1000;
                await renderWithdrawalCertificate(canvas, {
                    id: card.dataset.certificateId,
                    amount: Number(card.dataset.certificateAmount),
                    date: card.dataset.certificateDate,
                    username: card.dataset.certificateUsername
                });
                const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.94));
                if (!imageBlob) throw new Error('Your browser could not encode the certificate as a JPG.');
                const imageUrl = URL.createObjectURL(imageBlob);
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `blastrr-performance-bonus-certificate-${card.dataset.certificateId}.jpg`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
                if (feedback) {
                    feedback.textContent = shareButton
                        ? 'Certificate downloaded. Attach the JPG to your X post.'
                        : 'Certificate downloaded as JPG.';
                }
            } catch (error) {
                console.error(error);
                if (shareWindow) shareWindow.close();
                if (feedback) feedback.textContent = error.message || 'Unable to prepare the JPG certificate.';
            } finally {
                actionButton.disabled = false;
            }
        }

        function toggleEditProfile() {
            const setupBox = document.getElementById('profile-setup-box');
            if (setupBox) setupBox.style.display = setupBox.style.display === 'none' ? 'block' : 'none';
        }

        async function loadReferralTransactions(wallet) {
            try {
                const res = await walletFetch(`/api/user/referrals?wallet=${encodeURIComponent(wallet)}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Unable to load your referrals.');
                const container = document.getElementById('ref-transactions-list');
                const referrals = Array.isArray(data.referrals) ? data.referrals : [];
                if (container) {
                    container.innerHTML = referrals.length ? referrals.map(ref => {
                        const buyerName = ref.buyer_username ? `@${ref.buyer_username}` : 'Anonymous Trader';
                        const dateStr = new Date(ref.created_at).toLocaleString();
                        const level = Number(ref.referral_level) === 2 ? 2 : 1;
                        return `
                            <article class="battlepass-task profile-commission-card">
                                <div class="profile-commission-main">
                                    <strong>${escapeHTML(buyerName)}</strong>
                                    <span>${escapeHTML(ref.plan_name)}</span>
                                </div>
                                <div class="profile-commission-details">
                                    <strong>+$${Number(ref.commission_earned).toFixed(2)} USDT</strong>
                                    <span>Level ${level} · ${Number(ref.commission_pct ?? 2)}% commission</span>
                                    <small>${escapeHTML(dateStr)}</small>
                                </div>
                            </article>
                        `;
                    }).join('') : '<p class="workspace-empty-state">No sales recorded yet.</p>';
                }
                const referees = Array.isArray(data.referees) ? data.referees : [];
                const refereesHtml = referees.length ? referees.map(referee => `
                    <article class="battlepass-task profile-commission-card">
                        <div class="profile-commission-main">
                            <strong>${escapeHTML(referee.username ? `@${referee.username}` : 'Trader')}</strong>
                            <span>Direct referee</span>
                        </div>
                        <div class="profile-commission-details">
                            <code>${escapeHTML(referee.wallet_address)}</code>
                        </div>
                    </article>
                `).join('') : '<p class="workspace-empty-state">No referees yet.</p>';
                ['profile-referees-list', 'promo-referees-list'].forEach(id => {
                    const list = document.getElementById(id);
                    if (list) list.innerHTML = refereesHtml;
                });
                const levelOneRate = document.getElementById('disp-referral-pct');
                if (levelOneRate) levelOneRate.textContent = `${Number(data.level_one_pct ?? 2)}%`;
                const levelTwoRate = document.getElementById('disp-level-two-pct');
                if (levelTwoRate) levelTwoRate.textContent = `${Number(data.level_two_pct ?? 2)}%`;
            } catch (err) {
                console.error(err);
                const container = document.getElementById('ref-transactions-list');
                if (container) container.innerHTML = `<p class="support-feedback">${escapeHTML(err.message)}</p>`;
            }
        }

        async function saveProfile() {
            if (!connectedWallet) { alert("Connect wallet first!"); return; }
            const username = document.getElementById('prof-username')?.value.trim();
            const discount_code = document.getElementById('prof-code')?.value.trim();

            if (!username || !discount_code) {
                alert("Please provide both a username and a promo code.");
                return;
            }

            const authorization = await signedTradeAuthorization();
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...authorization, username, discount_code })
            });
            const data = await res.json();

            if (data.success) {
                alert("Profile saved successfully!");
                loadUserProfile(connectedWallet);
            } else {
                alert("Error: " + data.error);
            }
        }

        async function buyPlan(planId, priceUsdt) {
            if (!connectedWallet) { alert("Connect wallet first!"); return; }
            const quantity = Number(document.getElementById(`plan-quantity-${planId}`)?.value || 1);
            const quantityLimit = activePromoDetails?.type === 'PACK_DISCOUNT' ? 1 : 10;
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > quantityLimit) {
                alert(`Choose a quantity from 1 to ${quantityLimit} account${quantityLimit === 1 ? '' : 's'}.`);
                return;
            }
            if (activePromoDetails?.type === 'PACK_DISCOUNT' &&
                activePromoDetails.eligible_plan_id != null &&
                Number(activePromoDetails.eligible_plan_id) !== Number(planId)) {
                alert('This discount certificate can only be used for its eligible account type.');
                return;
            }
            const amount = Math.round(Number(priceUsdt) * quantity * 100) / 100;
            if (!Number.isFinite(amount) || amount < 0) { alert("Invalid plan price."); return; }
            const owner = getConnectedWalletOwnerKey();
            if (!dashboardAuthenticated || !walletSessionToken ||
                walletSessionOwner !== owner || walletSessionExpiresAt <= Date.now()) {
                lockDashboard('Your wallet session expired. Sign in again before purchasing.');
                return;
            }
            if (!await requestPurchaseDisclaimer() || getConnectedWalletOwnerKey() !== owner) return;
            await completePlanPurchase(planId, amount, quantity);
        }

        async function completePlanPurchase(planId, amount, quantity = 1) {
            if (amount === 0) {
                if (quantity > 1) { alert("Free or fully discounted purchases are limited to one account per checkout."); return; }
                if (!confirm('Confirm this free account purchase?')) return;
                try {
                    const response = await walletFetch('/api/accounts/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            wallet_address: connectedWallet,
                            plan_id: Number(planId),
                            quantity,
                            promo_code: activePromoCode,
                            disclaimer_version: DISCLAIMER_VERSION,
                            terms_accepted: true,
                            simulated_funds_acknowledged: true
                        })
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success) throw new Error(data.error || 'Unable to provision this free account.');
                    alert("Free account provisioned successfully.");
                    await loadUserAccounts(connectedWallet);
                    switchView('tradeView');
                } catch (error) {
                    console.error("Free account purchase error:", error);
                    alert(error.message || "Unable to provision this free account.");
                }
                return;
            }

            const selectedChain = document.getElementById('payment-chain-select')?.value || '1';
            const selectedAsset = document.getElementById('payment-asset-select')?.value || 'USDT';
            if (selectedChain === '101') {
                if (connectedWalletType !== 'SOLANA') {
                    alert('Solana payments are available only to a connected Solana wallet.');
                    return;
                }
                await completeSolanaPlanPurchase(planId, amount, quantity, selectedAsset);
                return;
            }
            if (connectedWalletType !== 'EVM') {
                alert('EVM payments are available only to a connected EVM wallet.');
                return;
            }
            const selectedChainId = Number(selectedChain);
            const chainConfig = SUPPORTED_EVM_CHAINS[selectedChainId];
            const tokenConfig = chainConfig?.tokens?.[selectedAsset];
            if (!chainConfig || !tokenConfig) { alert("Invalid network or payment asset selection."); return; }

            const provider = getProvider();
            if (!provider) return;

            try {
                await ensurePaymentNetwork(provider, chainConfig);
            } catch (networkErr) {
                console.error("Payment network switch error:", networkErr);
                alert(networkErr.message || `Unable to connect to ${chainConfig.name}. Please check your wallet network.`);
                return;
            }

            if (!confirm(`Confirm purchase of ${quantity} account${quantity === 1 ? '' : 's'} for $${amount.toFixed(2)} ${selectedAsset} on ${chainConfig.name}?`)) return;

            try {
                const paddedRecipient = TREASURY_WALLET.toLowerCase().replace('0x', '').padStart(64, '0');
                const rawAmount = toTokenUnits(amount, tokenConfig.decimals);
                const amountHex = rawAmount.toString(16).padStart(64, '0');
                const calldata = '0xa9059cbb' + paddedRecipient + amountHex;

                const txHash = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: connectedWallet,
                        to: tokenConfig.address,
                        data: calldata
                    }]
                });

                alert("Transaction submitted! Verifying on-chain...");

                const res = await walletFetch('/api/accounts/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        wallet_address: connectedWallet, 
                        plan_id: planId, 
                        quantity,
                        tx_hash: txHash, 
                        chain_id: selectedChainId,
                        payment_asset: selectedAsset,
                        promo_code: activePromoCode,
                        disclaimer_version: DISCLAIMER_VERSION,
                        terms_accepted: true,
                        simulated_funds_acknowledged: true
                    })
                });
                const data = await res.json();

                if (data.success) {
                    alert(data.message || `${quantity} account${quantity === 1 ? '' : 's'} provisioned successfully.`);
                    loadUserAccounts(connectedWallet);
                    switchView('tradeView');
                } else {
                    alert("Verification Error: " + data.error);
                }
            } catch (err) {
                console.error("Purchase Error:", err);
                alert("Transaction failed or was rejected.");
            }
        }

        async function completeSolanaPlanPurchase(planId, amount, quantity, assetSymbol) {
            const walletName = document.getElementById('solana-wallet-select')?.value || 'phantom';
            const walletProvider = getSolanaWalletProvider(walletName);
            if (!walletProvider) {
                alert(`${walletName === 'solflare' ? 'Solflare' : 'Phantom'} was not detected. Install or enable that Solana wallet, or select the wallet you have installed.`);
                return;
            }
            if (!window.solanaWeb3) {
                alert('Solana payment support could not load. Refresh the page and try again.');
                return;
            }
            const tokenConfig = SOLANA_TOKENS[assetSymbol];
            if (!tokenConfig) { alert('Invalid Solana payment asset.'); return; }

            let signature = '';
            try {
                await walletProvider.connect();
                if (walletProvider.publicKey?.toString() !== connectedWallet) {
                    throw new Error('Select the active Solana wallet in the payment provider before continuing.');
                }
                const payer = new solanaWeb3.PublicKey(walletProvider.publicKey.toString());
                if (!confirm(`Confirm purchase of ${quantity} account${quantity === 1 ? '' : 's'} for $${amount.toFixed(2)} ${assetSymbol} on Solana Mainnet?`)) return;

                const connection = new solanaWeb3.Connection(SOLANA_RPC_URL, 'confirmed');
                const mint = new solanaWeb3.PublicKey(tokenConfig.address);
                const treasury = new solanaWeb3.PublicKey(SOLANA_TREASURY_WALLET);
                const tokenProgram = new solanaWeb3.PublicKey(SOLANA_TOKEN_PROGRAM_ID);
                const associatedTokenProgram = new solanaWeb3.PublicKey(SOLANA_ASSOCIATED_TOKEN_PROGRAM_ID);
                const getAssociatedTokenAddress = owner => solanaWeb3.PublicKey.findProgramAddressSync([
                    owner.toBuffer(),
                    tokenProgram.toBuffer(),
                    mint.toBuffer()
                ], associatedTokenProgram)[0];
                const sourceTokenAccount = getAssociatedTokenAddress(payer);
                const destinationTokenAccount = getAssociatedTokenAddress(treasury);
                const [latestBlockhash, sourceInfo, destinationInfo] = await Promise.all([
                    connection.getLatestBlockhash('confirmed'),
                    connection.getAccountInfo(sourceTokenAccount, 'confirmed'),
                    connection.getAccountInfo(destinationTokenAccount, 'confirmed')
                ]);
                if (!sourceInfo) throw new Error(`The selected Solana wallet has no ${assetSymbol} token account.`);

                const transaction = new solanaWeb3.Transaction({
                    feePayer: payer,
                    recentBlockhash: latestBlockhash.blockhash
                });
                if (!destinationInfo) {
                    transaction.add(new solanaWeb3.TransactionInstruction({
                        programId: associatedTokenProgram,
                        keys: [
                            { pubkey: payer, isSigner: true, isWritable: true },
                            { pubkey: destinationTokenAccount, isSigner: false, isWritable: true },
                            { pubkey: treasury, isSigner: false, isWritable: false },
                            { pubkey: mint, isSigner: false, isWritable: false },
                            { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                            { pubkey: tokenProgram, isSigner: false, isWritable: false }
                        ],
                        data: new Uint8Array()
                    }));
                }

                const rawAmount = toTokenUnits(amount, tokenConfig.decimals);
                const transferData = new Uint8Array(10);
                transferData[0] = 12;
                new DataView(transferData.buffer).setBigUint64(1, rawAmount, true);
                transferData[9] = tokenConfig.decimals;
                transaction.add(new solanaWeb3.TransactionInstruction({
                    programId: tokenProgram,
                    keys: [
                        { pubkey: sourceTokenAccount, isSigner: false, isWritable: true },
                        { pubkey: mint, isSigner: false, isWritable: false },
                        { pubkey: destinationTokenAccount, isSigner: false, isWritable: true },
                        { pubkey: payer, isSigner: true, isWritable: false }
                    ],
                    data: transferData
                }));

                const result = await walletProvider.signAndSendTransaction(transaction);
                signature = typeof result === 'string' ? result : result?.signature;
                if (typeof signature !== 'string' || !signature) {
                    throw new Error('The Solana wallet did not return a transaction signature.');
                }
                const confirmation = await connection.confirmTransaction({
                    signature,
                    blockhash: latestBlockhash.blockhash,
                    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                }, 'finalized');
                if (confirmation.value.err) throw new Error('The Solana transaction failed on-chain.');

                const response = await walletFetch('/api/accounts/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wallet_address: connectedWallet,
                        plan_id: Number(planId),
                        quantity,
                        tx_hash: signature,
                        chain_id: 101,
                        payment_asset: assetSymbol,
                        payment_wallet_address: payer.toBase58(),
                        promo_code: activePromoCode,
                        disclaimer_version: DISCLAIMER_VERSION,
                        terms_accepted: true,
                        simulated_funds_acknowledged: true
                    })
                });
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Unable to verify the Solana payment.');
                }
                alert(data.message || `${quantity} account${quantity === 1 ? '' : 's'} provisioned successfully.`);
                await loadUserAccounts(connectedWallet);
                switchView('tradeView');
            } catch (error) {
                console.error('Solana purchase error:', error);
                alert(signature
                    ? `Payment transaction ${signature} was submitted, but account provisioning could not be completed: ${error.message}`
                    : error.message || 'Solana payment was cancelled or failed.');
            }
        }

        document.getElementById('support-ticket-form')?.addEventListener('submit', submitSupportTicket);
        document.getElementById('user-review-form')?.addEventListener('submit', submitUserReview);
        document.getElementById('creator-application-start')?.addEventListener('click', () => {
            const form = document.getElementById('creator-application-form');
            const button = document.getElementById('creator-application-start');
            if (form) form.hidden = false;
            if (button) button.hidden = true;
        });
        document.getElementById('creator-application-cancel')?.addEventListener('click', () => {
            const form = document.getElementById('creator-application-form');
            const button = document.getElementById('creator-application-start');
            if (form) form.hidden = true;
            if (button) button.hidden = false;
        });
        document.getElementById('creator-application-form')?.addEventListener('submit', submitCreatorApplication);
        document.getElementById('admin-creator-applications')?.addEventListener('click', event => {
            const button = event.target.closest('[data-creator-application-action]');
            const card = button?.closest('[data-creator-application-wallet]');
            if (button && card) {
                reviewCreatorApplication(
                    card.dataset.creatorApplicationWallet,
                    button.dataset.creatorApplicationAction,
                    card,
                    button
                );
            }
        });
        document.getElementById('admin-creator-search-form')?.addEventListener('submit', event => {
            event.preventDefault();
            loadAdminCreatorSearch(document.getElementById('admin-creator-search')?.value.trim() || '');
        });
        document.getElementById('admin-user-search-form')?.addEventListener('submit', event => {
            event.preventDefault();
            loadAdminUserSearch(document.getElementById('admin-user-search')?.value.trim() || '');
        });
        document.querySelectorAll('input[name="admin-battlepass-promotion-audience"]').forEach(input => {
            input.addEventListener('change', updateAdminBattlePassPromotionAudience);
        });
        document.getElementById('admin-battlepass-promotion-pack')?.addEventListener('change', invalidateAdminBattlePassPromotionRequest);
        document.getElementById('admin-battlepass-promotion-search-button')?.addEventListener('click', loadAdminBattlePassPromotionUsers);
        document.getElementById('admin-battlepass-promotion-search')?.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                loadAdminBattlePassPromotionUsers();
            }
        });
        document.getElementById('admin-battlepass-promotion-selected')?.addEventListener('click', event => {
            const button = event.target.closest('[data-remove-promo-recipient]');
            if (!button) return;
            adminBattlePassPromotionRecipients.delete(button.dataset.removePromoRecipient);
            invalidateAdminBattlePassPromotionRequest();
            renderAdminBattlePassPromotionSelection();
            loadAdminBattlePassPromotionUsers();
        });
        document.getElementById('admin-battlepass-promotion-issue')?.addEventListener('click', issueAdminBattlePassPromotion);
        document.getElementById('admin-plan-create-form')?.addEventListener('submit', event => {
            event.preventDefault();
            saveAdminPlan(event.currentTarget);
        });
        document.getElementById('admin-level-two-form')?.addEventListener('submit', event => {
            event.preventDefault();
            saveAdminLevelTwoRate(event.currentTarget);
        });
        document.getElementById('admin-maintenance-save')?.addEventListener('click', event => {
            saveAdminMaintenanceSettings(event.currentTarget);
        });
        document.getElementById('copy-group-create')?.addEventListener('click', () => startCopyGroupWizard());
        document.getElementById('copy-wizard-cancel')?.addEventListener('click', closeCopyGroupWizard);
        document.getElementById('copy-wizard-back')?.addEventListener('click', () => {
            if (!tradeCopyWizard) return;
            tradeCopyWizard.step = Math.max(1, tradeCopyWizard.step - 1);
            renderCopyGroupWizard();
        });
        document.getElementById('copy-wizard-next')?.addEventListener('click', () => {
            if (!tradeCopyWizard) return;
            const error = document.getElementById('copy-wizard-error');
            if (tradeCopyWizard.step === 1) {
                const leader = userAccounts.find(account => account.id === tradeCopyWizard.leaderId);
                if (!tradeCopyWizard.leaderId || isPermanentlyLockedCopyAccount(leader)) {
                    if (error) error.textContent = 'Choose an available, non-permanently locked leader account.';
                    return;
                }
                tradeCopyWizard.step = 2;
            } else if (tradeCopyWizard.step === 2) {
                const followers = Object.entries(tradeCopyWizard.followers);
                if (followers.some(([id]) => isPermanentlyLockedCopyAccount(userAccounts.find(account => account.id === id)))) {
                    if (error) error.textContent = 'Permanently locked accounts cannot be added as followers.';
                    return;
                }
                if (!followers.length || followers.some(([, pct]) => !Number.isFinite(Number(pct)) || Number(pct) <= 0)) {
                    if (error) error.textContent = 'Choose at least one follower and give each a positive size percentage.';
                    return;
                }
                tradeCopyWizard.step = 3;
            }
            renderCopyGroupWizard();
        });
        document.getElementById('copy-wizard-save')?.addEventListener('click', saveCopyGroup);
        document.getElementById('copy-wizard-content')?.addEventListener('change', event => {
            if (!tradeCopyWizard) return;
            const target = event.target;
            if (target.matches('input[name="copy-leader"]')) {
                tradeCopyWizard.leaderId = target.value;
                delete tradeCopyWizard.followers[target.value];
            } else if (target.matches('[data-copy-follower]')) {
                const accountId = target.dataset.copyFollower;
                if (target.checked) {
                    const input = document.querySelector(`[data-copy-size="${CSS.escape(accountId)}"]`);
                    tradeCopyWizard.followers[accountId] = Number(input?.value) || 100;
                    if (input) input.disabled = false;
                } else {
                    delete tradeCopyWizard.followers[accountId];
                    const input = document.querySelector(`[data-copy-size="${CSS.escape(accountId)}"]`);
                    if (input) input.disabled = true;
                }
            } else if (target.matches('[data-copy-size]')) {
                tradeCopyWizard.followers[target.dataset.copySize] = Number(target.value);
            }
            const error = document.getElementById('copy-wizard-error');
            if (error) error.textContent = '';
        });
        document.getElementById('copy-groups-container')?.addEventListener('click', handleCopyGroupAction);
        document.getElementById('copy-groups-container')?.addEventListener('change', handleCopyGroupAction);
        document.getElementById('copy-flatten-all')?.addEventListener('click', event => flattenCopyTrades(event.currentTarget));
        document.getElementById('admin-promo-code-form')?.addEventListener('submit', async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const button = form.querySelector('button[type="submit"]');
            const planId = Number(document.getElementById('admin-promo-plan')?.value);
            if (!planId) {
                const feedback = document.getElementById('admin-promo-feedback');
                if (feedback) feedback.textContent = 'Choose an account plan first.';
                return;
            }
            if (button) button.disabled = true;
            await createAdminPromoCode(planId);
            if (button) button.disabled = false;
        });
        document.getElementById('claim-free-account')?.addEventListener('click', claimFreeAccountCode);
        document.getElementById('review-account')?.addEventListener('change', renderSelectedUserReview);
        document.getElementById('user-ticket-list')?.addEventListener('click', event => {
            const button = event.target.closest('[data-user-ticket-reply]');
            const card = button?.closest('[data-ticket-id]');
            if (button && card) submitUserTicketReply(button.dataset.userTicketReply, card);
        });
        document.getElementById('refresh-user-tickets')?.addEventListener('click', async event => {
            const button = event.currentTarget;
            if (!connectedWallet) return;
            button.disabled = true;
            await loadUserTickets(connectedWallet);
            button.disabled = false;
        });
        document.getElementById('battlepass-profile-form')?.addEventListener('submit', saveBattlePassProfileImage);
        document.getElementById('battlepass-share')?.addEventListener('click', shareBattlePassProfile);
        document.getElementById('battlepass-claim-all')?.addEventListener('click', event => claimAllBattlePassTitles(event.currentTarget));
        document.getElementById('battlepass-user-content')?.addEventListener('click', event => {
            const tab = event.target.closest('[data-battlepass-tab]');
            const tabLink = event.target.closest('[data-battlepass-tab-link]');
            if (tab) selectBattlePassTab(tab.dataset.battlepassTab);
            if (tabLink) selectBattlePassTab(tabLink.dataset.battlepassTabLink);
        });
        document.querySelector('.battlepass-admin-shop')?.addEventListener('click', event => {
            const tab = event.target.closest('[data-battlepass-admin-tab]');
            if (!tab) return;
            document.querySelectorAll('[data-battlepass-admin-tab]').forEach(button => {
                const selected = button === tab;
                button.classList.toggle('active', selected);
                button.setAttribute('aria-selected', String(selected));
            });
            document.querySelectorAll('[data-battlepass-admin-panel]').forEach(panel => {
                panel.hidden = panel.dataset.battlepassAdminPanel !== tab.dataset.battlepassAdminTab;
            });
        });
        document.getElementById('admin-battlepass-add-pack-reward')?.addEventListener('click', () => addAdminBattlePassPackRewardRow());
        document.getElementById('admin-battlepass-pack-reset')?.addEventListener('click', resetAdminBattlePassPackForm);
        document.getElementById('admin-battlepass-reward-reset')?.addEventListener('click', resetAdminBattlePassRewardForm);
        document.getElementById('admin-battlepass-reward-type')?.addEventListener('change', updateAdminBattlePassRewardFields);
        document.getElementById('admin-battlepass-pack-form')?.addEventListener('submit', async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const rows = [...document.querySelectorAll('#admin-battlepass-pack-reward-rows .battlepass-admin-pool-row')];
            const rewards = rows.map(row => ({
                reward_id: Number(row.querySelector('[data-pack-reward-id]').value),
                odds: Number(row.querySelector('[data-pack-reward-odds]').value),
                max_drops: Number(row.querySelector('[data-pack-reward-cap]').value)
            }));
            const oddsTotal = getAdminPackOddsTotal(rewards);
            if (!rewards.length || rewards.some(reward => !reward.reward_id) || oddsTotal !== 100) {
                const feedback = document.getElementById('admin-battlepass-pack-feedback');
                if (feedback) feedback.textContent = `Reward odds must total exactly 100% (currently ${oddsTotal}%), and every row must select a reward.`;
                return;
            }
            const button = form.querySelector('button[type="submit"]');
            if (button) button.disabled = true;
            const packId = document.getElementById('admin-battlepass-pack-id').value;
            const success = await saveAdminBattlePassShop('/api/admin/battlepass/packs/save', {
                pack_id: packId ? Number(packId) : null,
                name: document.getElementById('admin-battlepass-pack-name').value.trim(),
                points_cost: Number(document.getElementById('admin-battlepass-pack-cost').value),
                active: document.getElementById('admin-battlepass-pack-active').checked,
                rewards
            }, 'admin-battlepass-pack-feedback');
            if (success) resetAdminBattlePassPackForm();
            if (button) button.disabled = false;
        });
        document.getElementById('admin-battlepass-reward-form')?.addEventListener('submit', async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const button = form.querySelector('button[type="submit"]');
            if (button) button.disabled = true;
            const rewardId = document.getElementById('admin-battlepass-reward-id').value;
            const success = await saveAdminBattlePassShop('/api/admin/battlepass/rewards/save', {
                reward_id: rewardId ? Number(rewardId) : null,
                name: document.getElementById('admin-battlepass-reward-name').value.trim(),
                description: document.getElementById('admin-battlepass-reward-description').value.trim(),
                reward_type: document.getElementById('admin-battlepass-reward-type').value,
                plan_id: document.getElementById('admin-battlepass-reward-plan').value || null,
                discount_pct: document.getElementById('admin-battlepass-reward-discount').value || null,
                xp_amount: Number(document.getElementById('admin-battlepass-reward-xp').value || 0),
                points_amount: Number(document.getElementById('admin-battlepass-reward-points').value || 0),
                quantity: Number(document.getElementById('admin-battlepass-reward-quantity').value),
                active: document.getElementById('admin-battlepass-reward-active').checked
            }, 'admin-battlepass-reward-feedback');
            if (success) resetAdminBattlePassRewardForm();
            if (button) button.disabled = false;
        });
        document.getElementById('admin-battlepass-settings-form')?.addEventListener('submit', event => {
            event.preventDefault();
            saveAdminBattlePass('/api/admin/battlepass/settings', {
                standard_discount_pct: Number(document.getElementById('admin-standard-discount').value)
            }, event.currentTarget.querySelector('button[type="submit"]'));
        });
        document.getElementById('admin-battlepass-task-form')?.addEventListener('submit', async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const feedback = document.getElementById('admin-battlepass-task-feedback');
            const button = form.querySelector('button[type="submit"]');
            const taskType = document.getElementById('admin-battlepass-task-type').value;
            const actionUrl = document.getElementById('admin-battlepass-task-url').value.trim();
            if (taskType === 'SOCIAL_CLICK' && !actionUrl) {
                if (feedback) feedback.textContent = 'Enter an action URL for a social task.';
                return;
            }
            if (feedback) feedback.textContent = '';
            if (button) button.disabled = true;
            const success = await saveAdminBattlePass('/api/admin/battlepass/tasks/save', {
                title: document.getElementById('admin-battlepass-task-title').value,
                description: document.getElementById('admin-battlepass-task-description').value,
                task_type: taskType,
                cadence: document.getElementById('admin-battlepass-task-cadence').value,
                action_url: actionUrl,
                xp_reward: Number(document.getElementById('admin-battlepass-task-xp').value),
                points_reward: Number(document.getElementById('admin-battlepass-task-points').value)
            }, button);
            if (success) {
                if (feedback) feedback.textContent = 'Task created.';
                form.reset();
                document.getElementById('admin-battlepass-task-xp').value = '100';
                document.getElementById('admin-battlepass-task-points').value = '10';
            }
        });
