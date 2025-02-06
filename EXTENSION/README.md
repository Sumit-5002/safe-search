# SafeSearch Kids Browser Extension

A secure and fun browsing experience for children with AI-powered safety features.

## Features

- **Content Filtering:** Real-time blocking of unsafe and adult content using OSID Blocklist API and RASO AI
- **AI-Powered Search Enhancement:** Safe search optimization for child-friendly results
- **Parental Control Panel:** Set time limits and manage browsing activity
- **AI Chatbot:** Kid-friendly assistant to answer questions and guide safe browsing
- **Interactive UI:** Child-friendly interface with animations and easy navigation
- **Cross-Browser Compatible:** Works with Chrome, Edge, Firefox, Opera, and Safari

## Installation

1. Clone this repository or download the ZIP file
2. Open your browser's extension management page:
   - Chrome: chrome://extensions
   - Edge: edge://extensions
   - Firefox: about:addons
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Development

### Prerequisites

- Modern web browser (Chrome, Edge, Firefox, Opera, or Safari)
- Basic knowledge of JavaScript, HTML, and CSS

### Project Structure

```
extension/
├── manifest.json           # Extension configuration
├── popup/                 # Extension popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/           # Background scripts
│   └── background.js
├── content/             # Content scripts
│   ├── content.js
│   └── content.css
└── assets/             # Images and icons
    └── icons/
```

### API Integration

The extension uses two main APIs:
- **OSID Blocklist API:** For website filtering and safety checks
- **RASO AI:** For content moderation and AI-powered features

### Building and Testing

1. Make changes to the source code
2. Reload the extension in your browser
3. Test the changes in a safe environment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security

- All API calls are made over HTTPS
- Content filtering runs in real-time
- Safe search is enforced
- Parental controls are password protected

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- OSID Blocklist API
- RASO AI for content moderation
- Icons and assets from various open-source projects
