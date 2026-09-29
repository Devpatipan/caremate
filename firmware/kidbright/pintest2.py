# pintest2.py - หาขาปุ่ม S2 (รอบเจาะจง) - เขียนแบบเลี่ยงไวยากรณ์ใหม่
# วิธีใช้: กด STOP แดงให้ขึ้น >>> ก่อน แล้วเปิดไฟล์นี้กด Run
#         จากนั้นกดปุ่ม S2 ค้างไว้ ~2 วิ ดูว่าขาไหนเป็น 0
from machine import Pin
import time

pins = {}
# ขาที่ตั้ง pull-up ได้ (รวม 14 ที่รอบก่อนลืมใส่)
for p in [14, 16, 17, 18, 19, 23]:
    try:
        pins[p] = Pin(p, Pin.IN, Pin.PULL_UP)
    except Exception:
        pass
# ขาอินพุตอย่างเดียว (เผื่อ S2 อยู่กลุ่มนี้)
for p in [34, 35, 36, 39]:
    try:
        pins[p] = Pin(p, Pin.IN)
    except Exception:
        pass

print("กดปุ่ม S2 ค้างไว้ แล้วดูว่าขาไหนกลายเป็น 0")
print("-" * 40)
last = None
while True:
    low = []
    for p in pins:
        if pins[p].value() == 0:
            low.append(p)
    if low != last:
        if low:
            print(">>> ขาที่เป็น 0:", low)
        else:
            print("... (ไม่มีขาไหนถูกกด)")
        last = low
    time.sleep_ms(120)
