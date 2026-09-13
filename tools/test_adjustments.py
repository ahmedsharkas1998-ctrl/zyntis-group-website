import subprocess
import time
import json
import urllib.request
import base64
import os
import websocket

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://localhost:8000/index.html"
USER_DATA = r"d:\side job\website dev\zyntis group\.edge_profile_adjustments"

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9229",
    "--remote-allow-origins=*",
    f"--user-data-dir={USER_DATA}",
    "--window-size=1920,1080",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--no-first-run",
    "--no-default-browser-check",
    URL
])

time.sleep(3)

try:
    req = urllib.request.urlopen("http://localhost:9229/json")
    tabs = json.loads(req.read().decode())
    page_tab = next(t for t in tabs if t.get('type') == 'page' and 'localhost:8000' in t.get('url', ''))
    ws = websocket.create_connection(page_tab['webSocketDebuggerUrl'])

    ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
    
    # 1. Capture Loader in pristine centered state
    ws.send(json.dumps({
        "id": 5,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """(() => {
                const ld = document.getElementById('loader');
                if (ld) {
                    ld.style.opacity = '1';
                    ld.style.visibility = 'visible';
                    const logo = ld.querySelector('.ld-logo');
                    if (logo) {
                        logo.style.webkitMaskImage = 'none';
                        logo.style.maskImage = 'none';
                    }
                }
            })()"""
        }
    }))
    time.sleep(0.5)
    
    ws.send(json.dumps({"id": 6, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == 6:
            out = os.path.join(r"d:\side job\website dev\zyntis group\test_screens", "adj_loader_centered.png")
            with open(out, "wb") as f:
                f.write(base64.b64decode(r["result"]["data"]))
            print("Captured adj_loader_centered.png")
            break

    # Dismiss loader and let 3D scene stabilize
    ws.send(json.dumps({
        "id": 7,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """(() => {
                const ld = document.getElementById('loader');
                if (ld) {
                    ld.style.opacity = '0';
                    ld.style.visibility = 'hidden';
                }
            })()"""
        }
    }))
    time.sleep(4.5)

    ws.send(json.dumps({
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """(() => {
                const ch2 = document.querySelector('[data-wp="2"]');
                const sys = document.getElementById('systems');
                return {
                    hero: 0,
                    ch2: ch2 ? ch2.offsetTop : 1800,
                    sys: sys ? sys.offsetTop : 6500
                };
            })()""",
            "returnByValue": True
        }
    }))
    while True:
        res = json.loads(ws.recv())
        if res.get("id") == 10:
            break
    data = res["result"]["result"]["value"]
    print("Positions:", data)

    snapshots = [
        ("adj_tree_hero_torches.png", data["hero"], 2.0),
        ("adj_philosophy_ch2.png", data["ch2"], 2.0),
        ("adj_systems_claim.png", data["sys"], 1.5)
    ]

    for idx, (name, pos, wait_sec) in enumerate(snapshots):
        ws.send(json.dumps({
            "id": 20 + idx,
            "method": "Runtime.evaluate",
            "params": {"expression": f"window.scrollTo(0, {pos}); if (window.lenis) window.lenis.scrollTo({pos}, {{ immediate: true }});"}
        }))
        time.sleep(wait_sec)
        
        # Trigger chapter fade-in and complete typewriters if needed
        ws.send(json.dumps({
            "id": 40 + idx,
            "method": "Runtime.evaluate",
            "params": {
                "expression": """(() => {
                    document.querySelectorAll('.chapter-copy').forEach(el => el.classList.add('in'));
                    const claims = [
                        'AI is the leverage, not the product.',
                        "A chatbot that doesn't connect is a dead end.",
                        'The expensive mistakes happen before the first line of code.',
                        'Your system should run without us.'
                    ];
                    document.querySelectorAll('.belief').forEach((b, i) => {
                        const claim = b.querySelector('.b-claim');
                        if (claim && claims[i]) claim.innerHTML = '<span class="tw-text">' + claims[i] + '</span>';
                        const text = b.querySelector('.b-text');
                        if (text) text.style.opacity = '1';
                    });
                })()"""
            }
        }))
        time.sleep(1.5);

        ws.send(json.dumps({"id": 30 + idx, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == 30 + idx:
                out = os.path.join(r"d:\side job\website dev\zyntis group\test_screens", name)
                with open(out, "wb") as f:
                    f.write(base64.b64decode(r["result"]["data"]))
                print(f"Captured {name}")
                break

    ws.close()
finally:
    proc.terminate()
