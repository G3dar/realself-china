/**
 * Real Self China Partnership Microsite
 * Main JavaScript - i18n, Calculator, Charts
 */

// ========== Header Component ==========
const headerComponent = {
    render() {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;

        // Use different logo for home page vs inner pages
        const isHomePage = window.location.pathname.endsWith('home.html') ||
                          window.location.pathname.endsWith('/') ||
                          window.location.pathname === '';
        const logoImg = isHomePage
            ? '<img src="images/logo-black.jpg" alt="Real Self" class="logo__img" style="height: 28px;">'
            : '<img src="images/logo-rs-icon.png" alt="Real Self" class="logo__img">';

        placeholder.outerHTML = `
        <header class="header">
            <div class="container">
                <div class="header__inner">
                    <a href="home.html" class="logo">${logoImg}</a>
                    <nav class="nav">
                        <ul class="nav__list">
                            <li><a href="experience.html" class="nav__link" data-i18n="nav.experience">Experience</a></li>
                            <li><a href="script.html" class="nav__link" data-i18n="nav.script">Script</a></li>
                            <li><a href="investment.html" class="nav__link" data-i18n="nav.scenarios">Scenarios</a></li>
                            <li><a href="investment-requirements.html" class="nav__link" data-i18n="nav.investment">Investment</a></li>
                            <li><a href="partnership.html" class="nav__link" data-i18n="nav.partnership">Partnership</a></li>
                        </ul>
                        <div class="lang-toggle">
                            <button class="lang-toggle__btn active" data-lang="en">EN</button>
                            <button class="lang-toggle__btn" data-lang="zh">中文</button>
                        </div>
                        <button class="menu-toggle" aria-label="Toggle menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </nav>
                </div>
            </div>
        </header>`;
    }
};

// ========== i18n System ==========
const i18n = {
    currentLang: 'en',
    translations: {},

    async init() {
        // Check localStorage for saved language preference
        const savedLang = localStorage.getItem('realself-lang');
        if (savedLang && ['en', 'zh'].includes(savedLang)) {
            this.currentLang = savedLang;
        }

        // Load translations
        await this.loadTranslations('en');
        await this.loadTranslations('zh');

        // Update UI
        this.updateLanguageToggle();
        this.translatePage();

        // Setup language toggle listeners
        this.setupToggleListeners();
    },

    async loadTranslations(lang) {
        try {
            const response = await fetch(`./i18n/${lang}.json`);
            this.translations[lang] = await response.json();
        } catch (error) {
            console.error(`Failed to load ${lang} translations:`, error);
        }
    },

    setupToggleListeners() {
        document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.setLanguage(lang);
            });
        });
    },

    setLanguage(lang) {
        if (!['en', 'zh'].includes(lang)) return;

        this.currentLang = lang;
        localStorage.setItem('realself-lang', lang);
        this.updateLanguageToggle();
        this.translatePage();

        // Trigger custom event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    },

    updateLanguageToggle() {
        document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });
    },

    translatePage() {
        const t = this.translations[this.currentLang];
        if (!t) return;

        // Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const value = this.getNestedValue(t, key);
            if (value) {
                el.textContent = value;
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            const value = this.getNestedValue(t, key);
            if (value) {
                el.placeholder = value;
            }
        });

        // Update document lang attribute
        document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en';
    },

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) =>
            current && current[key] !== undefined ? current[key] : null, obj);
    },

    t(key) {
        return this.getNestedValue(this.translations[this.currentLang], key) || key;
    }
};

// ========== Header Scroll Effect ==========
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

// ========== Mobile Menu ==========
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        toggle.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            toggle.classList.remove('active');
        });
    });
}

