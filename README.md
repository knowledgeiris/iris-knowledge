# Iris Inner Cosmo - Vercel MCP Server

## 🌟 Quick Setup Guide

### 1. MCP Server Configuration

Your MCP server is ready at: `/api/server`
Built with **@vercel/mcp-adapter** for optimal performance.

### 2. Cursor Configuration

Add this to your Cursor MCP settings:

\`\`\`json
{
  "mcpServers": {
    "iris-inner-cosmo": {
      "url": "https://your-domain.vercel.app/api/server"
    }
  }
}
\`\`\`

### 3. Available Tools

- 🏷️ **search_capsules_by_tags** - 按标签搜索胶囊
- 🔍 **search_capsules_by_content** - 按内容搜索胶囊
- ⏰ **get_recent_capsules** - 获取最近的胶囊
- ✨ **create_capsule** - 创建新的灵感胶囊
- 📊 **get_capsule_stats** - 查看知识库统计

### 4. Features

- ✅ Vercel MCP Adapter integration
- ✅ Zod schema validation
- ✅ Pagination support
- ✅ Comprehensive error handling
- ✅ TypeScript support
- ✅ Service layer architecture

### 5. Troubleshooting

If tools don't load in Cursor:

1. **Check the endpoint**: Visit `/api/server` to verify server status
2. **Verify configuration**: Ensure the URL is correct in Cursor settings
3. **Restart Cursor**: Close and reopen Cursor after configuration changes
4. **Check logs**: Monitor Vercel function logs for any errors

## 🚀 Your Knowledge Universe Awaits!

Your Iris Inner Cosmo is now powered by Vercel's MCP adapter for seamless AI integration!
