# CareMate - KidBright32 iP (ESP32) medication reminder box
# MicroPython firmware  +  WiFi provisioning ผ่านมือถือ (captive portal)
# -------------------------------------------------------------------
# แฟลชครั้งเดียว ไม่ต้องแก้โค้ด WiFi อีก!
#   - เปิดครั้งแรก / ต่อ WiFi ไม่ได้  -> กล่องปล่อย WiFi "CareMate-Setup"
#     ผู้ใช้ต่อจากมือถือ กรอกชื่อ+รหัส WiFi บ้าน และ DEVICE_KEY ในหน้าเว็บ
#   - กล่องเซฟค่าลงไฟล์เอง แล้วรีสตาร์ตต่อ WiFi ทำงาน
#   - อยากตั้ง WiFi ใหม่: กดปุ่ม S2 ค้างไว้ตอนเปิดเครื่อง
# -------------------------------------------------------------------
import network
import time
import machine
import ujson
import socket
import select
try:
    import urequests as requests
except ImportError:
    import requests

# ============ ค่าคงที่ (ไม่ต้องแก้) ============
SUPABASE_URL = "https://kxsujkyxuxierctfatpu.supabase.co"
CONFIG_FILE = "caremate_cfg.json"
AP_SSID = "CareMate-Setup"
AP_PASSWORD = ""          # ว่าง = WiFi ตั้งค่าแบบเปิด (ต่อง่าย)
AP_IP = "192.168.4.1"

POLL_SECONDS = 20
ALARM_MAX_SECONDS = 120

# ============ ขา GPIO ของ KidBright32 iP ============
PIN_BUZZER = 13
PIN_SW1 = 16
PIN_SW2 = 14
PIN_LED = 2

buzzer = machine.PWM(machine.Pin(PIN_BUZZER))
buzzer.duty(0)
sw1 = machine.Pin(PIN_SW1, machine.Pin.IN, machine.Pin.PULL_UP)
sw2 = machine.Pin(PIN_SW2, machine.Pin.IN, machine.Pin.PULL_UP)
try:
    led = machine.Pin(PIN_LED, machine.Pin.OUT)
except Exception:
    led = None

POLL_URL = SUPABASE_URL + "/functions/v1/device-poll"
CONFIRM_URL = SUPABASE_URL + "/functions/v1/device-confirm"
HEADERS = {"Content-Type": "application/json"}


def log(*a):
    print("[CareMate]", *a)


def led_set(on):
    if led:
        led.value(1 if on else 0)


def beep(freq=2200, ms=180):
    buzzer.freq(freq)
    buzzer.duty(512)
    time.sleep_ms(ms)
    buzzer.duty(0)


# ============ เก็บ/อ่านค่าตั้งต้น ============
def load_config():
    try:
        with open(CONFIG_FILE) as f:
            return ujson.loads(f.read())
    except Exception:
        return {}


def save_config(cfg):
    with open(CONFIG_FILE, "w") as f:
        f.write(ujson.dumps(cfg))


def clear_config():
    try:
        import os
        os.remove(CONFIG_FILE)
    except Exception:
        pass


# ============ WiFi ============
def connect_sta(ssid, password, timeout=25):
    wlan = network.WLAN(network.STA_IF)
    try:
        wlan.active(False); time.sleep_ms(200)
        wlan.active(True); time.sleep_ms(200)
        if not wlan.isconnected():
            log("เชื่อมต่อ WiFi:", ssid)
            try:
                wlan.disconnect()
            except Exception:
                pass
            time.sleep_ms(100)
            wlan.connect(ssid, password)
            for _ in range(timeout * 2):
                if wlan.isconnected():
                    break
                led_set(True); time.sleep_ms(120); led_set(False); time.sleep_ms(380)
        if wlan.isconnected():
            log("WiFi OK:", wlan.ifconfig()[0])
            return True
    except Exception as e:
        log("WiFi error:", e)
    return False