// ========== Calculator ==========
const calculator = {
    chart: null,
    config: {
        // Constants
        sqmPerPerson: 1.2, // Square meters per person
        projectorCoverage: 12, // m² per projector from 5m height
        weeksPerMonth: 4.33, // Average weeks per month

        // Revenue Share (Updated: 70/30)
        partnerSharePercent: 0.70,
        realSelfSharePercent: 0.30,

        // Pricing (USD)
        ticketPriceUSD: 32, // Base ticket price
        vipUpgradePrice: 45, // VIP upgrade price
        merchAvgPrice: 6, // Average merchandise price
        concessionsPrice: 5, // Food/drinks average
        photoboothPrice: 4, // Photobooth price
        corporateEventPrice: 45, // Corporate event per person

        // Conversion rates
        vipConversionRate: 0.10, // 10% of audience upgrades to VIP
        merchConversionRate: 0.70, // 70% buy merch
        concessionsConversionRate: 0.70, // 70% buy food/drinks
        photoboothConversionRate: 0.13, // 13% use photobooth
        corporateWeeklyPax: 200, // 200 people/week for corporate events

        // Operating costs
        maskCostPerUnit: 1.50, // $1.50 per mask
        costumeCostPerUnit: 4.50, // $4.50 per costume replacement
        staffCostPerDay: 50, // $50 per staff per day
        staffRatio: 25, // 1 staff per 25 people
        managementWeekly: 4800, // $4,800/week (producer + 2 techs)
        marketingPercent: 0.10, // 10% of ticket revenue
        insuranceMiscWeekly: 3000, // $3,000/week

        // Investment ranges by capacity
        getInvestmentRange(capacity) {
            if (capacity <= 150) {
                return { min: 236000, max: 400000, projectors: { min: 16, max: 18 } };
            } else if (capacity <= 250) {
                return { min: 320000, max: 550000, projectors: { min: 26, max: 30 } };
            } else {
                return { min: 420000, max: 750000, projectors: { min: 36, max: 42 } };
            }
        }
    },

    init() {
        this.bindInputs();
        this.bindToggles();
        this.initExpandableSections();
        this.calculate();
        this.initChart();

        // Listen for language changes
        document.addEventListener('languageChanged', () => {
            this.updateChart();
        });
    },

    bindInputs() {
        const inputs = [
            'capacity', 'ticketPrice', 'daysPerWeek', 'showsPerDay',
            'occupancy', 'costumeReplacement', 'maskReplacement',
            'vipPrice', 'merchConversion'
        ];

        inputs.forEach(id => {
            const input = document.getElementById(id);
            const display = document.getElementById(`${id}Value`);

            if (input && display) {
                // Initial display
                this.updateDisplay(input, display);

                // Update on input
                input.addEventListener('input', () => {
                    this.updateDisplay(input, display);
                    this.calculate();
                });
            }
        });
    },

    bindToggles() {
        const corporateToggle = document.getElementById('corporateEventsToggle');
        if (corporateToggle) {
            corporateToggle.addEventListener('change', () => {
                this.calculate();
            });
        }
    },

    initExpandableSections() {
        const expandBtns = document.querySelectorAll('.expand-btn');
        expandBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = document.getElementById(btn.dataset.target);
                if (target) {
                    target.classList.toggle('expanded');
                    btn.classList.toggle('active');
                }
            });
        });
    },

    updateDisplay(input, display) {
        const id = input.id;
        let value = input.value;

        switch(id) {
            case 'capacity':
                display.textContent = `${value} ${i18n.t('scenarios.inputs.capacityUnit')}`;
                break;
            case 'ticketPrice':
                display.textContent = `$${value} USD`;
                break;
            case 'daysPerWeek':
                display.textContent = `${value} ${i18n.t('scenarios.inputs.daysUnit')}`;
                break;
            case 'showsPerDay':
                display.textContent = value;
                break;
            case 'occupancy':
            case 'costumeReplacement':
            case 'maskReplacement':
            case 'merchConversion':
                display.textContent = `${value}%`;
                break;
            case 'vipPrice':
                display.textContent = `$${value} USD`;
                break;
        }
    },

    getValues() {
        return {
            capacity: parseInt(document.getElementById('capacity')?.value || 250),
            ticketPrice: parseInt(document.getElementById('ticketPrice')?.value || 32),
            daysPerWeek: parseInt(document.getElementById('daysPerWeek')?.value || 4),
            showsPerDay: parseInt(document.getElementById('showsPerDay')?.value || 3),
            occupancy: parseInt(document.getElementById('occupancy')?.value || 70) / 100,
            costumeReplacement: parseInt(document.getElementById('costumeReplacement')?.value || 25) / 100,
            maskReplacement: parseInt(document.getElementById('maskReplacement')?.value || 100) / 100,
            vipPrice: parseInt(document.getElementById('vipPrice')?.value || 45),
            merchConversion: parseInt(document.getElementById('merchConversion')?.value || 70) / 100,
            corporateEvents: document.getElementById('corporateEventsToggle')?.checked || false
        };
    },

    calculate() {
        const v = this.getValues();
        const cfg = this.config;

        // Calculate area needed
        const areaSqm = Math.ceil(v.capacity * cfg.sqmPerPerson);

        // Calculate projectors needed
        const projectorsNeeded = Math.ceil(areaSqm / cfg.projectorCoverage);

        // Get investment range
        const investment = cfg.getInvestmentRange(v.capacity);
        const avgInvestment = (investment.min + investment.max) / 2;

        // Weekly calculations
        const ticketsPerWeek = v.capacity * v.showsPerDay * v.daysPerWeek * v.occupancy;

        // === WEEKLY REVENUE ===
        // Ticket revenue
        const weeklyTicketRevenue = ticketsPerWeek * v.ticketPrice;

        // VIP upgrades (10% of audience)
        const weeklyVipRevenue = ticketsPerWeek * cfg.vipConversionRate * v.vipPrice;

        // Additional revenue streams
        const weeklyMerchRevenue = ticketsPerWeek * v.merchConversion * cfg.merchAvgPrice;
        const weeklyConcessionsRevenue = ticketsPerWeek * cfg.concessionsConversionRate * cfg.concessionsPrice;
        const weeklyPhotoboothRevenue = ticketsPerWeek * cfg.photoboothConversionRate * cfg.photoboothPrice;

        // Corporate events (optional)
        const weeklyCorporateRevenue = v.corporateEvents ? cfg.corporateWeeklyPax * cfg.corporateEventPrice : 0;

        // Total weekly revenue
        const weeklyAdditionalRevenue = weeklyMerchRevenue + weeklyConcessionsRevenue + weeklyPhotoboothRevenue;
        const weeklyGrossRevenue = weeklyTicketRevenue + weeklyVipRevenue + weeklyAdditionalRevenue + weeklyCorporateRevenue;

        // === WEEKLY COSTS ===
        // Masks: tickets × mask_replacement% × $1.50
        const weeklyMaskCost = ticketsPerWeek * v.maskReplacement * cfg.maskCostPerUnit;

        // Costumes: tickets × costume_replacement% × $4.50
        const weeklyCostumeCost = ticketsPerWeek * v.costumeReplacement * cfg.costumeCostPerUnit;

        // Staff: (capacity/25) × days × shows × $50
        const staffNeeded = Math.ceil(v.capacity / cfg.staffRatio);
        const weeklyStaffCost = staffNeeded * v.daysPerWeek * v.showsPerDay * cfg.staffCostPerDay;

        // Management: $4,800 fixed per week
        const weeklyManagementCost = cfg.managementWeekly;

        // Marketing: 10% of ticket revenue
        const weeklyMarketingCost = weeklyTicketRevenue * cfg.marketingPercent;

        // Insurance & Misc: $3,000 fixed per week
        const weeklyInsuranceCost = cfg.insuranceMiscWeekly;

        // Total weekly costs
        const weeklyOperatingCosts = weeklyMaskCost + weeklyCostumeCost + weeklyStaffCost +
                                     weeklyManagementCost + weeklyMarketingCost + weeklyInsuranceCost;

        // Weekly profit (before revenue share)
        const weeklyGrossProfit = weeklyGrossRevenue - weeklyOperatingCosts;

        // === REVENUE SHARE ===
        // Partner (70%): (gross - costs) × 0.70
        const weeklyPartnerShare = weeklyGrossProfit * cfg.partnerSharePercent;

        // Real Self (30%): gross × 0.30
        const weeklyRealSelfShare = weeklyGrossRevenue * cfg.realSelfSharePercent;

        // === MONTHLY CALCULATIONS ===
        const monthlyGrossRevenue = weeklyGrossRevenue * cfg.weeksPerMonth;
        const monthlyOperatingCosts = weeklyOperatingCosts * cfg.weeksPerMonth;
        const monthlyPartnerShare = weeklyPartnerShare * cfg.weeksPerMonth;
        const monthlyRealSelfShare = weeklyRealSelfShare * cfg.weeksPerMonth;

        // Breakeven calculation (months)
        const breakevenMonths = weeklyPartnerShare > 0 ? Math.ceil(avgInvestment / (weeklyPartnerShare * cfg.weeksPerMonth)) : 999;

        // Annual revenue
        const annualPartnerRevenue = monthlyPartnerShare * 12;
        const annualRealSelfRevenue = monthlyRealSelfShare * 12;

        // Store detailed results for PDF export
        this.lastCalculation = {
            // Inputs
            inputs: v,
            // Revenue breakdown (weekly)
            weeklyTicketRevenue,
            weeklyVipRevenue,
            weeklyMerchRevenue,
            weeklyConcessionsRevenue,
            weeklyPhotoboothRevenue,
            weeklyCorporateRevenue,
            weeklyAdditionalRevenue,
            weeklyGrossRevenue,
            // Costs breakdown (weekly)
            weeklyMaskCost,
            weeklyCostumeCost,
            weeklyStaffCost,
            weeklyManagementCost,
            weeklyMarketingCost,
            weeklyInsuranceCost,
            weeklyOperatingCosts,
            // Profit split
            weeklyPartnerShare,
            weeklyRealSelfShare,
            monthlyGrossRevenue,
            monthlyOperatingCosts,
            monthlyPartnerShare,
            monthlyRealSelfShare,
            annualPartnerRevenue,
            annualRealSelfRevenue
        };

        // Update UI
        this.updateResults({
            areaSqm,
            projectorsNeeded,
            investment,
            ticketsPerWeek,
            weeklyGrossRevenue,
            weeklyTicketRevenue,
            weeklyVipRevenue,
            weeklyAdditionalRevenue,
            weeklyCorporateRevenue,
            weeklyOperatingCosts,
            weeklyPartnerShare,
            weeklyRealSelfShare,
            monthlyGrossRevenue,
            monthlyPartnerShare,
            breakevenMonths,
            annualPartnerRevenue,
            annualRealSelfRevenue
        });

        // Update chart
        this.updateChart();

        return {
            ticketsPerWeek,
            weeklyGrossRevenue,
            monthlyGrossRevenue,
            monthlyPartnerShare,
            monthlyRealSelfShare
        };
    },

    updateResults(results) {
        const formatCurrency = (num) => {
            if (num >= 1000000) {
                return `$${(num / 1000000).toFixed(1)}M`;
            }
            return `$${Math.round(num).toLocaleString()}`;
        };

        // Update result cards
        const elements = {
            'resultArea': `${results.areaSqm} m²`,
            'resultProjectors': `${results.projectorsNeeded}`,
            'resultInvestment': `${formatCurrency(results.investment.min)} - ${formatCurrency(results.investment.max)}`,
            'resultTicketsPerWeek': `${Math.round(results.ticketsPerWeek).toLocaleString()}`,
            'resultWeeklyRevenue': formatCurrency(results.weeklyGrossRevenue),
            'resultWeeklyTickets': formatCurrency(results.weeklyTicketRevenue),
            'resultWeeklyVip': formatCurrency(results.weeklyVipRevenue),
            'resultWeeklyAdditional': formatCurrency(results.weeklyAdditionalRevenue),
            'resultWeeklyCorporate': formatCurrency(results.weeklyCorporateRevenue),
            'resultWeeklyCosts': formatCurrency(results.weeklyOperatingCosts),
            'resultPartnerShare': formatCurrency(results.monthlyPartnerShare),
            'resultRealSelfShare': formatCurrency(results.monthlyRealSelfShare),
            'resultBreakeven': `${results.breakevenMonths} ${i18n.t('scenarios.results.months')}`,
            'resultAnnualPartner': formatCurrency(results.annualPartnerRevenue),
            'resultAnnualRealSelf': formatCurrency(results.annualRealSelfRevenue)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    },

    initChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const chartConfig = this.getChartConfig();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: chartConfig.data,
            options: chartConfig.options
        });
    },

    getChartConfig() {
        const v = this.getValues();
        const calc = this.lastCalculation || this.calculate();
        const months = i18n.currentLang === 'zh'
            ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Generate 12-month projection with slight variation (ramp-up in first months)
        const grossData = [];
        const partnerData = [];
        const realSelfData = [];
        const occupancyVariation = [0.6, 0.7, 0.8, 0.9, 0.95, 1.0, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75];

        for (let i = 0; i < 12; i++) {
            const monthGross = calc.monthlyGrossRevenue * occupancyVariation[i];
            const monthCosts = calc.monthlyOperatingCosts * occupancyVariation[i];
            const monthProfit = monthGross - monthCosts;
            grossData.push(Math.round(monthGross));
            partnerData.push(Math.round(monthProfit * this.config.partnerSharePercent));
            realSelfData.push(Math.round(monthGross * this.config.realSelfSharePercent));
        }

        return {
            data: {
                labels: months,
                datasets: [
                    {
                        label: i18n.t('scenarios.chart.gross'),
                        data: grossData,
                        borderColor: '#ffffff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: i18n.t('scenarios.chart.partner'),
                        data: partnerData,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: i18n.t('scenarios.chart.realself'),
                        data: realSelfData,
                        borderColor: '#737373',
                        backgroundColor: 'rgba(115, 115, 115, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a3a3a3',
                            font: {
                                family: "'Inter', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#262626',
                        titleColor: '#ffffff',
                        bodyColor: '#a3a3a3',
                        borderColor: '#404040',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#262626'
                        },
                        ticks: {
                            color: '#737373'
                        }
                    },
                    y: {
                        grid: {
                            color: '#262626'
                        },
                        ticks: {
                            color: '#737373',
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return '$' + (value / 1000000).toFixed(1) + 'M';
                                }
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                        }
                    }
                }
            }
        };
    },

    updateChart() {
        if (!this.chart) return;

        const config = this.getChartConfig();
        this.chart.data = config.data;
        this.chart.options = config.options;
        this.chart.update();
    }
};

