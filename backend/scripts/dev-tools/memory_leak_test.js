const axios = require('axios');

async function testMemory() {
    console.log("🚀 Starting Memory Leak Audit...");
    const url = 'http://localhost:5000/api/products';
    
    // Print initial memory
    let memBefore = process.memoryUsage();
    console.log(`Initial Heap Used: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    console.log("Simulating 100 request cycles to /api/products...");
    for (let i = 0; i < 100; i++) {
        await axios.get(url).catch(() => {});
        if (i % 25 === 0) {
            let currentMem = process.memoryUsage();
            console.log(`  Cycle ${i}: Heap Used: ${(currentMem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        }
    }

    // Give time to settle and run GC if available
    await new Promise(r => setTimeout(r, 2000));
    
    let memAfter = process.memoryUsage();
    console.log(`Final Heap Used: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    const diff = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
    console.log(`Memory Difference: ${diff.toFixed(2)} MB`);
    if (diff > 15) {
        console.warn("⚠️ Memory growth exceeds 15MB, check for leaks.");
    } else {
        console.log("✅ Memory footprint stable.");
    }
}

testMemory();
