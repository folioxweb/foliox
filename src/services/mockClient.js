/**
 * Mock API Client
 * 
 * Returns mock data with artificial delay to simulate network latency.
 * Updates local in-memory arrays so additions/edits persist during the session.
 */

import stocksData from './mockData/stocks.json';
import etfsData from './mockData/etfs.json';
import mutualfundsData from './mockData/mutualfunds.json';
import fdsData from './mockData/fds.json';

// In-memory data store initialized from JSON files
let stocks = [...stocksData];
let etfs = [...etfsData];
let mutualFunds = [...mutualfundsData];
let fds = [...fdsData];

// ── Mock News Data ─────────────────────────────────────────────────────────────
const MOCK_NEWS = [
  {
    guid: 'mock-news-001',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank',
    title: 'HDFC Bank Penalizes MD, CFO in MSRDC Case',
    source: 'Rediff MoneyWiz',
    publishedAt: '2026-07-27T14:32:18',
    publishedDate: '2026-07-27',
    publishedTime: '14:32:18',
    link: 'https://economictimes.indiatimes.com/markets/stocks/news/hdfc-bank',
    retrievedAt: '2026-07-27T14:35:07',
    retrievedDate: '2026-07-27',
    retrievedTime: '14:35:07',
    isRead: false,
    category: 'Regulatory',
  },
  {
    guid: 'mock-news-002',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank',
    title: 'HDFC Bank Q1 FY27 Net Profit Rises 12% YoY to ₹17,200 Crore',
    source: 'Mint',
    publishedAt: '2026-07-26T10:15:00',
    publishedDate: '2026-07-26',
    publishedTime: '10:15:00',
    link: 'https://livemint.com/market/stock-market-news/hdfc-bank-q1',
    retrievedAt: '2026-07-26T10:20:00',
    retrievedDate: '2026-07-26',
    retrievedTime: '10:20:00',
    isRead: true,
    category: 'Earnings',
  },
  {
    guid: 'mock-news-003',
    symbol: 'TCS',
    company: 'Tata Consultancy Services',
    title: 'TCS Bags $1.5 Billion Deal from European Banking Consortium',
    source: 'Economic Times',
    publishedAt: '2026-07-27T11:45:00',
    publishedDate: '2026-07-27',
    publishedTime: '11:45:00',
    link: 'https://economictimes.indiatimes.com/tech/tcs-deal',
    retrievedAt: '2026-07-27T11:50:00',
    retrievedDate: '2026-07-27',
    retrievedTime: '11:50:00',
    isRead: false,
    category: 'Deal',
  },
  {
    guid: 'mock-news-004',
    symbol: 'TCS',
    company: 'Tata Consultancy Services',
    title: 'TCS Hiring 40,000 Freshers in FY27; Campus Recruitment Drive Begins',
    source: 'Business Standard',
    publishedAt: '2026-07-25T09:00:00',
    publishedDate: '2026-07-25',
    publishedTime: '09:00:00',
    link: 'https://business-standard.com/companies/news/tcs-hiring',
    retrievedAt: '2026-07-25T09:05:00',
    retrievedDate: '2026-07-25',
    retrievedTime: '09:05:00',
    isRead: true,
    category: 'HR',
  },
  {
    guid: 'mock-news-005',
    symbol: 'RELIANCE',
    company: 'Reliance Industries',
    title: 'Reliance Jio Launches 6G Trials in Mumbai, Delhi and Bengaluru',
    source: 'NDTV Profit',
    publishedAt: '2026-07-27T08:30:00',
    publishedDate: '2026-07-27',
    publishedTime: '08:30:00',
    link: 'https://ndtvprofit.com/business/reliance-jio-6g',
    retrievedAt: '2026-07-27T08:35:00',
    retrievedDate: '2026-07-27',
    retrievedTime: '08:35:00',
    isRead: false,
    category: 'Technology',
  },
  {
    guid: 'mock-news-006',
    symbol: 'RELIANCE',
    company: 'Reliance Industries',
    title: 'Reliance Retail Posts Record Revenue of ₹3.2 Lakh Crore in FY27',
    source: 'Moneycontrol',
    publishedAt: '2026-07-24T16:00:00',
    publishedDate: '2026-07-24',
    publishedTime: '16:00:00',
    link: 'https://moneycontrol.com/news/business/reliance-retail',
    retrievedAt: '2026-07-24T16:05:00',
    retrievedDate: '2026-07-24',
    retrievedTime: '16:05:00',
    isRead: true,
    category: 'Earnings',
  },
  {
    guid: 'mock-news-007',
    symbol: 'INFY',
    company: 'Infosys',
    title: 'Infosys Raises FY27 Revenue Guidance to 8-10% in Constant Currency',
    source: 'Reuters India',
    publishedAt: '2026-07-27T13:00:00',
    publishedDate: '2026-07-27',
    publishedTime: '13:00:00',
    link: 'https://reuters.com/business/infosys-guidance',
    retrievedAt: '2026-07-27T13:05:00',
    retrievedDate: '2026-07-27',
    retrievedTime: '13:05:00',
    isRead: false,
    category: 'Guidance',
  },
  {
    guid: 'mock-news-008',
    symbol: 'WIPRO',
    company: 'Wipro',
    title: 'Wipro Acquires AI Startup Neuron Labs for $280 Million',
    source: 'Financial Express',
    publishedAt: '2026-07-26T14:20:00',
    publishedDate: '2026-07-26',
    publishedTime: '14:20:00',
    link: 'https://financialexpress.com/market/wipro-acquisition',
    retrievedAt: '2026-07-26T14:25:00',
    retrievedDate: '2026-07-26',
    retrievedTime: '14:25:00',
    isRead: false,
    category: 'Acquisition',
  },
  {
    guid: 'mock-news-009',
    symbol: 'ICICIBANK',
    company: 'ICICI Bank',
    title: 'ICICI Bank Expands Digital Lending Platform; Eyes 20 Million New Customers',
    source: 'The Hindu BusinessLine',
    publishedAt: '2026-07-27T09:45:00',
    publishedDate: '2026-07-27',
    publishedTime: '09:45:00',
    link: 'https://thehindubusinessline.com/icici-bank-digital',
    retrievedAt: '2026-07-27T09:50:00',
    retrievedDate: '2026-07-27',
    retrievedTime: '09:50:00',
    isRead: false,
    category: '',
  },
  {
    guid: 'mock-news-010',
    symbol: 'AXISBANK',
    company: 'Axis Bank',
    title: 'Axis Bank to Raise ₹12,000 Crore Via QIP; Board Approves Resolution',
    source: 'Mint',
    publishedAt: '2026-07-26T17:30:00',
    publishedDate: '2026-07-26',
    publishedTime: '17:30:00',
    link: 'https://livemint.com/market/axis-bank-qip',
    retrievedAt: '2026-07-26T17:35:00',
    retrievedDate: '2026-07-26',
    retrievedTime: '17:35:00',
    isRead: true,
    category: 'Capital',
  },
  {
    guid: 'mock-news-011',
    symbol: 'SBIN',
    company: 'State Bank of India',
    title: 'SBI to Launch Next-Gen UPI Platform with Real-Time Cross-Border Payments',
    source: 'ET Markets',
    publishedAt: '2026-07-27T07:00:00',
    publishedDate: '2026-07-27',
    publishedTime: '07:00:00',
    link: 'https://etmarkets.com/sbin-upi-platform',
    retrievedAt: '2026-07-27T07:05:00',
    retrievedDate: '2026-07-27',
    retrievedTime: '07:05:00',
    isRead: false,
    category: 'Technology',
  },
  {
    guid: 'mock-news-012',
    symbol: 'BAJFINANCE',
    company: 'Bajaj Finance',
    title: 'Bajaj Finance AUM Crosses ₹4 Lakh Crore; EMI Book Grows 28% YoY',
    source: 'CNBC-TV18',
    publishedAt: '2026-07-25T12:00:00',
    publishedDate: '2026-07-25',
    publishedTime: '12:00:00',
    link: 'https://cnbctv18.com/market/bajaj-finance-aum',
    retrievedAt: '2026-07-25T12:05:00',
    retrievedDate: '2026-07-25',
    retrievedTime: '12:05:00',
    isRead: true,
    category: 'Business',
  },
  {
    guid: 'mock-news-013',
    symbol: 'MARUTI',
    company: 'Maruti Suzuki India',
    title: 'Maruti Suzuki EVs to Hit Showrooms by Diwali 2026; Bookings Open Next Month',
    source: 'Auto Car India',
    publishedAt: '2026-07-23T10:00:00',
    publishedDate: '2026-07-23',
    publishedTime: '10:00:00',
    link: 'https://autocarindia.com/news/maruti-ev-launch',
    retrievedAt: '2026-07-23T10:05:00',
    retrievedDate: '2026-07-23',
    retrievedTime: '10:05:00',
    isRead: true,
    category: 'Product',
  },
  {
    guid: 'mock-news-014',
    symbol: 'TATAMOTORS',
    company: 'Tata Motors',
    title: 'Tata Motors JLR Delivers Record 1.2 Lakh Vehicles in Q1 FY27',
    source: 'Business Today',
    publishedAt: '2026-07-22T15:00:00',
    publishedDate: '2026-07-22',
    publishedTime: '15:00:00',
    link: 'https://businesstoday.in/tata-motors-jlr',
    retrievedAt: '2026-07-22T15:05:00',
    retrievedDate: '2026-07-22',
    retrievedTime: '15:05:00',
    isRead: true,
    category: 'Sales',
  },
  {
    guid: 'mock-news-015',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank',
    title: 'HDFC Bank Unveils "SmartSave" - AI-Powered Savings Account for Gen-Z',
    source: 'Your Story',
    publishedAt: '2026-07-21T11:00:00',
    publishedDate: '2026-07-21',
    publishedTime: '11:00:00',
    link: 'https://yourstory.com/hdfc-bank-smartsave',
    retrievedAt: '2026-07-21T11:05:00',
    retrievedDate: '2026-07-21',
    retrievedTime: '11:05:00',
    isRead: true,
    category: 'Product',
  },
];

