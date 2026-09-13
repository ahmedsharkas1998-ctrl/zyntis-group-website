import subprocess
import time
import json
import urllib.request
import os

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://localhost:8000/index.html"
USER_DATA = r"d:\side job\website dev\zyntis group\.edge_profile"

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9222",
    f"--user-data-dir={USER_DATA}",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    URL
])

time.sleep(3)

try:
    req = urllib.request.urlopen("http://localhost:9222/json")
    tabs = json.loads(req.read().decode())
    print("Open tabs:", tabs)
except Exception as e:
    print("Error connecting to CDP:", e)
finally:
    proc.terminate()
