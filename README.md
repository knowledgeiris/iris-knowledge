# Iris Inner Cosmo - MCP Server Setup

## 🌟 Quick Setup Guide

### 1. MCP Server Configuration

Your MCP server is ready at: `/api/mcp`

### 2. Cursor Configuration

Add this to your Cursor MCP settings:

\`\`\`json
{
  "mcpServers": {
    "iris-inner-cosmo": {
      "url": "https://your-domain.vercel.app/api/mcp"
    }
  }
}
\`\`\`

### 3. Available Tools

- 🔍 **search_capsules** - Search your knowledge base
- ⏰ **get_recent_capsules** - Get recent inspirations  
- 🏷️ **get_capsules_by_tag** - Find capsules by tags
- ✨ **create_capsule** - Add new capsules during chat
- 📊 **get_capsule_stats** - View statistics

### 4. Troubleshooting

If tools don't load in Cursor:

1. **Check the endpoint**: Visit `/api/mcp` to verify server status
2. **Verify configuration**: Ensure the URL is correct in Cursor settings
3. **Restart Cursor**: Close and reopen Cursor after configuration changes
4. **Check logs**: Monitor browser console for any errors

### 5. MCP Protocol Compliance

The server implements:
- ✅ JSON-RPC 2.0 protocol
- ✅ Standard MCP methods (`initialize`, `tools/list`, `tools/call`)
- ✅ Proper error handling
- ✅ CORS support
- ✅ Protocol version 2024-11-05

## 🚀 Your Knowledge Universe Awaits!

Your Iris Inner Cosmo is now ready to enhance your conversations with captured knowledge!
