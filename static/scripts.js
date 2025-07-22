        // DOM Elements
        const scanTrendsCtx = document.getElementById('scanTrendsChart').getContext('2d');
        const targetInput = document.getElementById('targetInput');
        const scanButton = document.getElementById('scanButton');
        const filterBtn = document.getElementById('filterBtn');
        const exportBtn = document.getElementById('exportBtn');
        const themeToggle = document.getElementById('themeToggle');
        const historyDropdown = document.getElementById('historyDropdown');
        const settingsDropdown = document.getElementById('settingsDropdown');
        const aboutDropdown = document.getElementById('aboutDropdown');
        const warningBanner = document.getElementById('warningBanner');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const errorMessage = document.getElementById('errorMessage');
        const resultsSection = document.getElementById('resultsSection');
        const emptyState = document.getElementById('emptyState');
        const hostResults = document.getElementById('hostResults');
        const servicesDetected = document.getElementById('servicesDetected');
        const scanHistory = document.getElementById('scanHistory');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        const portPieChartCtx = document.getElementById('portPieChart').getContext('2d');
        const lineChartContainer = document.getElementById('lineChartContainer');
        
        // Modal elements
        const filterModal = document.getElementById('filterModal');
        const historyModal = document.getElementById('historyModal');
        const settingsModal = document.getElementById('settingsModal');
        const aboutModal = document.getElementById('aboutModal');
        const closeFilterModal = document.getElementById('closeFilterModal');
        const closeHistoryModal = document.getElementById('closeHistoryModal');
        const closeSettingsModal = document.getElementById('closeSettingsModal');
        const closeAboutModal = document.getElementById('closeAboutModal');
        const applyFilters = document.getElementById('applyFilters');
        const resetFilters = document.getElementById('resetFilters');
        const modalScanHistory = document.getElementById('modalScanHistory');
        const saveSettings = document.getElementById('saveSettings');
        
        // Stats elements
        const hostsUp = document.getElementById('hostsUp');
        const openPorts = document.getElementById('openPorts');
        const filteredPorts = document.getElementById('filteredPorts');
        const closedPorts = document.getElementById('closedPorts');
        const osCount = document.getElementById('osCount');
        const servicesCount = document.getElementById('servicesCount');
        const httpCount = document.getElementById('httpCount');
        const resultsCount = document.getElementById('resultsCount');
        const lastScanned = document.getElementById('lastScanned');
        
        // Variables
        let portPieChart = null;
        let scanTrendsChart = null;
        let currentTheme = "{{ theme }}";
        let currentFilters = {};
        
        // Initialize the page
        document.addEventListener('DOMContentLoaded', () => {
            applyTheme(currentTheme);
            
            // Hide results initially
            resultsSection.classList.add('hidden');
            emptyState.classList.remove('hidden');
            lineChartContainer.classList.add('hidden');
            
            // Add event listeners
            scanButton.addEventListener('click', startScan);
            filterBtn.addEventListener('click', () => filterModal.style.display = 'flex');
            exportBtn.addEventListener('click', exportResults);
            themeToggle.addEventListener('click', toggleTheme);
            historyDropdown.addEventListener('click', showHistoryModal);
            settingsDropdown.addEventListener('click', () => settingsModal.style.display = 'flex');
            aboutDropdown.addEventListener('click', () => aboutModal.style.display = 'flex');
            clearHistoryBtn.addEventListener('click', clearHistory);
            targetInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') startScan();
            });
            
            // Modal close buttons
            closeFilterModal.addEventListener('click', () => filterModal.style.display = 'none');
            closeHistoryModal.addEventListener('click', () => historyModal.style.display = 'none');
            closeSettingsModal.addEventListener('click', () => settingsModal.style.display = 'none');
            closeAboutModal.addEventListener('click', () => aboutModal.style.display = 'none');
            
            // Filter buttons
            applyFilters.addEventListener('click', applyResultsFilter);
            resetFilters.addEventListener('click', resetResultsFilter);
            
            // Settings button
            saveSettings.addEventListener('click', saveAppSettings);
            
            // Close modals when clicking outside content
            document.addEventListener('click', (e) => {
                if (e.target === filterModal) filterModal.style.display = 'none';
                if (e.target === historyModal) historyModal.style.display = 'none';
                if (e.target === settingsModal) settingsModal.style.display = 'none';
                if (e.target === aboutModal) aboutModal.style.display = 'none';
            });
        });
        
        // Apply theme to the page
        function applyTheme(theme) {
            document.documentElement.classList.toggle('dark', theme === 'dark');
            currentTheme = theme;
            
            if (theme === 'dark') {
                document.documentElement.style.setProperty('--text-color', '#f0f0f0');
                document.documentElement.style.setProperty('--bg-color', '#1e1e1e');
                document.documentElement.style.setProperty('--card-bg', '#2d2d2d');
                document.documentElement.style.setProperty('--border-color', '#3d3d3d');
            } else {
                document.documentElement.style.setProperty('--text-color', '#1e293b');
                document.documentElement.style.setProperty('--bg-color', '#f8fafc');
                document.documentElement.style.setProperty('--card-bg', '#ffffff');
                document.documentElement.style.setProperty('--border-color', '#e2e8f0');
            }
        }
        
        function toggleTheme() {
            fetch('/toggle-theme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                applyTheme(data.theme);
            });
        }
        
        // Scan function
        function startScan() {
            const target = targetInput.value.trim();
            
            if (!target) {
                showError('Please enter an IP address or IP range');
                return;
            }
            
            // Show loading, hide other sections
            loadingIndicator.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            emptyState.classList.add('hidden');
            errorMessage.classList.add('hidden');
            warningBanner.classList.add('hidden');
            
            // Send request to backend
            fetch('/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `target=${encodeURIComponent(target)}`
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || 'Scan failed');
                    });
                }
                return response.json();
            })
            .then(data => {
                // Hide loading
                loadingIndicator.classList.add('hidden');
                
                if (data.error) {
                    showError(data.error);
                    return;
                }
                
                // Update UI with results
                updateResults(data);
                
                // Show results
                resultsSection.classList.remove('hidden');
            })
            .catch(error => {
                loadingIndicator.classList.add('hidden');
                showError(error.message || 'An error occurred during scanning');
            });
        }
        
        // Update results with scan data
        function updateResults(data) {
            // Update stats
            hostsUp.textContent = data.result.summary.hosts_up || 0;
            openPorts.textContent = data.result.summary.open_ports || 0;
            filteredPorts.textContent = data.result.summary.filtered_ports || 0;
            closedPorts.textContent = data.result.summary.closed_ports || 0;
            osCount.textContent = data.result.summary.os_count || 0;
            servicesCount.textContent = data.result.summary.services || 0;
            httpCount.textContent = data.result.summary.http_ports || 0;
            resultsCount.textContent = data.result.hosts?.length || 0;
            
            // Update last scanned time
            lastScanned.textContent = data.result.scan_info?.timestamp || new Date().toLocaleTimeString();
            
            // Clear previous results
            hostResults.innerHTML = '';
            servicesDetected.innerHTML = '';
            
            // Add host results
            if (data.result.hosts && data.result.hosts.length > 0) {
                data.result.hosts.forEach(host => {
                    const row = document.createElement('tr');
                    row.className = 'host-row border-b border-gray-200';
                    
                    // Determine OS color
                    let osClass = 'text-gray-700';
                    if (host.os.includes('Linux')) osClass = 'text-yellow-600';
                    if (host.os.includes('Windows')) osClass = 'text-blue-600';
                    
                    // Determine status badge
                    let statusClass = 'bg-green-100 text-green-800';
                    let statusText = 'UP';
                    if (host.status !== 'up') {
                        statusClass = 'bg-gray-100 text-gray-800';
                        statusText = 'DOWN';
                    }
                    
                    // Format ports
                    const ports = host.ports?.join(', ') || '';
                    
                    // Format services
                    const services = host.services?.join(', ') || '';
                    
                    row.innerHTML = `
                        <td class="py-3 px-4 font-mono">${host.ip}</td>
                        <td class="py-3 px-4 ${osClass}">${host.os}</td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                                ${statusText}
                            </span>
                        </td>
                        <td class="py-3 px-4 font-mono">${ports}</td>
                        <td class="py-3 px-4">${services}</td>
                    `;
                    hostResults.appendChild(row);
                });
            } else {
                hostResults.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-8 text-center text-gray-500">
                            No hosts found with open ports
                        </td>
                    </tr>
                `;
            }
            
            // Add services
            if (data.result.services && Object.keys(data.result.services).length > 0) {
                Object.entries(data.result.services).forEach(([service, count]) => {
                    let serviceClass = 'bg-gray-100 text-gray-800';
                    if (service === 'http' || service === 'https') serviceClass = 'bg-blue-100 text-blue-800';
                    if (service === 'ssh') serviceClass = 'bg-purple-100 text-purple-800';
                    if (service === 'ftp') serviceClass = 'bg-orange-100 text-orange-800';
                    
                    const serviceEl = document.createElement('div');
                    serviceEl.className = `service-tag px-3 py-2 rounded-md ${serviceClass}`;
                    serviceEl.textContent = `${service} (${count})`;
                    servicesDetected.appendChild(serviceEl);
                });
            } else {
                servicesDetected.innerHTML = `
                    <div class="text-gray-500">
                        No services detected
                    </div>
                `;
            }
            
            // Update scan history
            updateHistory(data.history || []);
            
            // Update pie chart
            updatePieChart(data.result.summary);
            
            // Update line chart if available
            if (data.line_chart) {
                updateLineChart(data.line_chart);
            } else {
                lineChartContainer.classList.add('hidden');
            }
        }
        
        // Update pie chart with port status data
        function updatePieChart(summary) {
            // Destroy existing chart if it exists
            if (portPieChart) {
                portPieChart.destroy();
            }
            
            const totalPorts = summary.open_ports + summary.filtered_ports + summary.closed_ports;
            
            // Only show chart if we have data
            if (totalPorts > 0) {
                const openPercent = Math.round((summary.open_ports / totalPorts) * 100);
                const filteredPercent = Math.round((summary.filtered_ports / totalPorts) * 100);
                const closedPercent = Math.round((summary.closed_ports / totalPorts) * 100);
                
                portPieChart = new Chart(portPieChartCtx, {
                    type: 'doughnut',
                    data: {
                        labels: [
                            `Open (${openPercent}%)`,
                            `Filtered (${filteredPercent}%)`,
                            `Closed (${closedPercent}%)`
                        ],
                        datasets: [{
                            data: [summary.open_ports, summary.filtered_ports, summary.closed_ports],
                            backgroundColor: [
                                '#3b82f6',   // Blue for open
                                '#1d4ed8',   // Dark blue for filtered
                                '#9ca3af'    // Gray for closed
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.label;
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                portPieChartCtx.clearRect(0, 0, portPieChartCtx.canvas.width, portPieChartCtx.canvas.height);
                portPieChartCtx.fillStyle = '#9ca3af';
                portPieChartCtx.textAlign = 'center';
                portPieChartCtx.fillText('No port data available', 
                    portPieChartCtx.canvas.width / 2, 
                    portPieChartCtx.canvas.height / 2);
            }
        }
        
        // Update line chart with historical data
        function updateLineChart(lineChartData) {
            lineChartContainer.classList.remove('hidden');
            
            // Destroy existing chart if it exists
            if (scanTrendsChart) {
                scanTrendsChart.destroy();
            }
            
            // Create a new image element
            const img = new Image();
            img.src = lineChartData;
            img.onload = () => {
                // Set canvas dimensions to fixed size
                const canvas = document.getElementById('scanTrendsChart');
                canvas.width = 800;  // Fixed width
                canvas.height = 300; // Fixed height
                
                scanTrendsCtx.clearRect(0, 0, canvas.width, canvas.height);
                scanTrendsCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
        }
        
        // Update scan history
        function updateHistory(history) {
            scanHistory.innerHTML = '';
            modalScanHistory.innerHTML = '';
            
            if (history.length === 0) {
                scanHistory.innerHTML = `
                    <tr>
                        <td colspan="6" class="py-4 text-center text-gray-500">
                            No scan history
                        </td>
                    </tr>
                `;
                modalScanHistory.innerHTML = `
                    <tr>
                        <td colspan="6" class="py-4 text-center text-gray-500">
                            No scan history
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Reverse to show latest first
            [...history].reverse().forEach(entry => {
                const row = document.createElement('tr');
                row.className = 'history-item border-b border-gray-200';
                row.dataset.id = entry.id;
                
                row.innerHTML = `
                    <td class="py-3 px-4">${entry.timestamp}</td>
                    <td class="py-3 px-4 font-mono">${entry.target}</td>
                    <td class="py-3 px-4">${entry.hosts_up}</td>
                    <td class="py-3 px-4">${entry.open_ports}</td>
                    <td class="py-3 px-4">${entry.filtered_ports}</td>
                    <td class="py-3 px-4">${entry.os_count}</td>
                `;
                
                // Add click event to load scan
                row.addEventListener('click', () => {
                    loadScan(entry.id);
                    historyModal.style.display = 'none';
                });
                
                scanHistory.appendChild(row.cloneNode(true));
                modalScanHistory.appendChild(row);
            });
        }
        
        // Show history modal
        function showHistoryModal() {
            historyModal.style.display = 'flex';
        }
        
        // Load a specific scan
        function loadScan(scanId) {
            // Show loading
            loadingIndicator.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            
            fetch(`/load-scan/${scanId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load scan');
                }
                return response.json();
            })
            .then(data => {
                loadingIndicator.classList.add('hidden');
                updateResults(data);
                resultsSection.classList.remove('hidden');
            })
            .catch(error => {
                loadingIndicator.classList.add('hidden');
                showError(error.message || 'Failed to load scan');
            });
        }
        
        // Apply results filter
        function applyResultsFilter() {
            currentFilters = {
                host: document.getElementById('hostFilter').value,
                os: document.getElementById('osFilter').value,
                openPorts: document.getElementById('openPortsFilter').checked,
                filteredPorts: document.getElementById('filteredPortsFilter').checked,
                closedPorts: document.getElementById('closedPortsFilter').checked,
                service: document.getElementById('serviceFilter').value
            };
            
            filterModal.style.display = 'none';
            alert('Filters applied! In a real implementation, this would filter the displayed results.');
        }
        
        // Reset results filter
        function resetResultsFilter() {
            document.getElementById('hostFilter').value = '';
            document.getElementById('osFilter').value = '';
            document.getElementById('openPortsFilter').checked = true;
            document.getElementById('filteredPortsFilter').checked = true;
            document.getElementById('closedPortsFilter').checked = true;
            document.getElementById('serviceFilter').value = '';
            
            currentFilters = {};
            filterModal.style.display = 'none';
            alert('Filters reset!');
        }
        
        // Save app settings
        function saveAppSettings() {
            const timeout = document.getElementById('timeoutSetting').value;
            const maxHistory = document.getElementById('maxHistorySetting').value;
            const scanOptions = document.getElementById('scanOptionsSetting').value;
            
            // In a real app, you would save these to a database or config file
            alert(`Settings saved!\nTimeout: ${timeout}s\nMax History: ${maxHistory}\nScan Options: ${scanOptions}`);
            settingsModal.style.display = 'none';
        }
        
        // Export results as PDF
        function exportResults() {
            // Get the HTML content to export
            const content = document.getElementById('resultsSection').cloneNode(true);
            
            // Create a temporary element to hold the export content
            const exportContent = document.createElement('div');
            
            // Reorganize content for PDF
            const summaryStats = content.querySelector('.grid');
            const hostResults = content.querySelector('.panel:first-child');
            const servicesDetected = content.querySelector('.panel:nth-child(2)');
            const lineChart = content.querySelector('.line-chart-container');
            const scanHistory = content.querySelector('.panel:last-child');
            
            // Create PDF structure
            exportContent.innerHTML = `
                <div class="p-8" style="font-family: Arial, sans-serif;">
                    <!-- Header -->
                    <div class="text-center mb-8">
                        <div class="flex items-center justify-center gap-3 mb-4">
                            <i class="fas fa-network-wired text-blue-500 text-4xl"></i>
                            <h1 class="text-4xl font-bold">Nmap Dashboard</h1>
                        </div>
                        <div class="text-sm text-gray-500 mb-2">
                            Scan Report - ${new Date().toLocaleString()}
                        </div>
                        <div class="text-sm font-mono">
                            Target: ${targetInput.value}
                        </div>
                    </div>
                    
                    <!-- Summary Stats -->
                    <div class="mb-8">
                        <h2 class="text-xl font-semibold mb-4">Summary Statistics</h2>
                        ${summaryStats.outerHTML}
                    </div>
                    
                    <!-- Host Results -->
                    <div class="mb-8">
                        <h2 class="text-xl font-semibold mb-4">Host Results</h2>
                        ${hostResults.outerHTML}
                    </div>
                    
                    <!-- Services & Port Distribution -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <!-- Services Detected -->
                        <div>
                            <h2 class="text-xl font-semibold mb-4">Services Detected</h2>
                            ${servicesDetected.querySelector('#servicesDetected').outerHTML}
                        </div>
                        
                        <!-- Port Distribution -->
                        <div>
                            <h2 class="text-xl font-semibold mb-4">Port Status Distribution</h2>
                            <div style="height: 300px;">
                                ${servicesDetected.querySelector('#portPieChart').outerHTML}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Scan Trends -->
                    <div class="mb-8">
                        ${lineChart.outerHTML}
                    </div>
                    
                    <!-- Scan History -->
                    <div class="mb-8">
                        <h2 class="text-xl font-semibold mb-4">Scan History</h2>
                        ${scanHistory.outerHTML}
                    </div>
                </div>
            `;
            
            // Use html2pdf to generate PDF
            const opt = {
                margin: 1,
                filename: 'nmap_scan_report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            };
            
            html2pdf().set(opt).from(exportContent).save();
        }
        
        // Clear scan history
        function clearHistory() {
            if (confirm("Are you sure you want to clear the scan history?")) {
                fetch('/scan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'target=clear_history'
                })
                .then(() => {
                    scanHistory.innerHTML = `
                        <tr>
                            <td colspan="6" class="py-4 text-center text-gray-500">
                                No scan history
                            </td>
                        </tr>
                    `;
                    modalScanHistory.innerHTML = `
                        <tr>
                            <td colspan="6" class="py-4 text-center text-gray-500">
                                No scan history
                            </td>
                        </tr>
                    `;
                    lineChartContainer.classList.add('hidden');
                });
            }
        }
        
        // Show error message
        function showError(message) {
            errorMessage.textContent = `Error: ${message}`;
            errorMessage.classList.remove('hidden');
            emptyState.classList.remove('hidden');
        }
