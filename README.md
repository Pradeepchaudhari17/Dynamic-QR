# OmniQR Pro Studio 🚀
### Modern QR Code Generator with Real-Time Scan Analytics & Telemetry

OmniQR Studio is a web application built using **pure HTML, Vanilla CSS, and modern JavaScript**. It allows you to turn **anything** into a custom branded QR code and track its live scan count, device telemetry, and performance over time.

---

## 🌟 Key Features

### 1. 🔀 "Turn Anything into a QR Code"
- **🔗 Link / URL**: Any website, portfolio, web app, or social media profile.
- **📶 Wi-Fi Network**: SSID, Password, Encryption type (WPA/WPA2/WPA3, WEP, or Open), and Hidden Network toggle. Automatically prompts instant connection on smartphones.
- **📄 PDF & Document**: Upload any PDF file directly (with drag-and-drop or file picker) or paste a direct PDF web URL. Scanners can view or download the document immediately.
- **📝 Plain Text / Secret Notes**: Freeform notes, codes, and serials with a live character counter.
- **👤 vCard / Contact Card**: Name, phone, email, organization, job title, and website (vCard 3.0 standard).
- **✉️ Email**: Pre-filled recipient, subject line, and body message.
- **💬 WhatsApp**: Direct chat link with phone number and prefilled message.
- **💳 UPI / Payments**: Scannable by Google Pay, PhonePe, Paytm, and banking apps.
- **📅 Calendar Event**: Title, start/end date-time, location, and description (iCal format).

---

### 2. 📊 Real-Time Scan Counts & Analytics Engine
- **Dynamic Trackable QR vs Static QR**:
  - **Dynamic Mode**: Encodes a tracked landing gateway (`#/scan?id=...`). Every scan is logged into local storage with telemetry.
  - **Static Mode**: Encodes direct raw payload.
- **Live Metrics Bar on Preview**: Displays Total Scans, Unique Scanners, and Last Activity timestamp right on the generator card.
- **Dedicated Scan Analytics Portal**:
  - **KPI Cards**: Total Scans Recorded (with trend %), Unique Scanners, Top Device Category, and Last Activity.
  - **Scan Activity Timeline Chart**: Smooth canvas line chart with glowing gradient fill tracking scans across the last 7 days.
  - **Device Breakdown Donut Chart**: Canvas donut chart displaying Mobile vs Desktop vs Tablet percentages and interactive color legend.
  - **Detailed Activity Log Table**: Real-time table logging each scan with Timestamp, QR Campaign Title, Type badge, Device/OS, Browser, Simulated Geo Location, and Status.
  - **Interactive Scan Simulator**: "+ Simulate Visitor Scan" and "Test Scan" buttons to simulate and verify real-time counter increments.
  - **Filter by Campaign**: Select consolidated data or inspect individual QR campaigns.
  - **Export to CSV**: Export your scan logs into spreadsheet-ready CSV.

---

### 3. 📷 Integrated QR Code Scanner
- **Live Camera Scanner**: High-frame-rate scanning using device camera/webcam with laser viewfinder crosshairs.
- **Image File Dropzone**: Drag and drop any image containing a QR code for instant decoding.
- **Smart Payload Recognition**: Automatically parses Wi-Fi credentials (with one-click password copy), PDFs (with instant download), URLs, and OmniQR dynamic campaigns (recording a scan).

---

### 4. 🎨 Design & Customization Studio
- **Colors & Gradients**: Solid color fills or dynamic dual-color linear gradients (foreground, background, and corner eyes).
- **Module Body Styles**: Classic Square, Circle Dots, Smooth Rounded, and Diamond.
- **Eye Corner Shapes**: Square, Rounded, Circle, and Leaf.
- **Center Logo Branding**: Preset icons (Link, WiFi, PDF, WhatsApp, Star, Heart, Lock, Shop) or **Upload Your Own Brand Logo (PNG/SVG)** with a size slider.
- **Call-to-Action (CTA) Frames**: Bottom Banner ("SCAN ME"), Top Banner, Full Badge Card.

---

### 5. 💾 Saved QR Vault & Multi-Format Export
- **Export Formats**:
  - **High-Resolution 4K PNG**: Clean, pixel-perfect image for print or digital media.
  - **Vector SVG**: Infinitely scalable vector graphics.
  - **Copy Image to Clipboard**: Paste directly into Figma, Canva, Word, or Slack.
  - **Printable Flyer / Table Tent**: Modal with `@media print` support for instant physical printing.
- **QR Vault (Library)**: Save and manage your favorite QR codes, search by title, inspect scan counts, and re-edit in Studio.

---

### 6. 🔐 User Authentication & Account Management
- **Standalone Auth Pages**:
  - **[login.html](file:///c:/Users/Pravin%20Kumar/Downloads/QR%20Generator/login.html)**: Modern dedicated sign-in page with glassmorphism, showcase perks, social logins, password show/hide, and 1-click quick demo buttons.
  - **[signup.html](file:///c:/Users/Pravin%20Kumar/Downloads/QR%20Generator/signup.html)**: Dedicated registration page with real-time dynamic password strength meter (rule badges + color scoring) and confirm password validation.
- **In-App Seamless Auth Modal**:
  - Direct access from the top header without leaving the QR generator workspace.
  - Tab switcher between "Sign In" and "Create Account".
- **Instant 1-Click Demo Accounts**:
  - 🚀 **Pro Member**: `alex@omniqr.pro` (Password: `password123`)
  - ⚡ **Creator Tier**: `demo@omniqr.pro` (Password: `password123`)
- **User Profile & Settings Modal**:
  - Live Avatar theme selector (gradient picker).
  - Update display name & password.
  - Track total account QRs and cumulative scans.
  - Complete JSON vault backup exporter.

---

## 💻 How to Run Locally

You can open `index.html`, `login.html`, or `signup.html` directly in any web browser, or serve it using Python's built-in web server:

```bash
# In the project directory:
python -m http.server 8080
```

Then visit:
👉 **`http://localhost:8080`** (or `http://localhost:8080/login.html` / `http://localhost:8080/signup.html`) in your browser.

