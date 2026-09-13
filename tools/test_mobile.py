import subprocess
import time
import json
import urllib.request
import base64
import os
import websocket

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
USER_DATA = r"d:\side job\website dev\zyntis group\.edge_profile_mobile"
OUTPUT_DIR = r"d:\side job\website dev\zyntis group\test_screens"

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9224",
    "--remote-allow-origins=*",
    f"--user-data-dir={USER_DATA}",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--window-size=390,844",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/index.html"
])

time.sleep(3)

try:
    req = urllib.request.urlopen("http://localhost:9224/json")
    tabs = json.loads(req.read().decode())
    page_tab = next(t for t in tabs if t.get('type') == 'page' and 'localhost:8000' in t.get('url', ''))
    ws = websocket.create_connection(page_tab['webSocketDebuggerUrl'])

    ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))

    time.sleep(3.0)

    # 1. Mobile Hero
    ws.send(json.dumps({"id": 10, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        res = json.loads(ws.recv())
        if res.get("id") == 10:
            with open(os.path.join(OUTPUT_DIR, "mobile_01_hero.png"), "wb") as f:
                f.write(base64.b64decode(res["result"]["data"]))
            print("Captured mobile_01_hero.png")
            break

    # 3. Mobile System Architecture
    ws.send(json.dumps({
        "id": 30,
        "method": "Runtime.evaluate",
        "params": {
            "expression": "document.getElementById('system-architecture').scrollIntoView();"
        }
    }))
    time.sleep(1.0)
    ws.send(json.dumps({"id": 31, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        res = json.loads(ws.recv())
        if res.get("id") == 31:
            with open(os.path.join(OUTPUT_DIR, "mobile_03_system.png"), "wb") as f:
                f.write(base64.b64decode(res["result"]["data"]))
            print("Captured mobile_03_system.png")
            break

    ws.close()
except Exception as e:
    print("Error during mobile test:", e)
finally:
    proc.terminate()
