import os
import subprocess
import re
import json
import datetime
import uuid
from flask import Flask, render_template, request, jsonify
from xml.etree import ElementTree as ET
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)

SCAN_HISTORY_FILE = 'scan_history.json'
CURRENT_THEME = "light"

# Global scan_history list
scan_history = []

# Load scan history from file at startup
if os.path.exists(SCAN_HISTORY_FILE):
    try:
        with open(SCAN_HISTORY_FILE, 'r') as f:
            scan_history = json.load(f)
    except json.JSONDecodeError:
        scan_history = []
else:
    scan_history = []

def save_scan_history():
    global scan_history
    # Keep only last 50 entries
    if len(scan_history) > 50:
        scan_history = scan_history[-50:]
    with open(SCAN_HISTORY_FILE, 'w') as f:
        json.dump(scan_history, f, indent=2)

def run_nmap_scan(target):
    try:
        if ':' in target:
            host, port = target.split(':', 1)
            target = f"-p {port} {host}"
        cmd = f"nmap -sV -O -T4 -oX - {target}"
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            return {"error": f"Nmap failed: {result.stderr}"}
        return parse_nmap_xml(result.stdout)
    except subprocess.TimeoutExpired:
        return {"error": "Scan timed out after 5 minutes"}
    except Exception as e:
        return {"error": str(e)}

def parse_nmap_xml(xml_output):
    try:
        root = ET.fromstring(xml_output)
    except ET.ParseError as e:
        return {"error": f"XML parse error: {str(e)}"}

    results = {
        "hosts": [],
        "summary": {
            "hosts_up": 0,
            "open_ports": 0,
            "filtered_ports": 0,
            "closed_ports": 0,
            "os_count": 0,
            "services": 0,
            "http_ports": 0,
            "unique_services": set()
        },
        "services": {},
        "scan_info": {}
    }

    runstats = root.find("runstats/finished")
    if runstats is not None:
        results["scan_info"]["timestamp"] = runstats.get("timestr", "")
        results["scan_info"]["elapsed"] = runstats.get("elapsed", "")

    for host in root.findall("host"):
        status = host.find("status")
        if status is None or status.get("state") != "up":
            continue
        results["summary"]["hosts_up"] += 1
        address = host.find("address")
        ip = address.get("addr") if address is not None else "unknown"
        os_info = "Unknown"
        osmatch = host.find("os/osmatch")
        if osmatch is not None:
            os_info = osmatch.get("name", "Unknown")
        host_data = {"ip": ip, "os": os_info, "status": "up", "ports": [], "services": []}
        for port in host.findall("ports/port"):
            portid = port.get("portid")
            protocol = port.get("protocol")
            state = port.find("state")
            service = port.find("service")
            if state is None:
                continue
            st = state.get("state", "unknown")
            svc_name = service.get("name", "unknown") if service is not None else "unknown"
            product = service.get("product", "") if service is not None else ""
            version = service.get("version", "") if service is not None else ""
            svc_info = f"{svc_name} {product} {version}".strip() or "unknown"
            if st == "open":
                results["summary"]["open_ports"] += 1
                if svc_name in ["http", "https"]:
                    results["summary"]["http_ports"] += 1
            elif st == "filtered":
                results["summary"]["filtered_ports"] += 1
            elif st == "closed":
                results["summary"]["closed_ports"] += 1
            results["services"].setdefault(svc_name, 0)
            results["services"][svc_name] += 1
            results["summary"]["unique_services"].add(svc_name)
            host_data["ports"].append(portid)
            host_data["services"].append(f"{portid}/{protocol}: {svc_info}")
        results["hosts"].append(host_data)

    results["summary"]["services"] = len(results["summary"]["unique_services"])
    results["summary"]["os_count"] = len({h["os"] for h in results["hosts"] if h["os"]!="Unknown"})
    del results["summary"]["unique_services"]
    return results

def generate_line_chart(limit=15):
    if len(scan_history) < 2:
        return None
    recent = scan_history[-limit:]
    labels = [e['timestamp'] for e in recent]
    u = [e['hosts_up'] for e in recent]
    o = [e['open_ports'] for e in recent]
    f = [e['filtered_ports'] for e in recent]

    # Create figure with higher DPI for sharper lines
    plt.figure(figsize=(10, 4), dpi=300)
    
    # Plot with thicker lines and specified colors
    plt.plot(labels, u, 'o-', color="#182fff", linewidth=1.5, markersize=4, label='Hosts Up')
    plt.plot(labels, o, 's-', color="#ff0a91", linewidth=1.5, markersize=4, label='Open Ports')
    plt.plot(labels, f, 'd-', color="#28af06", linewidth=1.5, markersize=4, label='Filtered Ports')
    
    # Add titles and labels
    plt.title('Scan Trends', fontsize=14, fontweight='bold')
    plt.xlabel('Scan Timestamp', fontsize=11, fontweight='bold')
    plt.ylabel('Count', fontsize=11, fontweight='bold')
    
    # Format axes
    plt.xticks(rotation=45, fontsize=9)
    plt.yticks(fontsize=9)
    
    # Add grid lines for better readability
    plt.grid(True, linestyle='--', linewidth=0.7, alpha=0.7)
    
    # Add legend
    plt.legend(fontsize=10)
    
    # Ensure proper layout
    plt.tight_layout()

    # Save to buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=300)
    buf.seek(0)
    plt.close()
    
    return f"data:image/png;base64,{base64.b64encode(buf.read()).decode()}"

@app.route('/')
def index():
    return render_template('index.html', theme=CURRENT_THEME)

@app.route('/scan', methods=['POST'])
def scan():
    global scan_history
    target = request.form.get('target', '').strip()
    if not target:
        return jsonify({"error": "Target is required"}), 400
    if target == "clear_history":
        scan_history.clear()
        save_scan_history()
        return jsonify({"message": "History cleared", "history": scan_history}), 200
    if not re.match(r'^[\d\.\-\/:,a-zA-Z]+$', target):
        return jsonify({"error": "Invalid target format"}), 400
    
    result = run_nmap_scan(target)
    if "error" in result:
        return jsonify(result), 500
    
    scan_id = str(uuid.uuid4())
    entry = {
        "id": scan_id,
        "timestamp": datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'),
        "target": target,
        "hosts_up": result['summary']['hosts_up'], # type: ignore
        "open_ports": result['summary']['open_ports'], # type: ignore
        "filtered_ports": result['summary']['filtered_ports'],  # type: ignore
        "closed_ports": result['summary']['closed_ports'],  # type: ignore
        "os_count": result['summary']['os_count'],  # type: ignore
        "result": result
    }
    
    scan_history.append(entry)
    save_scan_history()
    
    return jsonify({
        "id": scan_id,
        "result": result,
        "history": scan_history,
        "line_chart": generate_line_chart()
    })

@app.route('/load-scan/<scan_id>', methods=['GET'])
def load_scan(scan_id):
    entry = next((e for e in scan_history if e['id'] == scan_id), None)
    if not entry:
        return jsonify({"error": "Scan not found"}), 404
    return jsonify({
        "result": entry['result'],
        "history": scan_history,
        "line_chart": generate_line_chart()
    })

@app.route('/toggle-theme', methods=['POST'])
def toggle_theme():
    global CURRENT_THEME
    CURRENT_THEME = "dark" if CURRENT_THEME == "light" else "light"
    return jsonify({"theme": CURRENT_THEME})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)