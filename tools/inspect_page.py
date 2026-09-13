import subprocess
import time
import json
import urllib.request
import base64
import os
import websocket

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://localhost:8000/index.html"
USER_DATA = r"d:\side job\website dev\zyntis group\.edge_profile"

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    f"--user-data-dir={USER_DATA}",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--no-first-run",
    "--no-default-browser-check",
    URL
])

time.sleep(3)

try:
    req = urllib.request.urlopen("http://localhost:9222/json")
    tabs = json.loads(req.read().decode())
    page_tab = next(t for t in tabs if t.get('type') == 'page' and 'localhost:8000' in t.get('url', ''))
    ws_url = page_tab['webSocketDebuggerUrl']
    print(f"Connecting to CDP: {ws_url}")

    ws = websocket.create_connection(ws_url)

    # Enable console & runtime
    ws.send(json.dumps({"id": 1, "method": "Console.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
    ws.send(json.dumps({"id": 3, "method": "Page.enable"}))

    time.sleep(3)

    # Check for console errors & evaluation
    eval_cmd = {
        "id": 4,
        "method": "Runtime.evaluate",
        "params": {
            "expression": """({
                title: document.title,
                ready: window.__zyntisReady,
                offsets: {
                    capabilities: document.getElementById('capabilities').offsetTop,
                    systems: document.getElementById('systems').offsetTop,
                    arch: document.getElementById('system-architecture').offsetTop,
                    archHeight: document.getElementById('system-architecture').offsetHeight,
                    insights: document.getElementById('insights').offsetTop,
                    footer: document.getElementById('footer').offsetTop
                }
            })""",
            "returnByValue": True
        }
    }
    ws.send(json.dumps(eval_cmd))
    
    offsets = {}
    while True:
        res = json.loads(ws.recv())
        if res.get("id") == 4:
            val = res.get("result", {}).get("value", {})
            print("Offsets:", json.dumps(val, indent=2))
            offsets = val.get("offsets", {})
            break

    def snap(scroll_y, filename):
        ws.send(json.dumps({
            "id": 100,
            "method": "Runtime.evaluate",
            "params": {"expression": f"window.scrollTo(0, {scroll_y}); if (window.lenis) window.lenis.scrollTo({scroll_y}, {{ immediate: true }});"}
        }))
        time.sleep(1.2)
        ws.send(json.dumps({"id": 101, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == 101:
                img = base64.b64decode(r["result"]["data"])
                path = os.path.join(r"d:\side job\website dev\zyntis group\test_screens", filename)
                with open(path, "wb") as f:
                    f.write(img)
                print(f"Captured {filename} at scroll {scroll_y}")
                break

    # 1. Capabilities Section
    cap_top = offsets.get("capabilities", 7000)
    snap(cap_top + 100, "view_capabilities_cards.png")

    # 2. What We Build
    sys_top = offsets.get("systems", 8000)
    snap(sys_top + 100, "view_what_we_build.png")

    # 3. System Architecture Progressions
    arch_top = offsets.get("arch", 9500)
    arch_h = offsets.get("archHeight", 3400)
    snap(arch_top + int(arch_h * 0.18), "view_arch_01_core_converging.png")
    snap(arch_top + int(arch_h * 0.45), "view_arch_02_spheres_emerging.png")
    snap(arch_top + int(arch_h * 0.85), "view_arch_03_fully_formed.png")

    # 4. Insights
    ins_top = offsets.get("insights", 13000)
    snap(ins_top + 100, "view_insights.png")

    # 5. Footer
    ft_top = offsets.get("footer", 14500)
    snap(ft_top + 100, "view_footer.png")

    ws.close()
except Exception as e:
    print("Error during inspection:", e)
finally:
    proc.terminate()
