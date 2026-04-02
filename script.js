/*  CURRENCY CONVERSION */

let exchangeRate = 83; // fallback INR

async function fetchExchangeRate() {
    try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await res.json();
        exchangeRate = data.rates.INR;
        console.log("Live INR Rate:", exchangeRate);
    } catch (err) {
        console.log("Using fallback INR rate");
    }
}

function toINR(usd) {
    return (usd * exchangeRate).toFixed(2);
}

/*  PRICING DATA */

const pricing = {
    aws: { hot: 0.023, cool: 0.0125, archive: 0.0024, dataOut: 0.09 },
    azure: { hot: 0.0208, cool: 0.01, archive: 0.0018, dataOut: 0.087 },
    gcp: { hot: 0.020, cool: 0.01, archive: 0.0015, dataOut: 0.12 }
};

let currentPlatform = 'aws';
let duration = 'monthly';
let comparisonChart = null;

/*  INIT */

document.addEventListener('DOMContentLoaded', async function () {
    await fetchExchangeRate(); // 🔥 important
    initApp();
});

function initApp() {
    setupEventListeners();
    calculateAll();
}

/*  EVENTS  */

function setupEventListeners() {
    // Platform switch
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentPlatform = e.target.dataset.platform;
            calculateAll();
        });
    });

    // Inputs
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calculateAll);
    });
}

/*  MAIN CALCULATION */

function calculateAll() {
    calculateMainCosts();
    updateTable();
    updateChart();
}

function calculateMainCosts() {
    const storage = parseFloat(document.getElementById('storage')?.value) || 100;
    const computeHours = parseFloat(document.getElementById('computeHours')?.value) || 730;
    const computeRate = parseFloat(document.getElementById('computeRate')?.value) || 0.10;
    const dataOut = parseFloat(document.getElementById('dataOut')?.value) || 50;

    const rates = pricing[currentPlatform];

    const storageCost = storage * rates.hot;
    const computeCost = computeHours * computeRate;
    const dataCost = dataOut * rates.dataOut;
    const total = storageCost + computeCost + dataCost;

    document.getElementById('storageCost').textContent =
        `$${storageCost.toFixed(2)} / ₹${toINR(storageCost)}`;

    document.getElementById('computeCost').textContent =
        `$${computeCost.toFixed(2)} / ₹${toINR(computeCost)}`;

    document.getElementById('dataTransferCost').textContent =
        `$${dataCost.toFixed(2)} / ₹${toINR(dataCost)}`;

    document.getElementById('totalCost').textContent =
        `$${total.toFixed(2)} / ₹${toINR(total)}`;
}

/* TABLE */

function updateTable() {
    const storageGB = parseFloat(document.getElementById('storage')?.value) || 100;
    const multiplier = duration === 'yearly' ? 12 : 1;

    const tbody = document.getElementById('costTableBody');
    if (!tbody) return;

    const format = (val) => `$${val.toFixed(2)} | ₹${toINR(val)}`;

    tbody.innerHTML = `
        <tr>
            <td><strong>HOT</strong></td>
            <td>${storageGB} GB</td>
            <td>
                <div class="price-comparison">
                    <span>${format(storageGB * pricing.aws.hot * multiplier)}</span>
                    <span>${format(storageGB * pricing.azure.hot * multiplier)}</span>
                    <span>${format(storageGB * pricing.gcp.hot * multiplier)}</span>
                </div>
            </td>
            <td>⚡ ms</td>
        </tr>
        <tr>
            <td><strong>COOL</strong></td>
            <td>${storageGB} GB</td>
            <td>
                <div class="price-comparison">
                    <span>${format(storageGB * pricing.aws.cool * multiplier)}</span>
                    <span>${format(storageGB * pricing.azure.cool * multiplier)}</span>
                    <span>${format(storageGB * pricing.gcp.cool * multiplier)}</span>
                </div>
            </td>
            <td>⏱️ sec</td>
        </tr>
        <tr>
            <td><strong>ARCHIVE</strong></td>
            <td>${storageGB} GB</td>
            <td>
                <div class="price-comparison">
                    <span>${format(storageGB * pricing.aws.archive * multiplier)}</span>
                    <span>${format(storageGB * pricing.azure.archive * multiplier)}</span>
                    <span>${format(storageGB * pricing.gcp.archive * multiplier)}</span>
                </div>
            </td>
            <td>🕐 hours</td>
        </tr>
    `;
}

/*  CHART  */

