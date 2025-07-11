# Iris's KnowledgeMesh - Next.js MCP Server

## 🌟 MCP Server Implementation

Built with **Next.js App Router** following Vercel's recommended patterns.

### 1. MCP Endpoint

Your MCP server is available at: `https://iris-knowledge.vercel.app/api/mcp`

### 2. Cursor Configuration

Add this to your Cursor MCP settings:

\`\`\`json
{
  "mcpServers": {
    "iris": {
      "url": "https://iris-knowledge.vercel.app/api/mcp"
    }
  }
}
\`\`\`

### 3. Available Tools

- 🔍 **search_capsules** - Search your knowledge mesh
- ⏰ **get_recent_capsules** - Get recent inspirations  
- ✨ **create_capsule** - Add new capsules during chat
- 📊 **get_capsule_stats** - View mesh statistics

### 4. Implementation Details

- ✅ Next.js 14 App Router
- ✅ JSON-RPC 2.0 protocol compliance
- ✅ Proper error handling
- ✅ CORS support
- ✅ TypeScript support
- ✅ Direct Supabase integration

### 5. Testing

1. **GET /api/mcp** - Returns server info and available tools
2. **POST /api/mcp** - Handles MCP protocol messages
3. **OPTIONS /api/mcp** - CORS preflight support

## 🚀 Ready for AI Integration!

Your knowledge mesh is now accessible through the Model Context Protocol!
