// Configuration
const PHISHTANK_FEED = 'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt';
const MALWARE_DOMAINS = 'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/malware-domains.txt';
const ADULT_DOMAINS = 'https://raw.githubusercontent.com/cbuijs/ut1/master/adult/domains';

// Initialize the extension
chrome.runtime.onInstalled.addListener(async () => {
    // Initialize storage with default values
    await chrome.storage.sync.set({
        protectionEnabled: true,
        filterLevel: 'strict',
        timeLimit: 7200, // 2 hours default
        blockedSites: [],
        lastUpdate: 0,
        blockList: new Set() // For caching blocked domains
    });

    // Set up initial rules and blocklists
    await initializeBlocklists();
    // Update blocklists every 12 hours
    setInterval(initializeBlocklists, 12 * 60 * 60 * 1000);
});

// Initialize and update blocklists
async function initializeBlocklists() {
    try {
        const { lastUpdate } = await chrome.storage.sync.get('lastUpdate');
        const now = Date.now();
        
        // Only update if more than 12 hours have passed
        if (now - lastUpdate < 12 * 60 * 60 * 1000) {
            console.log('Using cached blocklists');
            return;
        }

        console.log('Updating blocklists...');
        const blockList = new Set();

        // Fetch and process PhishTank domains
        const phishResponse = await fetch(PHISHTANK_FEED);
        if (phishResponse.ok) {
            const text = await phishResponse.text();
            const domains = text.split('\n').filter(Boolean);
            domains.forEach(domain => blockList.add(domain.trim()));
        }

        // Fetch and process malware domains
        const malwareResponse = await fetch(MALWARE_DOMAINS);
        if (malwareResponse.ok) {
            const text = await malwareResponse.text();
            const domains = text.split('\n').filter(Boolean);
            domains.forEach(domain => blockList.add(domain.trim()));
        }

        // Fetch and process adult domains
        const adultResponse = await fetch(ADULT_DOMAINS);
        if (adultResponse.ok) {
            const text = await adultResponse.text();
            const domains = text.split('\n')
                .filter(line => !line.startsWith('#') && line.trim())
                .map(line => line.trim());
            domains.forEach(domain => blockList.add(domain));
        }

        // Update storage
        await chrome.storage.sync.set({
            blockList: Array.from(blockList),
            lastUpdate: now
        });

        console.log(`Updated blocklists with ${blockList.size} domains`);
        await updateDynamicRules(blockList);
    } catch (error) {
        console.error('Error updating blocklists:', error);
    }
}

// Helper function to convert domain to rule
function domainToRule(domain, id) {
    return {
        id,
        priority: 1,
        action: { type: 'block' },
        condition: {
            urlFilter: `||${domain}`,
            resourceTypes: ['main_frame', 'sub_frame']
        }
    };
}

// Update dynamic rules
async function updateDynamicRules(blockList) {
    try {
        const { protectionEnabled } = await chrome.storage.sync.get('protectionEnabled');
        
        if (!protectionEnabled) {
            await removeAllRules();
            return;
        }

        // Convert domains to rules
        const rules = Array.from(blockList).map((domain, index) => 
            domainToRule(domain, index + 1)
        );

        // Update rules in chunks to stay within limits
        const CHUNK_SIZE = 1000; // Chrome has a limit on number of rules
        for (let i = 0; i < rules.length; i += CHUNK_SIZE) {
            const chunk = rules.slice(i, i + CHUNK_SIZE);
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: chunk.map(rule => rule.id),
                addRules: chunk
            });
        }

        console.log(`Updated ${rules.length} blocking rules`);
    } catch (error) {
        console.error('Error updating rules:', error);
    }
}

// Remove all dynamic rules
async function removeAllRules() {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = rules.map(rule => rule.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds,
        addRules: []
    });
}

// Check if a URL is safe
async function checkUrl(url) {
    try {
        const domain = new URL(url).hostname;
        const { blockList } = await chrome.storage.sync.get('blockList');

        // Check if domain is in blocklist
        if (blockList.includes(domain)) {
            return { 
                safe: false, 
                reason: 'Domain is in blocklist'
            };
        }

        // Check parent domains
        const parts = domain.split('.');
        for (let i = 0; i < parts.length - 1; i++) {
            const parentDomain = parts.slice(i).join('.');
            if (blockList.includes(parentDomain)) {
                return { 
                    safe: false, 
                    reason: 'Parent domain is in blocklist'
                };
            }
        }

        // Also check for keyword matches in the URL
        const unsafeKeywords = [
            'adult', 'porn', 'xxx', 'sex', 'gambling', 'casino', 'bet',
            'drugs', 'warez', 'crack', 'hack', 'pirate', 'torrent'
        ];

        const urlLower = url.toLowerCase();
        const matchedKeyword = unsafeKeywords.find(keyword => urlLower.includes(keyword));
        if (matchedKeyword) {
            return {
                safe: false,
                reason: `URL contains unsafe keyword: ${matchedKeyword}`
            };
        }

        return { safe: true, reason: 'URL passed all checks' };
    } catch (error) {
        console.error('Error checking URL:', error);
        return { safe: false, reason: 'Error checking safety' };
    }
}

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'CHECK_URL':
            checkUrl(request.url).then(sendResponse);
            return true;
        case 'UPDATE_SETTINGS':
            handleSettingsUpdate(request.settings).then(sendResponse);
            return true;
        case 'GET_STATS':
            getUsageStats().then(sendResponse);
            return true;
        case 'UPDATE_BLOCKLISTS':
            initializeBlocklists().then(sendResponse);
            return true;
    }
});

// Update settings
async function handleSettingsUpdate(settings) {
    try {
        await chrome.storage.sync.set(settings);
        if ('protectionEnabled' in settings) {
            await updateDynamicRules(settings.protectionEnabled);
        }
        return { success: true };
    } catch (error) {
        console.error('Error updating settings:', error);
        return { success: false, error: error.message };
    }
}

// Get usage stats
async function getUsageStats() {
    try {
        const { blockList, timeLimit } = await chrome.storage.sync.get(['blockList', 'timeLimit']);
        return {
            blockedDomainsCount: blockList.length,
            timeLimit,
            lastUpdate: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting usage stats:', error);
        return null;
    }
}

// Time tracking
let sessionStart = Date.now();
let activeTab = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    activeTab = tab;
    updateTimeTracking();
});

function updateTimeTracking() {
    chrome.storage.sync.get(['timeLimit'], function(data) {
        const timeSpent = (Date.now() - sessionStart) / 1000;
        if (timeSpent >= data.timeLimit) {
            chrome.tabs.create({
                url: 'pages/time-limit.html'
            });
        }
    });
}