// ── Mock Company Documents Data ─────────────────────────────────────────────
const MOCK_DOCUMENTS = [
  // ── HDFCBANK quarterly results ──
  {
    attachmentId: 'hdfc-q1-fy27.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2026-07-18',
    announcementTime: '14:59:18',
    reportingPeriod: 'Q1 FY27',
    documentType: 'RESULTS',
    title: 'Unaudited Standalone And Consolidated Financial Results for Q1 FY2026-27',
    originalTitle: 'Unaudited Standalone And Consolidated Financial Results for Q1 FY2026-27',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-q1-fy27.pdf',
    attachmentName: 'HDFC Bank Q1 FY27 Financial Results.pdf',
    retrievedOn: '2026-07-18T15:30:00Z',
  },
  {
    attachmentId: 'hdfc-q1-fy27-pres.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2026-07-18',
    announcementTime: '16:00:00',
    reportingPeriod: 'Q1 FY27',
    documentType: 'PRESENTATION',
    title: 'Investor Presentation - Q1 FY 2026-27',
    originalTitle: 'Investor Presentation - Q1 FY 2026-27',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-q1-fy27-pres.pdf',
    attachmentName: 'HDFC Bank Q1 FY27 Investor Presentation.pdf',
    retrievedOn: '2026-07-18T16:15:00Z',
  },
  {
    attachmentId: 'hdfc-q1-fy27-trans.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2026-07-19',
    announcementTime: '11:00:00',
    reportingPeriod: 'Q1 FY27',
    documentType: 'TRANSCRIPT',
    title: 'Earnings Call Transcript - Q1 FY 2026-27',
    originalTitle: 'Earnings Call Transcript - Q1 FY 2026-27',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-q1-fy27-trans.pdf',
    attachmentName: 'HDFC Bank Q1 FY27 Earnings Call Transcript.pdf',
    retrievedOn: '2026-07-19T11:30:00Z',
  },
  {
    attachmentId: 'hdfc-q4-fy26.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2026-04-19',
    announcementTime: '15:30:00',
    reportingPeriod: 'Q4 FY26',
    documentType: 'RESULTS',
    title: 'Audited Standalone And Consolidated Financial Results for Q4 & FY2025-26',
    originalTitle: 'Audited Standalone And Consolidated Financial Results for Q4 & FY2025-26',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-q4-fy26.pdf',
    attachmentName: 'HDFC Bank Q4 FY26 Annual Results.pdf',
    retrievedOn: '2026-04-19T16:00:00Z',
  },
  {
    attachmentId: 'hdfc-q3-fy26.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2026-01-17',
    announcementTime: '14:00:00',
    reportingPeriod: 'Q3 FY26',
    documentType: 'RESULTS',
    title: 'Unaudited Standalone And Consolidated Financial Results for Q3 FY2025-26',
    originalTitle: 'Unaudited Standalone And Consolidated Financial Results for Q3 FY2025-26',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-q3-fy26.pdf',
    attachmentName: 'HDFC Bank Q3 FY26 Financial Results.pdf',
    retrievedOn: '2026-01-17T14:30:00Z',
  },
  {
    attachmentId: 'hdfc-q2-fy26.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2025-10-19',
    announcementTime: '15:00:00',
    reportingPeriod: 'Q2 FY26',
    documentType: 'RESULTS',
    title: 'Unaudited Standalone And Consolidated Financial Results for Q2 FY2025-26',
    originalTitle: 'Unaudited Standalone And Consolidated Financial Results for Q2 FY2025-26',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-q2-fy26.pdf',
    attachmentName: 'HDFC Bank Q2 FY26 Financial Results.pdf',
    retrievedOn: '2025-10-19T15:30:00Z',
  },
  // ── HDFCBANK other documents (blank reportingPeriod) ──
  {
    attachmentId: 'hdfc-agm-2026.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2026-06-15',
    announcementTime: '10:00:00',
    reportingPeriod: '',
    documentType: 'AGM',
    title: 'Notice of Annual General Meeting 2026',
    originalTitle: 'Notice of Annual General Meeting 2026',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-agm-2026.pdf',
    attachmentName: 'HDFC Bank AGM Notice 2026.pdf',
    retrievedOn: '2026-06-15T10:30:00Z',
  },
  {
    attachmentId: 'hdfc-annual-report-fy26.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2026-06-01',
    announcementTime: '09:00:00',
    reportingPeriod: 'FY26',
    documentType: 'ANNUAL_REPORT',
    title: 'Annual Report FY 2025-26',
    originalTitle: 'Annual Report FY 2025-26',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-annual-report-fy26.pdf',
    attachmentName: 'HDFC Bank Annual Report FY26.pdf',
    retrievedOn: '2026-06-01T09:30:00Z',
  },
  {
    attachmentId: 'hdfc-dividend-2026.pdf',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd',
    announcementDate: '2026-05-10',
    announcementTime: '11:30:00',
    reportingPeriod: '',
    documentType: 'DIVIDEND',
    title: 'Dividend Declaration and Record Date Announcement',
    originalTitle: 'Dividend Declaration and Record Date Announcement',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/hdfc-dividend-2026.pdf',
    attachmentName: 'HDFC Bank Dividend Announcement 2026.pdf',
    retrievedOn: '2026-05-10T12:00:00Z',
  },
  // ── TCS quarterly results ──
  {
    attachmentId: 'tcs-q1-fy27.pdf',
    symbol: 'TCS',
    company: 'Tata Consultancy Services Ltd',
    announcementDate: '2026-07-10',
    announcementTime: '15:45:00',
    reportingPeriod: 'Q1 FY27',
    documentType: 'RESULTS',
    title: 'Audited Standalone And Consolidated Financial Results for Q1 FY2026-27',
    originalTitle: 'Audited Standalone And Consolidated Financial Results for Q1 FY2026-27',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/tcs-q1-fy27.pdf',
    attachmentName: 'TCS Q1 FY27 Financial Results.pdf',
    retrievedOn: '2026-07-10T16:00:00Z',
  },
  {
    attachmentId: 'tcs-q4-fy26.pdf',
    symbol: 'TCS',
    company: 'Tata Consultancy Services Ltd',
    announcementDate: '2026-04-09',
    announcementTime: '16:00:00',
    reportingPeriod: 'Q4 FY26',
    documentType: 'RESULTS',
    title: 'Audited Standalone And Consolidated Financial Results for Q4 & FY2025-26',
    originalTitle: 'Audited Standalone And Consolidated Financial Results for Q4 & FY2025-26',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/tcs-q4-fy26.pdf',
    attachmentName: 'TCS Q4 FY26 Annual Results.pdf',
    retrievedOn: '2026-04-09T16:30:00Z',
  },
  {
    attachmentId: 'tcs-agm-2026.pdf',
    symbol: 'TCS',
    company: 'Tata Consultancy Services Ltd',
    announcementDate: '2026-06-20',
    announcementTime: '10:30:00',
    reportingPeriod: '',
    documentType: 'AGM',
    title: 'Notice of 31st Annual General Meeting',
    originalTitle: 'Notice of 31st Annual General Meeting',
    pdfUrl: 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/tcs-agm-2026.pdf',
    attachmentName: 'TCS AGM Notice 2026.pdf',
    retrievedOn: '2026-06-20T11:00:00Z',
  },
];