# ============ โหมดตั้งค่า (captive portal) ============
SETUP_PAGE = """HTTP/1.0 200 OK\r
Content-Type: text/html; charset=utf-8\r
\r
<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ตั้งค่ากล่อง CareMate</title>
<style>
 *{box-sizing:border-box}
 body{font-family:'LINE Seed Sans TH','LINESeedSansTH','LINESeedSansTH_A',-apple-system,'Segoe UI',Roboto,'Noto Sans Thai',sans-serif;background:#eef4fb;margin:0;padding:22px 15px;color:#0f2540}
 .card{background:#fff;border-radius:20px;padding:26px 22px;max-width:440px;margin:0 auto;box-shadow:0 10px 34px rgba(30,136,233,.14)}
 .logo{width:58px;height:58px;border-radius:17px;background:#1E88E9;color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
 h1{font-size:21px;margin:0;text-align:center;font-weight:800}
 .sub{color:#5b6b7d;font-size:14px;margin:7px 4px 20px;text-align:center;line-height:1.55}
 label{display:block;font-weight:700;font-size:13.5px;margin:16px 0 7px;color:#243b53}
 input,select{width:100%;padding:13px;border:1.6px solid #d6e2f0;border-radius:12px;font-size:16px;background:#fff;color:#0f2540}
 input:focus,select:focus{outline:none;border-color:#1E88E9}
 .hint{font-size:12px;color:#8697a8;margin-top:6px;line-height:1.5}
 .or{text-align:center;color:#a7b4c2;font-size:12px;margin:12px 0 2px}
 button{width:100%;margin-top:26px;padding:15px;background:#1E88E9;color:#fff;border:0;border-radius:13px;font-size:17px;font-weight:800}
 button:active{background:#1668b8}
</style></head><body><div class="card">
 <div class="logo"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg></div>
 <h1>ตั้งค่ากล่อง CareMate</h1>
 <div class="sub">กรอก WiFi ที่บ้าน และรหัสอุปกรณ์จากแอป<br>แล้วกดบันทึก กล่องจะเริ่มทำงานให้เอง</div>
 <form method="POST" action="/save">
  <label><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E88E9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:5px"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.86a10 10 0 0 1 14 0"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/></svg>WiFi บ้าน (2.4GHz)</label>
  <select name="ssid">{options}</select>
  <div class="or">— หรือพิมพ์ชื่อเองถ้าไม่เจอในรายการ —</div>
  <input name="ssid_manual" placeholder="พิมพ์ชื่อ WiFi เอง">
  <label>รหัสผ่าน WiFi</label>
  <input name="password" type="password" placeholder="รหัสผ่าน WiFi">
  <label>รหัสอุปกรณ์ (device key)</label>
  <input name="device_key" placeholder="วางรหัสจากแอป">
  <div class="hint">เปิดแอป CareMate &#9656; อุปกรณ์ &#9656; กดปุ่ม &quot;คัดลอก&quot; ข้างรหัส</div>
  <button type="submit">บันทึกและเริ่มใช้งาน</button>
 </form>
</div></body></html>"""

DONE_PAGE = """HTTP/1.0 200 OK\r
Content-Type: text/html; charset=utf-8\r
\r
<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:sans-serif;background:#f0f6ff;text-align:center;padding:60px 20px;color:#0f2540}
h1{color:#1E88E9}</style></head><body>
<h1>บันทึกแล้ว ✓</h1>
<p>กล่องกำลังรีสตาร์ตและเชื่อมต่อ WiFi บ้าน<br>รอสักครู่ ไฟจะกระพริบตอนต่อสำเร็จ</p>
</body></html>"""


SETUP_HTML = SETUP_PAGE.replace("{options}", "<option value=''>WiFi</option>")  # แทนที่ตอน provision