// ========== PDF Export ==========
function initPdfExport() {
    const btn = document.getElementById('exportPdf');
    if (!btn) return;

    btn.addEventListener('click', () => {
        // Create printable content
        const v = calculator.getValues();
        const calc = calculator.lastCalculation || calculator.calculate();

        const formatCurrency = (num) => `$${Math.round(num).toLocaleString()}`;

        const content = `
            <html>
            <head>
                <title>Real Self - Partnership Proposal</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
                    h2 { margin-top: 30px; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #f5f5f5; }
                    .highlight { font-weight: bold; font-size: 1.1em; background: #f0f9ff; }
                    .section { margin: 25px 0; }
                    .two-col { display: flex; gap: 20px; }
                    .two-col > div { flex: 1; }
                    .total-row { background: #e8e8e8; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Real Self China Partnership Proposal</h1>
                <p>Generated: ${new Date().toLocaleDateString()}</p>
                <p style="background: #fff3cd; padding: 10px; border-radius: 4px;"><strong>Revenue Share:</strong> Partner 70% / Real Self 30%</p>

                <h2>Venue Configuration</h2>
                <table>
                    <tr><td>Capacity</td><td>${v.capacity} people</td></tr>
                    <tr><td>Ticket Price</td><td>$${v.ticketPrice} USD</td></tr>
                    <tr><td>VIP Upgrade Price</td><td>$${v.vipPrice} USD</td></tr>
                    <tr><td>Days per Week</td><td>${v.daysPerWeek}</td></tr>
                    <tr><td>Shows per Day</td><td>${v.showsPerDay}</td></tr>
                    <tr><td>Expected Occupancy</td><td>${v.occupancy * 100}%</td></tr>
                    <tr><td>Corporate Events</td><td>${v.corporateEvents ? 'Yes (200 pax/week)' : 'No'}</td></tr>
                </table>

                <h2>Weekly Revenue Breakdown</h2>
                <table>
                    <tr><td>Ticket Sales</td><td>${formatCurrency(calc.weeklyTicketRevenue)}</td></tr>
                    <tr><td>VIP Upgrades (10%)</td><td>${formatCurrency(calc.weeklyVipRevenue)}</td></tr>
                    <tr><td>Merchandise (${v.merchConversion * 100}%)</td><td>${formatCurrency(calc.weeklyMerchRevenue)}</td></tr>
                    <tr><td>Concessions/Afterparty (70%)</td><td>${formatCurrency(calc.weeklyConcessionsRevenue)}</td></tr>
                    <tr><td>Photobooth (13%)</td><td>${formatCurrency(calc.weeklyPhotoboothRevenue)}</td></tr>
                    ${v.corporateEvents ? `<tr><td>Corporate Events</td><td>${formatCurrency(calc.weeklyCorporateRevenue)}</td></tr>` : ''}
                    <tr class="total-row"><td>Total Weekly Revenue</td><td>${formatCurrency(calc.weeklyGrossRevenue)}</td></tr>
                </table>

                <h2>Weekly Operating Costs</h2>
                <table>
                    <tr><td>Masks (${v.maskReplacement * 100}% replacement @ $1.50/ea)</td><td>${formatCurrency(calc.weeklyMaskCost)}</td></tr>
                    <tr><td>Costumes (${v.costumeReplacement * 100}% replacement @ $4.50/ea)</td><td>${formatCurrency(calc.weeklyCostumeCost)}</td></tr>
                    <tr><td>Staff (1 per 25 people @ $50/day)</td><td>${formatCurrency(calc.weeklyStaffCost)}</td></tr>
                    <tr><td>Management (producer + 2 techs)</td><td>${formatCurrency(calc.weeklyManagementCost)}</td></tr>
                    <tr><td>Marketing (10% of ticket revenue)</td><td>${formatCurrency(calc.weeklyMarketingCost)}</td></tr>
                    <tr><td>Insurance & Miscellaneous</td><td>${formatCurrency(calc.weeklyInsuranceCost)}</td></tr>
                    <tr class="total-row"><td>Total Weekly Costs</td><td>${formatCurrency(calc.weeklyOperatingCosts)}</td></tr>
                </table>

                <h2>Revenue Share (Monthly)</h2>
                <table>
                    <tr><td>Monthly Gross Revenue</td><td>${formatCurrency(calc.monthlyGrossRevenue)}</td></tr>
                    <tr><td>Monthly Operating Costs</td><td>${formatCurrency(calc.monthlyOperatingCosts)}</td></tr>
                    <tr class="highlight"><td>Partner Share (70% of profit)</td><td>${formatCurrency(calc.monthlyPartnerShare)}</td></tr>
                    <tr><td>Real Self Share (30% of gross)</td><td>${formatCurrency(calc.monthlyRealSelfShare)}</td></tr>
                </table>

                <h2>Annual Projections</h2>
                <table>
                    <tr class="highlight"><td>Partner Annual Revenue</td><td>${formatCurrency(calc.annualPartnerRevenue)}</td></tr>
                    <tr><td>Real Self Annual Revenue</td><td>${formatCurrency(calc.annualRealSelfRevenue)}</td></tr>
                </table>

                <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                    <em>This is a preliminary projection based on the assumptions above. Final terms subject to negotiation.
                    Venue rent is not included as the partner provides the space.</em>
                </p>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    });
}

// ========== Contact Form ==========
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Here you would normally send to a backend
        // For now, show a success message
        alert(i18n.currentLang === 'zh'
            ? '感谢您的留言！我们将尽快与您联系。'
            : 'Thank you for your message! We will contact you soon.');

        form.reset();
    });
}

// ========== Animations ==========
function initAnimations() {
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ========== Active Navigation ==========
function initActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav__link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ========== Page Transitions ==========
function initPageTransitions() {
    // Remove transition class on page load (fixes back button blank screen)
    document.body.classList.remove('page-transitioning');

    // Handle bfcache (back-forward cache) - page restored from cache
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            document.body.classList.remove('page-transitioning');
        }
    });

    document.querySelectorAll('a[href$=".html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // Only apply transition to internal links (not external URLs)
            if (href && !href.startsWith('http') && !href.startsWith('//')) {
                e.preventDefault();
                document.body.classList.add('page-transitioning');
                setTimeout(() => {
                    window.location.href = href;
                }, 400);
            }
        });
    });
}

// ========== Page Prefetching ==========
const prefetcher = {
    pages: [
        'home.html',
        'experience.html',
        'script.html',
        'investment.html',
        'investment-requirements.html',
        'partnership.html'
    ],
    prefetched: new Set(),

    prefetchAll() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        this.pages.forEach(page => {
            if (page !== currentPage && !this.prefetched.has(page)) {
                this.prefetchPage(page);
            }
        });
    },

    prefetchPage(url) {
        if (this.prefetched.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        document.head.appendChild(link);
        this.prefetched.add(url);
    }
};

// Export for use in index.html
window.prefetcher = prefetcher;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Render header component if placeholder exists
    headerComponent.render();

    // Initialize i18n first
    await i18n.init();

    // Initialize other components
    initHeaderScroll();
    initMobileMenu();
    initActiveNav();
    initAnimations();
    initContactForm();
    initPdfExport();
    initPageTransitions();

    // Initialize calculator if on scenarios page
    if (document.getElementById('calculator')) {
        calculator.init();
    }

    // Prefetch other pages after a short delay (don't block initial render)
    setTimeout(() => {
        prefetcher.prefetchAll();
    }, 1000);
});

// Export for global access
window.i18n = i18n;
window.calculator = calculator;
