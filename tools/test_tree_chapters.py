import subprocess
import time
import json
import urllib.request
import base64
import os
import websocket

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://localhost:8000/index.html"
USER_DATA = r"d:\side job\website dev\zyntis group\.edge_profile_tree_diag"

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9227",
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
    req = urllib.request.urlopen("http://localhost:9227/json")
    tabs = json.loads(req.read().decode())
    page_tab = next(t for t in tabs if t.get('type') == 'page' and 'localhost:8000' in t.get('url', ''))
    ws = websocket.create_connection(page_tab['webSocketDebuggerUrl'])

    ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
    time.sleep(5.5)

    ws.send(json.dumps({
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """(() => {
                const s1 = document.getElementById('step-1');
                const s2 = document.getElementById('step-2');
                const s3 = document.getElementById('step-3');
                return {
                    hero: 0,
                    step1: s1 ? s1.offsetTop : 3000,
                    step2: s2 ? s2.offsetTop : 4000,
                    step3: s3 ? s3.offsetTop : 5000
                };
            })()""",
            "returnByValue": True
        }
    }))
    res = json.loads(ws.recv())
    while res.get("id") != 10:
        res = json.loads(ws.recv())
    data = res["result"]["result"]["value"]
    print("Positions:", data)

    snapshots = [
        ("tree_hero.png", data["hero"]),
        ("tree_step1_diagnose.png", data["step1"]),
        ("tree_step2_architect.png", data["step2"]),
        ("tree_step3_deploy.png", data["step3"])
    ]

    for name, pos in snapshots:
        ws.send(json.dumps({
            "id": 20,
            "method": "Runtime.evaluate",
            "params": {"expression": f"window.scrollTo(0, {pos}); if (window.lenis) window.lenis.scrollTo({pos}, {{ immediate: true }});"}
        }))
        time.sleep(1.5)
        ws.send(json.dumps({"id": 30, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == 30:
                out = os.path.join(r"d:\side job\website dev\zyntis group\test_screens", name)
                with open(out, "wb") as f:
                    f.write(base64.b64decode(r["result"]["data"]))
                print(f"Captured {name}")
                break

    ws.close()
finally:
    proc.terminate()
