const { spawn } = require('child_process');

function measureStartupTime() {
  console.log('Measuring Electron app startup time...');
  
  const startTime = Date.now();
  
  const electronProcess = spawn('npm', ['run', 'electron'], {
    stdio: 'pipe'
  });
  
  electronProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('DOM is ready') || output.includes('Page finished loading')) {
      const endTime = Date.now();
      const startupTime = endTime - startTime;
      console.log(`🚀 Startup time: ${startupTime}ms`);
      electronProcess.kill();
    }
  });
  
  electronProcess.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });
  
  electronProcess.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
  });
  
  // Kill after 10 seconds if not responsive
  setTimeout(() => {
    electronProcess.kill();
    console.log('❌ Timeout - app took too long to start');
  }, 10000);
}

measureStartupTime(); 