# qr-doorbell
A **simple IoT doorbell** that uses a QR code and a web interface to ring a buzzer via an ESP8266/ESP32.

## Live Demo
➡️ **[https://kokoc30.github.io/qr-doorbell/](https://kokoc30.github.io/qr-doorbell/)**

## Table of Contents
- [Features](#features)
- [QR Code](#qr-code)
- [Hardware Setup](#hardware-setup)  
  - [Components](#components)  
  - [Wiring Diagram](#wiring-diagram)
- [Software Setup](#software-setup)  
  - [Arduino Sketch](#arduino-sketch)  
  - [Web Interface](#web-interface)
- [Usage](#usage)
- [License](#license)

---

## Features
- **QR-to-ring**: Visitors scan a QR code to open a mobile-friendly web page.  
- **Press & hold**: Hold the on-screen bell for **3 seconds** to ring a physical buzzer.  
- **Self-hosted**: Static front-end on GitHub Pages, backend on the ESP8266/ESP32.

---

## QR Code
**Scan this code** with your phone to open the doorbell interface:

![QR Code](3.png)

---

## Hardware Setup

### Components
- **Wemos D1 Mini** (ESP8266) or **ESP32** board  
- **Active buzzer** (5–12 mm cylinder)  
- **USB-C cable** for power & programming  
- **Breadboard** (optional)  
- **Jumper wires**  

### Wiring Diagram
Connect the buzzer directly to the D1 Mini:

- **Buzzer “+”** → **D2 (GPIO4)** on the D1 Mini  
- **Buzzer “–”** → **GND** on the D1 Mini  

![Wiring Diagram](./assets/wiring-diagram.png)

---

## Software Setup

### Arduino Sketch
1. **Clone** this repository and open `doorbell.ino` in the Arduino IDE.  
2. **Install** the **PubSubClient** library via **Sketch → Include Library → Manage Libraries**.  
3. **Fill in** your Wi-Fi credentials:
    ```cpp
    const char* ssid = "YOUR_SSID";
    const char* pass = "YOUR_PASSWORD";
    ```
4. **Select** your board and settings:  
    - **Tools → Board** → `LOLIN(WEMOS) D1 mini (clone)`  
    - **Tools → Flash Size** → `4MB (FS: none)`  
5. **Upload**, then open the **Serial Monitor** at **115200 baud** to see the assigned IP.

```cpp
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#define BUZZER_PIN D2  // GPIO4

// … rest of your sketch …
