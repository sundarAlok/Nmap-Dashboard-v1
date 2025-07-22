# Nmap Dashboard v1

A Flask-based dashboard for running and visualizing Nmap scans.

---

## Prerequisites

- **Python 3.8+** installed
- **Nmap** installed and added to your system PATH  
  [Download Nmap](https://nmap.org/download.html)

## Setup

1. **Clone or download this repository.**
2. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```
3. **Run the app:**
   ```
   python app.py
   ```
4. **Open your browser and go to:**  
   [http://localhost:5000](http://localhost:5000)

## Features

- Start Nmap scans from the web interface
- View scan results and history
- Visualize open/filtered/closed ports and services
- Export results as PDF
- Light/Dark theme toggle

## Notes

- Only scan networks you have permission to scan.
- For best results, ensure Nmap is correctly installed and accessible from the command line.

## Project Structure

```
app.py
requirements.txt
scan_history.json
static/
templates/
```

---

Feel free to improve or customize this README!