const MOCK_DELAY_MS = 300;

async function mockFetch(endpoint, data) {
  console.warn(`[MOCK DATA] Using mock data for endpoint: ${endpoint}`);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
  return data;
}

const realMockApi = {
  // Authentication
  login: async (password) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    return { token: "mock-session-token-12345" };
  },

  // Read endpoints
  getStocks: () => mockFetch('stocks', stocks.map(item => ({
    ...item,
    currentPrice: item.currentPrice ?? (item.currentValue && item.quantity ? item.currentValue / item.quantity : undefined),
    dayChange: item.dayChange ?? ((item.quantity * 0.15) * (item.name.length % 2 === 0 ? 1 : -1)),
    dayChangePercent: item.dayChangePercent ?? (item.name.length % 2 === 0 ? 0.75 : -0.35),
  }))),

  getEtfs: () => mockFetch('etfs', etfs.map(item => ({
    ...item,
    currentPrice: item.currentPrice ?? (item.currentValue && item.quantity ? item.currentValue / item.quantity : undefined),
    dayChange: item.dayChange ?? ((item.quantity * 0.08) * (item.name.length % 2 === 0 ? 1 : -1)),
    dayChangePercent: item.dayChangePercent ?? (item.name.length % 2 === 0 ? 0.54 : -0.19),
  }))),

  getMutualFunds: () => mockFetch('mutualFunds', mutualFunds.map(item => ({
    ...item,
    currentNAV: item.currentNAV ?? (item.currentValue && item.quantity ? item.currentValue / item.quantity : undefined),
    dayChange: item.dayChange ?? ((item.quantity * 0.12) * (item.name.length % 2 === 0 ? 1 : -1)),
    dayChangePercent: item.dayChangePercent ?? (item.name.length % 2 === 0 ? 0.88 : -0.42),
  }))),

  getFDs: () => mockFetch('fds', fds),

  // News API mocks
  getNews: async (limit) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    // Sort by publishedAt descending (latest first)
    const sorted = [...MOCK_NEWS].sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );
    return limit ? sorted.slice(0, limit) : sorted;
  },

  getStockNews: async (symbol, limit) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const filtered = MOCK_NEWS.filter(
      (n) => n.symbol.toUpperCase() === String(symbol).toUpperCase()
    ).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return limit ? filtered.slice(0, limit) : filtered;
  },

  // Company Documents API
  getCompanyDocuments: async (symbol) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const results = MOCK_DOCUMENTS.filter(
      (d) => d.symbol.toUpperCase() === symbol.toUpperCase()
    ).sort((a, b) => {
      const dateCmp = (b.announcementDate || '').localeCompare(a.announcementDate || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.announcementTime || '').localeCompare(a.announcementTime || '');
    });
    return { success: true, data: results };
  },

  // AI Summary API
  summarizeDocument: async (documentId) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      data: {
        cached: false,
        aiSummary: {
          announcementType: "Quarterly Results Update",
          marketImpact: "Neutral",
          summary: "The company reported steady growth in Q1 with revenue up by 15% YoY.",
          keyTakeaways: [
            "Revenue increased 15% YoY.",
            "Operating margin expanded by 50 bps.",
            "Management remains confident in H2 outlook."
          ],
          financialHighlights: [],
          importantNumbers: [
            "Net Profit: ₹4,500 Cr",
            "Revenue: ₹35,000 Cr",
            "EPS: ₹12.5"
          ],
          positives: ["Strong retail growth", "Stable asset quality"],
          negatives: ["Slight increase in operational costs"],
          risks: ["Macroeconomic headwinds", "Regulatory changes"],
          managementCommentary: "We are pleased with our performance this quarter despite macro challenges.",
          futureOutlook: "We expect momentum to continue into the next fiscal.",
          sentiment: "Positive"
        }
      }
    };
  },

  getOverallInvestments: async () => {
    const s = await realMockApi.getStocks();
    const e = await realMockApi.getEtfs();
    const m = await realMockApi.getMutualFunds();
    const f = await realMockApi.getFDs();

    const sumInvested = (arr, valKey = 'investedValue') => arr.reduce((acc, x) => acc + (x[valKey] ?? x.invested ?? x.principal ?? 0), 0);
    const sumCurrent = (arr, valKey = 'currentValue') => arr.reduce((acc, x) => acc + (x[valKey] ?? x.current ?? 0), 0);

    const sInv = sumInvested(s);
    const sCur = sumCurrent(s);
    const sPnl = sCur - sInv;

    const eInv = sumInvested(e);
    const eCur = sumCurrent(e);
    const ePnl = eCur - eInv;

    const mInv = sumInvested(m);
    const mCur = sumCurrent(m);
    const mPnl = mCur - mInv;

    const fInv = sumInvested(f, 'principal');
    const fCur = sumCurrent(f);
    const fPnl = fCur - fInv;

    const totalInv = sInv + eInv + mInv + fInv;
    const totalCur = sCur + eCur + mCur + fCur;
    const totalPnl = totalCur - totalInv;

    return [
      { assetClass: "Stocks", invested: sInv, current: sCur, profit: sPnl, returnPercentage: sInv > 0 ? (sPnl / sInv) * 100 : 0, weightage: totalCur > 0 ? (sCur / totalCur) * 100 : 0 },
      { assetClass: "Mutual Funds", invested: mInv, current: mCur, profit: mPnl, returnPercentage: mInv > 0 ? (mPnl / mInv) * 100 : 0, weightage: totalCur > 0 ? (mCur / totalCur) * 100 : 0 },
      { assetClass: "ETFs", invested: eInv, current: eCur, profit: ePnl, returnPercentage: eInv > 0 ? (ePnl / eInv) * 100 : 0, weightage: totalCur > 0 ? (eCur / totalCur) * 100 : 0 },
      { assetClass: "Fixed Deposits", invested: fInv, current: fCur, profit: fPnl, returnPercentage: fInv > 0 ? (fPnl / fInv) * 100 : 0, weightage: totalCur > 0 ? (fCur / totalCur) * 100 : 0 },
      { assetClass: "Total", invested: totalInv, current: totalCur, profit: totalPnl, returnPercentage: totalInv > 0 ? (totalPnl / totalInv) * 100 : 0, weightage: 100 }
    ];
  },

  getAssetAllocation: async () => {
    const s = await realMockApi.getStocks();
    const e = await realMockApi.getEtfs();
    const m = await realMockApi.getMutualFunds();
    const f = await realMockApi.getFDs();

    const sumCurrent = (arr) => arr.reduce((acc, x) => acc + (x.currentValue ?? x.current ?? 0), 0);

    const sCur = sumCurrent(s);
    const eCur = sumCurrent(e);
    const mCur = sumCurrent(m);
    const fCur = sumCurrent(f);

    const totalEquity = sCur + eCur + mCur;
    const totalCashDebt = fCur;

    return [
      { asset: "Equity", allocation: totalEquity },
      { asset: "FD", allocation: fCur },
      { asset: "Cash", allocation: 12500 },
      { asset: "Total", allocation: totalEquity + fCur + 12500 }
    ];
  },

  getOverallSectorAllocation: async () => {
    const s = await realMockApi.getStocks();
    const all = s;

    const sectorExposure = {};
    let totalExposure = 0;

    all.forEach(x => {
      const sec = x.sector ?? 'Other';
      const cur = x.currentValue ?? 0;
      sectorExposure[sec] = (sectorExposure[sec] ?? 0) + cur;
      totalExposure += cur;
    });

    const result = Object.entries(sectorExposure).map(([sector, exposure]) => ({
      sector,
      exposure,
      allocation: totalExposure > 0 ? (exposure / totalExposure) * 100 : 0
    }));

    return result.sort((a, b) => b.exposure - a.exposure).slice(0, 5);
  },

  getStocksAllocation: async () => {
    const s = await realMockApi.getStocks();
    const totalCur = s.reduce((acc, x) => acc + (x.currentValue ?? 0), 0);

    const result = s.map(x => ({
      name: x.name,
      exposure: x.currentValue,
      allocation: totalCur > 0 ? (x.currentValue / totalCur) * 100 : 0
    }));

    return result.sort((a, b) => b.exposure - a.exposure);
  },

  getDashboard: async () => {
    const overallInvestments = await realMockApi.getOverallInvestments();
    const assetAllocation = await realMockApi.getAssetAllocation();
    const overallSectorAllocation = await realMockApi.getOverallSectorAllocation();
    const stocksAllocation = await realMockApi.getStocksAllocation();

    const s = await realMockApi.getStocks();
    const e = await realMockApi.getEtfs();
    const m = await realMockApi.getMutualFunds();
    const f = await realMockApi.getFDs();

    const sumDayChange = (arr) => arr.reduce((acc, x) => acc + (x.dayChange ?? 0), 0);
    const sumCurrentVal = (arr) => arr.reduce((acc, x) => acc + (x.currentValue ?? x.current ?? 0), 0);
    const sumInvestedVal = (arr, valKey = 'investedValue') => arr.reduce((acc, x) => acc + (x[valKey] ?? x.invested ?? x.principal ?? 0), 0);

    const stocksGain = sumDayChange(s);
    const sCurVal = sumCurrentVal(s);
    const stocksGainPercent = (sCurVal - stocksGain) > 0 ? (stocksGain / (sCurVal - stocksGain)) * 100 : 0;

    const etfsGain = sumDayChange(e);
    const eCurVal = sumCurrentVal(e);
    const etfsGainPercent = (eCurVal - etfsGain) > 0 ? (etfsGain / (eCurVal - etfsGain)) * 100 : 0;

    const mutualFundsGain = sumDayChange(m);
    const mCurVal = sumCurrentVal(m);
    const mutualFundsGainPercent = (mCurVal - mutualFundsGain) > 0 ? (mutualFundsGain / (mCurVal - mutualFundsGain)) * 100 : 0;

    const totalGain = stocksGain + etfsGain + mutualFundsGain;
    const totalCurrentVal = sCurVal + eCurVal + mCurVal + sumCurrentVal(f);
    const totalInvVal = sumInvestedVal(s) + sumInvestedVal(e) + sumInvestedVal(m) + sumInvestedVal(f, 'principal');
    const gainPercent = (totalCurrentVal - totalGain) > 0 ? (totalGain / (totalCurrentVal - totalGain)) * 100 : 0;

    return {
      overallInvestments,
      assetAllocation,
      overallSectorAllocation,
      stocksAllocation,
      todayPerformance: {
        data: {
          gain: totalGain,
          gainPercent: gainPercent,
          stocksGain,
          stocksGainPercent,
          etfsGain,
          etfsGainPercent,
          mutualFundsGain,
          mutualFundsGainPercent,
          totalCurrentValue: totalCurrentVal,
          totalInvestedValue: totalInvVal
        }
      }
    };
  },

  getPortfolio: async () => {
    const s = await realMockApi.getStocks();
    const e = await realMockApi.getEtfs();
    const m = await realMockApi.getMutualFunds();
    const f = await realMockApi.getFDs();

    return {
      stocks: s,
      etfs: e,
      mutualFunds: m,
      fds: f
    };
  },

  // Mutation endpoints updating the in-memory arrays
  buyMore: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    if (payload.assetType === "stocks") {
      const idx = stocks.findIndex(x => x.symbol === payload.symbol);
      if (idx !== -1) {
        const h = stocks[idx];
        const newQty = h.quantity + payload.quantity;
        const newCost = (h.quantity * (h.avgPurchasePrice ?? 0)) + (payload.quantity * payload.price);
        h.avgPurchasePrice = newCost / newQty;
        h.quantity = newQty;
        h.investedValue = newCost;
        h.currentValue = newQty * (payload.price * 1.05);
        h.returnValue = h.currentValue - h.investedValue;
        h.returnPct = (h.returnValue / h.investedValue) * 100;
      }
    }
    return { success: true };
  },

  updateHolding: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const target = payload.assetType === "mutualFunds" ? mutualFunds : (payload.assetType === "etfs" ? etfs : stocks);
    const idx = target.findIndex(x => x.symbol === payload.symbol || x.name === payload.name);
    if (idx !== -1) {
      const h = target[idx];
      h.quantity = payload.quantity;
      h.avgPurchasePrice = payload.price;
      h.investedValue = payload.quantity * payload.price;
      h.currentValue = payload.quantity * (payload.price * 1.1);
      h.returnValue = h.currentValue - h.investedValue;
      h.returnPct = (h.returnValue / h.investedValue) * 100;
      if (payload.assetType === "mutualFunds" && payload.sipEnabled !== undefined) {
        h.sipEnabled = payload.sipEnabled;
        h.sipAmount = payload.sipAmount;
        h.sipDay = payload.sipDay;
      }
    }
    return { success: true };
  },

  sellHolding: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const target = payload.assetType === "mutualFunds" ? mutualFunds : (payload.assetType === "etfs" ? etfs : stocks);
    const idx = target.findIndex(x => x.symbol === payload.symbol || x.name === payload.name);
    if (idx !== -1) {
      const h = target[idx];
      if (payload.quantity >= h.quantity) {
        target.splice(idx, 1);
      } else {
        h.quantity -= payload.quantity;
        h.investedValue = h.quantity * (h.avgPurchasePrice ?? 0);
        h.currentValue = h.quantity * (payload.price);
        h.returnValue = h.currentValue - h.investedValue;
        h.returnPct = h.investedValue > 0 ? (h.returnValue / h.investedValue) * 100 : 0;
      }
    }
    return { success: true };
  },

  addHolding: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const newAsset = {
      id: `mock-${payload.assetType}-${Date.now()}`,
      name: payload.name,
      symbol: payload.symbol || payload.name.toUpperCase().replace(/\s+/g, ""),
      category: payload.assetType === "stocks" ? "stock" : (payload.assetType === "etfs" ? "ETF" : "Mutual Fund"),
      quantity: payload.quantity,
      avgPurchasePrice: payload.price,
      investedValue: payload.quantity * payload.price,
      currentValue: payload.quantity * payload.price * 1.02,
      returnValue: (payload.quantity * payload.price * 0.02),
      returnPct: 2.0,
      portfolioWeight: 2.0,
      confidenceLevel: payload.confidence || "High",
      sector: payload.sector || "Other"
    };

    if (payload.assetType === "mutualFunds") {
      newAsset.sipEnabled = payload.sipEnabled || false;
      newAsset.sipAmount = payload.sipAmount || 0;
      newAsset.sipDay = payload.sipDay || 0;
    }

    if (payload.assetType === "mutualFunds") {
      mutualFunds.push(newAsset);
    } else if (payload.assetType === "etfs") {
      etfs.push(newAsset);
    } else if (payload.assetType === "fds") {
      const newFd = {
        srNo: fds.length > 0 ? Math.max(...fds.map(x => x.srNo)) + 1 : 1,
        name: payload.name,
        principal: payload.quantity,
        interestRate: payload.interestRate || 7.0,
        currentValue: payload.quantity * 1.02,
        maturityValue: payload.quantity * (1 + (payload.interestRate || 7.0) / 100),
        interestEarned: payload.quantity * 0.02,
        startDate: payload.startDate || new Date().toISOString(),
        maturityDate: payload.maturityDate || new Date().toISOString(),
        weightage: 2.0
      };
      fds.push(newFd);
    } else {
      stocks.push(newAsset);
    }
    return { success: true };
  },

  updateFD: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    const idx = fds.findIndex(x => x.srNo === payload.srNo);
    if (idx !== -1) {
      const f = fds[idx];
      f.name = payload.bankName;
      f.principal = payload.principal;
      f.interestRate = payload.interestRate;
      f.startDate = payload.startDate;
      f.maturityDate = payload.maturityDate;
      f.currentValue = payload.principal * 1.05;
      f.interestEarned = f.currentValue - payload.principal;
      f.maturityValue = payload.principal * (1 + (payload.interestRate / 100) * 2);
    }
    return { success: true };
  },

  deleteFD: async (payload) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    fds = fds.filter(x => x.srNo !== payload.srNo);
    return { success: true };
  }
};

export const mockApi = realMockApi;
