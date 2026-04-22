(async()=>{
  try{
    const body = {
      email: `smoke+${Date.now()}@example.com`,
      password: 'Test1234',
      firstName: 'Smoke',
      lastName: 'Test'
    };

    const res = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    console.log('STATUS', res.status);
    const text = await res.text();
    try {
      console.log(JSON.parse(text));
    } catch (e) {
      console.log(text);
    }
  } catch (err) {
    console.error('ERROR', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
