import subprocess
import time
import json
import urllib.request
import base64
import os
import websocket

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://localhost:8000/index.html"
USER_DATA = r"d:\side job\website dev\zyntis group\.edge_profile_sys"

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9223",
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
    req = urllib.request.urlopen("http://localhost:9223/json")
    tabs = json.loads(req.read().decode())
    page_tab = next(t for t in tabs if t.get('type') == 'page' and 'localhost:8000' in t.get('url', ''))
    ws_url = page_tab['webSocketDebuggerUrl']
    ws = websocket.create_connection(ws_url)

    ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Page.enable"}))
    time.sleep(2)

    eval_cmd = {
        "id": 10,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """(() => {
                const el = document.getElementById('system-architecture');
                const box = el.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return {
                    top: box.top + scrollTop,
                    height: el.offsetHeight,
                    winHeight: window.innerHeight
                };
            })()""",
            "returnByValue": True
        }
    }
    ws.send(json.dumps(eval_cmd))
    res = json.loads(ws.recv())
    while res.get("id") != 10:
        res = json.loads(ws.recv())

    print("Eval result:", res)
    if "exceptionDetails" in res.get("result", {}):
        raise RuntimeError(res["result"]["exceptionDetails"])
    data = res["result"]["result"]["value"]
    print("Section bounds:", data)

    top = data["top"]
    h = data["height"] - data["winHeight"]

    os.makedirs(r"d:\side job\website dev\zyntis group\test_screens", exist_ok=True)

    steps = [
        (0.00, "sys_p00_ambient.png"),
        (0.20, "sys_p20_core_gather.png"),
        (0.45, "sys_p45_upper_spheres.png"),
        (0.70, "sys_p70_mid_spheres.png"),
        (0.95, "sys_p95_complete.png")
    ]

    for p, fname in steps:
        target_scroll = top + h * p
        ws.send(json.dumps({
            "id": 50,
            "method": "Runtime.evaluate",
            "params": {"expression": f"window.scrollTo(0, {target_scroll}); if (window.lenis) window.lenis.scrollTo({target_scroll}, {{ immediate: true }});"}
        }))
        time.sleep(1.0)
        ws.send(json.dumps({"id": 60, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == 60:
                img = base64.b64decode(r["result"]["data"])
                out_path = os.path.join(r"d:\side job\website dev\zyntis group\test_screens", fname)
                with open(out_path, "wb") as f:
                    f.write(img)
                print(f"Saved {fname} at progress {p*100:.0f}% (scroll {target_scroll})")
                break

    ws.close()
finally:
    proc.terminate()