def url_unquote(s):
    s = s.replace("+", " ")
    out = ""
    i = 0
    while i < len(s):
        if s[i] == "%" and i + 2 < len(s):
            try:
                out += chr(int(s[i + 1:i + 3], 16))
                i += 3
                continue
            except Exception:
                pass
        out += s[i]
        i += 1
    return out


def parse_form(body):
    d = {}
    for pair in body.split("&"):
        if "=" in pair:
            k, v = pair.split("=", 1)
            d[k] = url_unquote(v)
    return d


def scan_options():
    try:
        wlan = network.WLAN(network.STA_IF)
        wlan.active(True)
        nets = wlan.scan()
        seen = []
        opts = ""
        for n in nets:
            name = n[0].decode() if isinstance(n[0], bytes) else str(n[0])
            if name and name not in seen:
                seen.append(name)
                opts += "<option>" + name + "</option>"
        return opts or "<option value=''>— ไม่พบ WiFi —</option>"
    except Exception:
        return "<option value=''>— สแกนไม่ได้ —</option>"


def dns_reply(data):
    # ตอบทุกชื่อโดเมนให้ชี้มาที่กล่อง (บังคับเปิดหน้า setup)
    try:
        if len(data) < 12:
            return None
        p = data[:2] + b"\x81\x80" + data[4:6] + data[4:6] + b"\x00\x00\x00\x00"
        idx = 12
        while data[idx] != 0:
            idx += 1 + data[idx]
        idx += 5  # null + qtype(2) + qclass(2)... null is 1 then 4
        # แก้ให้ถูก: null(1)+qtype(2)+qclass(2)=5 นับจากตำแหน่ง null
        p += data[12:idx]
        p += b"\xc0\x0c\x00\x01\x00\x01\x00\x00\x00\x1e\x00\x04"
        p += bytes(int(x) for x in AP_IP.split("."))
        return p
    except Exception:
        return None


def provision():
    global SETUP_HTML
    log("เข้าโหมดตั้งค่า — ปล่อย WiFi:", AP_SSID)
    beep(2000, 120); time.sleep_ms(80); beep(2600, 120)
    sta = network.WLAN(network.STA_IF); sta.active(True)  # เปิดไว้เพื่อสแกน
    SETUP_HTML = SETUP_PAGE.replace("{options}", scan_options())  # สแกนครั้งเดียว
    ap = network.WLAN(network.AP_IF)
    ap.active(True)
    try:
        if AP_PASSWORD:
            ap.config(essid=AP_SSID, password=AP_PASSWORD, authmode=3)
        else:
            ap.config(essid=AP_SSID, authmode=0)
    except Exception as e:
        log("AP config:", e)
    time.sleep(1)
    log("แอปเซสพอยต์พร้อม ต่อมือถือเข้า", AP_SSID, "แล้วเปิดเว็บ")

    # DNS (UDP 53) + HTTP (TCP 80)
    dns = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    dns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    dns.bind(("0.0.0.0", 53))
    http = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    http.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    http.bind(("0.0.0.0", 80))
    http.listen(2)

    poller = select.poll()
    poller.register(dns, select.POLLIN)
    poller.register(http, select.POLLIN)

    blink = 0
    while True:
        # ไฟกระพริบช้า ๆ บอกว่าอยู่โหมดตั้งค่า
        blink += 1
        led_set(blink % 2 == 0)
        for sock, ev in poller.poll(500):
            if sock is dns:
                try:
                    data, addr = dns.recvfrom(256)
                    r = dns_reply(data)
                    if r:
                        dns.sendto(r, addr)
                except Exception:
                    pass
            elif sock is http:
                try:
                    conn, addr = http.accept()
                    handle_http(conn)
                except Exception as e:
                    log("http:", e)


