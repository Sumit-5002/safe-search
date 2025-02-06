document.addEventListener('DOMContentLoaded', function() {
    // Initialize protection toggle
    const protectionToggle = document.getElementById('protection-toggle');
    
    // Load saved state
    chrome.storage.sync.get(['protectionEnabled'], function(result) {
        protectionToggle.checked = result.protectionEnabled !== false;
    });

    // Handle protection toggle
    protectionToggle.addEventListener('change', function() {
        chrome.storage.sync.set({ protectionEnabled: this.checked });
        updateMascotMessage(this.checked ? 
            "Yay! I'm keeping you safe! 🛡️" : 
            "Oh no! Please turn on protection to stay safe! 🙏");
    });

    // Feature buttons handlers
    document.getElementById('parentalControl').addEventListener('click', function() {
        chrome.tabs.create({ url: 'pages/parental-control.html' });
    });

    document.getElementById('aiChat').addEventListener('click', function() {
        chrome.tabs.create({ url: 'pages/ai-chat.html' });
    });

    document.getElementById('timeManager').addEventListener('click', function() {
        chrome.tabs.create({ url: 'pages/time-manager.html' });
    });

    document.getElementById('settings').addEventListener('click', function() {
        chrome.tabs.create({ url: 'pages/settings.html' });
    });

    // Mascot messages
    const mascotMessages = [
        "Remember to take breaks every hour! 🌟",
        "Stay safe and have fun learning! 📚",
        "If something looks unsafe, tell a grown-up! 🤝",
        "I'm here to help you explore safely! 🚀"
    ];

    function updateMascotMessage(message) {
        document.getElementById('mascot-message').textContent = message;
    }

    // Change mascot message every 30 seconds
    setInterval(() => {
        const randomMessage = mascotMessages[Math.floor(Math.random() * mascotMessages.length)];
        updateMascotMessage(randomMessage);
    }, 30000);
});