function updateChart() {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const storageGB = parseFloat(document.getElementById('storage')?.value) || 100;
    const multiplier = duration === 'yearly' ? 12 : 1;

    // Calculate values
    const awsData = [
        storageGB * pricing.aws.hot * multiplier,
        storageGB * pricing.aws.cool * multiplier,
        storageGB * pricing.aws.archive * multiplier
    ];

    const azureData = [
        storageGB * pricing.azure.hot * multiplier,
        storageGB * pricing.azure.cool * multiplier,
        storageGB * pricing.azure.archive * multiplier
    ];

    const gcpData = [
        storageGB * pricing.gcp.hot * multiplier,
        storageGB * pricing.gcp.cool * multiplier,
        storageGB * pricing.gcp.archive * multiplier
    ];

    //  Gradient (3D feel)
    const gradientRed = ctx.createLinearGradient(0, 0, 0, 400);
    gradientRed.addColorStop(0, "#ff6b6b");
    gradientRed.addColorStop(1, "#c0392b");

    const gradientBlue = ctx.createLinearGradient(0, 0, 0, 400);
    gradientBlue.addColorStop(0, "#4facfe");
    gradientBlue.addColorStop(1, "#1e3c72");

    const gradientGreen = ctx.createLinearGradient(0, 0, 0, 400);
    gradientGreen.addColorStop(0, "#43e97b");
    gradientGreen.addColorStop(1, "#11998e");

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['HOT', 'COOL', 'ARCHIVE'],
            datasets: [
                {
                    label: 'AWS ☁️',
                    data: awsData,
                    backgroundColor: gradientRed,
                    borderRadius: 12
                },
                {
                    label: 'Azure ⚡',
                    data: azureData,
                    backgroundColor: gradientBlue,
                    borderRadius: 12
                },
                {
                    label: 'GCP 🌿',
                    data: gcpData,
                    backgroundColor: gradientGreen,
                    borderRadius: 12
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const usd = context.raw;
                            const inr = usd * exchangeRate;

                            return ` $${usd.toFixed(2)} / ₹${inr.toFixed(2)}`;
                        }
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: '#00f7ff', // 🔵 Neon X-axis text
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                },

                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#ffcc00', // 🟡 Neon Y-axis text
                        callback: function(value) {
                            return '$' + value;
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            },

            animation: {
                duration: 1200,
                easing: 'easeOutBounce'
            }
        },

        plugins: [
            {
                // 💥 3D SHADOW EFFECT
                id: 'shadow3d',
                beforeDatasetDraw(chart, args) {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.6)';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 5;
                    ctx.shadowOffsetY = 5;
                },
                afterDatasetDraw(chart, args) {
                    chart.ctx.restore();
                }
            }
        ]
    });
}

/*  RESET  */

function resetCalculator() {
    document.getElementById('storage').value = 100;
    document.getElementById('computeHours').value = 730;
    document.getElementById('computeRate').value = 0.10;
    document.getElementById('dataOut').value = 50;
    calculateAll();
}

/* REAL-TIME SECTION */

let realTimeChart;
let selectedDuration = 'weekly';

const rtPricing = {
    aws: 0.023,
    azure: 0.0208,
    gcp: 0.020
};

const durationMultiplier = {
    weekly: 0.25,
    monthly: 1,
    yearly: 12
};

window.addEventListener('load', () => {
    setupRealTimeSection();
});

function setupRealTimeSection() {
    const buttons = document.querySelectorAll('.duration-btn');
    const input = document.getElementById('storageInput');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDuration = btn.dataset.duration;
            updateRealTimeChart();
        });
    });

    input.addEventListener('input', updateRealTimeChart);

    initRealTimeChart();
    updateRealTimeChart();
}

function initRealTimeChart() {
    const ctx = document.getElementById('realTimeChart').getContext('2d');

    realTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['AWS ☁️', 'Azure ⚡', 'GCP 🌿'],
            datasets: [{
                label: 'Cost ($ / ₹)',
                data: [0, 0, 0],
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                borderColor: '#00f7ff',
                backgroundColor: 'rgba(0,247,255,0.15)',
                pointBackgroundColor: '#ffcc00',
                pointBorderColor: '#ffffff',
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const usd = context.raw;
                            const inr = usd * exchangeRate;

                            return ` $${usd.toFixed(2)} / ₹${inr.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#4facfe', // 🔵 blue labels
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#e4e4e4', // 🟡 yellow labels
                        callback: function(value) {
                            return '$' + value;
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            }
        }
    });
}

function updateRealTimeChart() {
    const storage = parseFloat(document.getElementById('storageInput').value) || 0;
    const multiplier = durationMultiplier[selectedDuration];

    const awsCost = storage * rtPricing.aws * multiplier;
    const azureCost = storage * rtPricing.azure * multiplier;
    const gcpCost = storage * rtPricing.gcp * multiplier;

    // Update chart
    realTimeChart.data.datasets[0].data = [
        awsCost,
        azureCost,
        gcpCost
    ];

    realTimeChart.update();

    // Update total cost display (₹ + $)
    const totalUSD = awsCost + azureCost + gcpCost;
    const totalINR = totalUSD * exchangeRate;

    document.getElementById('liveCost').innerText =
        `Total Cost: $${totalUSD.toFixed(2)} / ₹${totalINR.toFixed(2)}`;
}