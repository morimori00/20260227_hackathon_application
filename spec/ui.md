# UI Design Document

## Common Specifications

### Layout
- Left sidebar (width 240px, collapsible) + main content area
- Sidebar contains logo, navigation menu, and user information
- Notion-style minimal and refined design
- Color palette: white background (#FFFFFF), text (#37352F), accent (#EB5757 red for fraud detection), secondary (#2F80ED blue), border (#E9E9E7)
- Fonts: Inter (alphanumeric), Noto Sans JP (Japanese)

### Sidebar Navigation
- Network Visualization (icon: graph node)
- Alert List (icon: bell + unresolved count badge)
- Pattern Analysis (icon: chart)
- Divider
- Settings (icon: gear)

### Loading
- SVG animation loading display common to all pages
- Page transition: pulse animation centered on the page (circle expanding like ripples)
- During data fetch: skeleton screen in content area + progress bar at top

### Responsive Design
- Minimum width 1280px (assuming desktop workstations)
- Sidebar is collapsible (switches to icon-only display)

---

## Page 1: Transaction Network Visualization Page

Path: `/network`

### Overview
A page that displays fund flows between accounts as an interactive network graph, enabling visual understanding of fraud transaction paths.

### Header Area
- Page title "Transaction Network"
- Account search bar: text input for searching account IDs. With autocomplete. Enter key or search button draws the graph starting from the specified account
- Hop count selector: dropdown to select 1-5 hops (default: 2)
- Date range filter: date range picker (start date / end date)

### Network Graph Area (80% width of main content)
- Force-directed interactive graph
- Nodes: circles representing accounts. Size proportional to total transaction amount
  - Color: high fraud score (red #EB5757), medium (yellow #F2C94C), low (grey #BDBDBD)
  - On hover: tooltip showing account ID, bank name, entity name
  - On click: navigate to Account Profile Page (1.2)
- Edges: lines representing transactions. Thickness proportional to transaction amount
  - Color: red for fraud-flagged transactions, grey for normal transactions
  - Arrows showing transfer direction
  - On hover: tooltip showing amount, currency, date/time, payment method
  - On click: navigate to Transaction Detail Page (1.1)
- Zoom and pan support (mouse wheel, drag)
- Legend: positioned bottom-right. Displays meaning of node and edge colors

### Pattern Detection Panel (right side of main content, width 280px)
- Display detected patterns as a card list
- Each card: pattern type (FAN-OUT, CYCLE, etc.), related transaction count, total amount
- On card click: highlight the corresponding pattern's transactions on the graph

---

## Page 1.1: Transaction Detail Page

Path: `/transactions/:transactionId`

### Overview
A page displaying detailed information for an individual transaction and the model's decision rationale.

### Transaction Information Card
- 2-column grid layout displaying:
  - Left column "Sender": bank name (Bank ID resolved via accounts.csv), account ID, entity name
  - Right column "Receiver": same as above
  - Arrow icon indicating transfer direction
- Bottom section showing transaction metadata in a horizontal row:
  - Transaction date/time
  - Amount paid / payment currency
  - Amount received / receiving currency
  - Payment method
- Fraud flag: if Is Laundering = 1, display a red "Fraud Detected" badge in a prominent position

### Model Decision Section
- Fraud probability score: large numeric display (e.g., "87.3%") + circular progress bar for visualization
- Decision result: label showing "Suspected Fraud" / "Normal"
- Feature importance: horizontal bar chart showing top 5 contributing features (e.g., Amount Paid, Payment Format_ACH, ...)

### Same Account Transaction History Section
- Tab switching: "Sender Account History" / "Receiver Account History"
- Table within each tab:
  - Columns: date/time, counterparty bank, counterparty account, amount, currency, payment method, fraud flag
  - Rows with fraud flag have light red background (#FFF5F5) highlight
  - Row click navigates to that transaction's detail page
- Pagination: 20 items per page

### Staff Notes Section
- Text area (max 500 characters)
- Save button
- Past notes history display (date/time, staff name, content)

---

## Page 1.2: Account Profile Page

Path: `/accounts/:accountId`

### Overview
A profile page for understanding the overall picture of a specified account.

### Account Information Header
- Account ID (large title display)
- Bank name, entity name, entity type (from accounts.csv)
- Account fraud risk score (calculated from the proportion of fraud transactions related to the account): displayed as a colored badge

### Summary Card Area (horizontal 4-column layout)
- Total transaction count (sent + received)
- Total sent amount
- Total received amount
- Fraud-flagged transaction count

### Transaction Amount Trend Graph
- Line chart: X-axis = date, Y-axis = transaction amount
- 2 series: sent amount (blue), received amount (green)
- Markers (red dots) displayed on dates with fraud transactions
- Date range filter: date range picker

### Counterparty List Table
- Tab switching: "Receivers" / "Senders"
- Columns: counterparty account ID, counterparty bank name, transaction count, total amount, last transaction date, fraud transaction presence
- Rows containing fraud transactions displayed with red icon
- Account ID click navigates to counterparty's account profile page
- Sort: ascending/descending on column header click

### Related Transactions Table
- List of all transactions involving this account
- Columns: date/time, direction (sent/received), counterparty bank, counterparty account, amount, currency, payment method, fraud flag
- Filters: direction, currency, payment method, fraud flag
- Pagination: 20 items per page

---

## Page 2: Alert List Page

Path: `/alerts`

### Overview
A page that lists transactions flagged as fraudulent by the model and manages their handling status.

### Header Area
- Page title "Alert List"
- Summary cards (horizontal 4-column layout):
  - Total alert count
  - Pending count (red background)
  - Investigating count (yellow background)
  - Today's new alert count

### Filter Bar
- Status filter: chip-style selection of "All", "Pending", "Investigating", "Resolved", "False Positive" (multi-select enabled)
- Sender bank: dropdown (with search)
- Receiver bank: dropdown (with search)
- Amount range: min/max input fields
- Currency: dropdown
- Payment method: dropdown
- Date range: date range picker
- Fraud score range: range slider (0%-100%)
- Filter reset button

### Alert Table
- Columns:
  - Status (colored dot icon: red = pending, yellow = investigating, green = resolved, grey = false positive)
  - Fraud score (percentage display + mini progress bar)
  - Transaction date/time
  - Sender bank / account
  - Receiver bank / account
  - Amount
  - Currency
  - Payment method
- Default sort: fraud score descending
- Sort toggle on each column header click
- Row click: navigate to Transaction Detail Page (1.1)
- Status change: click status dot to show dropdown menu, allowing in-place status change

### Pagination
- 20 items per page display
- Page number navigation + "Previous" / "Next" buttons
- Items per page toggle (20 / 50 / 100)

---

## Page 3: Pattern Analysis Page

Path: `/analytics`

### Overview
A page that statistically visualizes fraud transaction trends and patterns to support analysis.

### Date Range Filter (top of page)
- Date range picker (start date / end date)
- Quick select buttons: "Last 7 days", "Last 14 days", "All time"

### Section 1: Time-of-Day Analysis
- Heatmap: X-axis = hour (0-23), Y-axis = day of week (Mon-Sun), cell color = fraud transaction count
- Color gradient: light yellow (few) to red (many)
- On cell hover: tooltip showing specific count

### Section 2: Payment Method x Currency Cross-Tabulation
- Table format: rows = payment methods (7 types), columns = currencies (15 types), cells = fraud rate (%)
- Cells with high fraud rates colored with heatmap colors
- On cell click: navigate to alert list with corresponding filter applied

### Section 3: High-Risk Bank Ranking
- Horizontal bar chart: fraud transaction count for top 10 banks
- Bank name (from accounts.csv) and count displayed alongside bars
- Tab switching: "By Count" / "By Amount"
- On bar click: navigate to alert list with corresponding bank filter applied

### Section 4: Model Feature Importance
- Horizontal bar chart: all feature importance scores in descending order
- Percentage value displayed on each bar

### Section 5: Fraud Pattern Type Distribution
- Donut chart: count distribution of 8 pattern types from Patterns.txt (FAN-OUT, FAN-IN, CYCLE, RANDOM, BIPARTITE, STACK, SCATTER-GATHER, GATHER-SCATTER)
- Total pattern count displayed in chart center
- Legend: pattern names and counts displayed on the right
- On segment click: expand transaction list for the corresponding pattern below