def handle_http(conn):
    try:
        conn.settimeout(3)
        req = b""
        while b"\r\n\r\n" not in req:
            chunk = conn.recv(512)
            if not chunk:
                break
            req += chunk
            if len(req) > 4096:
                break
        text = req.decode("utf-8", "ignore")
        line1 = text.split("\r\n", 1)[0]
        is_post = line1.startswith("POST")
        path = line1.split(" ")[1] if " " in line1 else "/"

        if is_post and path.startswith("/save"):
            # อ่าน body (มี Content-Length)
            body = text.split("\r\n\r\n", 1)[1] if "\r\n\r\n" in text else ""
            clen = 0
            for h in text.split("\r\n"):
                if h.lower().startswith("content-length:"):
                    try:
                        clen = int(h.split(":", 1)[1].strip())
                    except Exception:
                        clen = 0
            while len(body) < clen:
                more = conn.recv(512)
                if not more:
                    break
                body += more.decode("utf-8", "ignore")
            form = parse_form(body)
            ssid = form.get("ssid_manual", "").strip() or form.get("ssid", "").strip()
            cfg = {
                "ssid": ssid,
                "password": form.get("password", ""),
                "device_key": form.get("device_key", "").strip(),
            }
            log("รับค่าตั้งค่า: ssid=", ssid)
            if ssid and cfg["device_key"]:
                save_config(cfg)
                conn.send(DONE_PAGE)
                conn.close()
                time.sleep(2)
                log("บันทึกแล้ว รีสตาร์ต...")
                machine.reset()
            else:
                conn.send(SETUP_HTML)
                conn.close()
        else:
            # ทุก path อื่น -> ส่งหน้า setup (captive portal)
            conn.send(SETUP_HTML)
            conn.close()
    except Exception as e:
        log("handle_http:", e)
        try:
            conn.close()
        except Exception:
            pass


# ============ เสียงเตือน (3 ทำนอง) ============
PATTERNS = {
    "buzzer":   [(2400, 200), (0, 120), (2000, 200), (0, 450)],
    "voice_th": [(1047, 200), (1319, 200), (1568, 200), (2093, 340), (0, 800)],
    "custom":   [(1600, 380), (1000, 380), (1600, 380), (1000, 380), (0, 350)],
}


def post(url, payload):
    try:
        r = requests.post(url, data=ujson.dumps(payload), headers=HEADERS)
        try:
            data = r.json()
        except Exception:
            data = {}
        code = r.status_code
        r.close()
        return code, data
    except Exception as e:
        log("HTTP error:", e)
        return 0, {}


def poll(device_key):
    code, data = post(POLL_URL, {"device_key": device_key})
    if code == 200:
        return data
    if code == 403:
        log("DEVICE_KEY ไม่ถูกต้อง (กล่องถูกถอด/ยังไม่จับคู่)")
        return {"_invalid": True}
    elif code != 0:
        log("poll status", code, data)
    return {}


def poll_due_ids(device_key):
    data = poll(device_key)
    return [d["reminder_id"] for d in (data.get("due", []) or [])]


def confirm(device_key, reminder_id, action):
    code, data = post(CONFIRM_URL, {"device_key": device_key, "reminder_id": reminder_id, "action": action})
    if code == 200:
        log("ส่งผล:", action, "สำเร็จ")
        return True
    log("ส่งผลไม่สำเร็จ", code, data)
    return False


def ok_feedback():
    beep(2600, 90); time.sleep_ms(60); beep(3000, 120)


def silence():
    buzzer.duty(0)
    led_set(False)


