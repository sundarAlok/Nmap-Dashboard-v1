# Nmap Dashboard v1

A Flask-based dashboard for running and visualizing Nmap scans.

---

## Prerequisites

- **Python 3.8+** installed
- **Nmap** installed and added to your system PATH  
  [Download Nmap](https://nmap.org/download.html)

## Setup

1. **Clone or download this repository.**
   ```
   git clone https://github.com/sundarAlok/Nmap-Dashboard-v1.git
   ```
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
- Configurable scan history and visualization:
  Easily adjust how many scan records are retained in [scan_history.json](scan_history.json) (default: 50), as well as the number of recent scans displayed in the trends line graph (default: 15).

## Notes

- Only scan networks you have permission to scan.
- For best results, ensure Nmap is correctly installed and accessible from the command line.

## Screenshots

<img width="1314" height="723" alt="without-scan" src="https://github.com/user-attachments/assets/b137dcb4-55bc-4c4a-a599-a5d869e9c244" />

<img width="1065" height="635" alt="after-scan" src="https://github.com/user-attachments/assets/b97b0589-69de-41f5-86dd-346b151891e9" />


## Project Structure

```
Nmap-Dashboard-v1/
├── app.py                # Main Flask application
├── requirements.txt      # Python dependencies
├── scan_history.json     # Stores scan results/history
├── static/               # Static files (CSS, JS, images)
│   ├── logo.png
│   ├── scripts.js
│   └── styles.css
├── templates/            # HTML templates
│   └── index.html
└── README.md             # Project documentation
```

---

Feel free to improve or customize this README!
