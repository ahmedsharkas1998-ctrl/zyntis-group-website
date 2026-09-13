import subprocess
import time
import json
import urllib.request
import base64
import os
import websocket

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://localhost:8000/index.html"
USER_DATA = r"d:\side job\website dev\zyntis group\.edge_profile_sys768"

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9225",
    "--remote-allow-origins=*",
    f"--user-data-dir={USER_DATA}",
    "--window-size=1366,768",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--no-first-run",
    "--no-default-browser-check",
    URL
])

time.sleep(3)

try:
    req = urllib.request.urlopen("http://localhost:9225/json")
    tabs = json.loads(req.read().decode())
    page_tab = next(t for t in tabs if t.get('type') == 'page' and 'localhost:8000' in t.get('url', ''))
    ws = websocket.create_connection(page_tab['webSocketDebuggerUrl'])

    ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
    time.sleep(2)

    ws.send(json.dumps({
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """(() => {
                const el = document.getElementById('system-architecture');
                const box = el.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return { top: box.top + scrollTop, height: el.offsetHeight, winHeight: window.innerHeight };
            })()""",
            "returnByValue": True
        }
    }))
    res = json.loads(ws.recv())
    while res.get("id") != 10:
        res = json.loads(ws.recv())

    d = res["result"]["result"]["value"]
    print("Bounds 768p:", d)
    target = d["top"] + (d["height"] - d["winHeight"]) * 0.95

    ws.send(json.dumps({
        "id": 20,
        "method": "Runtime.evaluate",
        "params": {"expression": f"window.scrollTo(0, {target}); if (window.lenis) window.lenis.scrollTo({target}, {{ immediate: true }});"}
    }))
    time.sleep(1.2)

    ws.send(json.dumps({"id": 30, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == 30:
            out_file = r"d:\side job\website dev\zyntis group\test_screens\sys_768p_complete.png"
            with open(out_file, "wb") as f:
                f.write(base64.b64decode(r["result"]["data"]))
            print("Successfully saved sys_768p_complete.png")
            break

    ws.close()
finally:
    proc.terminate()