def handle_alarm(device_key, due, sound="buzzer"):
    names = ", ".join([d.get("name", "ยา") for d in due])
    log("ถึงเวลายา:", names, "| เสียง:", sound)
    ring_ids = [d["reminder_id"] for d in due]
    pattern = PATTERNS.get(sound, PATTERNS["buzzer"])
    start = time.ticks_ms()
    idx = 0
    note_next = time.ticks_ms()
    next_check = time.ticks_add(start, 8000)

    while time.ticks_diff(time.ticks_ms(), start) < ALARM_MAX_SECONDS * 1000:
        now = time.ticks_ms()
        if time.ticks_diff(now, note_next) >= 0:
            freq, dur = pattern[idx]
            if freq > 0:
                buzzer.freq(freq); buzzer.duty(512); led_set(True)
            else:
                buzzer.duty(0); led_set(False)
            note_next = time.ticks_add(now, dur)
            idx = (idx + 1) % len(pattern)

        if time.ticks_diff(now, next_check) >= 0:
            next_check = time.ticks_add(time.ticks_ms(), 8000)
            still_ids = poll_due_ids(device_key)
            remaining = [rid for rid in ring_ids if rid != "test" and rid in still_ids]
            if not remaining:
                log("หยุดเตือน (จัดการจากแอปแล้ว)")
                silence()
                return

        if sw1.value() == 0:
            silence(); ok_feedback()
            for d in due:
                if d["reminder_id"] != "test":
                    confirm(device_key, d["reminder_id"], "taken")
            return
        if sw2.value() == 0:
            silence(); beep(1600, 200)
            for d in due:
                if d["reminder_id"] != "test":
                    confirm(device_key, d["reminder_id"], "snoozed")
            return
        time.sleep_ms(10)
    silence()


def run_caremate(device_key):
    log("เริ่มทำงาน (device_key พร้อม)")
    beep(2600, 120)
    bad_key = 0
    while True:
        try:
            wlan = network.WLAN(network.STA_IF)
            if not wlan.isconnected():
                log("WiFi หลุด — ต่อใหม่")
                cfg = load_config()
                connect_sta(cfg.get("ssid", ""), cfg.get("password", ""))
            data = poll(device_key)
            # device_key ใช้ไม่ได้ (ถูกถอดในแอป) -> เข้าโหมดตั้งค่าให้ใส่รหัสใหม่
            if data.get("_invalid"):
                bad_key += 1
                if bad_key >= 3:
                    log("รหัสอุปกรณ์ใช้ไม่ได้ — เข้าโหมดตั้งค่าใหม่ (จับคู่ใหม่ในแอปแล้วใส่รหัสใหม่)")
                    beep(1400, 300)
                    clear_config()
                    time.sleep(1)
                    machine.reset()
                time.sleep(POLL_SECONDS)
                continue
            bad_key = 0
            # คำสั่งรีเซ็ต WiFi จากแอป -> ลืมค่าเดิม เข้าโหมดตั้งค่าใหม่
            if data.get("reset_wifi"):
                log("ได้รับคำสั่งรีเซ็ต WiFi จากแอป — ล้างค่าและรีสตาร์ต")
                beep(1800, 150); time.sleep_ms(80); beep(1400, 200)
                clear_config()
                time.sleep(1)
                machine.reset()
            due = data.get("due", []) or []
            sound = data.get("sound", "buzzer")
            if due:
                handle_alarm(device_key, due, sound)
            else:
                led_set(True); time.sleep_ms(30); led_set(False)
        except Exception as e:
            log("loop error:", e)
        time.sleep(POLL_SECONDS)


def main():
    log("บูต")
    time.sleep_ms(300)
    # กด S2 ค้างตอนเปิด = ล้างค่า ตั้ง WiFi ใหม่
    if sw2.value() == 0:
        log("กดปุ่ม S2 — ล้างค่า เข้าโหมดตั้งค่าใหม่")
        clear_config()

    cfg = load_config()
    if not cfg.get("ssid") or not cfg.get("device_key"):
        provision()   # จะรีสตาร์ตเองเมื่อบันทึกเสร็จ
        return

    if not connect_sta(cfg["ssid"], cfg.get("password", "")):
        log("ต่อ WiFi ที่บันทึกไว้ไม่ได้ — เข้าโหมดตั้งค่า")
        provision()
        return

    run_caremate(cfg["device_key"])


main()
