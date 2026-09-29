# pintest.py - หาเลขขาปุ่ม S1/S2 ของบอร์ด KidBright
# วิธีใช้:
#   1) กดปุ่ม STOP แดงใน Thonny ให้ขึ้น >>> ก่อน
#   2) เปิดไฟล์นี้แล้วกด Run (ปุ่มเล่นสีเขียว)
#   3) กดปุ่ม S1 ค้างไว้ ~2 วิ ดูว่าเลขขาไหนหายไปจากรายการ (= ปุ่มนั้นคือ S1)
#   4) ปล่อย แล้วกดปุ่ม S2 ค้าง ทำแบบเดียวกัน
from machine import Pin
import time

# ขาที่ตั้ง pull-up ได้ (ตัด 13=buzzer, 6-11=flash, 34-39=อินพุตอย่างเดียว)
CANDIDATES = [0, 2, 4, 5, 12, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33]
pins = {}
for p in CANDIDATES:
    try:
        pins[p] = Pin(p, Pin.IN, Pin.PULL_UP)
    except Exception:
        pass

print("พร้อมแล้ว! ค่าปกติ (ยังไม่กด) ทุกขาควรเป็น 1")
print("กดปุ่มค้างไว้ แล้วดูว่าเลขขาไหนกลายเป็น 0")
print("-" * 40)
last = None
while True:
    low = [p for p, o in pins.items() if o.value() == 0]
    if low != last:
        if low:
            print(">>> ขาที่ถูกกด (= 0):", low)
        else:
            print("... ปล่อยหมดแล้ว (ทุกขา = 1)")
        last = low
    time.sleep_ms(120)
