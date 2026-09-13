import subprocess
import time
import json
import urllib.request
import base64
import os
import websocket

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
USER_DATA = r"d:\side job\website dev\zyntis group\.edge_profile_scroll"
OUTPUT_DIR = r"d:\side job\website dev\zyntis group\test_screens"
os.makedirs(OUTPUT_DIR, exist_ok=True)

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9223",
    "--remote-allow-origins=*",
    f"--user-data-dir={USER_DATA}",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--window-size=1920,1080",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/index.html"
])

time.sleep(3)

def capture_at_scroll(ws, scroll_y, filename, wait_before=1.0):
    eval_scroll = {
        "id": 100,
        "method": "Runtime.evaluate",
        "params": {
            "expression": f"window.scrollTo(0, {scroll_y}); if (window.lenis) window.lenis.scrollTo({scroll_y}, {{ immediate: true }});"
        }
    }
    ws.send(json.dumps(eval_scroll))
    time.sleep(wait_before)
    
    ws.send(json.dumps({"id": 101, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
    while True:
        res = json.loads(ws.recv())
        if res.get("id") == 101:
            data = base64.b64decode(res["result"]["data"])
            path = os.path.join(OUTPUT_DIR, filename)
            with open(path, "wb") as f:
                f.write(data)
            print(f"Captured {filename}")
            break

try:
    req = urllib.request.urlopen("http://localhost:9223/json")
    tabs = json.loads(req.read().decode())
    page_tab = next(t for t in tabs if t.get('type') == 'page' and 'localhost:8000' in t.get('url', ''))
    ws = websocket.create_connection(page_tab['webSocketDebuggerUrl'])

    ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
    ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))

    time.sleep(3.5) # Wait for intro animation

    # 1. Hero
    capture_at_scroll(ws, 0, "01_hero.png", wait_before=1.2)
    # 2. Problem
    capture_at_scroll(ws, 1080, "02_problem.png", wait_before=1.0)
    # 3. Beliefs
    capture_at_scroll(ws, 2160, "03_beliefs.png", wait_before=1.0)
    # 4. How We Work
    capture_at_scroll(ws, 3240, "04_how_we_work.png", wait_before=1.0)
    # 5. Capabilities
    capture_at_scroll(ws, 7600, "05_capabilities.png", wait_before=1.0)
    # 6. What We Build
    capture_at_scroll(ws, 8700, "06_what_we_build.png", wait_before=1.0)
    # 7. The System — Early Convergence
    capture_at_scroll(ws, 10300, "07_the_system_early.png", wait_before=1.0)
    # 7b. The System — Fully Formed
    capture_at_scroll(ws, 12200, "07b_the_system_formed.png", wait_before=1.0)
    # 8. Insights
    capture_at_scroll(ws, 13400, "08_insights.png", wait_before=1.0)
    # 9. Footer
    capture_at_scroll(ws, 14600, "09_footer.png", wait_before=1.0)

    # 10. Contact Page
    ws.send(json.dumps({
        "id": 200,
        "method": "Page.navigate",
        "params": {"url": "http://localhost:8000/contact.html"}
    }))
    time.sleep(2.0)
    capture_at_scroll(ws, 0, "10_contact_page.png", wait_before=0.5)

    ws.close()
except Exception as e:
    print("Error during test_scroll_all:", e)
finally:
    proc.terminate()
