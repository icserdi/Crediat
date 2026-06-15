# **App Name**: Smart Collections Hub

## Core Features:

- Automated Invoice Collection Workflow: An automated, schedule-based engine that identifies overdue invoices from PostgreSQL and initiates collection processes, feeding data for intelligent decision-making.
- AI-Driven Collection Strategy: Leverage pgvector to store and retrieve contextual embeddings of past debtor conversations, allowing the AI's 'LLM Manager' tool to dynamically select the best strategy and generate communication across various LLMs (OpenAI, Gemini, Ollama).
- Unified Debtor Interaction Hub: A centralized user interface to manage all communication history with debtors (CRUD operations), including secure storage of multimedia attachments like payment screenshots in MinIO, with references stored in PostgreSQL.
- Queue-based Omnichannel Communication: Send all collection actions (e.g., WhatsApp messages via dedicated APIs, Emails via Brevo) through a Redis-backed queue to ensure reliable delivery, handle rate limits, and provide robust tracking.
- Dynamic Customer Risk Segmentation: Automated classification of customers into segments based on their payment behavior (risk_score) through real-time SQL views, with intuitive visual display on the dashboard.
- Real-time Financial KPI Dashboard: Display a dashboard featuring key financial performance indicators such as DSO, Morbidity Rate, Recovery Rate, Portfolio Turnover, and Promise Compliance Ratio, calculated with optimized SQL queries from PostgreSQL.
- AI Cash Flow Prediction: Utilize historical data from PostgreSQL to generate AI-powered forecasts for future collections, providing crucial insights for financial planning, presented visually within the dashboard.

## Style Guidelines:

- A professional and modern color scheme reflecting efficiency and data. The primary color is a deep indigo (#353585), representing stability and insight.
- The background color is a subtle, desaturated light blue (#ECECF4), promoting clarity and focus for data-rich displays.
- A vibrant orange accent color (#FA9319) is used for calls to action, alerts, and key data points, adding a dynamic and purposeful contrast.
- Headlines will use 'Space Grotesk' (sans-serif) for a modern, slightly technical feel, while body text will use 'Inter' (sans-serif) for high legibility and a clean, objective appearance.
- Employ clean, concise line-art style icons that convey professionalism and clarity, ensuring easy interpretation of features and data visualizations across the platform.
- Structured and responsive layouts designed for optimal readability of financial data, tables, and communication logs, with clear hierarchy and consistent spacing on various screen sizes.
- Subtle and functional animations, such as smooth transitions for dashboard updates and interactive charts, enhancing user engagement without distracting from critical financial data.