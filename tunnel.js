const { spawn } = require('child_process');

console.log('[Cloudflare Tunnel] Starting tunnel for http://localhost:8000...');
const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:8000']);

tunnel.stdout.on('data', data => {
  const output = data.toString();
  console.log(output);
  const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    console.log('==============================================');
    console.log(`LIVE GATEWAY HUB URL: ${match[0]}`);
    console.log('==============================================');
  }
});
tunnel.stderr.on('data', data => console.error(data.toString()));
