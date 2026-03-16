/**
 * Test OpenClaw AIP Plugin
 * 
 * This test demonstrates how the plugin works
 */

const AIPPlugin = require('./dist/index').default;

async function test() {
  console.log('🧪 Testing OpenClaw AIP Plugin\n');
  
  // Create plugin instance
  const plugin = new AIPPlugin();
  
  console.log(`Plugin: ${plugin.name} v${plugin.version}`);
  
  // Initialize with mock config
  const mockContext = {
    config: {
      plugins: {
        aip: {
          client: {
            enabled: false, // Don't actually connect in test
          },
          server: {
            enabled: false, // Don't actually start server in test
          },
        },
      },
    },
  };
  
  await plugin.initialize(mockContext);
  console.log('✅ Plugin initialized\n');
  
  // Get available tools
  const tools = plugin.getTools();
  console.log(`📦 Available tools (${tools.length}):`);
  tools.forEach((tool) => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
  console.log();
  
  // Get tool handlers
  const handlers = plugin.getToolHandlers();
  console.log(`🔧 Tool handlers: ${Object.keys(handlers).join(', ')}\n`);
  
  // Shutdown
  await plugin.shutdown();
  console.log('✅ Plugin shutdown complete');
  
  console.log('\n🎉 All tests passed!');
}

test().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
