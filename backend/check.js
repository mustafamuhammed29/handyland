fetch('https://front-end-rho-five-94.vercel.app/').then(r=>r.text()).then(t=>{
  const match = t.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if(match) {
    const url = 'https://front-end-rho-five-94.vercel.app' + match[1];
    fetch(url).then(r=>r.text()).then(js=>{
      console.log("Includes error.response?.data:", js.includes("error.response?.data"));
      console.log("Includes /api/maintenance-info:", js.includes("/api/maintenance-info"));
      console.log("Includes window.location.href='/':", js.includes("window.location.href=\"/\"") || js.includes("window.location.href='/'"));
    });
  } else {
    console.log("No match found");
  }
});
